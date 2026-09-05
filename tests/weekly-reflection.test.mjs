import assert from "node:assert/strict";
import test from "node:test";
import { reflectionWeek, parseReflection } from "../lib/weekly-reflection.ts";

test("groups Monday through Sunday into the same week", () => {
  assert.equal(reflectionWeek("2026-08-31"), "2026-08-31");
  assert.equal(reflectionWeek("2026-09-06"), "2026-08-31");
  assert.equal(reflectionWeek("2026-09-07"), "2026-09-07");
  assert.equal(reflectionWeek("2027-01-01"), "2026-12-28");
});

test("rejects malformed and impossible dates", () => {
  for (const value of ["", "2026-02-29", "2026-04-31", "2026-13-01", "no date"]) {
    assert.throws(() => reflectionWeek(value), /valid date/);
  }
  assert.equal(reflectionWeek("2028-02-29"), "2028-02-28");
});

test("allows partial reflections and normalizes the date and whitespace", () => {
  const form = new FormData();
  form.set("week", "2026-09-05");
  form.set("worked", "  Studied a little every day.  ");
  const result = parseReflection(form);
  assert.equal(result.weekStart.toISOString(), "2026-08-31T00:00:00.000Z");
  assert.equal(result.worked, "Studied a little every day.");
  assert.equal(result.difficult, "");
  assert.equal(result.priorities, "");
});

test("rejects empty reflections and limits each entry separately", () => {
  const form = new FormData();
  form.set("week", "2026-09-05");
  form.set("worked", "   ");
  assert.throws(() => parseReflection(form), /at least one/);
  for (const key of ["worked", "difficult", "priorities"]) {
    form.set(key, "x".repeat(10001));
    assert.throws(() => parseReflection(form), /10,000/);
    form.set(key, "x".repeat(10000));
    assert.equal(parseReflection(form)[key].length, 10000);
    form.delete(key);
  }
});
