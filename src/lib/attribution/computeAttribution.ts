import type { GhlStage } from "../ghl/pipelines";
import type { AttributionSource, SafeOpportunity } from "../ghl/opportunities";
import { stageMappingByName } from "../funnel/stageMapping";

export interface SourceBreakdown {
  source: string;
  total: number;
  won: number;
  winRate: number | null;
}

function labelSource(source: AttributionSource | null): string {
  if (!source) return "Unknown";
  return (
    source.utmSource ??
    source.utmSessionSource ??
    source.referrer ??
    source.medium ??
    "Direct / Unattributed"
  );
}

/**
 * Aggregates opportunities by first-touch (or last-touch) source. Built
 * entirely from data GHL already returns on every opportunity -- no
 * touchpoint_events / extra webhooks needed for this single/dual-touch
 * view. A true multi-touch journey (every touchpoint over time, not just
 * first/last) would need that separate infrastructure.
 */
export function computeSourceAttribution(
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
  touch: "first" | "last" = "first",
): SourceBreakdown[] {
  const totals = new Map<string, number>();
  const wins = new Map<string, number>();

  for (const opp of opportunities) {
    const stageName = stagesById.get(opp.pipelineStageId)?.name;
    const bucket = stageName ? stageMappingByName.get(stageName)?.bucket : undefined;

    const source = labelSource(touch === "first" ? opp.firstTouchSource : opp.lastTouchSource);
    totals.set(source, (totals.get(source) ?? 0) + 1);
    if (bucket === "Won") {
      wins.set(source, (wins.get(source) ?? 0) + 1);
    }
  }

  return Array.from(totals.entries())
    .map(([source, total]) => {
      const won = wins.get(source) ?? 0;
      return { source, total, won, winRate: total > 0 ? won / total : null };
    })
    .sort((a, b) => b.total - a.total);
}
