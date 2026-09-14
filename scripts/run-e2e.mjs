import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { startRedisRestBridge } from "../tests/helpers/redis-rest-bridge.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const capture = promisify(execFile);
const project = `study-e2e-${randomUUID().slice(0, 8)}`;
const compose = ["compose", "-f", "compose.e2e.yaml", "-p", project];
let activeChild;
let interrupted = false;

function stop() {
  interrupted = true;
  activeChild?.kill("SIGTERM");
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function run(command, args, env = process.env) {
  if (interrupted) throw new Error("E2E run interrupted");
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
    activeChild = child;
    child.once("error", reject);
    child.once("close", (code) => {
      activeChild = undefined;
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args[0]} exited with ${code}`));
    });
  });
}

let bridge;
try {
  console.log(`Starting disposable E2E services (${project})`);
  await run("docker", [...compose, "up", "-d", "--wait", "--wait-timeout", "120"]);
  const { stdout: address } = await capture("docker", [...compose, "port", "postgres", "5432"], { cwd: root });
  const port = address.trim().match(/^127\.0\.0\.1:(\d+)$/)?.[1];
  if (!port) throw new Error("Expected a loopback-only E2E PostgreSQL port");
  const { stdout: redisId } = await capture("docker", [...compose, "ps", "-q", "redis"], { cwd: root });
  bridge = await startRedisRestBridge(redisId.trim());
  const databaseUrl = `postgresql://study_e2e:disposable_e2e_password@127.0.0.1:${port}/study_e2e?sslmode=disable`;

  // Override EVERY supported alias so inherited settings and Next's .env files
  // cannot redirect migrations or app queries to a developer/hosted database.
  const env = {
    ...process.env,
    NODE_ENV: "production",
    E2E_MANAGED_RUN: "1",
    E2E_DATABASE_URL: databaseUrl,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    PRISMA_MIGRATE_DATABASE_URL: databaseUrl,
    POSTGRES_URL_NON_POOLING: databaseUrl,
    POSTGRES_PRISMA_URL: databaseUrl,
    PRISMA_DATABASE_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
    AUTH_SECRET: "ci-only-placeholder-secret-not-for-deployment",
    AUTH_URL: "http://127.0.0.1:3100",
    NEXTAUTH_URL: "http://127.0.0.1:3100",
    NEXTAUTH_URL_INTERNAL: "http://127.0.0.1:3100",
    AUTH_TRUST_HOST: "true",
    AUTH_REDIRECT_PROXY_URL: "",
    UPSTASH_REDIS_REST_URL: bridge.url,
    UPSTASH_REDIS_REST_TOKEN: "local-test-token",
    RATE_LIMIT_PREFIX: project,
    RATE_LIMIT_REDIS_CONTAINER: redisId.trim(),
    RATE_LIMIT_DISABLED: "0",
    RATE_LIMIT_IP_HEADER: "",
    VERCEL: "0",
    VERCEL_ENV: "",
    VERCEL_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "",
    NEXT_TELEMETRY_DISABLED: "1",
    TZ: "UTC",
  };

  await run(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", "--test", "tests/rate-limit-redis.test.mjs"], env);
  // Exercise the same migration + production build used by deployment.
  await run("npm", ["run", "build"], env);
  // The project's standalone server needs its static assets copied alongside it.
  await cp(new URL("../public", import.meta.url), new URL("../.next/standalone/public", import.meta.url), { recursive: true });
  await cp(new URL("../.next/static", import.meta.url), new URL("../.next/standalone/.next/static", import.meta.url), { recursive: true });
  await run(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], env);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  try {
    await bridge?.close();
  } catch {
    console.error("Failed to close the local Redis test bridge");
    process.exitCode = 1;
  }
  console.log(`Removing disposable E2E services (${project})`);
  try {
    await capture("docker", [...compose, "down", "--volumes", "--remove-orphans"], { cwd: root });
  } catch {
    console.error(`Cleanup failed. Run: docker ${compose.join(" ")} down --volumes --remove-orphans`);
    process.exitCode = 1;
  }
  process.off("SIGINT", stop);
  process.off("SIGTERM", stop);
}
