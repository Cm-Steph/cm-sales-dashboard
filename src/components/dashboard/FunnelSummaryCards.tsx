import type { FunnelCounts } from "@/lib/funnel/computeFunnel";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</div>
    </div>
  );
}

export function FunnelSummaryCards({ counts, title }: { counts: FunnelCounts; title: string }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Card label="Total" value={counts.total} />
        <Card label="Qualified" value={counts.qualified} />
        <Card label="No Show" value={counts.noShow} />
        <Card label="Cancelled" value={counts.cancelled} />
        <Card label="In Deliberation" value={counts.inDeliberation} />
        <Card label="Won" value={counts.won} />
        <Card label="Lost" value={counts.lost} />
        <Card label="Win Rate" value={formatRate(counts.totalToWonRate)} />
      </div>
    </div>
  );
}
