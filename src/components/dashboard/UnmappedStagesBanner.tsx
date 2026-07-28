import type { UnmappedStage } from "@/lib/funnel/computeFunnel";
import { DataQualityBanner } from "./DataQualityBanner";

export function UnmappedStagesBanner({ stages }: { stages: UnmappedStage[] }) {
  if (stages.length === 0) return null;

  return (
    <DataQualityBanner>
      {stages.length} pipeline stage{stages.length > 1 ? "s" : ""} not yet categorized in{" "}
      <code>stageMapping.ts</code> and excluded from the counts below:{" "}
      {stages.map((s) => `${s.stageName} (${s.count})`).join(", ")}
    </DataQualityBanner>
  );
}
