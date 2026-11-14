import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProject } from "@/lib/queries";
import { buildDailyReport } from "@/lib/daily-report";
import { formatDateTime } from "@/lib/format";
import { CopyButton } from "@/components/report/copy-button";

export const dynamic = "force-dynamic";

export default async function DailyReportPage({ params }: PageProps<"/projects/[id]/report">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const now = new Date();
  const [defects, rules] = await Promise.all([
    prisma.defect.findMany({
      where: { projectId: id },
      select: {
        code: true,
        title: true,
        status: true,
        severity: true,
        phaseFound: true,
        moduleId: true,
        createdAt: true,
        reopenCount: true,
        assignee: true,
        fixedAt: true,
      },
    }),
    prisma.exitCriteria.findMany({ where: { projectId: id } }),
  ]);

  const text = buildDailyReport({
    projectName: project.name,
    activePhase: project.activePhase,
    phases: project.phaseList,
    defects,
    rules,
    now,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Laporan harian</h1>
          <p className="text-sm text-muted-foreground">
            Dibuat {formatDateTime(now)} dari data saat ini. Muat ulang halaman untuk memperbarui.
          </p>
        </div>
        <CopyButton text={text} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <pre className="overflow-x-auto rounded-2xl border bg-card p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap">
          {text}
        </pre>
        <aside className="flex h-fit flex-col gap-3 rounded-2xl border bg-card p-5 text-sm">
          <h2 className="font-display text-base font-semibold">Isi laporan</h2>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
            <li>Tanggal dan fase aktif</li>
            <li>Total, open per severity, closed</li>
            <li>Defect baru dan fixed hari ini (tanggal lokal server)</li>
            <li>Critical/High yang masih open, berurut dari Critical lalu paling lama</li>
            <li>Status exit criteria fase aktif</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Tanda *bintang* jadi tebal di WhatsApp. Batas exit criteria diatur di{" "}
            <Link href={`/projects/${id}/exit-criteria`} className="underline">
              halaman Exit criteria
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
