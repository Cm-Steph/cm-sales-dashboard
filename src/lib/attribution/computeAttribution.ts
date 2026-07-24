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

/** Just the path (e.g. "/how-to-come-off-the-tools-thank-you"), not the full URL -- no host, no query string. */
function labelLandingPage(source: AttributionSource | null): string {
  const url = source?.url;
  if (!url) return "Unknown";
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

function aggregate(
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
  touch: "first" | "last",
  label: (source: AttributionSource | null) => string,
): SourceBreakdown[] {
  const totals = new Map<string, number>();
  const wins = new Map<string, number>();

  for (const opp of opportunities) {
    const stageName = stagesById.get(opp.pipelineStageId)?.name;
    const bucket = stageName ? stageMappingByName.get(stageName)?.bucket : undefined;

    const key = label(touch === "first" ? opp.firstTouchSource : opp.lastTouchSource);
    totals.set(key, (totals.get(key) ?? 0) + 1);
    if (bucket === "Won") {
      wins.set(key, (wins.get(key) ?? 0) + 1);
    }
  }

  return Array.from(totals.entries())
    .map(([source, total]) => {
      const won = wins.get(source) ?? 0;
      return { source, total, won, winRate: total > 0 ? won / total : null };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Aggregates opportunities by first-touch (or last-touch) channel/source.
 * Built entirely from data GHL already returns on every opportunity -- no
 * touchpoint_events / extra webhooks needed for this single/dual-touch
 * view. A true multi-touch journey (every touchpoint over time, not just
 * first/last) would need that separate infrastructure.
 */
export function computeSourceAttribution(
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
  touch: "first" | "last" = "first",
): SourceBreakdown[] {
  return aggregate(opportunities, stagesById, touch, labelSource);
}

/**
 * Same idea as computeSourceAttribution, but grouped by the specific
 * landing/booking page path instead of the broad channel -- answers "which
 * lead magnet/offer" rather than just "which platform". Always uses
 * first-touch, since the last-touch page is usually just the booking
 * calendar itself (the same for everyone) rather than a meaningful signal.
 */
export function computeLandingPageAttribution(
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
): SourceBreakdown[] {
  return aggregate(opportunities, stagesById, "first", labelLandingPage);
}
