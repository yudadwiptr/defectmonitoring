import Link from "next/link";
import { CheckCircle2, CircleDashed, Sparkles, XCircle } from "lucide-react";
import { cn } from "cn";
import type { ExitCheck } from "@/lib/metrics";

interface ExitStatusCardProps {
  projectId: string;
  check: ExitCheck;
  active?: boolean;
  compact?: boolean;
}

/** Kartu "siap naik / belum" untuk satu fase beserta aturan yang belum terpenuhi. */
export function ExitStatusCard({ projectId, check, active, compact }: ExitStatusCardProps) {
  const ready = check.ready;
  const Icon = ready === null ? CircleDashed : ready ? CheckCircle2 : XCircle;
  const label = ready === null ? "Belum Diatur" : ready ? "Siap Naik" : "Belum Siap";
  const badgeTone =
    ready === null
      ? "bg-muted text-muted-foreground"
      : ready
        ? "bg-st-closed/15 text-st-closed"
        : "bg-sev-critical/15 text-sev-critical";

  return (
    <div
      className={cn(
        "card-surface relative flex flex-col gap-3 overflow-hidden rounded-3xl border p-4.5 transition-all",
        active && "border-primary/50 ring-2 ring-primary/15",
        ready === false && "border-sev-critical/35 bg-gradient-to-b from-sev-critical/8 to-card",
        ready === true && "border-st-closed/35 bg-gradient-to-b from-st-closed/8 to-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-display text-sm font-bold">
          {check.phase}
          {active && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              <Sparkles className="size-2.5" />
              Aktif
            </span>
          )}
        </span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", badgeTone)}>
          <Icon className="size-3.5" />
          {label}
        </span>
      </div>

      {ready === null ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {compact ? (
            <Link href={`/projects/${projectId}/exit-criteria`} className="font-semibold text-primary underline">
              Atur syarat lulus
            </Link>
          ) : (
            "Isi batas maksimal di tabel bawah agar tahap ini bisa dinilai otomatis."
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 border-t pt-2.5 text-xs">
          {check.rules.map((r) => (
            <li key={r.severity} className="flex items-center justify-between gap-2">
              <span className={cn(r.passed ? "text-muted-foreground" : "font-bold text-foreground")}>
                {r.severity}
              </span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 tnum",
                  r.passed
                    ? "bg-muted/60 text-muted-foreground"
                    : "bg-sev-critical/12 font-bold text-sev-critical",
                )}
              >
                {r.open} aktif / maks {r.maxOpen}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
