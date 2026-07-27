import { Suspense } from "react";
import {
  getCachedStages,
  getCachedUsers,
  getCachedOpportunities,
  getCachedAppointments,
} from "@/lib/dashboardData";
import { withinRange } from "@/lib/ghl/opportunities";
import { withinAppointmentRange } from "@/lib/ghl/appointments";
import { computeFunnel, emptyFunnelCounts } from "@/lib/funnel/computeFunnel";
import { computeAttendance, emptyAttendanceCounts } from "@/lib/attendance/computeAttendance";
import { resolveDateRange, resolveComparisonRangeFromParams } from "@/lib/dateRanges";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { FunnelSummaryCards, ConversionRateCards } from "@/components/dashboard/FunnelSummaryCards";
import { RepBreakdownTable } from "@/components/dashboard/RepBreakdownTable";
import { AttendanceSummaryCards } from "@/components/dashboard/AttendanceSummaryCards";
import { AttendanceByRepTable } from "@/components/dashboard/AttendanceByRepTable";
import { AttendanceCoverageBanner } from "@/components/dashboard/AttendanceCoverageBanner";
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
    compare?: string;
    comparePreset?: string;
    compareFrom?: string;
    compareTo?: string;
  }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);
  const bypassCache = Boolean(params.refresh);
  const showComparison = params.compare === "1";

  const [stages, users, allOpportunities, allAppointments] = await Promise.all([
    getCachedStages(bypassCache),
    getCachedUsers(bypassCache),
    getCachedOpportunities(bypassCache),
    getCachedAppointments(bypassCache),
  ]);

  const inRange = allOpportunities.filter((o) => withinRange(o, range.from, range.to));
  const result = computeFunnel(inRange, stages, users);

  const appointmentsInRange = allAppointments.filter((a) =>
    withinAppointmentRange(a, range.from, range.to),
  );
  const attendanceResult = computeAttendance(appointmentsInRange, users);

  const selectedOwner = params.owner && params.owner !== "all" ? params.owner : null;
  const selectedRep = selectedOwner
    ? result.byRep.find((r) => r.ownerId === selectedOwner)
    : null;
  const selectedRepAttendance = selectedOwner
    ? attendanceResult.byRep.find((r) => r.ownerId === selectedOwner)
    : null;

  let comparisonCounts;
  let comparisonLabel;
  if (showComparison) {
    const comparisonRange = resolveComparisonRangeFromParams(range, params);
    const comparisonInRange = allOpportunities.filter((o) =>
      withinRange(o, comparisonRange.from, comparisonRange.to),
    );
    const comparisonResult = computeFunnel(comparisonInRange, stages, users);
    comparisonCounts = selectedRep
      ? (comparisonResult.byRep.find((r) => r.ownerId === selectedRep.ownerId)?.counts ??
        emptyFunnelCounts())
      : comparisonResult.totals;

    comparisonLabel = `vs ${comparisonRange.from.toLocaleDateString()} – ${comparisonRange.to.toLocaleDateString()}`;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-xl font-medium text-brand-eggplant dark:text-zinc-50">
          Sales Pipeline Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()} · dated by last
          pipeline stage movement
        </p>
      </div>

      <Suspense>
        <DashboardFilters reps={result.byRep.map((r) => ({ id: r.ownerId, name: r.ownerName }))} />
      </Suspense>

      <UnmappedStagesBanner stages={result.unmappedStages} />

      <FunnelSummaryCards
        counts={selectedRep ? selectedRep.counts : result.totals}
        comparison={comparisonCounts}
        comparisonLabel={comparisonLabel}
        title={selectedRep ? selectedRep.ownerName : "Team totals"}
      />

      <ConversionRateCards
        counts={selectedRep ? selectedRep.counts : result.totals}
        comparison={comparisonCounts}
        comparisonLabel={comparisonLabel}
        title="Conversion & drop-off rates"
      />

      <div>
        <h2 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          By rep
        </h2>
        <RepBreakdownTable reps={selectedRep ? [selectedRep] : result.byRep} />
      </div>

      <div>
        <h2 className="mb-2 flex items-baseline gap-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Strategy Session attendance
          <span className="text-xs font-normal normal-case text-zinc-400">
            upstream of the pipeline above — booked from GHL calendars, not opportunity stage
          </span>
        </h2>
        <div className="flex flex-col gap-4">
          <AttendanceCoverageBanner
            unresolvedPastCount={attendanceResult.unresolvedPastCount}
            resolvedCount={attendanceResult.totals.booked}
          />
          <AttendanceSummaryCards
            counts={
              selectedOwner
                ? (selectedRepAttendance?.counts ?? emptyAttendanceCounts())
                : attendanceResult.totals
            }
            title={selectedRep ? selectedRep.ownerName : "Team totals"}
          />
          <AttendanceByRepTable
            reps={selectedRepAttendance ? [selectedRepAttendance] : attendanceResult.byRep}
          />
        </div>
      </div>
    </div>
  );
}
