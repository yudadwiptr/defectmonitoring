"use client";

interface Item {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Item[];
}

/** Tooltip chart bergaya kartu aplikasi, teks selalu pakai warna teks (bukan warna seri). */
export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a, p) => a + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label !== undefined && <div className="font-display mb-1 text-sm font-semibold">{label}</div>}
      <ul className="flex flex-col gap-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="tnum">{p.value}</span>
          </li>
        ))}
        {payload.length > 1 && (
          <li className="mt-0.5 flex justify-between gap-4 border-t pt-0.5 text-muted-foreground">
            <span>Total</span>
            <span className="tnum">{total}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
