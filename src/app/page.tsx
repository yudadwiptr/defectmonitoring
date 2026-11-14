import Link from "next/link";
import { ArrowRight, Bug } from "lucide-react";
import { listProjects } from "@/lib/queries";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { cn } from "cn";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listProjects();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-lg">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bug className="size-4" />
          </span>
          <span className="font-display text-base font-semibold">Defect Monitor</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <section className="grid gap-8 py-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                Project yang sedang diuji
              </h1>
              <p className="mt-2 max-w-md text-muted-foreground">
                Pilih project untuk mencatat defect, melihat kebocoran antar fase, dan mengecek apakah
                fase aktif sudah siap naik.
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="paper-grid rounded-2xl border border-dashed px-6 py-12 text-center">
                <p className="font-display text-lg font-semibold">Belum ada project</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Buat project pertama di panel sebelah, atau jalankan <code className="font-mono">npm run db:setup</code> untuk data contoh.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {projects.map((p) => {
                  const activeIdx = p.phases.indexOf(p.activePhase);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-display text-xl font-semibold group-hover:text-primary">{p.name}</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {p.moduleCount} modul · fase aktif {p.activePhase}
                            </p>
                          </div>
                          <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>

                        <div className="flex items-center gap-1.5" aria-label="Urutan fase">
                          {p.phases.map((ph, i) => (
                            <span
                              key={ph}
                              className={cn(
                                "font-display h-1.5 flex-1 rounded-full",
                                i < activeIdx && "bg-primary/60",
                                i === activeIdx && "bg-primary",
                                i > activeIdx && "bg-border",
                              )}
                              title={ph}
                            />
                          ))}
                        </div>

                        <dl className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">Total defect</dt>
                            <dd className="font-display text-2xl font-semibold tnum">{p.total}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Masih open</dt>
                            <dd className="font-display text-2xl font-semibold tnum">{p.open}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Critical/High open</dt>
                            <dd
                              className={cn(
                                "font-display text-2xl font-semibold tnum",
                                p.openCritical > 0 ? "text-sev-critical" : "text-st-closed",
                              )}
                            >
                              {p.openCritical}
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

          <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-6">
            <h2 className="font-display text-lg font-semibold">Project baru</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Satu project per aplikasi yang diuji.</p>
            <CreateProjectForm />
          </aside>
        </section>
      </main>
    </div>
  );
}
