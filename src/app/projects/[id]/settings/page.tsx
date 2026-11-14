import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPhaseCounts, getProject } from "@/lib/queries";
import { ModuleManager } from "@/components/projects/module-manager";
import { PhaseEditor } from "@/components/projects/phase-editor";
import { DeleteProjectButton, RenameProjectForm } from "@/components/projects/project-settings";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({ params }: PageProps<"/projects/[id]/settings">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [counts, moduleCounts, defectCount] = await Promise.all([
    getPhaseCounts(id, project.phaseList),
    prisma.defect.groupBy({ by: ["moduleId"], where: { projectId: id }, _count: { _all: true } }),
    prisma.defect.count({ where: { projectId: id } }),
  ]);
  const countByModule = new Map(moduleCounts.map((m) => [m.moduleId, m._count._all]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Pengaturan project</h1>
        <p className="text-sm text-muted-foreground">Modul, urutan fase, dan fase yang sedang berjalan.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-base font-semibold">Fase</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Urutan menentukan arah kebocoran: defect yang ditemukan di fase setelah X dianggap bocor dari X.
            Fase aktif jadi default saat mencatat defect baru.
          </p>
          <PhaseEditor projectId={id} phases={project.phaseList} activePhase={project.activePhase} counts={counts} />
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-base font-semibold">Modul</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Area aplikasi yang diuji. Dipakai untuk filter dan leakage per modul.
          </p>
          <ModuleManager
            projectId={id}
            modules={project.modules.map((m) => ({
              id: m.id,
              name: m.name,
              defectCount: countByModule.get(m.id) ?? 0,
            }))}
          />
        </section>

        <section className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Project</h2>
          <div className="mt-4 flex flex-col gap-6">
            <RenameProjectForm projectId={id} name={project.name} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Hapus project ini</p>
                <p className="text-xs text-muted-foreground">Termasuk {defectCount} defect dan semua lampirannya.</p>
              </div>
              <DeleteProjectButton projectId={id} name={project.name} defectCount={defectCount} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
