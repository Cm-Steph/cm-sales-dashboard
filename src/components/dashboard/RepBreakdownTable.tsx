import type { RepFunnelMetrics } from "@/lib/funnel/computeFunnel";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

const th = "px-3 py-2 text-right font-medium";
const td = "px-3 py-2 text-right text-zinc-700 dark:text-zinc-300";

const COLUMN_INFO: Record<string, string> = {
  Total: "Every opportunity whose most recent stage move falls in the selected range, regardless of current stage.",
  Qualified: "Made it past the initial No Show / Cancelled gate.",
  "No Show": "Currently sitting in a 'No Show' stage.",
  Cancelled: "Currently sitting in a 'Cancelled' stage.",
  "In Deliberation": "Currently in a product deliberation stage — decision not made yet.",
  Won: "Currently in a 'Closed - WON' stage.",
  Lost: "Currently in 'Closed - Lost' or 'No Longer Interested'.",
  "Win Rate": "Won ÷ Total for this rep in the selected range.",
};

function Th({ label }: { label: string }) {
  return (
    <th className={th}>
      <span className="inline-flex items-center justify-end">
        {label}
        <InfoTooltip text={COLUMN_INFO[label]} align="end" />
      </span>
    </th>
  );
}

export function RepBreakdownTable({ reps }: { reps: RepFunnelMetrics[] }) {
  if (reps.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No opportunities in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-zinc-50 text-left font-heading text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Rep</th>
            <Th label="Total" />
            <Th label="Qualified" />
            <Th label="No Show" />
            <Th label="Cancelled" />
            <Th label="In Deliberation" />
            <Th label="Won" />
            <Th label="Lost" />
            <Th label="Win Rate" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {reps.map((rep) => (
            <tr key={rep.ownerId}>
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                {rep.ownerName}
              </td>
              <td className={td}>{rep.counts.total}</td>
              <td className={td}>{rep.counts.qualified}</td>
              <td className={td}>{rep.counts.noShow}</td>
              <td className={td}>{rep.counts.cancelled}</td>
              <td className={td}>{rep.counts.inDeliberation}</td>
              <td className={td}>{rep.counts.won}</td>
              <td className={td}>{rep.counts.lost}</td>
              <td className={td}>{formatRate(rep.counts.totalToWonRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
