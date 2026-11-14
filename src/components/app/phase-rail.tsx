import Link from "next/link";
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
 * Rel fase: elemen khas aplikasi ini. Fase yang sudah dilewati tampil tenang,
 * fase aktif menyala, fase berikutnya masih "kosong". Angka di bawah nama
 * fase adalah defect yang masih open di fase itu.
 */
export function PhaseRail({ projectId, phases, activePhase, counts, selectedPhase }: PhaseRailProps) {
  const activeIdx = phases.indexOf(activePhase);

  return (
    <ol className="flex w-full items-stretch gap-0 overflow-x-auto" aria-label="Urutan fase">
      {phases.map((phase, i) => {
        const c = counts[phase] ?? { total: 0, open: 0 };
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "next";
        const selected = selectedPhase === phase;
        return (
          <li key={phase} className="relative flex min-w-28 flex-1 items-stretch">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-[18px] -left-1/2 h-0.5 w-full",
                  state === "next" ? "bg-border" : "bg-primary",
                )}
              />
            )}
            <Link
              href={`/projects/${projectId}/defects?phase=${encodeURIComponent(phase)}`}
              className={cn(
                "group relative z-10 flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 outline-none transition-colors",
                "hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50",
                selected && "bg-muted",
              )}
              title={`${c.total} defect ditemukan di ${phase}, ${c.open} masih open`}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold tnum",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" &&
                    "border-primary bg-background text-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
                  state === "next" && "border-border bg-background text-muted-foreground",
                )}
              >
                {c.open > 0 ? c.open : state === "done" ? "✓" : "·"}
              </span>
              <span
                className={cn(
                  "font-display text-sm font-semibold",
                  state === "active" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {phase}
              </span>
              <span className="text-[11px] text-muted-foreground tnum">
                {c.total === 0 ? "belum ada" : `${c.open} open / ${c.total}`}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
