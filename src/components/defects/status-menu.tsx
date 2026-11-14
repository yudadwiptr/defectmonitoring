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
import { StatusLabel, STATUS_CLASS } from "./badges";

interface StatusMenuProps {
  defectId: string;
  status: string;
  size?: "sm" | "md";
}

/** Pil status yang bisa diklik untuk pindah status langsung dari list. */
export function StatusMenu({ defectId, status, size = "sm" }: StatusMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
          "inline-flex items-center gap-1 rounded-full border border-transparent bg-transparent pr-1.5 pl-2 outline-none transition-colors",
          "hover:border-border hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-border aria-expanded:bg-muted",
          size === "sm" ? "h-7" : "h-8",
          pending && "opacity-60",
        )}
      >
        <StatusLabel status={status} />
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => change(s)}
            className={cn("grid grid-cols-[auto_1fr] items-baseline gap-x-2 py-1", s === status && "bg-muted")}
          >
            <span className={cn("size-2 translate-y-px rounded-full", STATUS_CLASS[s].dot)} />
            <span className="flex flex-col">
              <span className="text-sm font-medium leading-5">{s}</span>
              <span className="text-[11px] leading-4 text-muted-foreground">{STATUS_HINT[s]}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
