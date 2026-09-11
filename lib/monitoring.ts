import { AsyncLocalStorage } from "node:async_hooks";

// Labels are code-owned, never URLs, user identifiers, or submitted content.
const operations = [
  "dashboard", "study.chart", "study.calendar", "study.add", "study.update",
  "study.delete", "account.delete", "reflection.save", "auth.login",
  "auth.register", "auth.route", "auth", "proxy", "database", "unknown",
] as const;
export type Operation = typeof operations[number];
type Outcome = "success" | "rejected" | "error" | "control_flow";
type Context = { operation: Operation; correlationId: string; outcome: Outcome };
// Next can bundle instrumentation and handlers separately. Share context and
// deduplication across those bundles and development hot reloads.
const globalForMonitoring = globalThis as unknown as {
  studyMonitoring?: { contexts: AsyncLocalStorage<Context>; reported: WeakSet<object>; instanceId: string };
  studyExpectedErrors?: WeakSet<object>;
};
const { contexts, reported, instanceId } = globalForMonitoring.studyMonitoring ??= {
  contexts: new AsyncLocalStorage<Context>(), reported: new WeakSet<object>(), instanceId: crypto.randomUUID(),
};
const expectedErrors = globalForMonitoring.studyExpectedErrors ??= new WeakSet<object>();

function label<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

function number(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value * 10) / 10) : 0;
}

