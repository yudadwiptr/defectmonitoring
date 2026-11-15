import Link from "next/link";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "cn";

interface PhaseRailProps {
  projectId: string;
  phases: string[];
  activePhase: string;
  counts: Record<string, { total: number; open: number }>;
  /** fase yang sedang difilter di list defect, kalau ada */
  selectedPhase?: string;
}

/**
 * Rel tahapan pengujian: menampilkan alur fase secara visual seperti papan progres.
 */
export function PhaseRail({ projectId, phases, activePhase, counts, selectedPhase }: PhaseRailProps) {
  const activeIdx = phases.indexOf(activePhase);

  return (
    <ol
      className="flex w-full items-stretch gap-1.5 overflow-x-auto rounded-2xl border bg-card/75 p-1.5 shadow-2xs"
      aria-label="Urutan tahapan pengujian"
    >
      {phases.map((phase, i) => {
        const c = counts[phase] ?? { total: 0, open: 0 };
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "next";
        const selected = selectedPhase === phase;
        const resolved = Math.max(0, c.total - c.open);

        return (
          <li key={phase} className="flex min-w-36 flex-1 items-center gap-1.5">
            <Link
              href={`/projects/${projectId}/defects?phase=${encodeURIComponent(phase)}`}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 outline-none transition-all",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                state === "active"
                  ? "border-primary/40 bg-gradient-to-r from-primary/12 via-primary/6 to-transparent shadow-2xs"
                  : state === "done"
                    ? "border-transparent bg-muted/45 hover:border-border hover:bg-muted/80"
                    : "border-transparent bg-transparent opacity-80 hover:bg-muted/50 hover:opacity-100",
                selected && "ring-2 ring-primary/40",
              )}
              title={`${c.total} temuan di tahap ${phase} (${c.open} masih dikerjakan, ${resolved} selesai)`}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold tnum transition-transform group-hover:scale-105",
                  state === "done" && "bg-primary/15 text-primary",
                  state === "active" &&
                    "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
                  state === "next" && "border bg-background text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5 stroke-[2.5]" /> : i + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "truncate font-display text-xs font-bold",
                      state === "active" ? "text-primary" : "text-foreground",
                    )}
                  >
                    {phase}
                  </span>
                  {state === "active" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                      <Sparkles className="size-2.5" />
                      Aktif
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] tnum">
                  {c.total === 0 ? (
                    <span className="text-muted-foreground">Belum ada temuan</span>
                  ) : c.open === 0 ? (
                    <span className="font-medium text-st-closed">✓ Semua beres ({c.total})</span>
                  ) : (
                    <>
                      <span className="font-semibold text-sev-high">{c.open} aktif</span>
                      <span className="text-muted-foreground">/ {c.total} total</span>
                    </>
                  )}
                </div>
              </div>
            </Link>

            {i < phases.length - 1 && (
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/50" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
