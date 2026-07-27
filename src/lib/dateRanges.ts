export type DateRangePreset = "last7" | "last30" | "last90" | "lastYear" | "custom";

export interface ResolvedDateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
}

const PRESET_DAYS: Record<Exclude<DateRangePreset, "custom">, number> = {
  last7: 7,
  last30: 30,
  last90: 90,
  lastYear: 365,
};

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function resolveDateRange(params: {
  preset?: string;
  from?: string;
  to?: string;
}): ResolvedDateRange {
  const now = new Date();

  if (params.preset === "custom" && params.from && params.to) {
    const from = startOfDay(new Date(params.from));
    const to = endOfDay(new Date(params.to));
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
      return { from, to, preset: "custom" };
    }
  }

  const preset: Exclude<DateRangePreset, "custom"> =
    params.preset === "last7" || params.preset === "last90" || params.preset === "lastYear"
      ? params.preset
      : "last30";

  const from = startOfDay(new Date(now.getTime() - PRESET_DAYS[preset] * 24 * 60 * 60 * 1000));
  return { from, to: endOfDay(now), preset };
}

export interface ComparisonRange {
  from: Date;
  to: Date;
}

/**
 * The immediately preceding period of the same length as `range` -- the
 * default "vs previous period" comparison (e.g. Last 30 days compares
 * against the 30 days before that, back to back with no gap).
 */
export function resolveComparisonRange(range: ResolvedDateRange): ComparisonRange {
  const durationMs = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime() - 1);
  const from = new Date(to.getTime() - durationMs);
  return { from, to };
}

/**
 * Resolves the comparison window from its own URL params, letting the user
 * pick an independent comparison range (Last 7/30/90 days, Last year, or a
 * custom range) rather than always being locked to "immediately preceding,
 * same length as the main range". `comparePreset` of "previous" (the
 * default once comparison is turned on) keeps that original auto behavior.
 */
export function resolveComparisonRangeFromParams(
  range: ResolvedDateRange,
  params: { comparePreset?: string; compareFrom?: string; compareTo?: string },
): ComparisonRange {
  if (!params.comparePreset || params.comparePreset === "previous") {
    return resolveComparisonRange(range);
  }
  const resolved = resolveDateRange({
    preset: params.comparePreset,
    from: params.compareFrom,
    to: params.compareTo,
  });
  return { from: resolved.from, to: resolved.to };
}
