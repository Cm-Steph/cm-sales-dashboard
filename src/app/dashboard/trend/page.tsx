import { Suspense } from "react";
import { getCachedStageEvents } from "@/lib/dashboardData";
import { computeDailyBucketSnapshots } from "@/lib/history/dailySnapshots";
import { resolveDateRange } from "@/lib/dateRanges";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { TrendChart } from "@/components/dashboard/TrendChart";

export default async function TrendPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; refresh?: string }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);
  const bypassCache = Boolean(params.refresh);

  const events = await getCachedStageEvents(bypassCache);
  const snapshots = computeDailyBucketSnapshots(events, range.from, range.to);
  const hasAnyData = snapshots.some((s) => Object.values(s.counts).some((c) => c > 0));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-xl font-medium text-brand-eggplant dark:text-zinc-50">
          Pipeline Trend
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Day-by-day pipeline state, reconstructed from logged stage-change history — only
          available from {new Date().toLocaleDateString()} onward (the day this tracking went
          live); it can&apos;t reach back further than that.
        </p>
      </div>

      <Suspense>
        <DateRangeFilter />
      </Suspense>

      {hasAnyData ? (
        <TrendChart snapshots={snapshots} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No history recorded yet for this range. This builds up day by day as deals move through
          the pipeline — check back after a bit more activity.
        </p>
      )}
    </div>
  );
}
