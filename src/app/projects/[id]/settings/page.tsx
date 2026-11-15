import { notFound } from "next/navigation";
import { Boxes, GitCommitHorizontal, Settings2 } from "lucide-react";
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
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Konfigurasi Ruang Kerja
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Pengaturan Project</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Sesuaikan urutan tahapan pengujian, daftar bagian/modul aplikasi, serta identitas project.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface rounded-3xl border p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <GitCommitHorizontal className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Urutan Tahap Pengujian</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Urutan ini menentukan alur pelacakan temuan. Tahap yang ditandai aktif akan menjadi pilihan bawaan saat mencatat temuan baru.
              </p>
            </div>
          </div>
          <PhaseEditor projectId={id} phases={project.phaseList} activePhase={project.activePhase} counts={counts} />
        </section>

        <section className="card-surface rounded-3xl border p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
              <Boxes className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Bagian / Modul Aplikasi</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Kelompokkan temuan berdasarkan fitur atau halaman aplikasi agar lebih mudah dianalisis.
              </p>
            </div>
          </div>
          <ModuleManager
            projectId={id}
            modules={project.modules.map((m) => ({
              id: m.id,
              name: m.name,
              defectCount: countByModule.get(m.id) ?? 0,
            }))}
          />
        </section>

        <section className="card-surface rounded-3xl border p-6 lg:col-span-2">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-400">
              <Settings2 className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Identitas &amp; Penghapusan Project</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ubah nama project atau hapus seluruh data project secara permanen.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-6">
            <RenameProjectForm projectId={id} name={project.name} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-destructive">Zona Berbahaya: Hapus Project Ini</p>
                <p className="text-xs text-muted-foreground">
                  Menghapus project akan ikut menghapus {defectCount} temuan beserta seluruh lampirannya secara permanen.
                </p>
              </div>
              <DeleteProjectButton projectId={id} name={project.name} defectCount={defectCount} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
