/**
 * Impor Excel: pemetaan kolom dan normalisasi baris. Murni (tanpa DB, tanpa
 * exceljs) supaya bisa dipakai di client untuk preview dan di server untuk
 * commit, serta mudah diuji.
 */
import { SEVERITIES, STATUSES, type Severity, type Status } from "./constants";

export const IMPORT_FIELDS = [
  "code",
  "title",
  "description",
  "module",
  "severity",
  "phase",
  "status",
  "assignee",
  "reporter",
  "createdAt",
  "fixedAt",
  "closedAt",
  "reopenCount",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const FIELD_LABEL: Record<ImportField, string> = {
  code: "Kode (DEF-001)",
  title: "Judul",
  description: "Deskripsi",
  module: "Modul",
  severity: "Severity",
  phase: "Fase ditemukan",
  status: "Status",
  assignee: "Assignee",
  reporter: "Pelapor",
  createdAt: "Tanggal dibuat",
  fixedAt: "Tanggal fixed",
  closedAt: "Tanggal closed",
  reopenCount: "Jumlah reopen",
};

/** Nama kolom pada file ekspor (dipakai juga untuk pemetaan otomatis). */
export const EXPORT_HEADERS: Record<ImportField, string> = {
  code: "Kode",
  title: "Judul",
  description: "Deskripsi",
  module: "Modul",
  severity: "Severity",
  phase: "Fase",
  status: "Status",
  assignee: "Assignee",
  reporter: "Pelapor",
  createdAt: "Dibuat",
  fixedAt: "Diperbaiki",
  closedAt: "Ditutup",
  reopenCount: "Reopen",
};

const ALIASES: Record<ImportField, string[]> = {
  code: ["kode", "code", "id", "defect id", "no", "nomor", "key"],
  title: ["judul", "title", "summary", "ringkasan", "defect", "nama"],
  description: ["deskripsi", "description", "desc", "detail", "keterangan", "langkah"],
  module: ["modul", "module", "area", "fitur", "feature", "komponen", "component"],
  severity: ["severity", "prioritas", "priority", "tingkat", "sev"],
  phase: ["fase", "phase", "fase ditemukan", "found in", "ditemukan di", "tahap", "stage"],
  status: ["status", "state"],
  assignee: ["assignee", "pic", "developer", "dev", "ditugaskan", "penanggung jawab"],
  reporter: ["pelapor", "reporter", "tester", "qa", "dilaporkan oleh", "reported by"],
  createdAt: ["dibuat", "created", "created at", "tanggal", "tanggal dibuat", "date", "tgl", "dilaporkan"],
  fixedAt: ["diperbaiki", "fixed", "fixed at", "tanggal fixed", "tgl fixed"],
  closedAt: ["ditutup", "closed", "closed at", "tanggal closed", "tgl closed"],
  reopenCount: ["reopen", "reopen count", "jumlah reopen", "dibuka ulang"],
};

/** Pemetaan: indeks kolom -> field (kolom tanpa entri diabaikan). */
export type ColumnMapping = Record<number, ImportField>;

function norm(s: string): string {
  return s.toLowerCase().replace(/[_\-./]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Tebak pemetaan dari nama header. Tiap field maksimal satu kolom. */
export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const taken = new Set<ImportField>();
  const normalized = headers.map((h) => norm(String(h ?? "")));

  // Cocok persis dulu, lalu "mengandung"
  for (const exact of [true, false]) {
    normalized.forEach((h, idx) => {
      if (!h || mapping[idx] !== undefined) return;
      for (const field of IMPORT_FIELDS) {
        if (taken.has(field)) continue;
        const hit = ALIASES[field].some((a) => (exact ? h === a : h.includes(a)));
        if (hit) {
          mapping[idx] = field;
          taken.add(field);
          break;
        }
      }
    });
  }
  return mapping;
}

export type CellValue = string | number | boolean | Date | null;

export interface NormalizeContext {
  phases: string[];
  /** nama modul yang sudah ada di project */
  modules: string[];
  /** kode defect yang sudah ada di project */
  existingCodes: string[];
  defaultPhase: string;
  /** buat modul baru kalau nama tidak dikenal; kalau false -> tanpa modul + peringatan */
  createModules: boolean;
}

export interface NormalizedRow {
  /** nomor baris di file (1-based, termasuk header) */
  rowNumber: number;
  code: string | null;
  /** true jika kode sudah ada di project */
  existing: boolean;
  title: string;
  description: string;
  module: string | null;
  /** modul yang belum ada dan akan dibuat */
  newModule: boolean;
  severity: Severity;
  phase: string;
  status: Status;
  assignee: string | null;
  reporter: string | null;
  createdAt: Date | null;
  fixedAt: Date | null;
  closedAt: Date | null;
  reopenCount: number;
  errors: string[];
  warnings: string[];
}

function str(v: CellValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

export function normalizeSeverity(v: CellValue): Severity | null {
  const s = str(v).toLowerCase();
  if (!s) return null;
  const map: Record<string, Severity> = {
    critical: "Critical", kritis: "Critical", blocker: "Critical", s1: "Critical", p1: "Critical", "1": "Critical",
    high: "High", tinggi: "High", major: "High", s2: "High", p2: "High", "2": "High",
    medium: "Medium", sedang: "Medium", normal: "Medium", s3: "Medium", p3: "Medium", "3": "Medium",
    low: "Low", rendah: "Low", minor: "Low", trivial: "Low", s4: "Low", p4: "Low", "4": "Low",
  };
  if (map[s]) return map[s];
  const found = SEVERITIES.find((x) => x.toLowerCase() === s);
  return found ?? null;
}

export function normalizeStatus(v: CellValue): Status | null {
  const s = str(v).toLowerCase().replace(/[_\-]+/g, " ");
  if (!s) return null;
  const map: Record<string, Status> = {
    open: "Open", baru: "Open", new: "Open", todo: "Open",
    "in progress": "In Progress", progress: "In Progress", wip: "In Progress", dikerjakan: "In Progress", "sedang dikerjakan": "In Progress",
    fixed: "Fixed", resolved: "Fixed", diperbaiki: "Fixed", done: "Fixed",
    retest: "Retest", "re test": "Retest", testing: "Retest", verifikasi: "Retest",
    closed: "Closed", close: "Closed", selesai: "Closed", verified: "Closed", ditutup: "Closed",
    reopened: "Reopened", reopen: "Reopened", "re open": "Reopened", "re opened": "Reopened", "dibuka ulang": "Reopened",
    rejected: "Rejected", reject: "Rejected", ditolak: "Rejected", invalid: "Rejected", duplicate: "Rejected", "won't fix": "Rejected", "wont fix": "Rejected",
  };
  if (map[s]) return map[s];
  const found = STATUSES.find((x) => x.toLowerCase() === s);
  return found ?? null;
}

/** Terima Date, serial Excel (angka), ISO, atau dd/mm/yyyy [hh:mm]. */
export function parseDate(v: CellValue): Date | null | "invalid" {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? "invalid" : v;
  if (typeof v === "number") {
    // serial Excel (hari sejak 1899-12-30)
    if (v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 86400 * 1000));
    return "invalid";
  }
  const s = String(v).trim();
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T](\d{1,2})[:.](\d{2}))?$/);
  if (dmy) {
    const d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1], dmy[4] ? +dmy[4] : 0, dmy[5] ? +dmy[5] : 0);
    return isNaN(d.getTime()) ? "invalid" : d;
  }
  const t = Date.parse(s);
  return isNaN(t) ? "invalid" : new Date(t);
}

