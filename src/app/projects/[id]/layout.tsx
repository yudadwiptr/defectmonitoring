import Link from "next/link";
import { notFound } from "next/navigation";
import { Bug, ChevronsUpDown } from "lucide-react";
import { getPhaseCounts, getProject, listProjects } from "@/lib/queries";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { ProjectNav } from "@/components/app/project-nav";
import { PhaseRail } from "@/components/app/phase-rail";
import { QuickAddSheet } from "@/components/defects/quick-add-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Semua project"
          >
            <Bug className="size-4" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-display text-base font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
              {project.name}
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} render={<Link href={`/projects/${p.id}`} />}>
                  <span className="flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground tnum">{p.open} open</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<Link href="/" />}>Semua project…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-2 hidden sm:block">
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
        <div className="border-t sm:hidden">
          <div className="mx-auto flex max-w-7xl px-4 py-1.5">
            <ProjectNav projectId={project.id} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6">
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
