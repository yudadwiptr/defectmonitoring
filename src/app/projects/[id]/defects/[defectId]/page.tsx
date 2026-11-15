import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileEdit, History, Layers, Paperclip, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { getDefect, getProject } from "@/lib/queries";
import { isOpenStatus, type Severity } from "@/lib/constants";
import { agingDays, formatAging, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DefectCode, SEVERITY_CLASS, SeverityPill } from "@/components/defects/badges";
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
  const sevBar = SEVERITY_CLASS[defect.severity as Severity]?.bar ?? SEVERITY_CLASS.Low.bar;

  const facts: Array<[string, React.ReactNode]> = [
    ["Waktu Dicatat", formatDateTime(defect.createdAt)],
    ["Umur Temuan", open ? formatAging(age) : `${formatAging(age)} (tuntas)`],
    ["Selesai Diperbaiki", formatDateTime(defect.fixedAt)],
    ["Ditutup (Closed)", formatDateTime(defect.closedAt)],
    [
      "Dibuka Ulang",
      defect.reopenCount > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-st-reopened/12 px-2 py-0.5 text-xs font-bold text-st-reopened">
          <RotateCcw className="size-3" />
          {defect.reopenCount}×
        </span>
      ) : (
        <span className="text-muted-foreground">Tidak pernah</span>
      ),
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/projects/${id}/defects`} />}>
          <ArrowLeft data-icon="inline-start" />
          Kembali ke Daftar Temuan
        </Button>
        <DeleteDefectButton defectId={defect.id} code={defect.code} />
      </div>

      {/* Hero Header Card */}
      <header className="card-surface relative overflow-hidden rounded-3xl border p-6">
        <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1.5", sevBar)} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <DefectCode code={defect.code} className="text-xs" />
            <SeverityPill severity={defect.severity} />
            <span className="rounded-full border bg-muted/60 px-2.5 py-0.5 font-display text-xs font-bold">
              Tahap {defect.phaseFound}
            </span>
            {defect.module && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Layers className="size-3" />
                {defect.module.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status saat ini:</span>
            <StatusMenu defectId={defect.id} status={defect.status} size="md" />
          </div>
        </div>

        <h1 className={cn("mt-3 font-display text-2xl font-extrabold leading-snug sm:text-3xl", !open && "text-muted-foreground")}>
          {defect.title}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section className="card-surface rounded-3xl border p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <FileEdit className="size-4" />
              </span>
              <h2 className="font-display text-base font-bold">Rincian &amp; Perbarui Data</h2>
            </div>
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

          <section className="card-surface rounded-3xl border p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
                <Paperclip className="size-4" />
              </span>
              <h2 className="font-display text-base font-bold">
                Bukti &amp; Lampiran{" "}
                <span className="text-muted-foreground tnum">({defect.attachments.length})</span>
              </h2>
            </div>
            <AttachmentGallery defectId={defect.id} items={defect.attachments} />
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="card-surface rounded-3xl border p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <Calendar className="size-4" />
              </span>
              <h2 className="font-display text-base font-bold">Ringkasan Waktu</h2>
            </div>
            <dl className="flex flex-col divide-y text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
                  <dd className="text-right text-xs font-semibold tnum">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card-surface rounded-3xl border p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-400">
                <History className="size-4" />
              </span>
              <h2 className="font-display text-base font-bold">Jejak Perubahan Status</h2>
            </div>
            <StatusTimeline items={defect.statusHistory} />
          </section>
        </aside>
      </div>
    </div>
  );
}
