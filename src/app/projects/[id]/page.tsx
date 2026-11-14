import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
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

function Section({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-card p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Di fase mana defect bocor, dan seberapa sehat fase {project.activePhase} saat ini.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href={`/projects/${id}/defects`} />}>
          Semua defect
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <Link
        href={`/projects/${id}/exit-criteria`}
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-5 py-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          exit.ready === null && "bg-card hover:bg-muted/60",
          exit.ready === true && "border-st-closed/40 bg-st-closed/8 hover:bg-st-closed/12",
          exit.ready === false && "border-sev-critical/40 bg-sev-critical/8 hover:bg-sev-critical/12",
        )}
      >
        <span className="flex items-center gap-2 font-display font-semibold">
          {exit.ready === null ? (
            <CircleDashed className="size-4 text-muted-foreground" />
          ) : exit.ready ? (
            <CheckCircle2 className="size-4 text-st-closed" />
          ) : (
            <XCircle className="size-4 text-sev-critical" />
          )}
          Fase {project.activePhase}:{" "}
          {exit.ready === null ? "belum ada exit criteria" : exit.ready ? "siap naik" : "belum siap naik"}
        </span>
        <span className="text-muted-foreground">
          {exit.ready === null
            ? "Setel batas defect open per severity untuk menilai fase ini."
            : exit.ready
              ? "Semua batas defect open terpenuhi."
              : exit.failing.map((f) => `${f.severity} ${f.open} open (maks ${f.maxOpen})`).join(" · ")}
        </span>
        <ArrowRight className="ml-auto size-4 text-muted-foreground" />
      </Link>

      <Section
        title="Leakage antar fase"
        hint="Leakage fase X = defect valid yang ditemukan setelah X ÷ (ditemukan di X + setelah X). Defect Rejected tidak dihitung."
      >
        <LeakageFlow rows={data.leakage} activePhase={project.activePhase} />
      </Section>

      <StatTiles
        tiles={[
          { label: "Total defect", value: String(s.total), hint: `${s.rejected} rejected` },
          { label: "Masih open", value: String(s.open), tone: s.open > 0 ? "default" : "good" },
          { label: "Closed", value: String(s.closed) },
          {
            label: "Reopen rate",
            value: s.reopenRate === null ? "–" : percent(s.reopenRate, 1),
            hint: `${s.reopened} dari ${s.valid} defect valid`,
            tone: s.reopenRate !== null && s.reopenRate > 0.2 ? "bad" : "default",
          },
          {
            label: "Rata-rata umur open",
            value: data.averageAge === null ? "–" : `${Math.round(data.averageAge)} hari`,
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Open vs closed per fase" hint="Semua defect, dikelompokkan menurut fase ditemukan.">
          <PhaseStackChart rows={data.byPhase} />
        </Section>
        <Section title="Sebaran severity" hint="Bagian berwarna masih open, bagian abu sudah selesai.">
          <SeverityChart rows={data.bySeverity} />
        </Section>
      </div>

      <Section
        title="Leakage per modul"
        hint="Modul mana yang defect-nya paling sering lolos dari fase dasar. Rumus sama dengan leakage fase, dihitung per modul."
      >
        <ModuleLeakageTable projectId={id} rows={data.moduleLeakage} phases={project.phaseList} basePhase={data.basePhase} />
      </Section>

      <Section title="Defect open paling lama" hint="Sepuluh teratas menurut umur sejak dilaporkan.">
        <AgingTable projectId={id} rows={data.oldest} />
      </Section>
    </div>
  );
}
