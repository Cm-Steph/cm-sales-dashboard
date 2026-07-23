export type DateRangePreset = "last30" | "last90" | "lastYear" | "custom";

export interface ResolvedDateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
}

const PRESET_DAYS: Record<Exclude<DateRangePreset, "custom">, number> = {
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
    params.preset === "last90" || params.preset === "lastYear" ? params.preset : "last30";

  const from = startOfDay(new Date(now.getTime() - PRESET_DAYS[preset] * 24 * 60 * 60 * 1000));
  return { from, to: endOfDay(now), preset };
}
