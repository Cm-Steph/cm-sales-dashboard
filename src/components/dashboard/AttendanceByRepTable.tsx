import type { RepAttendanceMetrics } from "@/lib/attendance/computeAttendance";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

const th = "px-3 py-2 text-right font-medium";
const td = "px-3 py-2 text-right text-zinc-700 dark:text-zinc-300";

export function AttendanceByRepTable({ reps }: { reps: RepAttendanceMetrics[] }) {
  if (reps.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No Strategy Session bookings in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-zinc-50 text-left font-heading text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Rep</th>
            <th className={th}>
              <span className="inline-flex items-center justify-end">
                Booked
                <InfoTooltip
                  text="Strategy Sessions booked to this rep with a resolved outcome in this range."
                  align="end"
                  placement="below"
                />
              </span>
            </th>
            <th className={th}>
              <span className="inline-flex items-center justify-end">
                Attended
                <InfoTooltip text="Of those, how many the contact actually showed up for." align="end" placement="below" />
              </span>
            </th>
            <th className={th}>
              <span className="inline-flex items-center justify-end">
                No-Show
                <InfoTooltip text="Booked, but the contact never showed." align="end" placement="below" />
              </span>
            </th>
            <th className={th}>
              <span className="inline-flex items-center justify-end">
                Cancelled
                <InfoTooltip text="Booked, then cancelled outright." align="end" placement="below" />
              </span>
            </th>
            <th className={th}>
              <span className="inline-flex items-center justify-end">
                Show Rate
                <InfoTooltip text="Attended ÷ Booked for this rep." align="end" placement="below" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {reps.map((rep) => (
            <tr key={rep.ownerId}>
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                {rep.ownerName}
              </td>
              <td className={td}>{rep.counts.booked}</td>
              <td className={td}>{rep.counts.attended}</td>
              <td className={td}>{rep.counts.noShow}</td>
              <td className={td}>{rep.counts.cancelled}</td>
              <td className={td}>{formatRate(rep.counts.showRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
