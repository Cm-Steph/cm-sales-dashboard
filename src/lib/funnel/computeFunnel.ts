import type { GhlStage } from "../ghl/pipelines";
import type { GhlUser } from "../ghl/users";
import type { SafeOpportunity } from "../ghl/opportunities";
import { stageMappingByName, type FunnelBucket } from "./stageMapping";
import { canonicalOwnerNameOverride, resolveCanonicalOwnerId } from "./ownerAliases";
import { isTrackedRep } from "./trackedReps";

export interface FunnelCounts {
  total: number;
  qualified: number;
  noShow: number;
  cancelled: number;
  inDeliberation: number;
  won: number;
  lost: number;
  nurture: number;
  /** Won / total — the widest conversion measure. */
  totalToWonRate: number | null;
  /** Won / qualified — conversion once someone has passed initial screening. */
  qualifiedToWonRate: number | null;
  /** No Show / total — drop-off rate at the initial appointment gate. */
  noShowRate: number | null;
  /** Cancelled / total — drop-off rate from cancellations. */
  cancelledRate: number | null;
  /** In Deliberation / total — the "stuck, not yet decided" rate. */
  inDeliberationRate: number | null;
  /** Lost / total — explicit loss rate. */
  lostRate: number | null;
}

export interface RepFunnelMetrics {
  ownerId: string;
  ownerName: string;
  counts: FunnelCounts;
}

export interface UnmappedStage {
  stageId: string;
  stageName: string;
  count: number;
}

export interface FunnelResult {
  totals: FunnelCounts;
  byRep: RepFunnelMetrics[];
  unmappedStages: UnmappedStage[];
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

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

/** All-zero counts -- useful as a comparison baseline when a rep/segment had no activity at all in the other period. */
export function emptyFunnelCounts(): FunnelCounts {
  return {
    total: 0,
    qualified: 0,
    noShow: 0,
    cancelled: 0,
    inDeliberation: 0,
    won: 0,
    lost: 0,
    nurture: 0,
    totalToWonRate: null,
    qualifiedToWonRate: null,
    noShowRate: null,
    cancelledRate: null,
    inDeliberationRate: null,
    lostRate: null,
  };
}

function toFunnelCounts(buckets: Record<FunnelBucket, number>, total: number): FunnelCounts {
  const won = buckets.Won;
  // "Qualified" here means opportunities currently sitting at or past initial
  // screening (Qualified Booking, In Deliberation, Won, Lost, Nurture) — it
  // excludes only those that never got past a No Show / Cancelled gate.
  const qualified =
    buckets.Qualified +
    buckets.Booked +
    buckets.InDeliberation +
    buckets.Won +
    buckets.Lost +
    buckets.Nurture;

  return {
    total,
    qualified,
    noShow: buckets.NoShow,
    cancelled: buckets.Cancelled,
    inDeliberation: buckets.InDeliberation,
    won,
    lost: buckets.Lost,
    nurture: buckets.Nurture,
    totalToWonRate: rate(won, total),
    qualifiedToWonRate: rate(won, qualified),
    noShowRate: rate(buckets.NoShow, total),
    cancelledRate: rate(buckets.Cancelled, total),
    inDeliberationRate: rate(buckets.InDeliberation, total),
    lostRate: rate(buckets.Lost, total),
  };
}

/**
 * Pure aggregation: raw sanitized opportunities in, per-rep + team funnel
 * counts out. No network calls, no dates parsed here — callers are
 * responsible for pre-filtering opportunities to the desired date range
 * (see withinRange in lib/ghl/opportunities.ts). Opportunities not owned
 * by one of TRACKED_REPS (Unassigned, former staff, stray ids) are
 * excluded entirely -- from team totals as well as the by-rep breakdown --
 * per Steph 2026-07-29: this dashboard tracks the active sales team only.
 */
export function computeFunnel(
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
  users: Map<string, GhlUser>,
): FunnelResult {
  const teamBuckets = { ...EMPTY_BUCKET_COUNTS };
  const repBuckets = new Map<string, Record<FunnelBucket, number>>();
  const repNames = new Map<string, string>();
  const unmapped = new Map<string, UnmappedStage>();
  let teamTotal = 0;
  const repTotals = new Map<string, number>();

  for (const opp of opportunities) {
    const ownerId = opp.assignedTo ? resolveCanonicalOwnerId(opp.assignedTo) : "unassigned";
    if (!isTrackedRep(ownerId)) continue;

    const stage = stagesById.get(opp.pipelineStageId);
    const stageName = stage?.name ?? opp.pipelineStageId;
    const mapping = stageMappingByName.get(stageName);

    if (!mapping) {
      const existing = unmapped.get(opp.pipelineStageId);
      unmapped.set(opp.pipelineStageId, {
        stageId: opp.pipelineStageId,
        stageName,
        count: (existing?.count ?? 0) + 1,
      });
      continue;
    }

    teamBuckets[mapping.bucket]++;
    teamTotal++;

    if (!repBuckets.has(ownerId)) {
      repBuckets.set(ownerId, { ...EMPTY_BUCKET_COUNTS });
      repNames.set(
        ownerId,
        ownerId === "unassigned"
          ? "Unassigned"
          : (canonicalOwnerNameOverride(ownerId) ?? users.get(ownerId)?.name ?? ownerId),
      );
      repTotals.set(ownerId, 0);
    }
    repBuckets.get(ownerId)![mapping.bucket]++;
    repTotals.set(ownerId, (repTotals.get(ownerId) ?? 0) + 1);
  }

  const byRep: RepFunnelMetrics[] = Array.from(repBuckets.entries())
    .map(([ownerId, buckets]) => ({
      ownerId,
      ownerName: repNames.get(ownerId)!,
      counts: toFunnelCounts(buckets, repTotals.get(ownerId) ?? 0),
    }))
    .sort((a, b) => b.counts.total - a.counts.total);

  return {
    totals: toFunnelCounts(teamBuckets, teamTotal),
    byRep,
    unmappedStages: Array.from(unmapped.values()).sort((a, b) => b.count - a.count),
  };
}
