"use client";

import { useState } from "react";
import type { RepFunnelMetrics } from "@/lib/funnel/computeFunnel";
import type { AttendanceCounts } from "@/lib/attendance/computeAttendance";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

const th = "px-3 py-2 text-right font-medium";
const td = "px-3 py-2 text-right text-zinc-700 dark:text-zinc-300";

export interface RepBreakdownRow extends RepFunnelMetrics {
  attendance: AttendanceCounts;
}

type Mode = "numbers" | "percent";

// Metrics that exist as both a raw count and a rate -- the toggle switches
// which of the two is shown, instead of columns for both permanently, so
// the table fits without horizontal scroll.
interface ToggledColumn {
  label: string;
  number: (row: RepBreakdownRow) => number;
  numberInfo: string;
  percentLabel: string;
  percent: (row: RepBreakdownRow) => number | null;
  percentInfo: string;
}

const TOGGLED_COLUMNS: ToggledColumn[] = [
  {
    label: "No Show",
    number: (r) => r.counts.noShow,
    numberInfo: "Currently sitting in a 'No Show' stage.",
    percentLabel: "No-Show Rate",
    percent: (r) => r.counts.noShowRate,
    percentInfo: "No Show ÷ Total for this rep.",
  },
  {
    label: "Cancelled",
    number: (r) => r.counts.cancelled,
    numberInfo: "Currently sitting in a 'Cancelled' stage.",
    percentLabel: "Cancelled Rate",
    percent: (r) => r.counts.cancelledRate,
    percentInfo: "Cancelled ÷ Total for this rep.",
  },
  {
    label: "In Deliberation",
    number: (r) => r.counts.inDeliberation,
    numberInfo: "Currently in a product deliberation stage — decision not made yet.",
    percentLabel: "In Deliberation Rate",
    percent: (r) => r.counts.inDeliberationRate,
    percentInfo: "In Deliberation ÷ Total for this rep.",
  },
  {
    label: "Won",
    number: (r) => r.counts.won,
    numberInfo: "Currently in a 'Closed - WON' stage.",
    percentLabel: "Win Rate",
    percent: (r) => r.counts.totalToWonRate,
    percentInfo: "Won ÷ Total for this rep.",
  },
  {
    label: "Lost",
    number: (r) => r.counts.lost,
    numberInfo: "Currently in 'Closed - Lost' or 'No Longer Interested'.",
    percentLabel: "Lost Rate",
    percent: (r) => r.counts.lostRate,
    percentInfo: "Lost ÷ Total for this rep.",
  },
];

// Rate-only metric with no natural raw-count twin of its own -- shown only
// in "%" mode, alongside the toggled columns above.
const QUAL_WON_INFO = "Won ÷ Qualified for this rep — isolates closing performance from booking volume.";

// SS Cancelled has no rate worth showing on its own, and SS Show Rate has
// no meaningful raw-count twin now that SS Booked/Attended are gone -- each
// only appears in the one mode it makes sense in, rather than being forced
// into a number/percent pair with each other.
const SS_CANCELLED_INFO =
  "Strategy Session booked, then cancelled outright, per GHL's calendar appointment status -- a separate system from the pipeline-stage 'Cancelled' column.";
const SS_SHOW_RATE_INFO =
  "SS Attended ÷ SS Booked, per GHL's calendar appointment status -- a separate system from the pipeline-stage rate columns.";

function Th({
  label,
  info,
}: {
  label: string;
  info: string;
}) {
  return (
    <th className={th}>
      <span className="inline-flex items-center justify-end">
        {label}
        <InfoTooltip text={info} align="end" placement="below" />
      </span>
    </th>
  );
}

export function RepBreakdownTable({ reps }: { reps: RepBreakdownRow[] }) {
  const [mode, setMode] = useState<Mode>("numbers");

  if (reps.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No opportunities in this range.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("numbers")}
          className={`rounded-md px-2.5 py-1 font-medium ${
            mode === "numbers"
              ? "bg-brand-eggplant text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          Numbers
        </button>
        <button
          type="button"
          onClick={() => setMode("percent")}
          className={`rounded-md px-2.5 py-1 font-medium ${
            mode === "percent"
              ? "bg-brand-eggplant text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          %
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left font-heading text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Rep</th>
              <Th
                label="Total"
                info="Every opportunity whose most recent stage move falls in the selected range, regardless of current stage."
              />
              <Th label="Qualified" info="Made it past the initial No Show / Cancelled gate." />
              {TOGGLED_COLUMNS.map((col) =>
                mode === "numbers" ? (
                  <Th key={col.label} label={col.label} info={col.numberInfo} />
                ) : (
                  <Th key={col.label} label={col.percentLabel} info={col.percentInfo} />
                ),
              )}
              {mode === "numbers" ? (
                <Th label="SS Cancelled" info={SS_CANCELLED_INFO} />
              ) : (
                <>
                  <Th label="Qual. → Won Rate" info={QUAL_WON_INFO} />
                  <Th label="SS Show Rate" info={SS_SHOW_RATE_INFO} />
                </>
              )}
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
                {TOGGLED_COLUMNS.map((col) => (
                  <td key={col.label} className={td}>
                    {mode === "numbers" ? col.number(rep) : formatRate(col.percent(rep))}
                  </td>
                ))}
                {mode === "numbers" ? (
                  <td className={td}>{rep.attendance.cancelled}</td>
                ) : (
                  <>
                    <td className={td}>{formatRate(rep.counts.qualifiedToWonRate)}</td>
                    <td className={td}>{formatRate(rep.attendance.showRate)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
