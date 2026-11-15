import Link from "next/link";
import { notFound } from "next/navigation";
import { Bug, ChevronsUpDown, Home } from "lucide-react";
import { getPhaseCounts, getProject, listProjects } from "@/lib/queries";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { ProjectNav } from "@/components/app/project-nav";
import { PhaseRail } from "@/components/app/phase-rail";
import { QuickAddSheet } from "@/components/defects/quick-add-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({ children, params }: LayoutProps<"/projects/[id]">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [counts, projects] = await Promise.all([
    getPhaseCounts(project.id, project.phaseList),
    listProjects(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground shadow-sm shadow-primary/25 outline-none transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Kembali ke beranda semua project"
            title="Semua Project"
          >
            <Bug className="size-4.5" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border bg-card/90 px-3 py-1.5 font-display text-sm font-bold shadow-2xs outline-none transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="flex size-5 items-center justify-center rounded-md bg-primary/12 text-[11px] font-bold text-primary">
                {project.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-44 truncate sm:max-w-60">{project.name}</span>
              <span className="hidden rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary md:inline-block">
                {project.activePhase}
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64 p-1.5">
              {projects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  render={<Link href={`/projects/${p.id}`} />}
                  className="flex items-center justify-between gap-3 rounded-lg py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-display font-semibold">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">Tahap {p.activePhase}</span>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tnum">
                    {p.open} aktif
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/" />} className="gap-2 rounded-lg py-2 font-medium text-primary">
                <Home className="size-4" />
                Lihat Semua Project…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-2 hidden lg:block">
            <ProjectNav projectId={project.id} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <QuickAddSheet
              projectId={project.id}
              modules={project.modules.map((m) => ({ id: m.id, name: m.name }))}
              phases={project.phaseList}
              activePhase={project.activePhase}
            />
          </div>
        </div>

        <div className="border-t lg:hidden">
          <div className="mx-auto flex max-w-7xl px-4 py-2">
            <ProjectNav projectId={project.id} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-3 sm:px-6">
          <PhaseRail
            projectId={project.id}
            phases={project.phaseList}
            activePhase={project.activePhase}
            counts={counts}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
