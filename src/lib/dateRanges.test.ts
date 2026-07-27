import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveComparisonRange, type ResolvedDateRange } from "./dateRanges";

test("comparison range is the same length, immediately preceding, no gap or overlap", () => {
  const range: ResolvedDateRange = {
    from: new Date("2026-07-01T00:00:00.000Z"),
    to: new Date("2026-07-30T23:59:59.999Z"),
    preset: "last30",
  };

  const comparison = resolveComparisonRange(range);

  const rangeDuration = range.to.getTime() - range.from.getTime();
  const comparisonDuration = comparison.to.getTime() - comparison.from.getTime();
  assert.equal(comparisonDuration, rangeDuration, "same length as the original range");

  assert.equal(
    comparison.to.getTime(),
    range.from.getTime() - 1,
    "ends exactly 1ms before the original range starts -- no gap, no overlap",
  );
});

test("works for a custom range too, not just presets", () => {
  const range: ResolvedDateRange = {
    from: new Date("2026-03-10T00:00:00.000Z"),
    to: new Date("2026-03-17T23:59:59.999Z"), // 8 days
    preset: "custom",
  };

  const comparison = resolveComparisonRange(range);
  const rangeDuration = range.to.getTime() - range.from.getTime();
  assert.equal(comparison.to.getTime() - comparison.from.getTime(), rangeDuration);
  assert.ok(comparison.to.getTime() < range.from.getTime());
});
