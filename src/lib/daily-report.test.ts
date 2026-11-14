import { describe, expect, it } from "vitest";
import { buildDailyReport, formatReportDate, isSameDay, type ReportDefect } from "./daily-report";

const NOW = new Date("2026-11-14T15:30:00"); // Sabtu
const DAY = 24 * 60 * 60 * 1000;

function d(p: Partial<ReportDefect> & { code: string; status: string }): ReportDefect {
  return {
    title: `Judul ${p.code}`,
    severity: "Medium",
    phaseFound: "BETA",
    moduleId: null,
    createdAt: new Date(NOW.getTime() - 5 * DAY),
    reopenCount: 0,
    assignee: null,
    fixedAt: null,
    ...p,
  };
}

const defects: ReportDefect[] = [
  d({ code: "DEF-001", status: "Open", severity: "Critical", assignee: "Andi", createdAt: new Date(NOW.getTime() - 3 * DAY) }),
  d({ code: "DEF-002", status: "Fixed", severity: "High", fixedAt: new Date("2026-11-14T09:00:00") }),
  d({ code: "DEF-003", status: "Open", severity: "Low", createdAt: new Date("2026-11-14T08:00:00") }),
  d({ code: "DEF-004", status: "Closed", severity: "High", fixedAt: new Date("2026-11-13T09:00:00") }),
  d({ code: "DEF-005", status: "Rejected", severity: "Critical" }),
  d({ code: "DEF-006", status: "Open", severity: "High", phaseFound: "UAT", createdAt: new Date(NOW.getTime() - 10 * DAY) }),
];

const rules = [
  { phase: "BETA", severity: "Critical", maxOpen: 0 },
  { phase: "BETA", severity: "High", maxOpen: 1 },
];

describe("buildDailyReport", () => {
  const text = buildDailyReport({
    projectName: "Portal",
    activePhase: "BETA",
    phases: ["SIT", "UAT", "BETA"],
    defects,
    rules,
    now: NOW,
  });
  const lines = text.split("\n");

  it("judul, tanggal Indonesia, fase aktif", () => {
    expect(lines[0]).toBe("*Daily Report QA – Portal*");
    expect(lines[1]).toBe("Sabtu, 14 Nov 2026 · Fase aktif: BETA");
  });

  it("ringkasan dan open per severity", () => {
    expect(text).toContain("Total defect: 6 (valid 5, rejected 1)");
    expect(text).toContain("Masih open: 4 → Critical 1 · High 2 · Medium 0 · Low 1");
    expect(text).toContain("Closed: 1");
  });

  it("baru dan fixed hari ini berdasarkan tanggal lokal", () => {
    expect(text).toContain("Defect baru: 1 (DEF-003)");
    expect(text).toContain("Fixed: 1 (DEF-002)");
  });

  it("daftar Critical/High open, Critical dulu lalu yang paling lama", () => {
    const idx = lines.indexOf("*Critical/High masih open (3)*");
    expect(idx).toBeGreaterThan(0);
    expect(lines[idx + 1]).toBe("- DEF-001 [Critical] Judul DEF-001 – Open, Andi, 3 hari");
    expect(lines[idx + 2]).toBe("- DEF-006 [High] Judul DEF-006 – Open, 10 hari");
    expect(lines[idx + 3]).toBe("- DEF-002 [High] Judul DEF-002 – Fixed, 5 hari");
  });

  it("status exit criteria fase aktif hanya menghitung defect di fase itu", () => {
    expect(text).toContain("*Exit criteria BETA: BELUM SIAP ❌*");
    expect(text).toContain("- Critical: 1 open (maks 0) ✗");
    // DEF-006 High ada di UAT, jadi High di BETA hanya DEF-002
    expect(text).toContain("- High: 1 open (maks 1) ✓");
  });

  it("tanpa aturan dan tanpa Critical/High", () => {
    const t = buildDailyReport({
      projectName: "P",
      activePhase: "SIT",
      phases: ["SIT"],
      defects: [d({ code: "DEF-009", status: "Closed" })],
      rules: [],
      now: NOW,
    });
    expect(t).toContain("Tidak ada. 🎉");
    expect(t).toContain("Belum ada aturan yang disetel.");
  });
});

describe("helper tanggal", () => {
  it("formatReportDate", () => {
    expect(formatReportDate(new Date("2026-01-05T10:00:00"))).toBe("Senin, 5 Jan 2026");
  });
  it("isSameDay membandingkan tanggal lokal, bukan 24 jam", () => {
    expect(isSameDay(new Date("2026-11-14T00:10:00"), new Date("2026-11-14T23:50:00"))).toBe(true);
    expect(isSameDay(new Date("2026-11-14T23:50:00"), new Date("2026-11-15T00:10:00"))).toBe(false);
  });
});
