"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspaceId } from "@/lib/queries";
import { DEFAULT_PHASES, parsePhases } from "@/lib/constants";
import {
  firstError,
  moduleNameSchema,
  phasesSchema,
  projectNameSchema,
  str,
} from "@/lib/validation";
import { deleteDefectUploadDir } from "@/lib/uploads";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function projectPath(projectId: string) {
  return `/projects/${projectId}`;
}

export async function createProject(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const name = projectNameSchema.safeParse(str(formData, "name"));
  if (!name.success) return { ok: false, error: firstError(name.error) };

  const moduleNames = str(formData, "modules")
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  const uniqueModules = [...new Set(moduleNames)];
  for (const m of uniqueModules) {
    const r = moduleNameSchema.safeParse(m);
    if (!r.success) return { ok: false, error: `Modul "${m}": ${firstError(r.error)}` };
  }

  const workspaceId = await getDefaultWorkspaceId();
  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: name.data,
      phases: JSON.stringify([...DEFAULT_PHASES]),
      activePhase: DEFAULT_PHASES[0],
      modules: { create: uniqueModules.map((n) => ({ name: n })) },
    },
  });
  revalidatePath("/");
  redirect(projectPath(project.id));
}

export async function renameProject(projectId: string, name: string): Promise<ActionResult> {
  const parsed = projectNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  await prisma.project.update({ where: { id: projectId }, data: { name: parsed.data } });
  revalidatePath("/");
  revalidatePath(projectPath(projectId), "layout");
  return { ok: true, message: "Nama project disimpan" };
}

export async function setActivePhase(projectId: string, phase: string): Promise<ActionResult> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, error: "Project tidak ditemukan" };
  if (!parsePhases(project.phases).includes(phase)) {
    return { ok: false, error: "Fase tidak ada di project ini" };
  }
  await prisma.project.update({ where: { id: projectId }, data: { activePhase: phase } });
  revalidatePath(projectPath(projectId), "layout");
  return { ok: true, message: `Fase aktif sekarang ${phase}` };
}

export async function updatePhases(projectId: string, phases: string[]): Promise<ActionResult> {
  const parsed = phasesSchema.safeParse(phases);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, error: "Project tidak ditemukan" };

  // Fase yang sudah punya defect tidak boleh dihapus
  const used = await prisma.defect.groupBy({
    by: ["phaseFound"],
    where: { projectId },
    _count: { _all: true },
  });
  const removed = used.filter((u) => !parsed.data.includes(u.phaseFound));
  if (removed.length) {
    return {
      ok: false,
      error: `Fase ${removed.map((r) => r.phaseFound).join(", ")} masih punya defect, tidak bisa dihapus`,
    };
  }

  const activePhase = parsed.data.includes(project.activePhase) ? project.activePhase : parsed.data[0];
  await prisma.project.update({
    where: { id: projectId },
    data: { phases: JSON.stringify(parsed.data), activePhase },
  });
  revalidatePath(projectPath(projectId), "layout");
  return { ok: true, message: "Urutan fase disimpan" };
}

export async function deleteProject(projectId: string): Promise<void> {
  const defects = await prisma.defect.findMany({ where: { projectId }, select: { id: true } });
  await prisma.project.delete({ where: { id: projectId } });
  await Promise.all(defects.map((d) => deleteDefectUploadDir(d.id)));
  revalidatePath("/");
  redirect("/");
}

export async function addModule(projectId: string, name: string): Promise<ActionResult> {
  const parsed = moduleNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const exists = await prisma.module.findUnique({
    where: { projectId_name: { projectId, name: parsed.data } },
  });
  if (exists) return { ok: false, error: `Modul "${parsed.data}" sudah ada` };
  await prisma.module.create({ data: { projectId, name: parsed.data } });
  revalidatePath(projectPath(projectId), "layout");
  return { ok: true, message: `Modul ${parsed.data} ditambahkan` };
}

export async function renameModule(moduleId: string, name: string): Promise<ActionResult> {
  const parsed = moduleNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) return { ok: false, error: "Modul tidak ditemukan" };
  const clash = await prisma.module.findUnique({
    where: { projectId_name: { projectId: mod.projectId, name: parsed.data } },
  });
  if (clash && clash.id !== moduleId) return { ok: false, error: `Modul "${parsed.data}" sudah ada` };
  await prisma.module.update({ where: { id: moduleId }, data: { name: parsed.data } });
  revalidatePath(projectPath(mod.projectId), "layout");
  return { ok: true, message: "Nama modul disimpan" };
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { _count: { select: { defects: true } } },
  });
  if (!mod) return { ok: false, error: "Modul tidak ditemukan" };
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(projectPath(mod.projectId), "layout");
  const note = mod._count.defects
    ? ` ${mod._count.defects} defect kini tanpa modul.`
    : "";
  return { ok: true, message: `Modul ${mod.name} dihapus.${note}` };
}
