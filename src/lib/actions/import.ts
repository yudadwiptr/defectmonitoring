"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatDefectCode, parsePhases } from "@/lib/constants";
import { readWorkbook } from "@/lib/excel";
import {
  normalizeRows,
  suggestMapping,
  type CellValue,
  type ColumnMapping,
  type NormalizeContext,
} from "@/lib/excel-import";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 5000;

export type ParseResult =
  | {
      ok: true;
      fileName: string;
      sheetName: string;
      headers: string[];
      rows: CellValue[][];
      mapping: ColumnMapping;
      existingCodes: string[];
    }
  | { ok: false; error: string };

export async function parseImportFile(projectId: string, formData: FormData): Promise<ParseResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pilih file .xlsx dulu" };
  if (!/\.xlsx$/i.test(file.name)) return { ok: false, error: "Hanya file .xlsx yang didukung (simpan ulang dari Excel sebagai .xlsx)" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "Ukuran file melebihi 10 MB" };

  let sheet;
  try {
    sheet = await readWorkbook(await file.arrayBuffer());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `File tidak bisa dibaca: ${e.message}` : "File tidak bisa dibaca" };
  }
  if (sheet.rows.length === 0) return { ok: false, error: "Tidak ada baris data di bawah header" };
  if (sheet.rows.length > MAX_ROWS) return { ok: false, error: `Maksimal ${MAX_ROWS} baris per impor (file punya ${sheet.rows.length})` };

  const existing = await prisma.defect.findMany({ where: { projectId }, select: { code: true } });
  return {
    ok: true,
    fileName: file.name,
    sheetName: sheet.sheetName,
    headers: sheet.headers,
    rows: sheet.rows,
    mapping: suggestMapping(sheet.headers),
    existingCodes: existing.map((d) => d.code),
  };
}

export interface CommitInput {
  rows: CellValue[][];
  mapping: ColumnMapping;
  onDuplicate: "update" | "skip" | "create";
  createModules: boolean;
}

export type CommitResult =
  | { ok: true; created: number; updated: number; skipped: number; invalid: number; modulesCreated: number }
  | { ok: false; error: string };

export async function commitImport(projectId: string, input: CommitInput): Promise<CommitResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { modules: true, defects: { select: { id: true, code: true, seq: true, status: true } } },
  });
  if (!project) return { ok: false, error: "Project tidak ditemukan" };
  if (input.rows.length > MAX_ROWS) return { ok: false, error: `Maksimal ${MAX_ROWS} baris per impor` };
  const mappedFields = Object.values(input.mapping);
  if (!mappedFields.includes("title")) return { ok: false, error: "Kolom Judul wajib dipetakan" };
  if (new Set(mappedFields).size !== mappedFields.length) return { ok: false, error: "Satu field dipetakan ke lebih dari satu kolom" };

  const ctx: NormalizeContext = {
    phases: parsePhases(project.phases),
    modules: project.modules.map((m) => m.name),
    existingCodes: project.defects.map((d) => d.code),
    defaultPhase: project.activePhase,
    createModules: input.createModules,
  };
  const rows = normalizeRows(input.rows, input.mapping, ctx);
  const valid = rows.filter((r) => r.errors.length === 0);
  if (valid.length === 0) return { ok: false, error: "Tidak ada baris yang valid untuk diimpor" };

  const byCode = new Map(project.defects.map((d) => [d.code, d]));
  const moduleByName = new Map(project.modules.map((m) => [m.name.toLowerCase(), m.id]));
  let maxSeq = project.defects.reduce((a, d) => Math.max(a, d.seq), 0);
  const now = new Date();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let modulesCreated = 0;

  await prisma.$transaction(
    async (tx) => {
      // modul baru
      const newNames = [...new Set(valid.filter((r) => r.module && !moduleByName.has(r.module.toLowerCase())).map((r) => r.module!))];
      for (const name of newNames) {
        const m = await tx.module.create({ data: { projectId, name } });
        moduleByName.set(name.toLowerCase(), m.id);
        modulesCreated += 1;
      }

      for (const r of valid) {
        const moduleId = r.module ? (moduleByName.get(r.module.toLowerCase()) ?? null) : null;
        const existing = r.code ? byCode.get(r.code) : undefined;

        if (existing && input.onDuplicate === "skip") {
          skipped += 1;
          continue;
        }

        if (existing && input.onDuplicate === "update") {
          await tx.defect.update({
            where: { id: existing.id },
            data: {
              title: r.title,
              description: r.description,
              moduleId,
              severity: r.severity,
              phaseFound: r.phase,
              status: r.status,
              assignee: r.assignee,
              reporter: r.reporter,
              ...(r.createdAt ? { createdAt: r.createdAt } : {}),
              fixedAt: r.fixedAt,
              closedAt: r.closedAt,
              reopenCount: r.reopenCount,
            },
          });
          if (existing.status !== r.status) {
            await tx.statusHistory.create({
              data: { defectId: existing.id, fromStatus: existing.status, toStatus: r.status, changedAt: now, changedBy: "impor" },
            });
          }
          updated += 1;
          continue;
        }

        // buat baru: pakai nomor dari kode kalau berpola DEF-### dan belum terpakai
        let seq: number;
        const m = r.code?.match(/^DEF-(\d+)$/);
        if (m && !existing && !byCode.has(r.code!)) {
          seq = Number(m[1]);
          if (seq <= 0 || Number.isNaN(seq)) seq = ++maxSeq;
          else maxSeq = Math.max(maxSeq, seq);
        } else {
          seq = ++maxSeq;
        }
        const code = formatDefectCode(seq);
        const createdAt = r.createdAt ?? now;
        const transitionAt = r.closedAt ?? r.fixedAt ?? createdAt;
        const history: Array<{ fromStatus: string | null; toStatus: string; changedAt: Date; changedBy: string }> = [
          { fromStatus: null, toStatus: "Open", changedAt: createdAt, changedBy: "impor" },
        ];
        if (r.status !== "Open") {
          history.push({ fromStatus: "Open", toStatus: r.status, changedAt: transitionAt < createdAt ? createdAt : transitionAt, changedBy: "impor" });
        }
        const d = await tx.defect.create({
          data: {
            projectId,
            seq,
            code,
            title: r.title,
            description: r.description,
            moduleId,
            severity: r.severity,
            phaseFound: r.phase,
            status: r.status,
            assignee: r.assignee,
            reporter: r.reporter,
            createdAt,
            fixedAt: r.fixedAt,
            closedAt: r.closedAt,
            reopenCount: r.reopenCount,
            statusHistory: { create: history },
          },
        });
        byCode.set(code, { id: d.id, code, seq, status: r.status });
        created += 1;
      }
    },
    { maxWait: 10_000, timeout: 120_000 },
  );

  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true, created, updated, skipped, invalid: rows.length - valid.length, modulesCreated };
}
