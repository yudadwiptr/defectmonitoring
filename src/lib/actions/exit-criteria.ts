"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isSeverity, parsePhases } from "@/lib/constants";
import type { ActionResult } from "./projects";

export interface ExitRuleInput {
  phase: string;
  severity: string;
  /** null = hapus aturan (tidak dibatasi) */
  maxOpen: number | null;
}

/** Simpan seluruh matriks aturan sekaligus: isi = upsert, kosong = hapus. */
export async function saveExitCriteria(projectId: string, rules: ExitRuleInput[]): Promise<ActionResult> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, error: "Project tidak ditemukan" };
  const phases = parsePhases(project.phases);

  for (const r of rules) {
    if (!phases.includes(r.phase)) return { ok: false, error: `Fase ${r.phase} tidak dikenal` };
    if (!isSeverity(r.severity)) return { ok: false, error: `Severity ${r.severity} tidak dikenal` };
    if (r.maxOpen !== null && (!Number.isInteger(r.maxOpen) || r.maxOpen < 0 || r.maxOpen > 9999)) {
      return { ok: false, error: `Batas ${r.phase}/${r.severity} harus bilangan bulat 0 sampai 9999` };
    }
  }

  await prisma.$transaction(
    rules.map((r) =>
      r.maxOpen === null
        ? prisma.exitCriteria.deleteMany({ where: { projectId, phase: r.phase, severity: r.severity } })
        : prisma.exitCriteria.upsert({
            where: { projectId_phase_severity: { projectId, phase: r.phase, severity: r.severity } },
            create: { projectId, phase: r.phase, severity: r.severity, maxOpen: r.maxOpen },
            update: { maxOpen: r.maxOpen },
          }),
    ),
  );
  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true, message: "Exit criteria disimpan" };
}
