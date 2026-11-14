import { Fragment } from "react";
import { cn } from "cn";
import type { PhaseLeakage } from "@/lib/metrics";
import { percent } from "@/lib/format";

interface LeakageFlowProps {
  rows: PhaseLeakage[];
  activePhase: string;
}

function tone(leakage: number | null): string {
  if (leakage === null) return "text-muted-foreground";
  if (leakage >= 0.5) return "text-sev-critical";
  if (leakage >= 0.25) return "text-sev-high";
  return "text-st-closed";
}

/**
 * Aliran kebocoran antar fase: tiap kotak = defect valid yang ditemukan di
 * fase itu; panah di antaranya = persentase yang bocor dari fase kiri ke
 * fase-fase sesudahnya.
 */
export function LeakageFlow({ rows, activePhase }: LeakageFlowProps) {
  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[640px] items-stretch gap-2 py-1" aria-label="Leakage antar fase">
        {rows.map((r, i) => {
          const last = i === rows.length - 1;
          const active = r.phase === activePhase;
          return (
            <Fragment key={r.phase}>
              <li
                className={cn(
                  "flex min-w-24 flex-1 flex-col justify-between rounded-2xl border px-3.5 py-3",
                  active ? "border-primary bg-primary/5" : "bg-card",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-sm font-semibold">{r.phase}</span>
                  {active && <span className="text-[10px] font-medium text-primary">aktif</span>}
                </div>
                <div className="mt-3">
                  <div className="font-display text-3xl font-semibold leading-none">{r.found}</div>
                  <div className="mt-1 text-xs text-muted-foreground">ditemukan di sini</div>
                </div>
              </li>
              {!last && (
                <li
                  className="flex w-24 shrink-0 flex-col items-center justify-center text-center"
                  title={`${r.after} dari ${r.found + r.after} defect valid ditemukan setelah ${r.phase}`}
                >
                  <div className={cn("font-display text-xl font-semibold leading-none", tone(r.leakage))}>
                    {r.leakage === null ? "–" : percent(r.leakage, 0)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">bocor dari {r.phase}</div>
                  <div className="mt-2 flex w-full items-center" aria-hidden>
                    <span className="h-px flex-1 bg-border" />
                    <span className="size-0 border-y-4 border-l-[6px] border-y-transparent border-l-border" />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground tnum">
                    {r.after} / {r.found + r.after}
                  </div>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
