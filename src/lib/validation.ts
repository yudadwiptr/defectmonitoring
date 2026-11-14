import { z } from "zod";
import { SEVERITIES, STATUSES } from "./constants";

const trimmed = (max: number) => z.string().trim().max(max);

export const projectNameSchema = trimmed(80).min(2, "Nama project minimal 2 karakter");

export const phaseNameSchema = z
  .string()
  .trim()
  .min(1, "Nama fase tidak boleh kosong")
  .max(20, "Nama fase maksimal 20 karakter")
  .transform((s) => s.toUpperCase());

export const phasesSchema = z
  .array(phaseNameSchema)
  .min(2, "Minimal dua fase")
  .max(10, "Maksimal sepuluh fase")
  .refine((arr) => new Set(arr).size === arr.length, "Nama fase tidak boleh sama");

export const moduleNameSchema = trimmed(60).min(2, "Nama modul minimal 2 karakter");

export const severitySchema = z.enum(SEVERITIES, { message: "Severity tidak dikenal" });
export const statusSchema = z.enum(STATUSES, { message: "Status tidak dikenal" });

export const defectInputSchema = z.object({
  title: trimmed(200).min(3, "Judul minimal 3 karakter"),
  description: trimmed(5000).default(""),
  moduleId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  severity: severitySchema,
  phaseFound: trimmed(20).min(1, "Fase wajib diisi"),
  assignee: trimmed(60).default(""),
  reporter: trimmed(60).default(""),
});

export type DefectInput = z.infer<typeof defectInputSchema>;

/** Ambil pesan error pertama yang mudah dibaca. */
export function firstError(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Input tidak valid";
  const path = issue.path.length ? `${String(issue.path[0])}: ` : "";
  return `${path}${issue.message}`;
}

/** Baca string dari FormData, kosong kalau tidak ada. */
export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
