import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProject } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "@/components/import/import-wizard";

export const dynamic = "force-dynamic";

export default async function ImportPage({ params }: PageProps<"/projects/[id]/import">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Pindahkan Catatan Lama
          </span>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Impor Data dari Excel</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Unggah file spreadsheet (.xlsx) Anda. Anda dapat meninjau hasilnya terlebih dahulu sebelum benar-benar disimpan.
          </p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/projects/${id}/defects`} />}>
          <ArrowLeft data-icon="inline-start" />
          Kembali ke Daftar Temuan
        </Button>
      </div>
      <ImportWizard
        projectId={id}
        phases={project.phaseList}
        activePhase={project.activePhase}
        modules={project.modules.map((m) => m.name)}
      />
    </div>
  );
}
