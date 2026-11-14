import { describe, expect, it } from "vitest";
import {
  agingDays,
  averageOpenAge,
  checkExitCriteria,
  countByPhase,
  countBySeverity,
  leakageByModule,
  leakageByPhase,
  oldestOpen,
  openBySeverity,
  summarize,
  type MetricDefect,
} from "./metrics";
import { DEFECTS, EXIT_CRITERIA, MODULES } from "../../prisma/seed-data";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-11-14T09:00:00");

function d(partial: Partial<MetricDefect> & { status: string }): MetricDefect {
  return {
    severity: "Medium",
    phaseFound: "SIT",
    moduleId: null,
    createdAt: NOW,
    reopenCount: 0,
    ...partial,
  };
}

describe("summarize", () => {
  it("menghitung open, closed, valid, dan reopen rate", () => {
    const s = summarize([
      d({ status: "Open" }),
      d({ status: "Closed" }),
      d({ status: "Rejected" }),
      d({ status: "Reopened", reopenCount: 1 }),
      d({ status: "Fixed" }),
    ]);
    expect(s).toEqual({
      total: 5,
      valid: 4,
      rejected: 1,
      open: 3,
      closed: 1,
      reopened: 1,
      reopenRate: 0.25,
    });
  });

  it("reopen rate null kalau tidak ada defect valid", () => {
    expect(summarize([]).reopenRate).toBeNull();
    expect(summarize([d({ status: "Rejected", reopenCount: 2 })]).reopenRate).toBeNull();
  });

  it("defect Rejected yang pernah reopen tidak dihitung", () => {
    const s = summarize([d({ status: "Rejected", reopenCount: 1 }), d({ status: "Closed" })]);
    expect(s.reopened).toBe(0);
    expect(s.reopenRate).toBe(0);
  });
});

describe("leakageByPhase", () => {
  const phases = ["A", "B", "C"];
  const defects = [
    d({ status: "Closed", phaseFound: "A" }),
    d({ status: "Open", phaseFound: "A" }),
    d({ status: "Closed", phaseFound: "B" }),
    d({ status: "Open", phaseFound: "C" }),
    d({ status: "Rejected", phaseFound: "C" }), // tidak dihitung
  ];

  it("after/(found+after) per fase, fase terakhir selalu 0", () => {
    expect(leakageByPhase(defects, phases)).toEqual([
      { phase: "A", found: 2, after: 2, leakage: 0.5 },
      { phase: "B", found: 1, after: 1, leakage: 0.5 },
      { phase: "C", found: 1, after: 0, leakage: 0 },
    ]);
  });

  it("null kalau belum ada defect valid di fase itu dan sesudahnya", () => {
    expect(leakageByPhase([], phases).map((p) => p.leakage)).toEqual([null, null, null]);
  });

  it("mengabaikan defect dengan fase di luar urutan project", () => {
    const withStray = [...defects, d({ status: "Open", phaseFound: "HOTFIX" })];
    expect(leakageByPhase(withStray, phases)).toEqual(leakageByPhase(defects, phases));
  });
});

describe("leakageByModule", () => {
  const phases = ["SIT", "UAT", "PROD"];
  const modules = [
    { id: "m1", name: "Login" },
    { id: "m2", name: "Laporan" },
  ];
  const defects = [
    d({ status: "Closed", phaseFound: "SIT", moduleId: "m1" }),
    d({ status: "Closed", phaseFound: "UAT", moduleId: "m1" }),
    d({ status: "Open", phaseFound: "PROD", moduleId: "m1" }),
    d({ status: "Rejected", phaseFound: "PROD", moduleId: "m1" }),
    d({ status: "Open", phaseFound: "SIT", moduleId: "m2" }),
    d({ status: "Open", phaseFound: "UAT", moduleId: null }),
  ];

  it("menghitung leakage relatif fase dasar untuk tiap modul", () => {
    const res = leakageByModule(defects, phases, "SIT", modules);
    expect(res.map((r) => [r.moduleName, r.found, r.after, r.leakage])).toEqual([
      ["Login", 1, 2, 2 / 3],
      ["Laporan", 1, 0, 0],
      ["Tanpa modul", 0, 1, 1],
    ]);
    expect(res[0].byPhase).toEqual([1, 1, 1]);
  });

  it("fase dasar di tengah hanya menghitung fase setelahnya", () => {
    const res = leakageByModule(defects, phases, "UAT", modules);
    expect(res[0]).toMatchObject({ found: 1, after: 1, leakage: 0.5 });
  });

  it("tidak membuat baris 'Tanpa modul' kalau semua defect punya modul", () => {
    const res = leakageByModule(defects.slice(0, 5), phases, "SIT", modules);
    expect(res.map((r) => r.moduleName)).toEqual(["Login", "Laporan"]);
  });
});

