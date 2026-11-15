import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "cn";
import type { AgingRow, MetricDefect } from "@/lib/metrics";
import { DefectCode, SeverityPill, StatusLabel } from "@/components/defects/badges";

type Row = AgingRow<
  MetricDefect & {
    id: string;
    code: string;
    title: string;
    assignee: string | null;
    module: { name: string } | null;
  }
>;

export function AgingTable({ projectId, rows }: { projectId: string; rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-st-closed/30 bg-st-closed/8 px-4 py-5 text-sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-st-closed/15 text-st-closed">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <p className="font-display font-bold text-foreground">Semua Temuan Sudah Tuntas!</p>
          <p className="text-xs text-muted-foreground">Tidak ada temuan yang masih menggantung saat ini. Kerja bagus!</p>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="py-2.5 pr-2 pl-3.5 font-semibold">Temuan</th>
            <th className="px-2 py-2.5 font-semibold">Tingkat</th>
            <th className="hidden px-2 py-2.5 font-semibold md:table-cell">Status</th>
            <th className="hidden px-2 py-2.5 font-semibold lg:table-cell">Tahap</th>
            <th className="hidden px-2 py-2.5 font-semibold lg:table-cell">Penanggung Jawab</th>
            <th className="py-2.5 pr-3.5 pl-2 text-right font-semibold">Lama Menggantung</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ defect, days }) => (
            <tr key={defect.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/30">
              <td className="py-2.5 pr-2 pl-3.5">
                <div className="flex items-center gap-2">
                  <DefectCode code={defect.code} />
                  {defect.module && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {defect.module.name}
                    </span>
                  )}
                </div>
                <Link
                  href={`/projects/${projectId}/defects/${defect.id}`}
                  className="mt-0.5 line-clamp-1 font-semibold hover:text-primary hover:underline"
                >
                  {defect.title}
                </Link>
              </td>
              <td className="px-2 py-2.5">
                <SeverityPill severity={defect.severity} />
              </td>
              <td className="hidden px-2 py-2.5 md:table-cell">
                <StatusLabel status={defect.status} />
              </td>
              <td className="hidden px-2 py-2.5 lg:table-cell">
                <span className="rounded-md border bg-muted/50 px-2 py-0.5 font-display text-xs font-semibold">
                  {defect.phaseFound}
                </span>
              </td>
              <td className="hidden px-2 py-2.5 lg:table-cell">
                {defect.assignee ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 font-display text-[11px] font-bold text-primary">
                      {defect.assignee.slice(0, 2).toUpperCase()}
                    </span>
                    {defect.assignee}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Belum ditunjuk</span>
                )}
              </td>
              <td className="py-2.5 pr-3.5 pl-2 text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-xs font-bold tnum",
                    days >= 30
                      ? "bg-sev-critical/12 text-sev-critical"
                      : days >= 14
                        ? "bg-sev-high/12 text-sev-high"
                        : "bg-muted text-foreground",
                  )}
                >
                  <Clock className="size-3" />
                  {days} hari
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
