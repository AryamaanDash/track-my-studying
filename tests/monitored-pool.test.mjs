import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { setTimeout } from "node:timers/promises";
import test from "node:test";
import { Pool } from "pg";
import { MonitoredPool } from "../lib/monitored-pool.ts";
import { captureLogs } from "./helpers/monitoring.mjs";

// Exercise the real pg-pool queue, callbacks, release, and timeout code without
// a network/database. Only the wire client is replaced.
class WireClient extends EventEmitter {
  _queryable = true;
  _ending = false;
  connect(callback) { queueMicrotask(() => callback(null)); }
  end(callback) { this._ending = true; queueMicrotask(() => { this.emit("end"); callback?.(); }); }
  ref() {}
  unref() {}
}

test("captures a brief full-pool queue and recovery, preserving promise and callback clients", async (t) => {
  const records = captureLogs(t);
  const pool = new MonitoredPool({ max: 1, Client: WireClient });
  t.after(() => pool.end());
  assert.ok(pool instanceof Pool, "Prisma must recognize the supplied external pool");
  const first = await pool.connect();
  const secondPending = pool.connect();
  const thirdPending = new Promise((resolve, reject) => {
    pool.connect((error, client, release) => error ? reject(error) : resolve({ client, release }));
  });
  assert.equal(pool.waitingCount, 2);
  const saturation = records.find((r) => r.state === "saturated");
  assert.equal(saturation.busy, 1);
  assert.equal(saturation.idle, 0);
  assert.equal(saturation.waiting, 1);
  first.release();
  const second = await secondPending;
  second.release();
  const third = await thirdPending;
  assert.ok(third.client);
  third.release();
  await Promise.resolve();
  assert.equal(records.filter((r) => r.state === "saturated").length, 1);
  assert.equal(records.filter((r) => r.state === "recovered").length, 1);
  assert.equal(records.filter((r) => r.event === "database.acquire").length, 3);
  assert.equal(pool.idleCount, 1);
});

test("queued acquisition timeouts are counted without logging connection details", async (t) => {
  const records = captureLogs(t);
  const pool = new MonitoredPool({ max: 1, connectionTimeoutMillis: 10, Client: WireClient });
  t.after(() => pool.end());
  const held = await pool.connect();
  const rejected = assert.rejects(pool.connect(), /timeout exceeded/);
  // pg deliberately unrefs the timeout; this keeps the test alive until it fires.
  await setTimeout(25);
  await rejected;
  held.release();
  await Promise.resolve();
  const failure = records.find((r) => r.event === "database.acquire" && r.outcome === "error");
  assert.equal(failure.reason, "timeout");
  assert.ok(failure.durationMs >= 5);
  const secret = "private-journal-and-db-password";
  pool.emit("error", new Error(secret), held);
  assert.equal(records.filter((r) => r.event === "server.error").length, 1);
  assert.ok(!JSON.stringify(records).includes(secret));
});
