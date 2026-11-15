import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDashed,
  Clock,
  FileSpreadsheet,
  Flame,
  XCircle,
} from "lucide-react";
import { cn } from "cn";
import { getProject } from "@/lib/queries";
import { getDashboardData } from "@/lib/dashboard-data";
import { percent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { LeakageFlow } from "@/components/dashboard/leakage-flow";
import { PhaseStackChart } from "@/components/dashboard/phase-stack-chart";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { ModuleLeakageTable } from "@/components/dashboard/module-leakage-table";
import { AgingTable } from "@/components/dashboard/aging-table";

export const dynamic = "force-dynamic";

function Section({
  title,
  hint,
  icon: Icon,
  iconClass = "bg-primary/12 text-primary",
  children,
  className,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-surface rounded-3xl border p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconClass)}>
            <Icon className="size-4.5" />
          </span>
        )}
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function ProjectDashboardPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  const baseParam = Array.isArray(sp.base) ? sp.base[0] : sp.base;
  const data = await getDashboardData(id, project.phaseList, project.activePhase, baseParam ?? project.phaseList[0]);
  const s = data.summary;
  const exit = data.exitCheck;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Ringkasan Kualitas Aplikasi
          </span>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{project.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pantau kondisi tahap <strong className="font-semibold text-foreground">{project.activePhase}</strong>,
            progres penyelesaian temuan, dan kesiapan lanjut ke tahap berikutnya.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href={`/projects/${id}/report`} />}>
            <FileSpreadsheet data-icon="inline-start" />
            Laporan Harian
          </Button>
          <Button variant="default" nativeButton={false} render={<Link href={`/projects/${id}/defects`} />}>
            Lihat Semua Temuan
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      {/* Exit Readiness Banner */}
      <Link
        href={`/projects/${id}/exit-criteria`}
        className={cn(
          "card-surface group relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl border p-5 transition-all outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50",
          exit.ready === null && "hover:border-primary/40",
          exit.ready === true && "border-st-closed/40 bg-gradient-to-r from-st-closed/12 via-st-closed/5 to-card",
          exit.ready === false && "border-sev-critical/40 bg-gradient-to-r from-sev-critical/12 via-sev-critical/5 to-card",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              exit.ready === null && "bg-muted text-muted-foreground",
              exit.ready === true && "bg-st-closed/15 text-st-closed",
              exit.ready === false && "bg-sev-critical/15 text-sev-critical",
            )}
          >
            {exit.ready === null ? (
              <CircleDashed className="size-6" />
            ) : exit.ready ? (
              <CheckCircle2 className="size-6" />
            ) : (
              <XCircle className="size-6" />
            )}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-bold">
                Status Tahap {project.activePhase}:{" "}
                {exit.ready === null
                  ? "Syarat Lulus Belum Diatur"
                  : exit.ready
                    ? "Siap Naik ke Tahap Berikutnya! 🎉"
                    : "Belum Siap Naik Tahap"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {exit.ready === null
                ? "Klik di sini untuk mengatur batas maksimal temuan per tingkat keparahan."
                : exit.ready
                  ? "Semua syarat batas maksimal temuan aktif pada tahap ini sudah terpenuhi."
                  : `Masih melebihi batas: ${exit.failing.map((f) => `${f.severity} (${f.open} aktif dari batas maks ${f.maxOpen})`).join(" · ")}`}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3.5 py-1.5 text-xs font-semibold transition-colors group-hover:border-primary group-hover:text-primary">
          Atur Syarat Lulus
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <StatTiles
        tiles={[
          {
            label: "Total Temuan",
            value: String(s.total),
            hint: `${s.rejected} dibatalkan/rejected`,
            kind: "total",
          },
          {
            label: "Masih Dikerjakan",
            value: String(s.open),
            hint: s.open === 0 ? "Semua beres!" : "Perlu dituntaskan",
            tone: s.open > 0 ? "default" : "good",
            kind: "open",
          },
          {
            label: "Sudah Selesai",
            value: String(s.closed),
            hint: s.total > 0 ? `${Math.round((s.closed / s.total) * 100)}% dari total` : "Belum ada data",
            tone: "good",
            kind: "closed",
          },
          {
            label: "Dibuka Ulang (Reopen)",
            value: s.reopenRate === null ? "–" : percent(s.reopenRate, 1),
            hint: `${s.reopened} dari ${s.valid} temuan valid`,
            tone: s.reopenRate !== null && s.reopenRate > 0.2 ? "bad" : "default",
            kind: "reopen",
          },
          {
            label: "Rata-rata Umur Temuan",
            value: data.averageAge === null ? "–" : `${Math.round(data.averageAge)} hr`,
            hint: "Sejak dilaporkan",
            kind: "age",
          },
        ]}
      />

      <Section
        title="Alur Temuan Antar Tahap (Leakage)"
        hint="Menunjukkan berapa banyak temuan yang berhasil dijaring di tiap tahap, dan berapa persen yang baru ketahuan di tahap setelahnya."
        icon={Activity}
        iconClass="bg-primary/12 text-primary"
      >
        <LeakageFlow rows={data.leakage} activePhase={project.activePhase} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Perbandingan Temuan per Tahap"
          hint="Jumlah temuan yang masih dikerjakan, sudah selesai, dan dibatalkan di setiap tahap."
          icon={BarChart3}
          iconClass="bg-sky-500/12 text-sky-600 dark:text-sky-400"
        >
          <PhaseStackChart rows={data.byPhase} />
        </Section>
        <Section
          title="Sebaran Tingkat Keparahan (Severity)"
          hint="Warna menyala menandakan temuan yang masih dikerjakan, warna abu menandakan sudah selesai."
          icon={Flame}
          iconClass="bg-rose-500/12 text-rose-600 dark:text-rose-400"
        >
          <SeverityChart rows={data.bySeverity} />
        </Section>
      </div>

      <Section
        title="Bagian / Modul yang Paling Sering Lolos"
        hint="Membantu melihat area aplikasi mana yang paling butuh pengujian lebih mendalam."
        icon={Boxes}
        iconClass="bg-violet-500/12 text-violet-600 dark:text-violet-400"
      >
        <ModuleLeakageTable
          projectId={id}
          rows={data.moduleLeakage}
          phases={project.phaseList}
          basePhase={data.basePhase}
        />
      </Section>

      <Section
        title="Temuan yang Paling Lama Menggantung"
        hint="10 temuan aktif teratas yang sudah paling lama belum terselesaikan sejak pertama kali dicatat."
        icon={Clock}
        iconClass="bg-amber-500/12 text-amber-600 dark:text-amber-400"
      >
        <AgingTable projectId={id} rows={data.oldest} />
      </Section>
    </div>
  );
}
