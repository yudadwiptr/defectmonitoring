"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PhaseCount } from "@/lib/metrics";
import { ChartTooltip } from "./chart-tooltip";

const SERIES = [
  { key: "open", name: "Open", fill: "var(--primary)" },
  { key: "closed", name: "Closed", fill: "var(--st-closed)" },
  { key: "rejected", name: "Rejected", fill: "var(--st-rejected)" },
] as const;

/** Open vs closed per fase: kolom bertumpuk, satu kolom per fase. */
export function PhaseStackChart({ rows }: { rows: PhaseCount[] }) {
  const data = rows.map((r) => ({ phase: r.phase, open: r.open, closed: r.closed, rejected: r.rejected }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="phase"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
          {SERIES.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId="a"
              fill={s.fill}
              stroke="var(--card)"
              strokeWidth={2}
              maxBarSize={28}
              radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
