import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { promisify } from "node:util";
import test from "node:test";
import { createRateLimitService } from "../lib/rate-limit-core.ts";

const run = promisify(execFile);
const container = process.env.RATE_LIMIT_REDIS_CONTAINER;

// The real Upstash SDK talks to a loopback REST bridge. Redis itself executes
// the SDK's real Lua scripts, including atomic concurrent checks and TTLs.
test("Redis shares atomic limits across instances and smooths window boundaries", {
  skip: !container,
}, async (t) => {
  const redis = async (command) => {
    const { stdout } = await run("docker", ["exec", container, "redis-cli", "--json", ...command.map(String)]);
    const value = stdout.trim();
    return value.startsWith("error:")
      ? { error: JSON.parse(value.slice(6)) }
      : { result: JSON.parse(value) };
  };
  const bridge = createServer(async (request, response) => {
    try {
      assert.equal(request.headers.authorization, "Bearer local-test-token");
      let body = "";
      for await (const chunk of request) body += chunk;
      const payload = JSON.parse(body);
      const pipeline = request.url === "/pipeline";
      const commands = pipeline ? payload : [payload];
      assert.ok(commands.every(([command]) => ["eval", "evalsha"].includes(command.toLowerCase())));
      const results = await Promise.all(commands.map(redis));
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(pipeline ? results : results[0]));
    } catch {
      response.writeHead(500);
      response.end(JSON.stringify({ error: "Test bridge failure" }));
    }
  });
  await new Promise((resolve) => bridge.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => bridge.close(resolve)));
  const prefix = `rate-limit-test:${randomUUID()}`;
  const env = {
    NODE_ENV: "test",
    AUTH_SECRET: "local-test-secret",
    UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${bridge.address().port}`,
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
