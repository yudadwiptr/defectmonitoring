import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { getProject, listDefects } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { DefectFilters } from "@/components/defects/defect-filters";
import { DefectTable } from "@/components/defects/defect-table";

export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function DefectListPage({ params, searchParams }: PageProps<"/projects/[id]/defects">) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  const filters = {
    phase: one(sp.phase),
    severity: one(sp.severity),
    status: one(sp.status),
    moduleId: one(sp.module),
    q: one(sp.q),
    scope: one(sp.scope) === "all" ? ("all" as const) : ("open" as const),
  };
  const defects = await listDefects(id, filters);

  // Ekspor memakai filter yang sama persis dengan yang sedang aktif
  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries({ phase: filters.phase, severity: filters.severity, status: filters.status, module: filters.moduleId, q: filters.q })) {
    if (v) exportQs.set(k, v);
  }
  if (filters.scope === "all") exportQs.set("scope", "all");
  const exportHref = `/projects/${id}/defects/export${exportQs.size ? `?${exportQs}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Defect</h1>
          <p className="text-sm text-muted-foreground">
            Klik status untuk memindahkannya langsung. Tekan <kbd className="rounded border bg-muted px-1 font-mono text-xs">N</kbd> untuk mencatat yang baru.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/projects/${id}/import`} />}>
            <Upload data-icon="inline-start" />
            Impor Excel
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={exportHref} />} title="Mengikuti filter yang sedang aktif">
            <Download data-icon="inline-start" />
            Ekspor Excel ({defects.length})
          </Button>
        </div>
      </div>

      <DefectFilters
        phases={project.phaseList}
        modules={project.modules.map((m) => ({ id: m.id, name: m.name }))}
        resultCount={defects.length}
      />

      <DefectTable projectId={id} defects={defects} />
    </div>
  );
}
