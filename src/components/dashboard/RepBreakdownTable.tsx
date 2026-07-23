import type { RepFunnelMetrics } from "@/lib/funnel/computeFunnel";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

const th = "px-3 py-2 text-right font-medium";
const td = "px-3 py-2 text-right text-zinc-700 dark:text-zinc-300";

export function RepBreakdownTable({ reps }: { reps: RepFunnelMetrics[] }) {
  if (reps.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No opportunities in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Rep</th>
            <th className={th}>Total</th>
            <th className={th}>Qualified</th>
            <th className={th}>No Show</th>
            <th className={th}>Cancelled</th>
            <th className={th}>In Deliberation</th>
            <th className={th}>Won</th>
            <th className={th}>Lost</th>
            <th className={th}>Win Rate</th>
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
