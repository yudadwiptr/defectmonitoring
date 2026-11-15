import { AlertCircle, CheckCircle2, ClipboardList, Clock, RotateCcw } from "lucide-react";
import { cn } from "cn";

export interface StatTile {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad";
  kind?: "total" | "open" | "closed" | "reopen" | "age";
}

const KIND_STYLE = {
  total: {
    Icon: ClipboardList,
    iconWrap: "bg-primary/12 text-primary",
    accent: "from-primary/10 to-transparent",
  },
  open: {
    Icon: AlertCircle,
    iconWrap: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    accent: "from-amber-500/10 to-transparent",
  },
  closed: {
    Icon: CheckCircle2,
    iconWrap: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    accent: "from-emerald-500/10 to-transparent",
  },
  reopen: {
    Icon: RotateCcw,
    iconWrap: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    accent: "from-rose-500/10 to-transparent",
  },
  age: {
    Icon: Clock,
    iconWrap: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    accent: "from-sky-500/10 to-transparent",
  },
} as const;

const FALLBACK_KINDS = ["total", "open", "closed", "reopen", "age"] as const;

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
      {tiles.map((t, i) => {
        const k = t.kind ?? FALLBACK_KINDS[i % FALLBACK_KINDS.length];
        const cfg = KIND_STYLE[k];
        const Icon = cfg.Icon;
        return (
          <div
            key={t.label}
            className="card-surface relative overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
          >
            <div
              aria-hidden
              className={cn("pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b", cfg.accent)}
            />
            <div className="relative flex items-start justify-between gap-2">
              <dt className="text-xs font-semibold text-muted-foreground">{t.label}</dt>
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", cfg.iconWrap)}>
                <Icon className="size-4" />
              </span>
            </div>
            <dd
              className={cn(
                "relative font-display mt-2 text-3xl font-extrabold leading-none tnum",
                t.tone === "good" && "text-st-closed",
                t.tone === "bad" && "text-sev-critical",
              )}
            >
              {t.value}
            </dd>
            {t.hint && (
              <dd className="relative mt-2 inline-flex items-center rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t.hint}
              </dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
