import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimitPolicies = {
  proxy: { requests: 300, window: "1 m" },
  loginIp: { requests: 30, window: "15 m" },
  loginAccount: { requests: 10, window: "15 m" },
  registration: { requests: 5, window: "1 h" },
  write: { requests: 30, window: "1 m" },
  deleteAccount: { requests: 5, window: "15 m" },
} as const;

export type RateLimitPolicy = keyof typeof rateLimitPolicies;
type Environment = Record<string, string | undefined>;
type RequestHeaders = Pick<Headers, "get">;

export type RateLimitRejection = {
  allowed: false;
  status: 429 | 503;
  error: string;
  retryAfterSeconds: number;
};
export type RateLimitDecision = { allowed: true } | RateLimitRejection;
type Limiter = Pick<Ratelimit, "limit">;
type LimiterFactory = (policy: RateLimitPolicy, env: Environment) => Limiter;

// Trust only a header overwritten by the deployment's ingress. Never fall back
// to arbitrary client-supplied forwarding headers or a random identifier.
export function getClientIp(headers: RequestHeaders, env: Environment = process.env) {
  const header = env.VERCEL === "1"
    ? "x-vercel-forwarded-for"
    : env.RATE_LIMIT_IP_HEADER?.trim();
  const value = header ? headers.get(header)?.trim() : undefined;
  if (!value || !isIP(value) || value.includes("%")) return "unknown";
  // Canonicalize alternate spellings of the same IPv6 address.
  return isIP(value) === 6 ? new URL(`http://[${value}]`).hostname : value;
}

function createRedisLimiter(policy: RateLimitPolicy, env: Environment): Limiter {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
    retry: false,
    signal: () => AbortSignal.timeout(1500),
  });
  const { requests, window } = rateLimitPolicies[policy];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `${env.RATE_LIMIT_PREFIX?.trim() || "track-my-studying"}:${env.VERCEL_ENV || env.NODE_ENV || "development"}:ratelimit:v1:${policy}`,
    analytics: false,
    ephemeralCache: false,
    timeout: 2000,
  });
}

function unavailable(): RateLimitRejection {
  return {
    allowed: false,
    status: 503,
    error: "This service is temporarily unavailable. Please try again in a minute.",
    retryAfterSeconds: 60,
  };
}

// Each process reuses SDK clients; counters and atomic decisions live in Redis.
// The factory also allows deterministic outage tests without a live service.
export function createRateLimitService(
  env: Environment = process.env,
  factory: LimiterFactory = createRedisLimiter,
) {
  const limiters = new Map<RateLimitPolicy, Limiter>();
  return async function checkRateLimit(
    policy: RateLimitPolicy,
    identifier: string,
  ): Promise<RateLimitDecision> {
    if (env.NODE_ENV === "development" && env.RATE_LIMIT_DISABLED === "1") {
      return { allowed: true };
    }

    const secret = env.AUTH_SECRET || env.NEXTAUTH_SECRET || env.BETTER_AUTH_SECRET;
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN || !secret) {
      console.error(`[rate-limit:${policy}] Missing Redis credentials or auth secret`);
      return unavailable();
    }

    try {
      let limiter = limiters.get(policy);
      if (!limiter) {
        limiter = factory(policy, env);
        limiters.set(policy, limiter);
      }
      // Avoid storing raw IPs, email addresses, or user IDs in Redis keys.
      const key = createHmac("sha256", secret).update(identifier).digest("hex");
      const result = await limiter.limit(key);
      // Analytics are disabled, but always settle SDK background work.
      void result.pending.catch(() => {
        console.error(`[rate-limit:${policy}] Background operation failed`);
      });
      // The SDK permits requests on timeout by default. Override that behavior.
      if (result.reason === "timeout") return unavailable();
      if (result.success) return { allowed: true };

      const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return {
        allowed: false,
        status: 429,
        error: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfterSeconds,
      };
    } catch {
      // Do not log SDK errors: they may contain connection details or identifiers.
      console.error(`[rate-limit:${policy}] Redis request failed`);
      return unavailable();
    }
  };
}

export function rateLimitResponse(rejection: RateLimitRejection) {
  return Response.json(
    { error: rejection.error, retryAfterSeconds: rejection.retryAfterSeconds },
    {
      status: rejection.status,
      headers: {
        "Retry-After": String(rejection.retryAfterSeconds),
        "Cache-Control": "private, no-store",
      },
    },
  );
}
