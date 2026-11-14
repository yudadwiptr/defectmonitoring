"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeverityCount } from "@/lib/metrics";
import { ChartTooltip } from "./chart-tooltip";

const SEV_VAR: Record<string, string> = {
  Critical: "var(--sev-critical)",
  High: "var(--sev-high)",
  Medium: "var(--sev-medium)",
  Low: "var(--sev-low)",
};

/**
 * Sebaran severity: batang mendatar per severity (nama selalu tertulis di
 * sumbu, jadi warna tidak pernah jadi satu-satunya penanda). Bagian berwarna
 * = masih open, bagian abu = sudah selesai (Closed/Rejected).
 */
export function SeverityChart({ rows }: { rows: SeverityCount[] }) {
  const data = rows.map((r) => ({
    severity: r.severity,
    open: r.open,
    done: r.total - r.open,
    total: r.total,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="severity"
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
          <Bar dataKey="open" name="Masih open" stackId="a" stroke="var(--card)" strokeWidth={2} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.severity} fill={SEV_VAR[d.severity]} />
            ))}
          </Bar>
          <Bar
            dataKey="done"
            name="Selesai"
            stackId="a"
            fill="var(--st-rejected)"
            stroke="var(--card)"
            strokeWidth={2}
            maxBarSize={22}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              dataKey="total"
              position="right"
              offset={8}
              style={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
