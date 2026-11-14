import Link from "next/link";
import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
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
  const label = ready === null ? "Belum ada aturan" : ready ? "Siap naik" : "Belum siap";
  const tone = ready === null ? "text-muted-foreground" : ready ? "text-st-closed" : "text-sev-critical";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-card p-4",
        active && "border-primary",
        ready === false && "bg-sev-critical/5",
        ready === true && "bg-st-closed/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold">
          {check.phase}
          {active && <span className="ml-1.5 text-[10px] font-medium text-primary">aktif</span>}
        </span>
        <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", tone)}>
          <Icon className="size-4" />
          {label}
        </span>
      </div>

      {ready === null ? (
        <p className="text-xs text-muted-foreground">
          {compact ? (
            <Link href={`/projects/${projectId}/exit-criteria`} className="underline">
              Setel batas
            </Link>
          ) : (
            "Isi batas di form bawah supaya fase ini bisa dinilai."
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5 text-xs">
          {check.rules.map((r) => (
            <li key={r.severity} className="flex items-center justify-between gap-2">
              <span className={cn(r.passed ? "text-muted-foreground" : "font-medium")}>{r.severity}</span>
              <span className={cn("tnum", r.passed ? "text-muted-foreground" : "font-semibold text-sev-critical")}>
                {r.open} open / maks {r.maxOpen}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
