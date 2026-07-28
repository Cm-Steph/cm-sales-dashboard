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
          label="SS Booked"
          value={counts.booked}
          info="Strategy Session appointments in this date range with a resolved outcome (attended, no-show, or cancelled), per GHL's calendar -- still-upcoming confirmed bookings aren't counted yet since they haven't happened."
        />
        <Card
          label="SS Attended"
          value={counts.attended}
          info="Strategy Sessions the contact actually showed up for, per GHL's own calendar appointment status."
        />
        <Card
          label="SS No-Show"
          value={counts.noShow}
          info="Booked, but the contact never showed, per GHL's calendar appointment status -- a separate system from the pipeline stage 'No Show' card above, and won't always match it (see the note above)."
        />
        <Card
          label="SS Cancelled"
          value={counts.cancelled}
          info="Booked, then cancelled outright, per GHL's calendar appointment status -- a separate system from the pipeline stage 'Cancelled' card above."
        />
        <Card
          label="SS Show Rate"
          value={formatRate(counts.showRate)}
          info="SS Attended ÷ SS Booked. This is upstream of the pipeline funnel -- a low show rate is a booking/reminder/qualification problem, not a sales-closing problem."
          align="end"
        />
      </div>
    </div>
  );
}
