/**
 * The Overview dashboard only tracks the active sales team -- confirmed
 * with Steph 2026-07-29. Everything else (Unassigned, former staff, stray
 * owner ids) is noise for this view: Unassigned alone was ~75% of raw
 * opportunity volume, which drowned out the 3 reps actually being managed.
 * IDs are canonical (post-alias-merge, see ownerAliases.ts) GHL user ids.
 */
export const TRACKED_REPS = [
  { id: "tBJ1NcXH2JGeUzFu9DVj", name: "Jack O'Brien", color: "#a1129e" }, // violet
  { id: "m4TSEnsR5FLCZouKGr6N", name: "Peter Flynn", color: "#ff8e21" }, // orange
  { id: "fLFcwyQAVkrZ0QOazh9g", name: "Daniel Gibbs", color: "#24a3ff" }, // blue
] as const;

const trackedIds = new Set<string>(TRACKED_REPS.map((r) => r.id));

export function isTrackedRep(canonicalOwnerId: string): boolean {
  return trackedIds.has(canonicalOwnerId);
}

export function repColor(canonicalOwnerId: string): string {
  return TRACKED_REPS.find((r) => r.id === canonicalOwnerId)?.color ?? "#9ca3af";
}
