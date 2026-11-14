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
    return <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>;
  }
  const ordered = [...items].reverse();
  return (
    <ol className="relative flex flex-col gap-3 pl-4 before:absolute before:top-1 before:bottom-1 before:left-[5px] before:w-px before:bg-border">
      {ordered.map((h, i) => {
        const cls = STATUS_CLASS[h.toStatus as Status] ?? STATUS_CLASS.Open;
        return (
          <li key={h.id} className="relative text-sm">
            <span
              aria-hidden
              className={cn(
                "absolute top-1.5 -left-4 size-[11px] rounded-full ring-2 ring-background",
                cls.dot,
                i === 0 && "shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]",
              )}
            />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className={cn("font-medium", i === 0 ? "text-foreground" : "text-muted-foreground")}>
                {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : `Dilaporkan sebagai ${h.toStatus}`}
              </span>
            </div>
            <div className="text-xs text-muted-foreground tnum">{formatDateTime(h.changedAt)}</div>
          </li>
        );
      })}
    </ol>
  );
}
