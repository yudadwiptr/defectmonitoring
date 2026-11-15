import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Info, MessageSquareText, Sparkles } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Siap Bagikan ke Grup Tim
          </span>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Laporan Ringkas Harian</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Disusun otomatis pada {formatDateTime(now)} berdasarkan kondisi project terkini.
          </p>
        </div>
        <CopyButton text={text} label="Salin Laporan ke Clipboard" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Chat-style Message Preview Card */}
        <div className="card-surface overflow-hidden rounded-3xl border">
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-emerald-500/12 via-primary/8 to-transparent px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <MessageSquareText className="size-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-bold">Pratinjau Pesan (Format WhatsApp / Chat)</h2>
                <p className="text-[11px] text-muted-foreground">Tinggal salin dan tempel ke grup koordinasi</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Otomatis Rapi
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <pre className="overflow-x-auto rounded-2xl border bg-muted/35 p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {text}
            </pre>
          </div>
        </div>

        <aside className="card-surface flex h-fit flex-col gap-4 rounded-3xl border p-6 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Sparkles className="size-4" />
            </span>
            <h2 className="font-display text-base font-bold">Apa Saja yang Tercantum?</h2>
          </div>
          <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
            {[
              "Tanggal laporan & tahap pengujian aktif saat ini",
              "Total temuan, rincian yang masih dikerjakan per tingkat keparahan, serta yang sudah selesai",
              "Temuan baru & yang berhasil diperbaiki hari ini",
              "Daftar temuan Critical / High yang masih menggantung beserta penanggung jawabnya",
              "Status kesiapan lulus (Exit Criteria) pada tahap aktif",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-st-closed" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <Info className="size-3.5 text-primary" />
              Tips Format Chat
            </p>
            <p className="mt-1 leading-relaxed">
              Tanda <code className="font-mono font-bold text-foreground">*bintang*</code> akan otomatis berubah menjadi{" "}
              <strong>teks tebal</strong> saat ditempel di WhatsApp. Atur syarat lulus di{" "}
              <Link href={`/projects/${id}/exit-criteria`} className="font-semibold text-primary underline">
                halaman Syarat Lulus
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
