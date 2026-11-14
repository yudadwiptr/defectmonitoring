export const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const STATUSES = [
  "Open",
  "In Progress",
  "Fixed",
  "Retest",
  "Closed",
  "Reopened",
  "Rejected",
] as const;
export type Status = (typeof STATUSES)[number];

/** Status yang dianggap "selesai": tidak dihitung sebagai open. */
export const TERMINAL_STATUSES: readonly Status[] = ["Closed", "Rejected"];

/** Status yang dianggap open (semua selain Closed dan Rejected). */
export const OPEN_STATUSES: readonly Status[] = STATUSES.filter(
  (s) => !TERMINAL_STATUSES.includes(s),
);

export const DEFAULT_PHASES = ["SIT", "UAT", "REGRESI", "BETA", "PROD"] as const;

/** Keterangan singkat tiap severity untuk tooltip/form. */
export const SEVERITY_HINT: Record<Severity, string> = {
  Critical: "Sistem tidak bisa dipakai atau data rusak. Harus beres sebelum lanjut.",
  High: "Fitur utama gagal, tidak ada jalan lain. Prioritas tinggi.",
  Medium: "Fitur terganggu tapi masih ada cara lain untuk menyelesaikan tugas.",
  Low: "Kosmetik, typo, atau gangguan kecil.",
};

/** Keterangan singkat tiap status untuk menu ubah status. */
export const STATUS_HINT: Record<Status, string> = {
  Open: "Baru dilaporkan, belum ditangani.",
  "In Progress": "Sedang diperbaiki developer.",
  Fixed: "Sudah diperbaiki, menunggu dites ulang.",
  Retest: "Sedang dites ulang oleh QA.",
  Closed: "Lolos tes ulang. Selesai.",
  Reopened: "Gagal tes ulang, dibuka lagi.",
  Rejected: "Bukan defect (duplikat, sesuai desain, dll).",
};

export function isSeverity(v: unknown): v is Severity {
  return typeof v === "string" && (SEVERITIES as readonly string[]).includes(v);
}

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export function isOpenStatus(status: string): boolean {
  return !(TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function formatDefectCode(seq: number): string {
  return `DEF-${String(seq).padStart(3, "0")}`;
}

export function parsePhases(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((p) => typeof p === "string")) {
      return parsed;
    }
  } catch {
    // fallthrough
  }
  return [...DEFAULT_PHASES];
}
