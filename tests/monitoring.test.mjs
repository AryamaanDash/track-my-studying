import assert from "node:assert/strict";
import test from "node:test";
import { inspect } from "node:util";
import { redirect, notFound } from "next/navigation.js";
import { monitored, monitoring as m, captureLogs } from "./helpers/monitoring.mjs";
import { loadIsolatedModule } from "./helpers/load-isolated-module.mjs";
import { createRateLimitService } from "../lib/rate-limit-core.ts";

const secret = "NEVER-LOG-password-journal-reflection-token";
const source = (path) => new URL(`../${path}`, import.meta.url);
const hook = loadIsolatedModule(source("instrumentation.ts"), { "./lib/monitoring.ts": m });

function privateError() {
  return Object.assign(new Error(secret, { cause: { password: secret } }), {
    code: secret, name: secret, stack: secret, meta: { journal: secret },
    toJSON() { throw new Error("must not serialize errors"); },
  });
}

test("the reporting boundary excludes raw errors, request data, identifiers, and arbitrary labels", (t) => {
  const records = captureLogs(t);
  const error = privateError();
  hook.onRequestError(error, {
    path: `/dashboard?password=${secret}`, method: secret, headers: { cookie: secret },
  }, { routePath: `/user/${secret}` });
  m.safeAuthLogger.error(privateError());
  m.safeAuthLogger.warn(secret);
  m.safeAuthLogger.debug(secret, { password: secret });
  m.recordPerformance(secret, { authMs: 12.34, [secret]: 123, dataLoadMs: Infinity, password: secret });
  m.recordRateLimit(secret, secret);
  const output = JSON.stringify(records);
  assert.ok(!output.includes(secret));
  assert.equal(records[0].operation, "unknown");
  assert.deepEqual(records.find((r) => r.event === "performance.detail").timings, { authMs: 12.3 });
  assert.equal(records.filter((r) => r.event === "server.error").length, 2);
  assert.ok(records.every((r) => /^[a-f0-9-]{36}$/.test(r.correlationId)));
});

test("failed operations report once, preserve correlation, and rethrow only a safe error", async (t) => {
  const records = captureLogs(t);
  let safe;
  await assert.rejects(monitored.monitorOperation("study.add", async () => { throw privateError(); }), (error) => {
    safe = error;
    assert.ok(!String(error.stack).includes(secret));
    assert.equal(error.cause, undefined);
    return true;
  });
  hook.onRequestError(safe, {}, { routePath: "/dashboard" });
  assert.equal(records.filter((r) => r.event === "server.error").length, 1);
  assert.equal(records.find((r) => r.event === "operation.completed").outcome, "error");
  assert.equal(new Set(records.map((r) => r.correlationId)).size, 1);
  assert.ok(!JSON.stringify(records).includes(secret));
});

test("the Next error hook scrubs the object later used by the framework logger", (t) => {
  const records = captureLogs(t);
  const error = Object.assign(privateError(), { digest: "123456789" });
  error[inspect.custom] = () => secret;
  hook.onRequestError(error, {}, { routePath: "/dashboard" });
  assert.equal(error.digest, "123456789");
  assert.ok(!inspect(error).includes(secret));
  assert.ok(!JSON.stringify(error).includes(secret));
  assert.equal(error.cause, undefined);
  assert.equal(records[0].operation, "dashboard");
});

test("Auth.js main and proxy configurations use the safe logger with debugging off", () => {
  const { authConfig } = loadIsolatedModule(source("auth.config.ts"), { "./lib/monitoring.ts": m });
  assert.equal(authConfig.logger, m.safeAuthLogger);
  assert.equal(authConfig.debug, false);
});

test("redirects and notFound retain Next behavior; expected failures are not server errors", async (t) => {
  const records = captureLogs(t);
  for (const run of [() => redirect("/login"), () => notFound()]) {
    await assert.rejects(monitored.monitorOperation("auth.login", async () => run()));
  }
  await assert.rejects(monitored.monitorOperation("study.add", async () => {
    throw new m.ExpectedOperationError("Subject is required");
  }), /Subject is required/);
  await monitored.monitorOperation("auth.login", async () => {
    m.safeAuthLogger.error({ type: "CredentialsSignin", message: secret });
  });
  assert.deepEqual(records.map((r) => r.outcome), ["control_flow", "control_flow", "rejected", "rejected"]);
});

test("records HTTP rejection status and caught failures without reading response bodies", async (t) => {
  const records = captureLogs(t);
  const response = Response.json({ journal: secret }, { status: 400 });
  assert.equal(await monitored.monitorOperation("study.chart", async () => response), response);
  await monitored.monitorOperation("reflection.save", async () => {
    m.reportError(Object.assign(privateError(), { code: "P1001" }));
    return { error: "Please retry" };
  });
  assert.equal(records[0].status, 400);
  assert.equal(records[0].outcome, "rejected");
  assert.equal(records[1].code, "P1001");
  assert.equal(records[2].outcome, "error");
  assert.ok(!JSON.stringify(records).includes(secret));
});

