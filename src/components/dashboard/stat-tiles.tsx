import { cn } from "cn";

export interface StatTile {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad";
}

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border bg-card px-4 py-3.5">
          <dt className="text-xs text-muted-foreground">{t.label}</dt>
          <dd
            className={cn(
              "font-display mt-1 text-3xl font-semibold leading-none",
              t.tone === "good" && "text-st-closed",
              t.tone === "bad" && "text-sev-critical",
            )}
          >
            {t.value}
          </dd>
          {t.hint && <dd className="mt-1.5 text-xs text-muted-foreground">{t.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
