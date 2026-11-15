import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  Layers,
  PlusCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { listProjects } from "@/lib/queries";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { cn } from "cn";

export const dynamic = "force-dynamic";

const CARD_PALETTES = [
  {
    iconBg: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
    bar: "from-indigo-500 via-violet-500 to-sky-500",
  },
  {
    iconBg: "bg-sky-500/12 text-sky-600 dark:text-sky-400 ring-sky-500/20",
    bar: "from-sky-500 via-cyan-500 to-emerald-500",
  },
  {
    iconBg: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    bar: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    iconBg: "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/20",
    bar: "from-amber-500 via-orange-500 to-rose-500",
  },
];

export default async function HomePage() {
  const projects = await listProjects();

  const totalProjects = projects.length;
  const totalDefects = projects.reduce((acc, p) => acc + p.total, 0);
  const totalOpen = projects.reduce((acc, p) => acc + p.open, 0);
  const totalCritical = projects.reduce((acc, p) => acc + p.openCritical, 0);
  const totalResolved = Math.max(0, totalDefects - totalOpen);
  const resolvedPercent = totalDefects > 0 ? Math.round((totalResolved / totalDefects) * 100) : 100;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground shadow-md shadow-primary/25">
              <Bug className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none tracking-tight">Defect Monitor</span>
              <span className="mt-0.5 text-xs text-muted-foreground">Ruang Pantau Kualitas & Rilis</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              <span className="size-2 rounded-full bg-st-closed animate-pulse" />
              Siap digunakan
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Hero Section */}
        <section className="hero-mesh card-surface relative overflow-hidden rounded-3xl border p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                Pengganti Catatan Excel yang Lebih Nyaman
              </span>
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Pantau Perbaikan Aplikasi &amp; Kesiapan Rilis dalam Satu Layar
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Tidak perlu lagi pusing melacak ratusan baris tabel. Catat kendala yang ditemukan, pantau
                progres perbaikannya di setiap tahap uji coba, dan lihat langsung kapan aplikasi siap diluncurkan.
              </p>
            </div>

            {/* Global Portfolio Overview Tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-3.5 rounded-2xl border bg-card/90 p-4 backdrop-blur-xs">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <FolderKanban className="size-5" />
                </span>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Aplikasi Diuji</div>
                  <div className="font-display text-2xl font-bold tnum">{totalProjects}</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border bg-card/90 p-4 backdrop-blur-xs">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
                  <ClipboardCheck className="size-5" />
                </span>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Total Temuan</div>
                  <div className="font-display text-2xl font-bold tnum">{totalDefects}</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border bg-card/90 p-4 backdrop-blur-xs">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Tingkat Selesai</div>
                  <div className="font-display text-2xl font-bold tnum">
                    {totalDefects === 0 ? "–" : `${resolvedPercent}%`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border bg-card/90 p-4 backdrop-blur-xs">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    totalCritical > 0
                      ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {totalCritical > 0 ? <AlertTriangle className="size-5" /> : <ShieldCheck className="size-5" />}
                </span>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Prioritas Tinggi</div>
                  <div
                    className={cn(
                      "font-display text-2xl font-bold tnum",
                      totalCritical > 0 ? "text-sev-critical" : "text-st-closed",
                    )}
                  >
                    {totalCritical}
                  </div>
                </div>
              </div>
            </div>

            {/* 3-step visual workflow */}
            <div className="grid gap-2.5 border-t border-border/60 pt-4 text-xs sm:grid-cols-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  1
                </span>
                <span>
                  <strong className="font-semibold text-foreground">Catat Cepat:</strong> Tekan tombol{" "}
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">N</kbd> dan tempel screenshot langsung.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  2
                </span>
                <span>
                  <strong className="font-semibold text-foreground">Lacak Tahapan:</strong> Lihat temuan yang lolos dari SIT ke UAT hingga Produksi.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  3
                </span>
                <span>
                  <strong className="font-semibold text-foreground">Laporan Instan:</strong> Salin ringkasan harian rapi untuk grup WhatsApp tim.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Daftar Aplikasi &amp; Project</h2>
                <p className="text-sm text-muted-foreground">
                  Klik salah satu project untuk membuka dashboard dan daftar temuan.
                </p>
              </div>
              <span className="rounded-full border bg-card px-3 py-1 font-display text-xs font-semibold text-muted-foreground tnum">
                {projects.length} project
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="paper-grid card-surface flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Rocket className="size-7" />
                </div>
                <p className="mt-4 font-display text-xl font-bold">Belum Ada Project yang Diuji</p>
                <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                  Mulai dengan membuat project pertama Anda melalui formulir di sebelah kanan, atau muat data contoh
                  dengan menjalankan perintah <code className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">npm run db:setup</code>.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {projects.map((p, idx) => {
                  const activeIdx = p.phases.indexOf(p.activePhase);
                  const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
                  const closedCount = Math.max(0, p.total - p.open);
                  const completionPct = p.total > 0 ? Math.round((closedCount / p.total) * 100) : 100;

                  return (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="card-surface group relative flex flex-col gap-5 overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {/* Top Accent Gradient Bar */}
                        <span
                          aria-hidden
                          className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", palette.bar)}
                        />

                        <div className="flex items-start justify-between gap-4 pt-1">
                          <div className="flex items-start gap-3.5">
                            <span
                              className={cn(
                                "flex size-12 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold ring-1",
                                palette.iconBg,
                              )}
                            >
                              {p.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-xl font-bold transition-colors group-hover:text-primary">
                                  {p.name}
                                </h3>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                  Tahap {p.activePhase}
                                </span>
                              </div>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Layers className="size-3.5" />
                                  {p.moduleCount} bagian/modul
                                </span>
                                <span>·</span>
                                <span>
                                  {p.total === 0
                                    ? "Belum ada temuan tercatat"
                                    : `${completionPct}% temuan sudah selesai (${closedCount}/${p.total})`}
                                </span>
                              </p>
                            </div>
                          </div>

                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted/50 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                            <ArrowRight className="size-4" />
                          </span>
                        </div>

                        {/* Visual Phase Stepper with Labels */}
                        <div className="rounded-2xl border bg-muted/35 p-3">
                          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-medium">Alur Tahap Pengujian</span>
                            <span className="font-semibold text-foreground">
                              Tahap {Math.max(1, activeIdx + 1)} dari {p.phases.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5" aria-label="Urutan fase">
                            {p.phases.map((ph, i) => {
                              const isDone = i < activeIdx;
                              const isCurrent = i === activeIdx;
                              return (
                                <div key={ph} className="flex flex-col gap-1">
                                  <span
                                    className={cn(
                                      "h-2 w-full rounded-full transition-colors",
                                      isDone && "bg-primary/60",
                                      isCurrent && "bg-primary",
                                      !isDone && !isCurrent && "bg-border",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "truncate text-center font-display text-[11px]",
                                      isCurrent
                                        ? "font-bold text-primary"
                                        : isDone
                                          ? "font-medium text-foreground/80"
                                          : "text-muted-foreground",
                                    )}
                                  >
                                    {ph}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Metric Pills */}
                        <dl className="grid grid-cols-3 gap-2.5 text-sm">
                          <div className="rounded-2xl border bg-background/60 px-3.5 py-2.5">
                            <dt className="text-xs text-muted-foreground">Total Temuan</dt>
                            <dd className="mt-0.5 font-display text-2xl font-bold tnum">{p.total}</dd>
                          </div>
                          <div className="rounded-2xl border bg-background/60 px-3.5 py-2.5">
                            <dt className="text-xs text-muted-foreground">Masih Dikerjakan</dt>
                            <dd className="mt-0.5 font-display text-2xl font-bold tnum">{p.open}</dd>
                          </div>
                          <div
                            className={cn(
                              "rounded-2xl border px-3.5 py-2.5",
                              p.openCritical > 0
                                ? "border-sev-critical/30 bg-sev-critical/8"
                                : "border-st-closed/30 bg-st-closed/8",
                            )}
                          >
                            <dt className="text-xs text-muted-foreground">Critical / High</dt>
                            <dd
                              className={cn(
                                "mt-0.5 flex items-baseline gap-1.5 font-display text-2xl font-bold tnum",
                                p.openCritical > 0 ? "text-sev-critical" : "text-st-closed",
                              )}
                            >
                              {p.openCritical}
                              <span className="font-sans text-[11px] font-medium">
                                {p.openCritical > 0 ? "perlu dicek" : "aman"}
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Right Column: Create New Project Card */}
          <aside className="card-surface overflow-hidden rounded-3xl border lg:sticky lg:top-20">
            <div className="border-b bg-gradient-to-r from-primary/10 via-violet-500/8 to-transparent px-6 py-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  <PlusCircle className="size-4.5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold">Tambah Project Baru</h2>
                  <p className="text-xs text-muted-foreground">Siapkan ruang pantau untuk aplikasi yang akan diuji.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <CreateProjectForm />
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
