import type { UnmappedStage } from "@/lib/funnel/computeFunnel";

export function UnmappedStagesBanner({ stages }: { stages: UnmappedStage[] }) {
  if (stages.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      {stages.length} pipeline stage{stages.length > 1 ? "s" : ""} not yet categorized in{" "}
      <code>stageMapping.ts</code> and excluded from the counts below:{" "}
      {stages.map((s) => `${s.stageName} (${s.count})`).join(", ")}
    </div>
  );
}