export function positiveSetting(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Private sink: callers cannot spread request/error objects into a log record.
function emit(event: string, level: "info" | "warn" | "error", fields: Record<string, unknown>) {
  try {
    const context = contexts.getStore();
    console[level](JSON.stringify({
      timestamp: new Date().toISOString(), event, level, instanceId,
      operation: context?.operation ?? "unknown",
      correlationId: context?.correlationId ?? crypto.randomUUID(),
      ...fields,
    }));
  } catch {
    // Telemetry must never change request behavior, including during sink failure.
  }
}

export function withMonitoringContext<T>(operation: Operation, run: () => T): T {
  return contexts.run({
    operation: label(operation, operations, "unknown"),
    correlationId: crypto.randomUUID(), outcome: "success",
  }, run);
}

export function markOutcome(outcome: "rejected" | "error") {
  const context = contexts.getStore();
  if (context && context.outcome !== "error") context.outcome = outcome;
}

export class ExpectedOperationError extends Error {
  constructor(message: string) {
    super(message);
    expectedErrors.add(this);
  }
}

const safeCodes = [
  "P1000", "P1001", "P1002", "P1008", "P1017", "P2002", "P2003", "P2024", "P2025",
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "53300", "57P01", "08006",
] as const;

function property(error: unknown, key: string): unknown {
  try {
    return error && typeof error === "object" ? Reflect.get(error, key) : undefined;
  } catch { return undefined; }
}

export function isExpectedError(error: unknown) {
  return (error !== null && typeof error === "object" && expectedErrors.has(error)) ||
    property(error, "type") === "CredentialsSignin";
}

export function reportError(error: unknown, source: "request" | "operation" | "auth" | "database" = "operation", operation?: Operation) {
  if (isExpectedError(error)) { markOutcome("rejected"); return; }
  markOutcome("error");
  if (error && typeof error === "object") {
    if (reported.has(error)) return;
    reported.add(error);
  }
  const code = property(error, "code");
  emit("server.error", "error", {
    source: label(source, ["request", "operation", "auth", "database"], "operation"),
    ...(operation ? { operation: label(operation, operations, "unknown") } : {}),
    category: safeCodes.includes(code as typeof safeCodes[number]) ? "dependency" : "unexpected",
    ...(safeCodes.includes(code as typeof safeCodes[number]) ? { code } : {}),
    count: 1,
  });
}

// Prevent downstream framework logging from printing Prisma query arguments or
// nested causes. Never attach the original error, stack, or message.
export function safeOperationError() {
  const error = new Error("The operation could not be completed. Please try again.");
  reported.add(error);
  return error;
}

export function redactFrameworkError(value: unknown) {
  if (!value || typeof value !== "object") return;
  const error = value as Error;
  // Next's Node production runtime logs this same object AFTER onRequestError.
  // Retain only its generated digest for React; discard custom properties,
  // inspect/toJSON hooks, causes, query metadata, and the original stack.
  const digest = property(error, "digest");
  try {
    for (const key of Reflect.ownKeys(error)) delete (error as unknown as Record<PropertyKey, unknown>)[key];
    Object.setPrototypeOf(error, Error.prototype);
    error.name = "Error";
    error.message = "An unexpected server error occurred.";
    error.stack = "Error: An unexpected server error occurred.";
    if (typeof digest === "string" && /^\d{1,20}$/.test(digest)) {
      Object.assign(error, { digest });
    }
  } catch {
    // A frozen third-party error must not cause instrumentation itself to fail.
    // Monitored operations already rethrow newly created, safe errors.
  }
}

export function recordOperation(durationMs: number, fallback: Outcome = "success", status?: number) {
  const outcome = contexts.getStore()?.outcome;
  const resolvedOutcome = outcome && outcome !== "success" ? outcome : fallback;
  const slowThresholdMs = positiveSetting("SLOW_OPERATION_MS", 1000);
  const slow = durationMs >= slowThresholdMs;
  emit("operation.completed", slow || resolvedOutcome === "error" ? "warn" : "info", {
    durationMs: number(durationMs), slow, slowThresholdMs,
    outcome: label(resolvedOutcome, ["success", "rejected", "error", "control_flow"], "error"),
    ...(Number.isInteger(status) && status! >= 100 && status! <= 599 ? { status } : {}),
    count: 1,
  });
}

const timingNames = [
  "authMs", "latestSessionQueryMs", "lifetimeTotalQueryMs", "monthChartQueryMs",
  "calendarQueryMs", "databaseQueriesMs", "dataLoadMs", "responseFinishedMs",
] as const;

export function recordPerformance(operation: Operation, timings: Record<string, number>) {
  const safeTimings: Record<string, number> = {};
  for (const name of timingNames) {
    if (typeof timings[name] === "number" && Number.isFinite(timings[name])) {
      safeTimings[name] = number(timings[name]);
    }
  }
  emit("performance.detail", "info", { operation: label(operation, operations, "unknown"), timings: safeTimings });
}

const policies = ["proxy", "loginIp", "loginAccount", "registration", "write", "deleteAccount", "unknown"] as const;
type Policy = typeof policies[number];
type LimiterFailure = "configuration" | "timeout" | "redis" | "background";
export function recordRateLimit(policy: Policy, reason: "exhausted" | LimiterFailure) {
  const rejected = reason === "exhausted";
  if (reason !== "background") markOutcome(rejected ? "rejected" : "error");
  emit(rejected ? "rate_limit.rejected" : "rate_limit.failure", rejected ? "warn" : "error", {
    policy: label(policy, policies, "unknown"),
    reason: label(reason, ["exhausted", "configuration", "timeout", "redis", "background"], "redis"),
    // Background errors don't reject the request and must not inflate 503 counts.
    ...(reason !== "background" ? { status: rejected ? 429 : 503 } : {}),
    count: 1,
  });
}

export type PoolSnapshot = { max: number; total: number; idle: number; waiting: number };
export function recordPool(snapshot: PoolSnapshot, state: "sample" | "saturated" | "recovered") {
  const max = number(snapshot.max);
  const total = number(snapshot.total);
  const idle = Math.min(total, number(snapshot.idle));
  emit("database.pool", state === "saturated" ? "warn" : "info", {
    operation: "database", max, total, idle, busy: total - idle,
    waiting: number(snapshot.waiting), utilization: max ? number((total - idle) / max * 100) : 0,
    state: label(state, ["sample", "saturated", "recovered"], "sample"),
  });
}

export function recordPoolAcquisition(durationMs: number, failure?: "timeout" | "connection") {
  const failed = failure !== undefined;
  emit("database.acquire", failed ? "warn" : "info", {
    operation: "database", durationMs: number(durationMs), outcome: failed ? "error" : "success", count: 1,
    ...(failed ? { reason: label(failure, ["timeout", "connection"], "connection") } : {}),
  });
}

// Auth.js normally serializes error causes and debug metadata. Override every
// level, including debug, in both the main auth instance and the proxy instance.
export const safeAuthLogger = {
  error(error: unknown) { reportError(error, "auth", "auth"); },
  warn() { emit("auth.warning", "warn", { operation: "auth", count: 1 }); },
  debug() {},
};

export function operationForRoute(route: string): Operation {
  const routes: Record<string, Operation> = {
    "/dashboard": "dashboard", "/dashboard/page": "dashboard",
    "/api/study-sessions/chart/route": "study.chart", "/api/study-sessions/chart": "study.chart",
    "/api/study-sessions/calendar/route": "study.calendar", "/api/study-sessions/calendar": "study.calendar",
    "/api/auth/[...nextauth]/route": "auth.route", "/api/auth/[...nextauth]": "auth.route",
    "/login": "auth.login", "/login/page": "auth.login",
    "/register": "auth.register", "/register/page": "auth.register",
    "/weekly-reflection": "reflection.save", "/weekly-reflection/page": "reflection.save",
  };
  return Object.hasOwn(routes, route) ? routes[route] : "unknown";
}
