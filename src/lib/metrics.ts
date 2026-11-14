/**
 * Rumus metrik Defect Monitor. Semua fungsi murni (tanpa DB) supaya bisa
 * diuji unit dan hasilnya bisa dicocokkan dengan hitungan manual.
 *
 * Definisi (dari brief):
 * - Open        = semua status selain Closed dan Rejected
 * - Valid       = semua status selain Rejected
 * - Aging       = hari sejak created_at untuk defect yang masih open
 * - Leakage X   = valid ditemukan di fase SETELAH X / (valid di X + valid setelah X)
 * - Reopen rate = defect valid dengan reopen_count > 0 / total defect valid
 */
import { isOpenStatus, SEVERITIES, type Severity } from "./constants";

export interface MetricDefect {
  status: string;
  severity: string;
  phaseFound: string;
  moduleId: string | null;
  createdAt: Date;
  reopenCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValid(d: Pick<MetricDefect, "status">): boolean {
  return d.status !== "Rejected";
}

export function isOpen(d: Pick<MetricDefect, "status">): boolean {
  return isOpenStatus(d.status);
}

export function agingDays(createdAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / DAY_MS));
}

/** Pembagian aman: null kalau penyebut 0 (ditampilkan sebagai "–"). */
export function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

// ---------------------------------------------------------------------------
// Ringkasan
// ---------------------------------------------------------------------------

export interface Summary {
  total: number;
  valid: number;
  rejected: number;
  open: number;
  closed: number;
  reopened: number;
  /** reopened / valid, null jika tidak ada defect valid */
  reopenRate: number | null;
}

export function summarize(defects: MetricDefect[]): Summary {
  const valid = defects.filter(isValid);
  const reopened = valid.filter((d) => d.reopenCount > 0).length;
  return {
    total: defects.length,
    valid: valid.length,
    rejected: defects.length - valid.length,
    open: defects.filter(isOpen).length,
    closed: defects.filter((d) => d.status === "Closed").length,
    reopened,
    reopenRate: ratio(reopened, valid.length),
  };
}

// ---------------------------------------------------------------------------
// Per fase dan per severity
// ---------------------------------------------------------------------------

export interface PhaseCount {
  phase: string;
  total: number;
  valid: number;
  open: number;
  closed: number;
  rejected: number;
}

/** Hitungan per fase mengikuti urutan `phases`; fase tak dikenal ditambahkan di akhir. */
export function countByPhase(defects: MetricDefect[], phases: string[]): PhaseCount[] {
  const order = [...phases];
  for (const d of defects) if (!order.includes(d.phaseFound)) order.push(d.phaseFound);
  return order.map((phase) => {
    const x = defects.filter((d) => d.phaseFound === phase);
    return {
      phase,
      total: x.length,
      valid: x.filter(isValid).length,
      open: x.filter(isOpen).length,
      closed: x.filter((d) => d.status === "Closed").length,
      rejected: x.filter((d) => !isValid(d)).length,
    };
  });
}

export interface SeverityCount {
  severity: Severity;
  total: number;
  open: number;
  closed: number;
  rejected: number;
}

export function countBySeverity(defects: MetricDefect[]): SeverityCount[] {
  return SEVERITIES.map((severity) => {
    const x = defects.filter((d) => d.severity === severity);
    return {
      severity,
      total: x.length,
      open: x.filter(isOpen).length,
      closed: x.filter((d) => d.status === "Closed").length,
      rejected: x.filter((d) => !isValid(d)).length,
    };
  });
}

