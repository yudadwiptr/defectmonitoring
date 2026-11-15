import Link from "next/link";
import { Boxes, Layers } from "lucide-react";
import { cn } from "cn";
import type { ModuleLeakage } from "@/lib/metrics";
import { percent } from "@/lib/format";

interface ModuleLeakageTableProps {
  projectId: string;
  rows: ModuleLeakage[];
  phases: string[];
  basePhase: string;
}

export function ModuleLeakageTable({ projectId, rows, phases, basePhase }: ModuleLeakageTableProps) {
  const selectable = phases.slice(0, -1);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-muted/40 px-3 py-2 text-xs">
        <span className="mr-1 font-medium text-muted-foreground">Patokan tahap awal:</span>
        {selectable.map((p) => (
          <Link
            key={p}
            href={`/projects/${projectId}?base=${encodeURIComponent(p)}`}
            scroll={false}
            aria-current={p === basePhase ? "true" : undefined}
            className={cn(
              "font-display rounded-lg px-3 py-1 text-xs font-bold transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              p === basePhase
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            {p}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="paper-grid flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-center">
          <Boxes className="size-8 text-muted-foreground/60" />
          <p className="mt-2 font-display text-sm font-semibold">Belum ada data temuan per modul</p>
          <p className="text-xs text-muted-foreground">Data akan muncul otomatis saat temuan mulai dicatat.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2.5 pr-2 pl-3.5 font-semibold">Bagian / Modul</th>
                {phases.map((p) => (
                  <th key={p} className="hidden px-2 py-2.5 text-right font-semibold lg:table-cell">
                    {p}
                  </th>
                ))}
                <th className="px-2.5 py-2.5 text-right font-semibold">Di {basePhase}</th>
                <th className="px-2.5 py-2.5 text-right font-semibold">Lolos Setelahnya</th>
                <th className="w-[36%] py-2.5 pr-3.5 pl-2.5 font-semibold">Tingkat Lolos (Leakage)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const leak = r.leakage ?? 0;
                const barColor =
                  r.leakage === null
                    ? "bg-muted"
                    : leak >= 0.5
                      ? "bg-sev-critical"
                      : leak >= 0.25
                        ? "bg-sev-high"
                        : "bg-st-closed";
                return (
                  <tr key={r.moduleId ?? "none"} className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
                    <td className="py-2.5 pr-2 pl-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Layers className="size-3.5" />
                        </span>
                        {r.moduleId ? (
                          <Link
                            href={`/projects/${projectId}/defects?module=${r.moduleId}&scope=all`}
                            className="font-semibold hover:text-primary hover:underline"
                          >
                            {r.moduleName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{r.moduleName}</span>
                        )}
                      </div>
                    </td>
                    {r.byPhase.map((n, i) => (
                      <td
                        key={phases[i]}
                        className={cn(
                          "hidden px-2 py-2.5 text-right tnum lg:table-cell",
                          n === 0 ? "text-muted-foreground/50" : "font-medium",
                        )}
                      >
                        {n}
                      </td>
                    ))}
                    <td className="px-2.5 py-2.5 text-right font-semibold tnum">{r.found}</td>
                    <td className="px-2.5 py-2.5 text-right font-semibold tnum">{r.after}</td>
                    <td className="py-2.5 pr-3.5 pl-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", barColor)}
                            style={{ width: `${Math.round(leak * 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-display text-xs font-bold tnum">
                          {r.leakage === null ? "–" : percent(r.leakage, 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
