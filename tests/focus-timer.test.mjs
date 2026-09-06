import assert from "node:assert/strict";
import test from "node:test";
import { MAX_DURATION, elapsedTime, restoreSession, stopSession } from "../lib/focus-timer.ts";

const initial = {
  version: 1, phase: "running", accumulated: 1500, startedAt: 10000,
  subject: "Math", journal: "Practice problems", date: "2026-09-05",
};
const reload = (session, now) => restoreSession(JSON.stringify(session), now);

test("running restoration includes time away without double counting repeated reloads", () => {
  const restored = reload(initial, 20000);
  assert.equal(elapsedTime(restored, 20000), 11500);
  assert.equal(elapsedTime(reload(restored, 30000), 30000), 21500);
});

test("paused restoration excludes time away and resume retains fractional seconds", () => {
  const paused = stopSession(initial, 10555, false);
  const restored = reload(paused, 90000);
  assert.equal(restored.phase, "paused");
  assert.equal(elapsedTime(restored, 90000), 2055);
  const resumed = { ...restored, phase: "running", startedAt: 90000 };
  assert.equal(elapsedTime(reload(resumed, 91000), 91000), 3055);
});

test("ended drafts remain frozen with their notes and date intact", () => {
  const ended = stopSession(initial, 20000, true);
  assert.deepEqual(reload(ended, 999999), ended);
});

test("running sessions reach the 24 hour cap while away and restore ready to save", () => {
  const restored = reload(initial, MAX_DURATION * 2);
  assert.equal(restored.phase, "ended");
  assert.equal(restored.accumulated, MAX_DURATION);
  assert.equal(restored.startedAt, null);
  assert.equal(stopSession(initial, MAX_DURATION * 2, false).phase, "ended");
});

test("missing, corrupt, unsupported and invalid saved state is ignored", () => {
  for (const raw of [null, "{", "null", "[]", JSON.stringify({ ...initial, version: 2 }),
    JSON.stringify({ ...initial, accumulated: -1 }),
    JSON.stringify({ ...initial, accumulated: MAX_DURATION + 1 }),
    JSON.stringify({ ...initial, startedAt: null }),
    JSON.stringify({ ...initial, startedAt: 999999 }),
    JSON.stringify({ ...initial, phase: "paused" }),
    JSON.stringify({ ...initial, date: "2026-02-30" })]) {
    assert.equal(restoreSession(raw, 20000), null);
  }
});

test("backward clock adjustments never subtract already accumulated time", () => {
  assert.equal(elapsedTime(initial, 9000), initial.accumulated);
});

test("clearing a draft date does not discard the session on refresh", () => {
  const draft = { ...stopSession(initial, 20000, true), date: "" };
  assert.deepEqual(reload(draft, 30000), draft);
});
