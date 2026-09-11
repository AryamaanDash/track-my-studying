import { monitored, monitoring, captureLogs } from "./helpers/monitoring.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import nextTesting from "next/experimental/testing/server.js";
import { loadIsolatedModule } from "./helpers/load-isolated-module.mjs";
import { rateLimitResponse } from "../lib/rate-limit-core.ts";

const rejection = { allowed: false, status: 429, error: "Please retry later.", retryAfterSeconds: 60 };
const source = (path) => new URL(`../${path}`, import.meta.url);
const never = () => assert.fail("protected operation ran after rejection");
const jsx = (type, props) => ({ type, props });
const jsxRuntime = { jsx, jsxs: jsx };
// Next 16.2.4 still exports the testing helper under its middleware-era name.
const { unstable_doesMiddlewareMatch: doesProxyMatch } = nextTesting;

test("study writes and account deletion stop before Prisma, bcrypt, or invalidation", async (t) => {
  captureLogs(t);
  const calls = [];
  const actions = loadIsolatedModule(source("app/actions.ts"), {
    "next/cache": { updateTag: never, revalidatePath: never },
    bcryptjs: { compare: never },
    "../auth": { auth: async () => ({ user: { id: "verified-user" } }), signOut: never },
    "../lib/prisma": { prisma: {
      studySession: { create: never, updateMany: never, deleteMany: never },
      user: { findUnique: never, deleteMany: never },
    } },
    "../lib/study-cache": { getStudyDataCacheTag: never },
    "../lib/monitor-operation": monitored,
    "../lib/monitoring.ts": monitoring,
    "../lib/rate-limit": { checkRateLimit: async (...args) => { calls.push(args); return rejection; } },
  });
  const form = new FormData();
  for (const result of [
    await actions.addStudySession(form),
    await actions.updateStudySession("session-id", form),
    await actions.deleteSession("session-id"),
    await actions.deleteAccount({ attempt: 0 }, form),
  ]) assert.equal(result.error, rejection.error);
  assert.deepEqual(calls, [
    ["write", "verified-user"], ["write", "verified-user"],
    ["write", "verified-user"], ["deleteAccount", "verified-user"],
  ]);
});

test("weekly reflections use the same authenticated write budget", async (t) => {
  captureLogs(t);
  const calls = [];
  const actions = loadIsolatedModule(source("app/weekly-reflection/actions.ts"), {
    "@/auth": { auth: async () => ({ user: { id: "verified-user" } }) },
    "@/lib/prisma": { prisma: { weeklyReflection: { upsert: never } } },
    "@/lib/weekly-reflection": { parseReflection: never },
    "next/cache": { revalidatePath: never },
    "@/lib/monitor-operation": monitored,
    "@/lib/monitoring.ts": monitoring,
    "@/lib/rate-limit": { checkRateLimit: async (...args) => { calls.push(args); return rejection; } },
  });
  assert.deepEqual(await actions.saveWeeklyReflection(new FormData()), { error: rejection.error });
  assert.deepEqual(calls, [["write", "verified-user"]]);
});

test("login provider checks IP then normalized account before reading or comparing passwords", async () => {
  for (const blockedPolicy of ["loginIp", "loginAccount"]) {
    let config;
    const calls = [];
    class CredentialsSignin extends Error {}
    const nextAuth = (options) => { config = options; return {}; };
    loadIsolatedModule(source("auth.ts"), {
      "next-auth": { __esModule: true, default: nextAuth, CredentialsSignin },
      bcryptjs: { compare: never },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "next-auth/providers/credentials": (options) => options,
      "./auth.config": { authConfig: { callbacks: {} } },
      "./lib/prisma": { prisma: { user: { findUnique: never } } },
      "./lib/rate-limit": {
        getClientIp: (headers) => headers.get("x-test-ip"),
        checkRateLimit: async (...args) => {
          calls.push(args);
          return args[0] === blockedPolicy ? rejection : { allowed: true };
        },
      },
    });
    await assert.rejects(config.providers[0].authorize({
      email: "  Student@Example.com ", password: "test-password",
    }, new Request("http://localhost/api/auth/callback/credentials", {
      headers: { "x-test-ip": "192.0.2.1" },
    })), (error) => error instanceof CredentialsSignin && error.code === "rate_limited");
    assert.deepEqual(calls, blockedPolicy === "loginIp"
      ? [["loginIp", "192.0.2.1"]]
      : [["loginIp", "192.0.2.1"], ["loginAccount", "student@example.com"]]);
  }
});

