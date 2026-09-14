import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";

const run = promisify(execFile);

// Test-only transport for the real Upstash SDK. Redis executes the real Lua
// scripts; no rate-limit decisions or application responses are mocked.
export async function startRedisRestBridge(container) {
  const redis = async (command) => {
    const { stdout } = await run("docker", ["exec", container, "redis-cli", "--json", ...command.map(String)]);
    const value = stdout.trim();
    return value.startsWith("error:")
      ? { error: JSON.parse(value.slice(6)) }
      : { result: JSON.parse(value) };
  };
  const server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
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
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Test bridge failure" }));
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    redis,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}
