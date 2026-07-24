import type { StageEventRow } from "../db/types";
import { stageMappingByName, type FunnelBucket } from "../funnel/stageMapping";

export interface DailyBucketSnapshot {
  /** YYYY-MM-DD, in UTC (matches how event_at is stored). */
  date: string;
  counts: Record<FunnelBucket, number>;
}

const EMPTY_BUCKET_COUNTS: Record<FunnelBucket, number> = {
  Booked: 0,
  Qualified: 0,
  NoShow: 0,
  Cancelled: 0,
  InDeliberation: 0,
  Won: 0,
  Lost: 0,
  Nurture: 0,
};

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Reconstructs "how many contacts were in each funnel bucket, as of the end
 * of each day" from the raw stage-event log. This is what makes the trend
 * view possible at all -- GHL itself has no rewind button, only our own
 * logged history does.
 *
 * `events` should be the FULL history (not pre-filtered to `from`/`to`),
 * since a contact's state on day `from` depends on events before `from`.
 * Single forward pass over time-sorted events, advancing a day cursor --
 * O(events + days), not O(events * days).
 */
export function computeDailyBucketSnapshots(
  events: StageEventRow[],
  from: Date,
  to: Date,
): DailyBucketSnapshot[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.event_at).getTime() - new Date(b.event_at).getTime(),
  );

  const currentStageByContact = new Map<string, string>();
  const snapshots: DailyBucketSnapshot[] = [];
  const oneDayMs = 24 * 60 * 60 * 1000;

  let eventIndex = 0;
  const rangeStart = startOfDayUtc(from).getTime();
  const rangeEnd = startOfDayUtc(to).getTime();

  for (let dayStart = rangeStart; dayStart <= rangeEnd; dayStart += oneDayMs) {
    const dayEnd = dayStart + oneDayMs - 1;

    while (eventIndex < sorted.length && new Date(sorted[eventIndex].event_at).getTime() <= dayEnd) {
      const event = sorted[eventIndex];
      currentStageByContact.set(event.contact_ref, event.to_stage_id);
      eventIndex++;
    }

    const counts = { ...EMPTY_BUCKET_COUNTS };
    for (const stageName of currentStageByContact.values()) {
      const mapping = stageMappingByName.get(stageName);
      if (mapping) counts[mapping.bucket]++;
    }

    snapshots.push({ date: toDateKey(new Date(dayStart)), counts });
  }

  return snapshots;
}
