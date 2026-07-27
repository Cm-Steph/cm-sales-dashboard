import type { FunnelCounts } from "@/lib/funnel/computeFunnel";
import { percentChange, percentagePointChange, type Delta } from "@/lib/formatDelta";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

function DeltaBadge({ delta }: { delta: Delta }) {
  if (delta.direction === "flat") {
    return <span className="text-xs text-zinc-400">{delta.label}</span>;
  }
  const color = delta.direction === "up" ? "text-brand-blue" : "text-brand-salmon";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {delta.direction === "up" ? "▲" : "▼"} {delta.label}
    </span>
  );
}

function Card({
  label,
  value,
  info,
  align,
  delta,
}: {
  label: string;
  value: string | number;
  info: string;
  align?: "start" | "end";
  delta?: Delta;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
        {label}
        <InfoTooltip text={info} align={align} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-heading text-2xl font-medium text-brand-eggplant dark:text-zinc-50">
          {value}
        </span>
        {delta && <DeltaBadge delta={delta} />}
      </div>
    </div>
  );
}

export function FunnelSummaryCards({
  counts,
  comparison,
  comparisonLabel,
  title,
}: {
  counts: FunnelCounts;
  /** Same-shape counts for the previous period, if the "Compare to previous period" toggle is on. */
  comparison?: FunnelCounts;
  /** e.g. "vs previous 30 days" -- shown next to the section title so the comparison basis is explicit. */
  comparisonLabel?: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
        {comparison && comparisonLabel && (
          <span className="ml-2 font-normal text-zinc-400">{comparisonLabel}</span>
        )}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Card
          label="Total"
          value={counts.total}
          info="Every opportunity in '03. Sales Pipeline' whose most recent stage move falls in the selected date range, regardless of which stage it's currently in."
          delta={comparison && percentChange(counts.total, comparison.total)}
        />
        <Card
          label="Qualified"
          value={counts.qualified}
          info="Opportunities that made it past the initial No Show / Cancelled gate — currently sitting in Qualified Booking, Decision Call Scheduled, In Deliberation, Won, Lost, or Nurture."
          delta={comparison && percentChange(counts.qualified, comparison.qualified)}
        />
        <Card
          label="No Show"
          value={counts.noShow}
          info="Currently sitting in a 'No Show' stage (Strategy Session or Decision Call)."
          delta={comparison && percentChange(counts.noShow, comparison.noShow)}
        />
        <Card
          label="Cancelled"
          value={counts.cancelled}
          info="Currently sitting in a 'Cancelled' stage (Strategy Session or Decision Call)."
          delta={comparison && percentChange(counts.cancelled, comparison.cancelled)}
        />
        <Card
          label="In Deliberation"
          value={counts.inDeliberation}
          info="Currently in a product deliberation stage (CMBA / Elevate / DNU In Deliberation) — decision not made yet."
          delta={comparison && percentChange(counts.inDeliberation, comparison.inDeliberation)}
        />
        <Card
          label="Won"
          value={counts.won}
          info="Currently in a 'Closed - WON' stage for any product."
          delta={comparison && percentChange(counts.won, comparison.won)}
        />
        <Card
          label="Lost"
          value={counts.lost}
          info="Currently in 'Closed - Lost' or 'No Longer Interested'."
          delta={comparison && percentChange(counts.lost, comparison.lost)}
        />
        <Card
          label="Win Rate"
          value={formatRate(counts.totalToWonRate)}
          info="Won ÷ Total for this date range and filter. This is a current-state snapshot, not a true cohort conversion rate — see the Trend tab for day-by-day history."
          align="end"
          delta={
            comparison &&
            percentagePointChange(counts.totalToWonRate, comparison.totalToWonRate)
          }
        />
      </div>
    </div>
  );
}

export function ConversionRateCards({
  counts,
  comparison,
  comparisonLabel,
  title,
}: {
  counts: FunnelCounts;
  comparison?: FunnelCounts;
  comparisonLabel?: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
        {comparison && comparisonLabel && (
          <span className="ml-2 font-normal text-zinc-400">{comparisonLabel}</span>
        )}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card
          label="No-Show Rate"
          value={formatRate(counts.noShowRate)}
          info="No Show ÷ Total for this date range. High values point to a booking or reminder problem — people scheduling a Strategy Session but never turning up."
          delta={comparison && percentagePointChange(counts.noShowRate, comparison.noShowRate)}
        />
        <Card
          label="Cancelled Rate"
          value={formatRate(counts.cancelledRate)}
          info="Cancelled ÷ Total for this date range."
          delta={comparison && percentagePointChange(counts.cancelledRate, comparison.cancelledRate)}
        />
        <Card
          label="In Deliberation Rate"
          value={formatRate(counts.inDeliberationRate)}
          info="In Deliberation ÷ Total for this date range. High values point to a follow-through problem — decisions are being made but not closed out either way."
          delta={
            comparison &&
            percentagePointChange(counts.inDeliberationRate, comparison.inDeliberationRate)
          }
        />
        <Card
          label="Lost Rate"
          value={formatRate(counts.lostRate)}
          info="Lost ÷ Total for this date range."
          delta={comparison && percentagePointChange(counts.lostRate, comparison.lostRate)}
        />
        <Card
          label="Qualified → Won Rate"
          value={formatRate(counts.qualifiedToWonRate)}
          info="Won ÷ Qualified — conversion once someone has passed the initial No Show / Cancelled gate. Isolates closing performance from top-of-funnel volume, unlike the blunter Win Rate (Won ÷ Total)."
          align="end"
          delta={
            comparison &&
            percentagePointChange(counts.qualifiedToWonRate, comparison.qualifiedToWonRate)
          }
        />
      </div>
    </div>
  );
}
