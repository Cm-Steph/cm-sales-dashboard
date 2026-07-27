export interface Delta {
  label: string;
  direction: "up" | "down" | "flat";
}

const FLAT_THRESHOLD = 0.05;

/** Percentage change between two counts, e.g. Total this period vs last period. */
export function percentChange(current: number, previous: number): Delta {
  if (previous === 0) {
    if (current === 0) return { label: "—", direction: "flat" };
    return { label: "New", direction: "up" };
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < FLAT_THRESHOLD) return { label: "—", direction: "flat" };
  const direction = change > 0 ? "up" : "down";
  return { label: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`, direction };
}

/**
 * Percentage-POINT change for rates that are already percentages (e.g. Win
 * Rate 20% -> 25% reads as "+5pp", not "+25%" -- the latter is technically
 * a valid computation but reliably misleads people reading a dashboard.
 */
export function percentagePointChange(current: number | null, previous: number | null): Delta {
  if (current === null || previous === null) return { label: "—", direction: "flat" };
  const diff = (current - previous) * 100;
  if (Math.abs(diff) < FLAT_THRESHOLD) return { label: "—", direction: "flat" };
  const direction = diff > 0 ? "up" : "down";
  return { label: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}pp`, direction };
}
