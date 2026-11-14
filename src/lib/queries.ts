import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { isOpenStatus, parsePhases, TERMINAL_STATUSES } from "./constants";

export async function getDefaultWorkspaceId(): Promise<string> {
  const ws = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (ws) return ws.id;
  const created = await prisma.workspace.create({ data: { name: "Workspace Default" } });
  return created.id;
}

export async function listProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { modules: true, defects: true } },
      defects: { select: { status: true, severity: true } },
    },
  });
  return projects.map((p) => {
    const open = p.defects.filter((d) => isOpenStatus(d.status));
    return {
      id: p.id,
      name: p.name,
      phases: parsePhases(p.phases),
      activePhase: p.activePhase,
      moduleCount: p._count.modules,
      total: p._count.defects,
      open: open.length,
      openCritical: open.filter((d) => d.severity === "Critical" || d.severity === "High").length,
    };
  });
}

export async function getProject(id: string) {
  const p = await prisma.project.findUnique({
    where: { id },
    include: { modules: { orderBy: { name: "asc" } } },
  });
  if (!p) return null;
  return { ...p, phaseList: parsePhases(p.phases) };
}

export type ProjectWithModules = NonNullable<Awaited<ReturnType<typeof getProject>>>;

/** Jumlah defect total dan open per fase, mengikuti urutan fase project. */
export async function getPhaseCounts(projectId: string, phases: string[]) {
  const rows = await prisma.defect.groupBy({
    by: ["phaseFound", "status"],
    where: { projectId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(phases.map((ph) => [ph, { total: 0, open: 0 }])) as Record<
    string,
    { total: number; open: number }
  >;
  for (const r of rows) {
    const bucket = counts[r.phaseFound] ?? (counts[r.phaseFound] = { total: 0, open: 0 });
    bucket.total += r._count._all;
    if (isOpenStatus(r.status)) bucket.open += r._count._all;
  }
  return counts;
}

export interface DefectFilters {
  phase?: string;
  severity?: string;
  status?: string;
  moduleId?: string;
  q?: string;
  /** "open" = hanya yang belum selesai, "all" = semua */
  scope?: "open" | "all";
}

export async function listDefects(projectId: string, f: DefectFilters) {
  const where: Prisma.DefectWhereInput = { projectId };
  if (f.phase) where.phaseFound = f.phase;
  if (f.severity) where.severity = f.severity;
  if (f.status) where.status = f.status;
  else if (f.scope === "open") where.status = { notIn: [...TERMINAL_STATUSES] };
  if (f.moduleId) where.moduleId = f.moduleId === "none" ? null : f.moduleId;
  if (f.q) {
    where.OR = [{ title: { contains: f.q } }, { code: { contains: f.q.toUpperCase() } }];
  }
  return prisma.defect.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: {
      module: { select: { id: true, name: true } },
      _count: { select: { attachments: true } },
    },
  });
}

export type DefectRow = Awaited<ReturnType<typeof listDefects>>[number];

export async function getDefect(id: string) {
  return prisma.defect.findUnique({
    where: { id },
    include: {
      module: true,
      attachments: { orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });
}

export type DefectDetail = NonNullable<Awaited<ReturnType<typeof getDefect>>>;
