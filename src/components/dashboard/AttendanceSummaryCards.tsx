import type { AttendanceCounts } from "@/lib/attendance/computeAttendance";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

function Card({
  label,
  value,
  info,
  align,
}: {
  label: string;
  value: string | number;
  info: string;
  align?: "start" | "end";
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
        {label}
        <InfoTooltip text={info} align={align} />
      </div>
      <div className="mt-1 font-heading text-2xl font-medium text-brand-eggplant dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

export function AttendanceSummaryCards({
  counts,
  title,
}: {
  counts: AttendanceCounts;
  title: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card
          label="Booked"
          value={counts.booked}
          info="Strategy Session appointments in this date range with a resolved outcome (attended, no-show, or cancelled) -- still-upcoming confirmed bookings aren't counted yet since they haven't happened."
        />
        <Card
          label="Attended"
          value={counts.attended}
          info="Strategy Sessions the contact actually showed up for, per GHL's own appointment status."
        />
        <Card
          label="No-Show"
          value={counts.noShow}
          info="Booked, but the contact never showed."
        />
        <Card label="Cancelled" value={counts.cancelled} info="Booked, then cancelled outright." />
        <Card
          label="Show Rate"
          value={formatRate(counts.showRate)}
          info="Attended ÷ Booked. This is upstream of the pipeline funnel -- a low show rate is a booking/reminder/qualification problem, not a sales-closing problem."
          align="end"
        />
      </div>
    </div>
  );
}
