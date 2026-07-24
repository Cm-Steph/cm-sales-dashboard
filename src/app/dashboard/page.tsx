import { Suspense } from "react";
import { getCachedStages, getCachedUsers, getCachedOpportunities } from "@/lib/dashboardData";
import { withinRange } from "@/lib/ghl/opportunities";
import { computeFunnel } from "@/lib/funnel/computeFunnel";
import { resolveDateRange } from "@/lib/dateRanges";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { FunnelSummaryCards } from "@/components/dashboard/FunnelSummaryCards";
import { RepBreakdownTable } from "@/components/dashboard/RepBreakdownTable";
import { UnmappedStagesBanner } from "@/components/dashboard/UnmappedStagesBanner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    owner?: string;
    refresh?: string;
  }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);
  const bypassCache = Boolean(params.refresh);

  const [stages, users, allOpportunities] = await Promise.all([
    getCachedStages(bypassCache),
    getCachedUsers(bypassCache),
    getCachedOpportunities(bypassCache),
  ]);

  const inRange = allOpportunities.filter((o) => withinRange(o, range.from, range.to));
  const result = computeFunnel(inRange, stages, users);

  const selectedOwner = params.owner && params.owner !== "all" ? params.owner : null;
  const selectedRep = selectedOwner
    ? result.byRep.find((r) => r.ownerId === selectedOwner)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sales Pipeline Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()} · dated by last
          pipeline stage movement
        </p>
      </div>

      <Suspense>
        <DashboardNav />
      </Suspense>

      <Suspense>
        <DashboardFilters reps={result.byRep.map((r) => ({ id: r.ownerId, name: r.ownerName }))} />
      </Suspense>

      <UnmappedStagesBanner stages={result.unmappedStages} />

      <FunnelSummaryCards
        counts={selectedRep ? selectedRep.counts : result.totals}
        title={selectedRep ? selectedRep.ownerName : "Team totals"}
      />

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">By rep</h2>
        <RepBreakdownTable reps={selectedRep ? [selectedRep] : result.byRep} />
      </div>
    </div>
  );
}
