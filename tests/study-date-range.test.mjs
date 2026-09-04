import assert from "node:assert/strict";
import test from "node:test";
import { getExclusiveUtcDayEnd } from "../lib/study-date-range.ts";

test("uses tomorrow as the exclusive boundary for a time during the day", () => {
  const referenceDate = new Date("2026-09-04T22:15:00.000Z");

  assert.equal(
    getExclusiveUtcDayEnd(referenceDate).toISOString(),
    "2026-09-05T00:00:00.000Z"
  );
});

test("rolls the exclusive boundary into the next month and year", () => {
  const referenceDate = new Date("2026-12-31T23:59:59.999Z");

  assert.equal(
    getExclusiveUtcDayEnd(referenceDate).toISOString(),
    "2027-01-01T00:00:00.000Z"
  );
});
