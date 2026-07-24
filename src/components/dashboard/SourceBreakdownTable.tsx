import type { SourceBreakdown } from "@/lib/attribution/computeAttribution";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

export function SourceBreakdownTable({ rows }: { rows: SourceBreakdown[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No opportunities in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="bg-zinc-50 text-left font-heading text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">
              <span className="inline-flex items-center">
                Source
                <InfoTooltip text="The UTM source, session source, referrer, or medium GHL attributed the contact to — whichever is most specific." />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Bookings
                <InfoTooltip
                  text="Opportunities attributed to this source in the selected date range."
                  align="end"
                />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Won
                <InfoTooltip
                  text="Of those bookings, how many are currently in a 'Closed - WON' stage."
                  align="end"
                />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Win Rate
                <InfoTooltip text="Won ÷ Bookings for this source." align="end" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.source}>
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                {row.source}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">{row.total}</td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">{row.won}</td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">
                {formatRate(row.winRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