test("registration action limits direct submissions before database lookup or hashing", async (t) => {
  captureLogs(t);
  const calls = [];
  const page = loadIsolatedModule(source("app/register/page.tsx"), {
    "react/jsx-runtime": jsxRuntime,
    bcryptjs: { hash: never },
    "@prisma/client": { Prisma: {} },
    "next/link": "Link",
    "next/navigation": { redirect: (url) => { throw Object.assign(new Error(`redirect:${url}`), { digest: `NEXT_REDIRECT;push;${url};307;` }); } },
    "next/server": { connection: async () => {} },
    "lucide-react": {},
    "@/auth": { auth: async () => null },
    "@/components/JournalAuthPage": "JournalAuthPage",
    "@/components/ui/dot-border-button": "DotBorderButton",
    "@/lib/prisma": { prisma: { user: { findUnique: never, create: never } } },
    "next/headers": { headers: async () => new Headers({ "x-test-ip": "192.0.2.1" }) },
    "@/lib/monitor-operation": monitored,
    "@/lib/monitoring.ts": monitoring,
    "@/lib/rate-limit": {
      getClientIp: (headers) => headers.get("x-test-ip"),
      checkRateLimit: async (...args) => { calls.push(args); return rejection; },
    },
  });
  const rendered = await page.default({ searchParams: Promise.resolve({}) });
  const form = rendered.props.children.find((child) => child.type === "form");
  await assert.rejects(form.props.action(new FormData()), /redirect:\/register\?error=rate_limited/);
  assert.deepEqual(calls, [["registration", "192.0.2.1"]]);
});

test("proxy covers API/actions, excludes assets, preserves auth, and emits 429/503", async () => {
  const { authConfig } = loadIsolatedModule(source("auth.config.ts"), { "./lib/monitoring.ts": monitoring });
  let configured;
  let decision = { allowed: true };
  const proxy = loadIsolatedModule(source("proxy.ts"), {
    "next-auth": (options) => { configured = options; return { auth: () => {} }; },
    "./auth.config": { authConfig },
    "./lib/rate-limit": {
      getClientIp: () => "192.0.2.1",
      checkRateLimit: async (policy, ip) => {
        assert.equal(policy, "proxy");
        assert.equal(ip, "192.0.2.1");
        return decision;
      },
      rateLimitResponse,
    },
  });
  for (const url of ["/api/auth/callback/credentials", "/api/study-sessions/chart", "/register", "/dashboard", "/weekly-reflection"]) {
    assert.equal(doesProxyMatch({ config: proxy.config, nextConfig: {}, url }), true);
  }
  for (const url of ["/_next/static/chunk.js", "/_next/image?url=test", "/favicon.ico"]) {
    assert.equal(doesProxyMatch({ config: proxy.config, nextConfig: {}, url }), false);
  }
  const context = { auth: null, request: { headers: new Headers(), nextUrl: new URL("http://localhost/dashboard") } };
  assert.equal(await configured.callbacks.authorized(context), false);
  assert.equal(await configured.callbacks.authorized({ ...context, auth: { user: { id: "verified-user" } } }), true);
  for (const status of [429, 503]) {
    decision = { ...rejection, status };
    const response = await configured.callbacks.authorized(context);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Retry-After"), "60");
  }
});
