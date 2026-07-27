import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveDateRange,
  resolveComparisonRange,
  resolveComparisonRangeFromParams,
  type ResolvedDateRange,
} from "./dateRanges";

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

test("resolveDateRange accepts 'last7' as a valid preset", () => {
  const result = resolveDateRange({ preset: "last7" });
  assert.equal(result.preset, "last7");
  // Rounded to calendar-day boundaries (start-of-day/end-of-day), same as
  // every other preset -- "7 days back" plus "today" spans 8 calendar days.
  const days = Math.round((result.to.getTime() - result.from.getTime()) / (24 * 60 * 60 * 1000));
  assert.equal(days, 8);
});

test("resolveComparisonRangeFromParams defaults to 'previous period' when comparePreset is omitted", () => {
  const range = resolveDateRange({ preset: "last30" });
  const viaDefault = resolveComparisonRangeFromParams(range, {});
  const viaExplicitAuto = resolveComparisonRange(range);
  assert.equal(viaDefault.from.getTime(), viaExplicitAuto.from.getTime());
  assert.equal(viaDefault.to.getTime(), viaExplicitAuto.to.getTime());
});

test("resolveComparisonRangeFromParams supports an independent preset, decoupled from the main range's length", () => {
  const range = resolveDateRange({ preset: "last30" }); // 30-day main range
  const comparison = resolveComparisonRangeFromParams(range, { comparePreset: "last7" });
  const days = Math.round(
    (comparison.to.getTime() - comparison.from.getTime()) / (24 * 60 * 60 * 1000),
  );
  assert.equal(days, 8, "comparison window matches the 'last7' preset's own span, not the 30-day main range");
});

test("resolveComparisonRangeFromParams supports a fully custom comparison range", () => {
  const range = resolveDateRange({ preset: "last30" });
  const comparison = resolveComparisonRangeFromParams(range, {
    comparePreset: "custom",
    compareFrom: "2025-01-01",
    compareTo: "2025-01-31",
  });
  assert.equal(comparison.from.getFullYear(), 2025);
  assert.equal(comparison.from.getMonth(), 0);
  assert.equal(comparison.from.getDate(), 1);
});
