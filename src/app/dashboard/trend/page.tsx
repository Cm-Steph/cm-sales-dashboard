import { Suspense } from "react";
import { getCachedStageEvents } from "@/lib/dashboardData";
import { computeDailyBucketSnapshots } from "@/lib/history/dailySnapshots";
import { resolveDateRange } from "@/lib/dateRanges";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { DataQualityBanner } from "@/components/dashboard/DataQualityBanner";

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

  const earliestEventDate =
    events.length > 0
      ? new Date(Math.min(...events.map((e) => new Date(e.event_at).getTime())))
      : null;
  const trackingStartsAfterRangeStart = earliestEventDate && earliestEventDate.getTime() > range.from.getTime();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-xl font-medium text-brand-eggplant dark:text-zinc-50">
          Pipeline Trend
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Day-by-day pipeline state, reconstructed from logged stage-change history. This can only
          go back as far as the day tracking went live — it has no way to rewind GHL&apos;s own
          history from before that.
        </p>
      </div>

      <Suspense>
        <DateRangeFilter />
      </Suspense>

      {earliestEventDate && trackingStartsAfterRangeStart && (
        <DataQualityBanner>
          Day-by-day history has only been tracked since {earliestEventDate.toLocaleDateString()}.
          The part of this range before that ({range.from.toLocaleDateString()} –{" "}
          {earliestEventDate.toLocaleDateString()}) has no logged data and won&apos;t appear below.
        </DataQualityBanner>
      )}

      {hasAnyData ? (
        <TrendChart snapshots={snapshots} />
      ) : (
        <DataQualityBanner>
          No history recorded yet for {range.from.toLocaleDateString()} –{" "}
          {range.to.toLocaleDateString()}. This builds up day by day as deals move through the
          pipeline — check back after a bit more activity.
        </DataQualityBanner>
      )}
    </div>
  );
}
