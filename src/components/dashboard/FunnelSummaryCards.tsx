import type { FunnelCounts } from "@/lib/funnel/computeFunnel";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

function Card({ label, value, info }: { label: string; value: string | number; info: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
        {label}
        <InfoTooltip text={info} />
      </div>
      <div className="mt-1 font-heading text-2xl font-medium text-brand-eggplant dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

export function FunnelSummaryCards({ counts, title }: { counts: FunnelCounts; title: string }) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Card
          label="Total"
          value={counts.total}
          info="Every opportunity in '03. Sales Pipeline' whose most recent stage move falls in the selected date range, regardless of which stage it's currently in."
        />
        <Card
          label="Qualified"
          value={counts.qualified}
          info="Opportunities that made it past the initial No Show / Cancelled gate — currently sitting in Qualified Booking, Decision Call Scheduled, In Deliberation, Won, Lost, or Nurture."
        />
        <Card
          label="No Show"
          value={counts.noShow}
          info="Currently sitting in a 'No Show' stage (Strategy Session or Decision Call)."
        />
        <Card
          label="Cancelled"
          value={counts.cancelled}
          info="Currently sitting in a 'Cancelled' stage (Strategy Session or Decision Call)."
        />
        <Card
          label="In Deliberation"
          value={counts.inDeliberation}
          info="Currently in a product deliberation stage (CMBA / Elevate / DNU In Deliberation) — decision not made yet."
        />
        <Card
          label="Won"
          value={counts.won}
          info="Currently in a 'Closed - WON' stage for any product."
        />
        <Card
          label="Lost"
          value={counts.lost}
          info="Currently in 'Closed - Lost' or 'No Longer Interested'."
        />
        <Card
          label="Win Rate"
          value={formatRate(counts.totalToWonRate)}
          info="Won ÷ Total for this date range and filter. This is a current-state snapshot, not a true cohort conversion rate — see the Trend tab for day-by-day history."
        />
      </div>
    </div>
  );
}
