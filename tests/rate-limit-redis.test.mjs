import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createRateLimitService } from "../lib/rate-limit-core.ts";
import { startRedisRestBridge } from "./helpers/redis-rest-bridge.mjs";

const container = process.env.RATE_LIMIT_REDIS_CONTAINER;

// The real Upstash SDK talks to a loopback REST bridge. Redis itself executes
// the SDK's real Lua scripts, including atomic concurrent checks and TTLs.
test("Redis shares atomic limits across instances and smooths window boundaries", {
  skip: !container,
}, async (t) => {
  const bridge = await startRedisRestBridge(container);
  const { redis } = bridge;
  t.after(() => bridge.close());
  const prefix = `rate-limit-test:${randomUUID()}`;
  const env = {
    NODE_ENV: "test",
    AUTH_SECRET: "local-test-secret",
    UPSTASH_REDIS_REST_URL: bridge.url,
    UPSTASH_REDIS_REST_TOKEN: "local-test-token",
    RATE_LIMIT_PREFIX: prefix,
  };
  const instanceOne = createRateLimitService(env);
  const instanceTwo = createRateLimitService(env);
  const hour = 60 * 60 * 1000;
  const start = Math.floor(Date.now() / hour) * hour;
  t.mock.timers.enable({ apis: ["Date"], now: start + hour - 1000 });

  const attempts = await Promise.all(Array.from({ length: 12 }, (_, index) =>
    (index % 2 ? instanceOne : instanceTwo)("registration", "192.0.2.1")));
  assert.equal(attempts.filter((result) => result.allowed).length, 5);
  assert.equal(attempts.filter((result) => result.status === 429).length, 7);
  assert.equal((await instanceTwo("registration", "192.0.2.2")).allowed, true);
  assert.equal((await instanceTwo("write", "192.0.2.1")).allowed, true);

  // A fixed-window limiter would allow a fresh full burst here. A sliding
  // counter still counts the five requests from the preceding window.
  t.mock.timers.setTime(start + hour);
  assert.equal((await instanceTwo("registration", "192.0.2.1")).status, 429);
  t.mock.timers.setTime(start + 2 * hour);
  assert.equal((await instanceOne("registration", "192.0.2.1")).allowed, true);

  const { result: keys } = await redis(["KEYS", `${prefix}:*`]);
  assert.ok(keys.length > 0);
  assert.ok(keys.every((key) => !key.includes("192.0.2.")));
  for (const key of keys) {
    assert.ok((await redis(["PTTL", key])).result > 0, "counter must expire");
  }
  await redis(["DEL", ...keys]);
});
