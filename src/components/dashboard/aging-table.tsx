import Link from "next/link";
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
    return <p className="text-sm text-muted-foreground">Tidak ada defect open. Mantap.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted-foreground">
        <tr className="border-b">
          <th className="py-2 pr-2 font-medium">Defect</th>
          <th className="px-2 py-2 font-medium">Severity</th>
          <th className="hidden px-2 py-2 font-medium md:table-cell">Status</th>
          <th className="hidden px-2 py-2 font-medium lg:table-cell">Fase</th>
          <th className="hidden px-2 py-2 font-medium lg:table-cell">Assignee</th>
          <th className="py-2 pl-2 text-right font-medium">Umur</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ defect, days }) => (
          <tr key={defect.id} className="border-b last:border-b-0">
            <td className="py-2 pr-2">
              <div className="flex items-center gap-2">
                <DefectCode code={defect.code} />
                {defect.module && <span className="text-xs text-muted-foreground">{defect.module.name}</span>}
              </div>
              <Link href={`/projects/${projectId}/defects/${defect.id}`} className="line-clamp-1 font-medium hover:underline">
                {defect.title}
              </Link>
            </td>
            <td className="px-2 py-2">
              <SeverityPill severity={defect.severity} />
            </td>
            <td className="hidden px-2 py-2 md:table-cell">
              <StatusLabel status={defect.status} />
            </td>
            <td className="hidden px-2 py-2 md:table-cell lg:table-cell">
              <span className="font-display text-xs font-semibold">{defect.phaseFound}</span>
            </td>
            <td className="hidden px-2 py-2 lg:table-cell">{defect.assignee ?? <span className="text-muted-foreground">–</span>}</td>
            <td
              className={cn(
                "font-display py-2 pl-2 text-right text-base font-semibold tnum",
                days >= 14 && "text-sev-high",
                days >= 30 && "text-sev-critical",
              )}
            >
              {days} <span className="text-xs font-normal text-muted-foreground">hari</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
