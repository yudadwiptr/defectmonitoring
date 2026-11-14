import Link from "next/link";
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="mr-1 text-muted-foreground">Dihitung dari fase</span>
        {selectable.map((p) => (
          <Link
            key={p}
            href={`/projects/${projectId}?base=${encodeURIComponent(p)}`}
            scroll={false}
            aria-current={p === basePhase ? "true" : undefined}
            className={cn(
              "font-display rounded-full px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              p === basePhase ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada defect valid.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-2 font-medium">Modul</th>
              {phases.map((p) => (
                <th key={p} className="hidden px-1.5 py-2 text-right font-medium lg:table-cell">
                  {p}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium">Di {basePhase}</th>
              <th className="px-2 py-2 text-right font-medium">Setelahnya</th>
              <th className="w-[38%] py-2 pl-2 font-medium">Leakage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.moduleId ?? "none"} className="border-b last:border-b-0">
                <td className="py-2 pr-2 font-medium">
                  {r.moduleId ? (
                    <Link href={`/projects/${projectId}/defects?module=${r.moduleId}&scope=all`} className="hover:underline">
                      {r.moduleName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{r.moduleName}</span>
                  )}
                </td>
                {r.byPhase.map((n, i) => (
                  <td key={phases[i]} className={cn("hidden px-1.5 py-2 text-right tnum lg:table-cell", n === 0 && "text-muted-foreground/60")}>
                    {n}
                  </td>
                ))}
                <td className="px-2 py-2 text-right tnum">{r.found}</td>
                <td className="px-2 py-2 text-right tnum">{r.after}</td>
                <td className="py-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((r.leakage ?? 0) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs tnum">
                      {r.leakage === null ? "–" : percent(r.leakage, 0)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
