import { notFound } from "next/navigation";
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
        <h1 className="font-display text-2xl font-bold">Exit criteria</h1>
        <p className="text-sm text-muted-foreground">
          Sebuah fase siap naik kalau jumlah defect open di fase itu, per severity, tidak melebihi batas.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {checks.map((c) => (
          <ExitStatusCard key={c.phase} projectId={id} check={c} active={c.phase === project.activePhase} />
        ))}
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Batas defect open per fase</h2>
        <p className="mb-4 mt-0.5 text-xs text-muted-foreground">
          Angka di samping tiap kotak adalah defect open saat ini di fase dan severity itu.
        </p>
        <ExitCriteriaForm projectId={id} phases={project.phaseList} initial={initial} openNow={openNow} />
      </section>
    </div>
  );
}
