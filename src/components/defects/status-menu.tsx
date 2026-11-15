"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUSES, STATUS_HINT } from "@/lib/constants";
import { changeDefectStatus } from "@/lib/actions/defects";
import { STATUS_CLASS } from "./badges";
import type { Status } from "@/lib/constants";

interface StatusMenuProps {
  defectId: string;
  status: string;
  size?: "sm" | "md";
}

/** Pil status yang bisa diklik untuk pindah status langsung dari list. */
export function StatusMenu({ defectId, status, size = "sm" }: StatusMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const cls = STATUS_CLASS[status as Status] ?? STATUS_CLASS.Open;

  function change(to: string) {
    if (to === status) return;
    startTransition(async () => {
      const res = await changeDefectStatus(defectId, to);
      if (res.ok) {
        if (res.message) toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Ubah status, sekarang ${status}`}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset outline-none transition-all",
          "hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50",
          cls.pill,
          size === "sm" ? "h-6" : "h-7 px-3 text-sm",
          pending && "opacity-60",
        )}
      >
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", cls.dot)} />
        <span>{status}</span>
        <ChevronDown className="size-3 opacity-75" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-1.5">
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => change(s)}
            className={cn("grid grid-cols-[auto_1fr] items-baseline gap-x-2.5 rounded-lg py-1.5", s === status && "bg-muted")}
          >
            <span className={cn("size-2 translate-y-px rounded-full", STATUS_CLASS[s].dot)} />
            <span className="flex flex-col">
              <span className="text-sm font-semibold leading-5">{s}</span>
              <span className="text-[11px] leading-4 text-muted-foreground">{STATUS_HINT[s]}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
