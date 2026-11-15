import { notFound } from "next/navigation";
import { ShieldCheck, SlidersHorizontal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getProject } from "@/lib/queries";
import { checkExitCriteria, openBySeverity } from "@/lib/metrics";
import { SEVERITIES } from "@/lib/constants";
import { ExitStatusCard } from "@/components/exit-criteria/exit-status-card";
import { ExitCriteriaForm } from "@/components/exit-criteria/exit-criteria-form";

export const dynamic = "force-dynamic";

export default async function ExitCriteriaPage({ params }: PageProps<"/projects/[id]/exit-criteria">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [defects, rules] = await Promise.all([
    prisma.defect.findMany({
      where: { projectId: id },
      select: { status: true, severity: true, phaseFound: true, moduleId: true, createdAt: true, reopenCount: true },
    }),
    prisma.exitCriteria.findMany({ where: { projectId: id } }),
  ]);

  const checks = project.phaseList.map((ph) => checkExitCriteria(defects, rules, ph));
  const initial = Object.fromEntries(rules.map((r) => [`${r.phase}|${r.severity}`, r.maxOpen]));
  const openNow: Record<string, number> = {};
  for (const ph of project.phaseList) {
    const open = openBySeverity(defects.filter((d) => d.phaseFound === ph));
    for (const sev of SEVERITIES) openNow[`${ph}|${sev}`] = open[sev];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Standar Kelulusan Tahap Uji
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Syarat Lulus (Exit Criteria)</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tentukan batas maksimal temuan yang masih boleh aktif pada setiap tahap sebelum aplikasi dinyatakan siap lanjut ke tahap berikutnya.
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {checks.map((c) => (
          <ExitStatusCard key={c.phase} projectId={id} check={c} active={c.phase === project.activePhase} />
        ))}
      </div>

      <section className="card-surface rounded-3xl border p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <SlidersHorizontal className="size-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">Pengaturan Batas Maksimal Temuan Aktif</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Angka di sebelah tiap kolom input menunjukkan jumlah temuan yang saat ini masih aktif pada tahap &amp; tingkat keparahan tersebut.
            </p>
          </div>
        </div>
        <ExitCriteriaForm projectId={id} phases={project.phaseList} initial={initial} openNow={openNow} />
      </section>
    </div>
  );
}
