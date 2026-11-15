import Link from "next/link";
import { Layers, Paperclip, RotateCcw, Sparkles } from "lucide-react";
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
      <div className="paper-grid card-surface flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </span>
        <div>
          <p className="font-display text-lg font-bold">Belum Ada Temuan yang Cocok</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Coba sesuaikan filter di atas, atau tekan tombol{" "}
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs">N</kbd> untuk
            mencatat temuan baru.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="card-surface overflow-hidden rounded-3xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-3 pr-2 pl-5 font-semibold">Temuan &amp; Kendala</th>
              <th className="px-2.5 py-3 font-semibold">Tingkat</th>
              <th className="px-2.5 py-3 font-semibold">Status</th>
              <th className="hidden px-2.5 py-3 font-semibold md:table-cell">Bagian / Modul</th>
              <th className="hidden px-2.5 py-3 font-semibold lg:table-cell">Tahap</th>
              <th className="hidden px-2.5 py-3 font-semibold lg:table-cell">Penanggung Jawab</th>
              <th className="px-2.5 py-3 text-right font-semibold">Umur</th>
              <th className="hidden py-3 pr-5 pl-2.5 text-right font-semibold xl:table-cell">Tgl Dicatat</th>
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
                    "group relative border-b last:border-b-0 transition-colors hover:bg-muted/35",
                    !open && "bg-muted/15 text-muted-foreground",
                  )}
                >
                  <td className="relative py-3 pr-2 pl-5">
                    <span
                      aria-hidden
                      className={cn("absolute inset-y-2.5 left-0 w-1 rounded-r-full", bar, !open && "opacity-35")}
                    />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <DefectCode code={d.code} />
                        {d.reopenCount > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full bg-st-reopened/12 px-1.5 py-0.5 text-[10px] font-bold text-st-reopened"
                            title={`Dibuka ulang ${d.reopenCount}×`}
                          >
                            <RotateCcw className="size-3" />
                            {d.reopenCount}×
                          </span>
                        )}
                        {d._count.attachments > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                            title={`${d._count.attachments} lampiran`}
                          >
                            <Paperclip className="size-3" />
                            {d._count.attachments}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/projects/${projectId}/defects/${d.id}`}
                        className={cn(
                          "line-clamp-2 font-semibold text-foreground transition-colors outline-none group-hover:text-primary hover:underline focus-visible:underline",
                          !open && "font-medium text-muted-foreground",
                        )}
                      >
                        {d.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-2.5 py-3 align-middle">
                    <SeverityPill severity={d.severity} className={cn(!open && "opacity-60")} />
                  </td>
                  <td className="px-2.5 py-3 align-middle">
                    <StatusMenu defectId={d.id} status={d.status} />
                  </td>
                  <td className="hidden px-2.5 py-3 align-middle md:table-cell">
                    {d.module ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/70 px-2 py-1 text-xs font-medium">
                        <Layers className="size-3 text-primary" />
                        {d.module.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="hidden px-2.5 py-3 align-middle lg:table-cell">
                    <span className="rounded-md border bg-background/80 px-2 py-0.5 font-display text-xs font-bold">
                      {d.phaseFound}
                    </span>
                  </td>
                  <td className="hidden px-2.5 py-3 align-middle lg:table-cell">
                    {d.assignee ? (
                      <span className="inline-flex items-center gap-2 text-xs font-medium">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 font-display text-[10px] font-bold text-primary">
                          {d.assignee.slice(0, 2).toUpperCase()}
                        </span>
                        {d.assignee}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum ada</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-2.5 py-3 text-right align-middle text-xs font-medium tnum",
                      open && age >= 14 && "font-bold text-sev-high",
                      open && age >= 30 && "font-bold text-sev-critical",
                    )}
                    title={open ? "Hari sejak dilaporkan" : "Sudah selesai"}
                  >
                    {open ? formatAging(age) : "Selesai"}
                  </td>
                  <td className="hidden py-3 pr-5 pl-2.5 text-right align-middle text-xs text-muted-foreground tnum xl:table-cell">
                    {formatDate(d.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