export function normalizeCode(v: CellValue): string | null {
  const s = str(v).toUpperCase().replace(/\s+/g, "");
  if (!s) return null;
  const m = s.match(/^(?:DEF-?)?(\d{1,6})$/);
  if (m) return `DEF-${m[1].padStart(3, "0")}`;
  return s;
}

function isEmptyRow(cells: CellValue[]): boolean {
  return cells.every((c) => c === null || c === undefined || String(c).trim() === "");
}

/**
 * Normalisasi semua baris data (tanpa header). `rows[i]` adalah baris ke i+2 di file.
 */
export function normalizeRows(rows: CellValue[][], mapping: ColumnMapping, ctx: NormalizeContext): NormalizedRow[] {
  const col = (field: ImportField): number | undefined => {
    const entry = Object.entries(mapping).find(([, f]) => f === field);
    return entry ? Number(entry[0]) : undefined;
  };
  const idx = Object.fromEntries(IMPORT_FIELDS.map((f) => [f, col(f)])) as Record<ImportField, number | undefined>;
  const get = (cells: CellValue[], field: ImportField): CellValue =>
    idx[field] === undefined ? null : (cells[idx[field]!] ?? null);

  const phaseLookup = new Map(ctx.phases.map((p) => [p.toUpperCase(), p]));
  const moduleLookup = new Map(ctx.modules.map((m) => [m.toLowerCase(), m]));
  const existing = new Set(ctx.existingCodes.map((c) => c.toUpperCase()));
  const seenCodes = new Set<string>();
  const out: NormalizedRow[] = [];

  rows.forEach((cells, i) => {
    if (isEmptyRow(cells)) return;
    const rowNumber = i + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const title = str(get(cells, "title"));
    if (!title) errors.push("Judul kosong");
    else if (title.length > 200) warnings.push("Judul dipotong ke 200 karakter");

    const code = normalizeCode(get(cells, "code"));
    if (code && seenCodes.has(code)) errors.push(`Kode ${code} muncul dua kali di file`);
    if (code) seenCodes.add(code);

    let severity = normalizeSeverity(get(cells, "severity"));
    if (!severity) {
      if (idx.severity !== undefined && str(get(cells, "severity"))) {
        errors.push(`Severity "${str(get(cells, "severity"))}" tidak dikenal`);
      } else {
        warnings.push("Severity kosong, dipakai Medium");
      }
      severity = "Medium";
    }

    const rawPhase = str(get(cells, "phase"));
    let phase = ctx.defaultPhase;
    if (rawPhase) {
      const hit = phaseLookup.get(rawPhase.toUpperCase());
      if (hit) phase = hit;
      else errors.push(`Fase "${rawPhase}" tidak ada di project (${ctx.phases.join(", ")})`);
    } else {
      warnings.push(`Fase kosong, dipakai ${ctx.defaultPhase}`);
    }

    let status = normalizeStatus(get(cells, "status"));
    if (!status) {
      if (idx.status !== undefined && str(get(cells, "status"))) {
        errors.push(`Status "${str(get(cells, "status"))}" tidak dikenal`);
      }
      status = "Open";
    }

    const rawModule = str(get(cells, "module"));
    let moduleName: string | null = null;
    let newModule = false;
    if (rawModule) {
      const hit = moduleLookup.get(rawModule.toLowerCase());
      if (hit) moduleName = hit;
      else if (ctx.createModules) {
        moduleName = rawModule.slice(0, 60);
        newModule = true;
      } else {
        warnings.push(`Modul "${rawModule}" tidak dikenal, disimpan tanpa modul`);
      }
    }

    const dates = {} as Record<"createdAt" | "fixedAt" | "closedAt", Date | null>;
    for (const f of ["createdAt", "fixedAt", "closedAt"] as const) {
      const parsed = parseDate(get(cells, f));
      if (parsed === "invalid") {
        errors.push(`${FIELD_LABEL[f]} "${str(get(cells, f))}" tidak bisa dibaca`);
        dates[f] = null;
      } else dates[f] = parsed;
    }

    const rawReopen = get(cells, "reopenCount");
    let reopenCount = 0;
    if (rawReopen !== null && str(rawReopen) !== "") {
      const n = Number(rawReopen);
      if (Number.isInteger(n) && n >= 0) reopenCount = n;
      else errors.push(`Jumlah reopen "${str(rawReopen)}" bukan bilangan bulat`);
    }

    out.push({
      rowNumber,
      code,
      existing: code !== null && existing.has(code),
      title: title.slice(0, 200),
      description: str(get(cells, "description")).slice(0, 5000),
      module: moduleName,
      newModule,
      severity,
      phase,
      status,
      assignee: str(get(cells, "assignee")).slice(0, 60) || null,
      reporter: str(get(cells, "reporter")).slice(0, 60) || null,
      createdAt: dates.createdAt,
      fixedAt: dates.fixedAt,
      closedAt: dates.closedAt,
      reopenCount,
      errors,
      warnings,
    });
  });
  return out;
}

export interface ImportSummary {
  total: number;
  valid: number;
  invalid: number;
  toCreate: number;
  toUpdate: number;
  newModules: string[];
  warnings: number;
}

export function summarizeImport(rows: NormalizedRow[], onDuplicate: "update" | "skip" | "create"): ImportSummary {
  const valid = rows.filter((r) => r.errors.length === 0);
  const dup = valid.filter((r) => r.existing);
  return {
    total: rows.length,
    valid: valid.length,
    invalid: rows.length - valid.length,
    toCreate: valid.length - dup.length + (onDuplicate === "create" ? dup.length : 0),
    toUpdate: onDuplicate === "update" ? dup.length : 0,
    newModules: [...new Set(valid.filter((r) => r.newModule && r.module).map((r) => r.module!))],
    warnings: rows.reduce((a, r) => a + r.warnings.length, 0),
  };
}
