import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  createRateLimitService,
  getClientIp,
  rateLimitResponse,
} from "../lib/rate-limit-core.ts";

const configuredEnv = {
  NODE_ENV: "production",
  AUTH_SECRET: "test-only-secret",
  UPSTASH_REDIS_REST_URL: "https://example.invalid",
  UPSTASH_REDIS_REST_TOKEN: "test-only-token",
};
const allowedResponse = () => ({
  success: true, limit: 5, remaining: 4, reset: Date.now() + 60_000,
  pending: Promise.resolve(),
});

test("only trusts the deployment's configured IP header", () => {
  const headers = new Headers({
    "x-forwarded-for": "192.0.2.99",
    "x-real-ip": "192.0.2.98",
    "x-vercel-forwarded-for": "192.0.2.1",
  });
  assert.equal(getClientIp(headers, {}), "unknown");
  assert.equal(getClientIp(headers, { VERCEL: "1" }), "192.0.2.1");
  assert.equal(getClientIp(headers, {
    VERCEL: "1", RATE_LIMIT_IP_HEADER: "x-real-ip",
  }), "192.0.2.1");
  assert.equal(getClientIp(headers, { RATE_LIMIT_IP_HEADER: "x-real-ip" }), "192.0.2.98");
});

test("missing, malformed, and ambiguous IPs share one non-bypass bucket", () => {
  for (const value of ["", "not-an-ip", "192.0.2.1, 192.0.2.2", "192.0.2.1:80", "fe80::1%eth0"]) {
    assert.equal(getClientIp(new Headers({ "x-real-ip": value }), {
      RATE_LIMIT_IP_HEADER: "x-real-ip",
    }), "unknown");
  }
  assert.equal(getClientIp(new Headers(), { VERCEL: "1" }), "unknown");
});

test("equivalent IPv6 spellings use the same identifier", () => {
  const ip = (value) => getClientIp(new Headers({ "x-real-ip": value }), {
    RATE_LIMIT_IP_HEADER: "x-real-ip",
  });
  assert.equal(ip("2001:0DB8:0000:0000:0000:0000:0000:0001"), ip("2001:db8::1"));
  assert.notEqual(ip("2001:db8::1"), ip("2001:db8::2"));
});

test("hashes identifiers, reuses clients, and consults Redis for every attempt", async () => {
  const created = [];
  const calls = [];
  const check = createRateLimitService(configuredEnv, (policy) => {
    created.push(policy);
    return { limit: async (key) => {
      calls.push({ policy, key });
      return allowedResponse();
    } };
  });
  for (let index = 0; index < 2; index++) {
    assert.deepEqual(await check("write", "user-one"), { allowed: true });
  }
  await check("write", "user-two");
  await check("loginAccount", "student@example.com");
  assert.deepEqual(created, ["write", "loginAccount"]);
  assert.equal(calls.length, 4);
  assert.equal(calls[0].key, calls[1].key);
  assert.notEqual(calls[0].key, calls[2].key);
  assert.equal(calls[3].key, createHmac("sha256", configuredEnv.AUTH_SECRET)
    .update("student@example.com").digest("hex"));
  assert.ok(calls.every(({ key }) => /^[a-f0-9]{64}$/.test(key)));
});

test("exhaustion returns a serializable rejection and non-cacheable HTTP response", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 10_000 });
  const check = createRateLimitService(configuredEnv, () => ({
    limit: async () => ({ ...allowedResponse(), success: false, reset: 11_501 }),
  }));
  const rejected = await check("write", "user-one");
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.status, 429);
  assert.equal(rejected.retryAfterSeconds, 2);
  const response = rateLimitResponse(rejected);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "2");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal((await response.json()).error, rejected.error);
});

test("retry delay is never zero or negative", async () => {
  const check = createRateLimitService(configuredEnv, () => ({
    limit: async () => ({ ...allowedResponse(), success: false, reset: 0 }),
  }));
  assert.equal((await check("write", "user-one")).retryAfterSeconds, 1);
});

test("Redis exceptions and SDK allow-on-timeout responses fail closed", async (t) => {
  const logger = t.mock.method(console, "error", () => {});
  for (const limit of [
    async () => { throw new Error("sensitive-connection-details"); },
    async () => ({ ...allowedResponse(), success: true, reason: "timeout" }),
  ]) {
    const check = createRateLimitService(configuredEnv, () => ({ limit }));
    const result = await check("loginIp", "192.0.2.1");
    assert.equal(result.allowed, false);
    assert.equal(result.status, 503);
    assert.equal(rateLimitResponse(result).headers.get("Retry-After"), "60");
  }
  assert.ok(!JSON.stringify(logger.mock.calls).includes("sensitive-connection-details"));
});

test("missing configuration fails closed and production cannot opt out", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const missingKey of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "AUTH_SECRET"]) {
    const env = { ...configuredEnv, [missingKey]: undefined, RATE_LIMIT_DISABLED: "1" };
    const check = createRateLimitService(env, () => assert.fail("must not create a client"));
    assert.equal((await check("proxy", "192.0.2.1")).status, 503);
  }
  const check = createRateLimitService({ ...configuredEnv, RATE_LIMIT_DISABLED: "1" }, () => ({
    limit: async () => ({ ...allowedResponse(), success: false }),
  }));
  assert.equal((await check("proxy", "192.0.2.1")).status, 429);
});

test("development opt-out is explicit; missing development credentials do not bypass", async (t) => {
  t.mock.method(console, "error", () => {});
  assert.deepEqual(await createRateLimitService({
    NODE_ENV: "development", RATE_LIMIT_DISABLED: "1",
  })("proxy", "unknown"), { allowed: true });
  assert.equal((await createRateLimitService({ NODE_ENV: "development" })("proxy", "unknown")).status, 503);
});
