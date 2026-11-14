/**
 * Pembuat teks daily report (murni, tanpa DB) untuk disalin ke WhatsApp/email.
 * Format sengaja polos: *tebal* ala WhatsApp, satu fakta per baris.
 */
import { SEVERITIES, type Severity } from "./constants";
import {
  agingDays,
  checkExitCriteria,
  isOpen,
  isValid,
  openBySeverity,
  summarize,
  type ExitRule,
  type MetricDefect,
} from "./metrics";

export interface ReportDefect extends MetricDefect {
  code: string;
  title: string;
  assignee: string | null;
  fixedAt: Date | null;
}

export interface DailyReportInput {
  projectName: string;
  activePhase: string;
  phases: string[];
  defects: ReportDefect[];
  rules: ExitRule[];
  now: Date;
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function formatReportDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function codes(list: ReportDefect[]): string {
  return list.length ? ` (${list.map((d) => d.code).join(", ")})` : "";
}

export function buildDailyReport(input: DailyReportInput): string {
  const { projectName, activePhase, defects, rules, now } = input;
  const s = summarize(defects);
  const open = openBySeverity(defects);
  const newToday = defects.filter((d) => isSameDay(d.createdAt, now));
  const fixedToday = defects.filter((d) => d.fixedAt && isSameDay(d.fixedAt, now) && isValid(d));
  const criticalHigh = defects
    .filter((d) => isOpen(d) && (d.severity === "Critical" || d.severity === "High"))
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "Critical" ? -1 : 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  const exit = checkExitCriteria(defects, rules, activePhase);

  const lines: string[] = [];
  lines.push(`*Daily Report QA – ${projectName}*`);
  lines.push(`${formatReportDate(now)} · Fase aktif: ${activePhase}`);
  lines.push("");
  lines.push("*Ringkasan*");
  lines.push(`Total defect: ${s.total} (valid ${s.valid}, rejected ${s.rejected})`);
  lines.push(
    `Masih open: ${s.open} → ${SEVERITIES.map((sev) => `${sev} ${open[sev as Severity]}`).join(" · ")}`,
  );
  lines.push(`Closed: ${s.closed}`);
  lines.push("");
  lines.push("*Hari ini*");
  lines.push(`Defect baru: ${newToday.length}${codes(newToday)}`);
  lines.push(`Fixed: ${fixedToday.length}${codes(fixedToday)}`);
  lines.push("");
  lines.push(`*Critical/High masih open (${criticalHigh.length})*`);
  if (criticalHigh.length === 0) {
    lines.push("Tidak ada. 🎉");
  } else {
    for (const d of criticalHigh) {
      const who = d.assignee ? `, ${d.assignee}` : "";
      lines.push(`- ${d.code} [${d.severity}] ${d.title} – ${d.status}${who}, ${agingDays(d.createdAt, now)} hari`);
    }
  }
  lines.push("");
  if (exit.ready === null) {
    lines.push(`*Exit criteria ${activePhase}*`);
    lines.push("Belum ada aturan yang disetel.");
  } else {
    lines.push(`*Exit criteria ${activePhase}: ${exit.ready ? "SIAP NAIK ✅" : "BELUM SIAP ❌"}*`);
    for (const r of exit.rules) {
      lines.push(`- ${r.severity}: ${r.open} open (maks ${r.maxOpen}) ${r.passed ? "✓" : "✗"}`);
    }
  }
  return lines.join("\n");
}
