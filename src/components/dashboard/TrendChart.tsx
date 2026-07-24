"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyBucketSnapshot } from "@/lib/history/dailySnapshots";

// Clinic Mastery brand palette (yellow reserved for the logo/primary brand
// mark, so it's deliberately not used as a data-series colour here).
const SERIES: { key: keyof DailyBucketSnapshot["counts"]; color: string; label: string }[] = [
  { key: "InDeliberation", color: "#2e0a78", label: "In Deliberation" }, // eggplant
  { key: "Won", color: "#ff8e21", label: "Won" }, // orange
  { key: "Lost", color: "#ff707d", label: "Lost" }, // salmon
  { key: "NoShow", color: "#24a3ff", label: "No Show" }, // blue
  { key: "Cancelled", color: "#a1129e", label: "Cancelled" }, // violet
];

export function TrendChart({ snapshots }: { snapshots: DailyBucketSnapshot[] }) {
  const data = snapshots.map((s) => ({ date: s.date, ...s.counts }));

  return (
    <div className="h-80 w-full rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip />
          <Legend />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