/** Jumlah defect open per severity (dipakai exit criteria dan daily report). */
export function openBySeverity(defects: MetricDefect[]): Record<Severity, number> {
  const out = { Critical: 0, High: 0, Medium: 0, Low: 0 } as Record<Severity, number>;
  for (const d of defects) {
    if (isOpen(d) && d.severity in out) out[d.severity as Severity] += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Leakage
// ---------------------------------------------------------------------------

export interface PhaseLeakage {
  phase: string;
  /** defect valid yang ditemukan di fase ini */
  found: number;
  /** defect valid yang ditemukan di fase-fase setelah fase ini */
  after: number;
  /** after / (found + after); null kalau keduanya 0 */
  leakage: number | null;
}

/**
 * Leakage tiap fase sesuai urutan. Fase terakhir selalu after = 0.
 * Defect dengan fase yang tidak ada di `phases` diabaikan.
 */
export function leakageByPhase(defects: MetricDefect[], phases: string[]): PhaseLeakage[] {
  const valid = defects.filter(isValid).filter((d) => phases.includes(d.phaseFound));
  const foundAt = phases.map((ph) => valid.filter((d) => d.phaseFound === ph).length);
  return phases.map((phase, i) => {
    const found = foundAt[i];
    const after = foundAt.slice(i + 1).reduce((a, b) => a + b, 0);
    return { phase, found, after, leakage: ratio(after, found + after) };
  });
}

export interface ModuleLeakage {
  moduleId: string | null;
  moduleName: string;
  found: number;
  after: number;
  leakage: number | null;
  /** defect valid per fase untuk modul ini, urut sesuai `phases` */
  byPhase: number[];
}

/**
 * Leakage per modul relatif terhadap satu fase dasar (`basePhase`), rumus sama
 * dengan leakage fase tapi dihitung hanya untuk defect modul tersebut.
 * Modul tanpa defect valid tetap muncul dengan leakage null.
 */
export function leakageByModule(
  defects: MetricDefect[],
  phases: string[],
  basePhase: string,
  modules: { id: string; name: string }[],
): ModuleLeakage[] {
  const baseIdx = phases.indexOf(basePhase);
  const valid = defects.filter(isValid).filter((d) => phases.includes(d.phaseFound));
  const groups: Array<{ id: string | null; name: string }> = [
    ...modules.map((m) => ({ id: m.id, name: m.name })),
  ];
  if (valid.some((d) => d.moduleId === null || !modules.some((m) => m.id === d.moduleId))) {
    groups.push({ id: null, name: "Tanpa modul" });
  }
  return groups.map((g) => {
    const mine = valid.filter((d) =>
      g.id === null ? d.moduleId === null || !modules.some((m) => m.id === d.moduleId) : d.moduleId === g.id,
    );
    const byPhase = phases.map((ph) => mine.filter((d) => d.phaseFound === ph).length);
    const found = baseIdx >= 0 ? byPhase[baseIdx] : 0;
    const after = baseIdx >= 0 ? byPhase.slice(baseIdx + 1).reduce((a, b) => a + b, 0) : 0;
    return { moduleId: g.id, moduleName: g.name, found, after, leakage: ratio(after, found + after), byPhase };
  });
}

// ---------------------------------------------------------------------------
// Aging
// ---------------------------------------------------------------------------

export interface AgingRow<T extends MetricDefect> {
  defect: T;
  days: number;
}

/** Defect open diurutkan dari yang paling lama, dibatasi `limit`. */
export function oldestOpen<T extends MetricDefect>(defects: T[], now: Date, limit = 10): AgingRow<T>[] {
  return defects
    .filter(isOpen)
    .map((defect) => ({ defect, days: agingDays(defect.createdAt, now) }))
    .sort((a, b) => b.days - a.days || a.defect.createdAt.getTime() - b.defect.createdAt.getTime())
    .slice(0, limit);
}

/** Rata-rata umur defect open (hari), null kalau tidak ada yang open. */
export function averageOpenAge(defects: MetricDefect[], now: Date): number | null {
  const open = defects.filter(isOpen);
  if (open.length === 0) return null;
  return open.reduce((sum, d) => sum + agingDays(d.createdAt, now), 0) / open.length;
}

// ---------------------------------------------------------------------------
// Exit criteria
// ---------------------------------------------------------------------------

export interface ExitRule {
  phase: string;
  severity: string;
  maxOpen: number;
}

export interface ExitRuleResult extends ExitRule {
  open: number;
  passed: boolean;
}

export interface ExitCheck {
  phase: string;
  /** true jika semua aturan fase lolos; null kalau fase tidak punya aturan */
  ready: boolean | null;
  rules: ExitRuleResult[];
  failing: ExitRuleResult[];
}

/**
 * Fase X lolos jika jumlah defect open di fase X per severity <= max_open
 * untuk semua aturan fase itu.
 */
export function checkExitCriteria(defects: MetricDefect[], rules: ExitRule[], phase: string): ExitCheck {
  const inPhase = defects.filter((d) => d.phaseFound === phase);
  const open = openBySeverity(inPhase);
  const order = (s: string) => {
    const i = (SEVERITIES as readonly string[]).indexOf(s);
    return i === -1 ? SEVERITIES.length : i;
  };
  const results = rules
    .filter((r) => r.phase === phase)
    .sort((a, b) => order(a.severity) - order(b.severity))
    .map((r) => {
      const n = open[r.severity as Severity] ?? 0;
      return { ...r, open: n, passed: n <= r.maxOpen };
    });
  const failing = results.filter((r) => !r.passed);
  return {
    phase,
    ready: results.length === 0 ? null : failing.length === 0,
    rules: results,
    failing,
  };
}
