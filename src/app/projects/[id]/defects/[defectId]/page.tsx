import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { getDefect, getProject } from "@/lib/queries";
import { isOpenStatus, type Severity } from "@/lib/constants";
import { agingDays, formatAging, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DefectCode, SeverityPill } from "@/components/defects/badges";
import { StatusMenu } from "@/components/defects/status-menu";
import { DefectForm } from "@/components/defects/defect-form";
import { AttachmentGallery } from "@/components/defects/attachment-gallery";
import { StatusTimeline } from "@/components/defects/status-timeline";
import { DeleteDefectButton } from "@/components/defects/delete-defect-button";

export const dynamic = "force-dynamic";

export default async function DefectDetailPage({ params }: PageProps<"/projects/[id]/defects/[defectId]">) {
  const { id, defectId } = await params;
  const [project, defect] = await Promise.all([getProject(id), getDefect(defectId)]);
  if (!project || !defect || defect.projectId !== id) notFound();

  const open = isOpenStatus(defect.status);
  const age = agingDays(defect.createdAt);

  const facts: Array<[string, React.ReactNode]> = [
    ["Dilaporkan", formatDateTime(defect.createdAt)],
    ["Umur", open ? formatAging(age) : `${formatAging(age)} (selesai)`],
    ["Diperbaiki", formatDateTime(defect.fixedAt)],
    ["Ditutup", formatDateTime(defect.closedAt)],
    [
      "Dibuka ulang",
      defect.reopenCount > 0 ? (
        <span className="inline-flex items-center gap-1 text-st-reopened">
          <RotateCcw className="size-3.5" />
          {defect.reopenCount}×
        </span>
      ) : (
        "tidak pernah"
      ),
    ],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/projects/${id}/defects`} />}>
          <ArrowLeft data-icon="inline-start" />
          Daftar defect
        </Button>
        <DeleteDefectButton defectId={defect.id} code={defect.code} />
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DefectCode code={defect.code} className="text-sm" />
          <SeverityPill severity={defect.severity} />
          <span className="font-display text-xs font-semibold text-muted-foreground">{defect.phaseFound}</span>
          {defect.module && <span className="text-xs text-muted-foreground">· {defect.module.name}</span>}
        </div>
        <h1 className={cn("font-display text-2xl font-bold leading-snug", !open && "text-muted-foreground")}>
          {defect.title}
        </h1>
        <div>
          <StatusMenu defectId={defect.id} status={defect.status} size="md" />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display mb-4 text-base font-semibold">Detail</h2>
            <DefectForm
              mode="edit"
              defectId={defect.id}
              projectId={id}
              modules={project.modules.map((m) => ({ id: m.id, name: m.name }))}
              phases={project.phaseList}
              defaults={{
                title: defect.title,
                description: defect.description,
                moduleId: defect.moduleId ?? "",
                severity: defect.severity as Severity,
                phaseFound: defect.phaseFound,
                assignee: defect.assignee ?? "",
                reporter: defect.reporter ?? "",
              }}
            />
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display mb-3 text-base font-semibold">
              Lampiran <span className="text-muted-foreground tnum">({defect.attachments.length})</span>
            </h2>
            <AttachmentGallery defectId={defect.id} items={defect.attachments} />
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display mb-3 text-base font-semibold">Fakta</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right tnum">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display mb-3 text-base font-semibold">Riwayat status</h2>
            <StatusTimeline items={defect.statusHistory} />
          </section>
        </aside>
      </div>
    </div>
  );
}
