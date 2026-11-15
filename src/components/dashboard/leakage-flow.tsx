import { Fragment } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "cn";
import type { PhaseLeakage } from "@/lib/metrics";
import { percent } from "@/lib/format";

interface LeakageFlowProps {
  rows: PhaseLeakage[];
  activePhase: string;
}

function leakageBadge(leakage: number | null): { pill: string; label: string } {
  if (leakage === null) {
    return { pill: "bg-muted text-muted-foreground border-border", label: "Belum ada data" };
  }
  if (leakage >= 0.5) {
    return { pill: "bg-sev-critical/12 text-sev-critical border-sev-critical/30", label: "Perlu perhatian" };
  }
  if (leakage >= 0.25) {
    return { pill: "bg-sev-high/12 text-sev-high border-sev-high/30", label: "Cukup banyak lolos" };
  }
  return { pill: "bg-st-closed/12 text-st-closed border-st-closed/30", label: "Terkendali" };
}

/**
 * Aliran temuan antar tahapan pengujian: tiap kartu menunjukkan berapa temuan
 * yang berhasil dijaring di tahap itu, serta persentase yang baru ketahuan di tahap setelahnya.
 */
export function LeakageFlow({ rows, activePhase }: LeakageFlowProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[680px] items-stretch gap-2.5 py-1" aria-label="Alur temuan antar tahap">
        {rows.map((r, i) => {
          const last = i === rows.length - 1;
          const active = r.phase === activePhase;
          const badge = leakageBadge(r.leakage);
          return (
            <Fragment key={r.phase}>
              <li
                className={cn(
                  "relative flex min-w-32 flex-1 flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all",
                  active
                    ? "border-primary/50 bg-gradient-to-b from-primary/12 via-primary/4 to-card shadow-sm"
                    : "bg-muted/25 hover:bg-muted/45",
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-display text-sm font-bold">{r.phase}</span>
                  {active ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      <Sparkles className="size-2.5" />
                      Aktif
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-muted-foreground">Tahap {i + 1}</span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="font-display text-3xl font-extrabold leading-none tnum">{r.found}</div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">temuan dijaring di sini</div>
                </div>
              </li>

              {!last && (
                <li
                  className="flex w-28 shrink-0 flex-col items-center justify-center px-1 text-center"
                  title={`${r.after} dari ${r.found + r.after} temuan valid baru ketahuan setelah tahap ${r.phase}`}
                >
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 font-display text-sm font-bold tnum",
                      badge.pill,
                    )}
                  >
                    {r.leakage === null ? "–" : percent(r.leakage, 0)}
                  </span>
                  <div className="mt-1 text-[11px] font-medium text-muted-foreground">lolos dari {r.phase}</div>
                  <div className="my-1.5 flex w-full items-center justify-center gap-1 text-muted-foreground/60" aria-hidden>
                    <span className="h-0.5 flex-1 rounded-full bg-border" />
                    <ArrowRight className="size-3.5 shrink-0" />
                    <span className="h-0.5 flex-1 rounded-full bg-border" />
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground tnum">
                    {r.after} dari {r.found + r.after} temuan
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