test("slow thresholds are inclusive, configurable, and fall back for invalid settings", (t) => {
  const records = captureLogs(t);
  const previous = process.env.SLOW_OPERATION_MS;
  t.after(() => { if (previous === undefined) delete process.env.SLOW_OPERATION_MS; else process.env.SLOW_OPERATION_MS = previous; });
  process.env.SLOW_OPERATION_MS = "500";
  m.recordOperation(499.9);
  m.recordOperation(500);
  for (const value of ["", "0", "-1", "Infinity", "oops"]) {
    process.env.SLOW_OPERATION_MS = value;
    m.recordOperation(1000);
  }
  assert.equal(records[0].slow, false);
  assert.equal(records[1].slow, true);
  assert.ok(records.slice(2).every((r) => r.slow && r.slowThresholdMs === 1000));
});

test("concurrent operations cannot mix correlation IDs or outcomes", async (t) => {
  const records = captureLogs(t);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const first = monitored.monitorOperation("study.add", async () => {
    await gate;
    m.reportError(privateError());
    return { error: "retry" };
  });
  await monitored.monitorOperation("study.chart", async () => Response.json({ ok: true }));
  release();
  await first;
  const chart = records.find((r) => r.operation === "study.chart");
  const writes = records.filter((r) => r.operation === "study.add");
  assert.equal(chart.outcome, "success");
  assert.equal(writes.length, 2);
  assert.equal(writes[0].correlationId, writes[1].correlationId);
  assert.notEqual(chart.correlationId, writes[0].correlationId);
  assert.equal(writes[1].outcome, "error");
});

test("a failing log sink cannot change operation results or limiter decisions", async (t) => {
  for (const level of ["info", "warn", "error"]) t.mock.method(console, level, () => { throw new Error("sink offline"); });
  assert.equal(await monitored.monitorOperation("study.add", async () => 42), 42);
  const decision = await createRateLimitService({})("write", secret);
  assert.equal(decision.status, 503);
});

test("rate-limit events count each rejection once and distinguish all outage paths", async (t) => {
  const records = captureLogs(t);
  const env = { NODE_ENV: "production", AUTH_SECRET: secret, UPSTASH_REDIS_REST_URL: "https://example.invalid", UPSTASH_REDIS_REST_TOKEN: secret };
  const result = () => ({ success: true, reset: Date.now() + 1000, pending: Promise.resolve() });
  await createRateLimitService(env, () => ({ limit: async () => result() }))("write", secret);
  assert.equal(records.length, 0);
  for (const response of [
    () => ({ ...result(), success: false }),
    () => ({ ...result(), reason: "timeout" }),
    () => { throw privateError(); },
    () => ({ ...result(), pending: Promise.reject(privateError()) }),
  ]) await createRateLimitService(env, () => ({ limit: async () => response() }))("loginIp", secret);
  await createRateLimitService({})("registration", secret);
  await Promise.resolve();
  assert.equal(records.length, 5);
  assert.equal(records.filter((r) => r.status === 429).length, 1);
  assert.equal(records.filter((r) => r.status === 503).length, 3);
  assert.equal(records.find((r) => r.reason === "background").status, undefined);
  assert.deepEqual(new Set(records.map((r) => r.reason)), new Set(["exhausted", "timeout", "redis", "background", "configuration"]));
  assert.ok(records.every((r) => r.count === 1));
  assert.ok(!JSON.stringify(records).includes(secret));
});

test("reflection persistence failures keep the friendly response and emit a safe error", async (t) => {
  const records = captureLogs(t);
  const actions = loadIsolatedModule(source("app/weekly-reflection/actions.ts"), {
    "@/auth": { auth: async () => ({ user: { id: secret } }) },
    "@/lib/prisma": { prisma: { weeklyReflection: { upsert: async () => { throw privateError(); } } } },
    "@/lib/weekly-reflection": { parseReflection: () => ({ journal: secret }) },
    "next/cache": { revalidatePath: () => assert.fail("must not invalidate after failure") },
    "@/lib/rate-limit": { checkRateLimit: async () => ({ allowed: true }) },
    "@/lib/monitor-operation": monitored,
    "@/lib/monitoring.ts": m,
  });
  const result = await actions.saveWeeklyReflection(new FormData());
  assert.match(result.error, /Your writing is still here/);
  assert.equal(records.filter((r) => r.event === "server.error").length, 1);
  assert.equal(records.at(-1).outcome, "error");
  assert.ok(!JSON.stringify(records).includes(secret));
});
