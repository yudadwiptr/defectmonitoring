import Link from "next/link";
import { Paperclip, RotateCcw } from "lucide-react";
import { cn } from "cn";
import type { DefectRow } from "@/lib/queries";
import { isOpenStatus, type Severity } from "@/lib/constants";
import { agingDays, formatAging, formatDate } from "@/lib/format";
import { DefectCode, SEVERITY_CLASS, SeverityPill } from "./badges";
import { StatusMenu } from "./status-menu";

interface DefectTableProps {
  projectId: string;
  defects: DefectRow[];
}

export function DefectTable({ projectId, defects }: DefectTableProps) {
  if (defects.length === 0) {
    return (
      <div className="paper-grid flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">Tidak ada defect yang cocok</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Coba longgarkan filter, atau tekan <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs">N</kbd> untuk
          mencatat defect baru.
        </p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="py-2.5 pr-2 pl-4 font-medium">Defect</th>
            <th className="px-2 py-2.5 font-medium">Severity</th>
            <th className="px-2 py-2.5 font-medium">Status</th>
            <th className="hidden px-2 py-2.5 font-medium md:table-cell">Modul</th>
            <th className="hidden px-2 py-2.5 font-medium lg:table-cell">Fase</th>
            <th className="hidden px-2 py-2.5 font-medium lg:table-cell">Assignee</th>
            <th className="px-2 py-2.5 text-right font-medium">Umur</th>
            <th className="hidden py-2.5 pr-4 pl-2 text-right font-medium xl:table-cell">Dibuat</th>
          </tr>
        </thead>
        <tbody>
          {defects.map((d) => {
            const open = isOpenStatus(d.status);
            const age = agingDays(d.createdAt, now);
            const bar = SEVERITY_CLASS[d.severity as Severity]?.bar ?? SEVERITY_CLASS.Low.bar;
            return (
              <tr
                key={d.id}
                className={cn(
                  "group relative border-b last:border-b-0 transition-colors hover:bg-muted/40",
                  !open && "text-muted-foreground",
                )}
              >
                <td className="relative py-2.5 pr-2 pl-4">
                  <span aria-hidden className={cn("absolute inset-y-2 left-0 w-[3px] rounded-r", bar, !open && "opacity-40")} />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <DefectCode code={d.code} />
                      {d.reopenCount > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[11px] text-st-reopened"
                          title={`Dibuka ulang ${d.reopenCount}×`}
                        >
                          <RotateCcw className="size-3" />
                          {d.reopenCount}
                        </span>
                      )}
                      {d._count.attachments > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground" title={`${d._count.attachments} lampiran`}>
                          <Paperclip className="size-3" />
                          {d._count.attachments}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/projects/${projectId}/defects/${d.id}`}
                      className={cn(
                        "line-clamp-2 font-medium text-foreground outline-none hover:underline focus-visible:underline",
                        !open && "text-muted-foreground",
                      )}
                    >
                      {d.title}
                    </Link>
                  </div>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <SeverityPill severity={d.severity} className={cn(!open && "opacity-60")} />
                </td>
                <td className="px-2 py-2.5 align-top">
                  <StatusMenu defectId={d.id} status={d.status} />
                </td>
                <td className="hidden px-2 py-2.5 align-top md:table-cell">
                  {d.module?.name ?? <span className="text-muted-foreground">–</span>}
                </td>
                <td className="hidden px-2 py-2.5 align-top lg:table-cell">
                  <span className="font-display text-xs font-semibold">{d.phaseFound}</span>
                </td>
                <td className="hidden px-2 py-2.5 align-top lg:table-cell">
                  {d.assignee ?? <span className="text-muted-foreground">–</span>}
                </td>
                <td
                  className={cn(
                    "px-2 py-2.5 text-right align-top tnum",
                    open && age >= 14 && "font-semibold text-sev-high",
                    open && age >= 30 && "text-sev-critical",
                  )}
                  title={open ? "Hari sejak dilaporkan" : "Sudah selesai"}
                >
                  {open ? formatAging(age) : "–"}
                </td>
                <td className="hidden py-2.5 pr-4 pl-2 text-right align-top text-muted-foreground tnum xl:table-cell">
                  {formatDate(d.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