describe("aging", () => {
  it("agingDays membulatkan ke bawah dan tidak negatif", () => {
    expect(agingDays(new Date(NOW.getTime() - 2.9 * DAY), NOW)).toBe(2);
    expect(agingDays(new Date(NOW.getTime() + DAY), NOW)).toBe(0);
  });

  it("oldestOpen hanya defect open, urut dari paling lama", () => {
    const rows = oldestOpen(
      [
        d({ status: "Closed", createdAt: new Date(NOW.getTime() - 50 * DAY) }),
        d({ status: "Open", createdAt: new Date(NOW.getTime() - 3 * DAY) }),
        d({ status: "Retest", createdAt: new Date(NOW.getTime() - 10 * DAY) }),
        d({ status: "Rejected", createdAt: new Date(NOW.getTime() - 40 * DAY) }),
      ],
      NOW,
      5,
    );
    expect(rows.map((r) => [r.defect.status, r.days])).toEqual([
      ["Retest", 10],
      ["Open", 3],
    ]);
  });

  it("averageOpenAge", () => {
    expect(averageOpenAge([], NOW)).toBeNull();
    expect(
      averageOpenAge(
        [
          d({ status: "Open", createdAt: new Date(NOW.getTime() - 4 * DAY) }),
          d({ status: "Fixed", createdAt: new Date(NOW.getTime() - 2 * DAY) }),
          d({ status: "Closed", createdAt: new Date(NOW.getTime() - 100 * DAY) }),
        ],
        NOW,
      ),
    ).toBe(3);
  });
});

describe("checkExitCriteria", () => {
  const rules = [
    { phase: "UAT", severity: "Critical", maxOpen: 0 },
    { phase: "UAT", severity: "High", maxOpen: 1 },
    { phase: "SIT", severity: "Critical", maxOpen: 0 },
  ];

  it("lolos jika semua open per severity <= max_open", () => {
    const res = checkExitCriteria(
      [d({ status: "Fixed", phaseFound: "UAT", severity: "High" }), d({ status: "Open", phaseFound: "SIT", severity: "Critical" })],
      rules,
      "UAT",
    );
    expect(res.ready).toBe(true);
    expect(res.failing).toEqual([]);
  });

  it("gagal dan menyebut aturan yang tidak terpenuhi", () => {
    const res = checkExitCriteria(
      [
        d({ status: "Open", phaseFound: "UAT", severity: "High" }),
        d({ status: "Retest", phaseFound: "UAT", severity: "High" }),
        d({ status: "Closed", phaseFound: "UAT", severity: "Critical" }),
      ],
      rules,
      "UAT",
    );
    expect(res.ready).toBe(false);
    expect(res.failing.map((f) => [f.severity, f.open, f.maxOpen])).toEqual([["High", 2, 1]]);
  });

  it("null kalau fase tidak punya aturan", () => {
    expect(checkExitCriteria([], rules, "PROD").ready).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Angka dari seed harus sama dengan prisma/SEED.md
// ---------------------------------------------------------------------------

describe("angka seed (prisma/SEED.md)", () => {
  const phases = ["SIT", "UAT", "REGRESI", "BETA", "PROD"];
  const modules = MODULES.map((name) => ({ id: name, name }));
  const seedDefects: MetricDefect[] = DEFECTS.map((s) => ({
    status: s.status,
    severity: s.severity,
    phaseFound: s.phase,
    moduleId: s.module,
    createdAt: new Date(NOW.getTime() - s.c * DAY),
    reopenCount: s.r ?? 0,
  }));

  it("ringkasan", () => {
    expect(summarize(seedDefects)).toEqual({
      total: 68,
      valid: 62,
      rejected: 6,
      open: 20,
      closed: 42,
      reopened: 8,
      reopenRate: 8 / 62,
    });
  });

  it("per fase", () => {
    const rows = countByPhase(seedDefects, phases).map((p) => [p.phase, p.total, p.valid, p.closed, p.open, p.rejected]);
    expect(rows).toEqual([
      ["SIT", 26, 23, 22, 1, 3],
      ["UAT", 22, 21, 14, 7, 1],
      ["REGRESI", 8, 7, 5, 2, 1],
      ["BETA", 12, 11, 1, 10, 1],
      ["PROD", 0, 0, 0, 0, 0],
    ]);
  });

  it("leakage antar fase", () => {
    const rows = leakageByPhase(seedDefects, phases);
    expect(rows.map((r) => [r.phase, r.found, r.after])).toEqual([
      ["SIT", 23, 39],
      ["UAT", 21, 18],
      ["REGRESI", 7, 11],
      ["BETA", 11, 0],
      ["PROD", 0, 0],
    ]);
    expect(rows[0].leakage).toBeCloseTo(0.629, 3);
    expect(rows[1].leakage).toBeCloseTo(0.462, 3);
    expect(rows[2].leakage).toBeCloseTo(0.611, 3);
    expect(rows[3].leakage).toBe(0);
    expect(rows[4].leakage).toBeNull();
  });

  it("sebaran severity konsisten dengan total", () => {
    const sev = countBySeverity(seedDefects);
    expect(sev.reduce((a, s) => a + s.total, 0)).toBe(68);
    expect(sev.reduce((a, s) => a + s.open, 0)).toBe(20);
  });

  it("open BETA per severity dan exit criteria BETA belum siap", () => {
    const beta = seedDefects.filter((x) => x.phaseFound === "BETA");
    expect(openBySeverity(beta)).toEqual({ Critical: 1, High: 3, Medium: 4, Low: 2 });

    const check = checkExitCriteria(seedDefects, EXIT_CRITERIA, "BETA");
    expect(check.ready).toBe(false);
    expect(check.failing.map((f) => f.severity)).toEqual(["Critical", "High", "Medium"]);
  });

  it("leakage per modul: jumlah per modul = total valid", () => {
    const rows = leakageByModule(seedDefects, phases, "SIT", modules);
    const sum = rows.reduce((a, r) => a + r.byPhase.reduce((x, y) => x + y, 0), 0);
    expect(sum).toBe(62);
    expect(rows.map((r) => r.moduleName)).toEqual(MODULES);
  });
});
