import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import type { Status } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { STATUS_CLASS } from "./badges";

interface HistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
}

export function StatusTimeline({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada riwayat perubahan status.</p>;
  }
  const ordered = [...items].reverse();
  return (
    <ol className="relative flex flex-col gap-3 pl-5 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-border">
      {ordered.map((h, i) => {
        const cls = STATUS_CLASS[h.toStatus as Status] ?? STATUS_CLASS.Open;
        return (
          <li key={h.id} className="relative rounded-xl border bg-muted/30 px-3 py-2 text-xs">
            <span
              aria-hidden
              className={cn(
                "absolute top-3 -left-[18px] size-3 rounded-full ring-2 ring-card",
                cls.dot,
                i === 0 && "shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
              )}
            />
            <div className="flex flex-wrap items-center gap-1.5 font-semibold">
              {h.fromStatus ? (
                <>
                  <span className="text-muted-foreground">{h.fromStatus}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="text-foreground">{h.toStatus}</span>
                </>
              ) : (
                <span className="text-foreground">Dicatat pertama kali ({h.toStatus})</span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground tnum">{formatDateTime(h.changedAt)}</div>
          </li>
        );
      })}
    </ol>
  );
}
