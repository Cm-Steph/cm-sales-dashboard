"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { RepBreakdownRow } from "./RepBreakdownTable";
import { repColor } from "@/lib/funnel/trackedReps";
import type { FunnelCounts } from "@/lib/funnel/computeFunnel";

export function RepBookingsChart({ reps }: { reps: RepBreakdownRow[] }) {
  if (reps.length === 0) return null;
  const data = reps.map((r) => ({ name: r.ownerName, ownerId: r.ownerId, total: r.counts.total }));

  return (
    <div className="h-64 w-full rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Bookings by rep
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip />
          <Bar dataKey="total" name="Total bookings" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {data.map((d) => (
              <Cell key={d.ownerId} fill={repColor(d.ownerId)} />
            ))}
            <LabelList dataKey="total" position="top" className="fill-zinc-700 dark:fill-zinc-300" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const RATE_METRICS: { key: keyof FunnelCounts; label: string }[] = [
  { key: "totalToWonRate", label: "Win Rate" },
  { key: "qualifiedToWonRate", label: "Qual. → Won" },
  { key: "noShowRate", label: "No-Show" },
  { key: "inDeliberationRate", label: "In Deliberation" },
  { key: "lostRate", label: "Lost" },
];

export function RepRateComparisonChart({ reps }: { reps: RepBreakdownRow[] }) {
  if (reps.length === 0) return null;

  const data = RATE_METRICS.map((metric) => {
    const row: Record<string, string | number> = { metric: metric.label };
    for (const rep of reps) {
      const value = rep.counts[metric.key];
      row[rep.ownerName] = typeof value === "number" ? Math.round(value * 1000) / 10 : 0;
    }
    return row;
  });

  return (
    <div className="h-72 w-full rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-2 font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Conversion &amp; drop-off rates by rep
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />
          <XAxis dataKey="metric" tick={{ fontSize: 12 }} interval={0} />
          <YAxis tick={{ fontSize: 12 }} width={40} unit="%" />
          <Tooltip />
          <Legend />
          {reps.map((rep) => (
            <Bar
              key={rep.ownerId}
              dataKey={rep.ownerName}
              name={rep.ownerName}
              unit="%"
              fill={repColor(rep.ownerId)}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
