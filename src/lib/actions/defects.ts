"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDefectCode, isStatus, parsePhases } from "@/lib/constants";
import { applyStatusTransition } from "@/lib/defect-status";
import { defectInputSchema, firstError, str } from "@/lib/validation";
import {
  deleteAttachmentFile,
  deleteDefectUploadDir,
  saveAttachmentFile,
} from "@/lib/uploads";
import type { ActionResult } from "./projects";

export type DefectActionResult =
  | { ok: true; id: string; code: string; message?: string }
  | { ok: false; error: string };

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

function filesFrom(formData: FormData, key = "files"): File[] {
  return formData
    .getAll(key)
    .filter((f): f is File => f instanceof File && f.size > 0);
}

function parseDefectForm(formData: FormData) {
  return defectInputSchema.safeParse({
    title: str(formData, "title"),
    description: str(formData, "description"),
    moduleId: str(formData, "moduleId"),
    severity: str(formData, "severity"),
    phaseFound: str(formData, "phaseFound"),
    assignee: str(formData, "assignee"),
    reporter: str(formData, "reporter"),
  });
}

async function persistAttachments(defectId: string, files: File[]): Promise<string[]> {
  const warnings: string[] = [];
  for (const file of files) {
    try {
      const saved = await saveAttachmentFile(file, defectId);
      await prisma.attachment.create({ data: { defectId, ...saved } });
    } catch (e) {
      warnings.push(e instanceof Error ? e.message : "Lampiran gagal disimpan");
    }
  }
  return warnings;
}

export async function createDefect(projectId: string, formData: FormData): Promise<DefectActionResult> {
  const parsed = parseDefectForm(formData);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const input = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, error: "Project tidak ditemukan" };
  if (!parsePhases(project.phases).includes(input.phaseFound)) {
    return { ok: false, error: "Fase tidak dikenal di project ini" };
  }
  if (input.moduleId) {
    const mod = await prisma.module.findFirst({ where: { id: input.moduleId, projectId } });
    if (!mod) return { ok: false, error: "Modul tidak ditemukan" };
  }

  const now = new Date();
  const defect = await prisma.$transaction(async (tx) => {
    const last = await tx.defect.findFirst({
      where: { projectId },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    const seq = (last?.seq ?? 0) + 1;
    return tx.defect.create({
      data: {
        projectId,
        seq,
        code: formatDefectCode(seq),
        title: input.title,
        description: input.description,
        moduleId: input.moduleId,
        severity: input.severity,
        phaseFound: input.phaseFound,
        status: "Open",
        assignee: input.assignee || null,
        reporter: input.reporter || null,
        createdAt: now,
        statusHistory: { create: { fromStatus: null, toStatus: "Open", changedAt: now } },
      },
    });
  });

  const warnings = await persistAttachments(defect.id, filesFrom(formData));
  revalidateProject(projectId);
  return {
    ok: true,
    id: defect.id,
    code: defect.code,
    message: warnings.length ? `${defect.code} dibuat, tapi: ${warnings.join("; ")}` : undefined,
  };
}

export async function updateDefect(defectId: string, formData: FormData): Promise<DefectActionResult> {
  const parsed = parseDefectForm(formData);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const input = parsed.data;

  const defect = await prisma.defect.findUnique({
    where: { id: defectId },
    include: { project: true },
  });
  if (!defect) return { ok: false, error: "Defect tidak ditemukan" };
  if (!parsePhases(defect.project.phases).includes(input.phaseFound)) {
    return { ok: false, error: "Fase tidak dikenal di project ini" };
  }
  if (input.moduleId) {
    const mod = await prisma.module.findFirst({
      where: { id: input.moduleId, projectId: defect.projectId },
    });
    if (!mod) return { ok: false, error: "Modul tidak ditemukan" };
  }

  await prisma.defect.update({
    where: { id: defectId },
    data: {
      title: input.title,
      description: input.description,
      moduleId: input.moduleId,
      severity: input.severity,
      phaseFound: input.phaseFound,
      assignee: input.assignee || null,
      reporter: input.reporter || null,
    },
  });
  const warnings = await persistAttachments(defectId, filesFrom(formData));
  revalidateProject(defect.projectId);
  return {
    ok: true,
    id: defectId,
    code: defect.code,
    message: warnings.length ? `Tersimpan, tapi: ${warnings.join("; ")}` : "Perubahan disimpan",
  };
}

export async function changeDefectStatus(defectId: string, to: string): Promise<ActionResult> {
  if (!isStatus(to)) return { ok: false, error: "Status tidak dikenal" };
  const defect = await prisma.defect.findUnique({ where: { id: defectId } });
  if (!defect) return { ok: false, error: "Defect tidak ditemukan" };

  const transition = applyStatusTransition(defect, to);
  if (!transition) return { ok: true };

  await prisma.$transaction([
    prisma.defect.update({ where: { id: defectId }, data: transition.data }),
    prisma.statusHistory.create({ data: { defectId, ...transition.history } }),
  ]);
  revalidateProject(defect.projectId);
  return { ok: true, message: `${defect.code} → ${to}` };
}

export async function deleteDefect(defectId: string): Promise<void> {
  const defect = await prisma.defect.findUnique({ where: { id: defectId } });
  if (!defect) return;
  await prisma.defect.delete({ where: { id: defectId } });
  await deleteDefectUploadDir(defectId);
  revalidateProject(defect.projectId);
  redirect(`/projects/${defect.projectId}/defects`);
}

export async function addAttachments(defectId: string, formData: FormData): Promise<ActionResult> {
  const defect = await prisma.defect.findUnique({ where: { id: defectId } });
  if (!defect) return { ok: false, error: "Defect tidak ditemukan" };
  const files = filesFrom(formData);
  if (!files.length) return { ok: false, error: "Tidak ada file yang dipilih" };
  const warnings = await persistAttachments(defectId, files);
  revalidateProject(defect.projectId);
  if (warnings.length === files.length) return { ok: false, error: warnings.join("; ") };
  return {
    ok: true,
    message: warnings.length ? `Sebagian tersimpan. ${warnings.join("; ")}` : "Lampiran ditambahkan",
  };
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  const att = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { defect: { select: { projectId: true } } },
  });
  if (!att) return { ok: false, error: "Lampiran tidak ditemukan" };
  await prisma.attachment.delete({ where: { id: attachmentId } });
  await deleteAttachmentFile(att.filePath);
  revalidateProject(att.defect.projectId);
  return { ok: true, message: "Lampiran dihapus" };
}
