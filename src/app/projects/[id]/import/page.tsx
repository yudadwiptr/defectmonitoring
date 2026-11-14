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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Impor dari Excel</h1>
          <p className="text-sm text-muted-foreground">
            Pindahkan defect log lama ke sini. Tidak ada yang disimpan sebelum Anda menekan tombol impor di langkah 3.
          </p>
        </div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/projects/${id}/defects`} />}>
          <ArrowLeft data-icon="inline-start" />
          Daftar defect
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
