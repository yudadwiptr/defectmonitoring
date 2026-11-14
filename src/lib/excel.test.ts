import { describe, expect, it } from "vitest";
import {
  normalizeRows,
  normalizeSeverity,
  normalizeStatus,
  parseDate,
  suggestMapping,
  summarizeImport,
  type ColumnMapping,
  type NormalizeContext,
} from "./excel-import";
import { buildExportWorkbook, readWorkbook, type ExportDefect } from "./excel";

const ctx: NormalizeContext = {
  phases: ["SIT", "UAT", "BETA"],
  modules: ["Login", "Laporan"],
  existingCodes: ["DEF-001", "DEF-002"],
  defaultPhase: "UAT",
  createModules: true,
};

describe("suggestMapping", () => {
  it("mengenali header Indonesia dan Inggris, satu kolom per field", () => {
    const m = suggestMapping(["No", "Judul", "Deskripsi", "Module", "Priority", "Phase", "Status", "PIC", "Tester", "Tanggal", "Catatan"]);
    expect(m).toEqual({
      0: "code",
      1: "title",
      2: "description",
      3: "module",
      4: "severity",
      5: "phase",
      6: "status",
      7: "assignee",
      8: "reporter",
      9: "createdAt",
    });
  });

  it("header ekspor terpetakan semua", () => {
    const m = suggestMapping(["Kode", "Judul", "Deskripsi", "Modul", "Severity", "Fase", "Status", "Assignee", "Pelapor", "Dibuat", "Diperbaiki", "Ditutup", "Reopen"]);
    expect(Object.values(m)).toHaveLength(13);
    expect(m[12]).toBe("reopenCount");
    expect(m[11]).toBe("closedAt");
  });
});

describe("normalisasi nilai", () => {
  it("severity", () => {
    expect(normalizeSeverity("HIGH")).toBe("High");
    expect(normalizeSeverity("kritis")).toBe("Critical");
    expect(normalizeSeverity("P3")).toBe("Medium");
    expect(normalizeSeverity("apa")).toBeNull();
  });
  it("status", () => {
    expect(normalizeStatus("in-progress")).toBe("In Progress");
    expect(normalizeStatus("Selesai")).toBe("Closed");
    expect(normalizeStatus("Re-open")).toBe("Reopened");
    expect(normalizeStatus("")).toBeNull();
  });
  it("tanggal: Date, serial Excel, dd/mm/yyyy, ISO", () => {
    expect(parseDate(new Date("2026-11-14T09:00:00"))).toEqual(new Date("2026-11-14T09:00:00"));
    expect(parseDate(46340)).toEqual(new Date(Date.UTC(2026, 10, 14)));
    expect(parseDate("14/11/2026 09:30")).toEqual(new Date(2026, 10, 14, 9, 30));
    expect(parseDate("2026-11-14")).toBeInstanceOf(Date);
    expect(parseDate("kemarin")).toBe("invalid");
    expect(parseDate("")).toBeNull();
  });
});

describe("normalizeRows", () => {
  const mapping: ColumnMapping = { 0: "code", 1: "title", 2: "module", 3: "severity", 4: "phase", 5: "status", 6: "createdAt" };

  it("baris valid, kode lama terdeteksi, modul baru ditandai", () => {
    const rows = normalizeRows(
      [
        ["def-1", "Login gagal", "login", "high", "sit", "closed", "01/11/2026"],
        ["", "Tombol hilang", "Vendor", "", "", "", ""],
        [null, null, null, null, null, null, null],
      ],
      mapping,
      ctx,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      rowNumber: 2,
      code: "DEF-001",
      existing: true,
      module: "Login",
      newModule: false,
      severity: "High",
      phase: "SIT",
      status: "Closed",
      errors: [],
    });
    expect(rows[1]).toMatchObject({
      rowNumber: 3,
      code: null,
      module: "Vendor",
      newModule: true,
      severity: "Medium",
      phase: "UAT",
      status: "Open",
      errors: [],
    });
    expect(rows[1].warnings).toEqual(["Severity kosong, dipakai Medium", "Fase kosong, dipakai UAT"]);
  });

  it("error: judul kosong, fase asing, severity asing, kode ganda, tanggal rusak", () => {
    const rows = normalizeRows(
      [
        ["DEF-009", "", "", "urgent", "PROD", "open", "besok"],
        ["DEF-009", "Dua", "", "low", "UAT", "open", ""],
      ],
      mapping,
      ctx,
    );
    expect(rows[0].errors).toEqual([
      "Judul kosong",
      'Severity "urgent" tidak dikenal',
      'Fase "PROD" tidak ada di project (SIT, UAT, BETA)',
      'Tanggal dibuat "besok" tidak bisa dibaca',
    ]);
    expect(rows[1].errors).toEqual(["Kode DEF-009 muncul dua kali di file"]);
  });

  it("modul tak dikenal tanpa createModules -> peringatan, tanpa modul", () => {
    const rows = normalizeRows([["", "X", "Baru", "low", "SIT", "open", ""]], mapping, { ...ctx, createModules: false });
    expect(rows[0].module).toBeNull();
    expect(rows[0].warnings).toContain('Modul "Baru" tidak dikenal, disimpan tanpa modul');
  });

  it("summarizeImport", () => {
    const rows = normalizeRows(
      [
        ["DEF-001", "A", "", "low", "SIT", "open", ""],
        ["", "B", "Baru", "low", "SIT", "open", ""],
        ["", "", "", "", "", "", ""],
        ["DEF-002", "", "", "low", "SIT", "open", ""],
      ],
      mapping,
      ctx,
    );
    expect(summarizeImport(rows, "update")).toEqual({ total: 3, valid: 2, invalid: 1, toCreate: 1, toUpdate: 1, newModules: ["Baru"], warnings: 0 });
    expect(summarizeImport(rows, "skip")).toMatchObject({ toCreate: 1, toUpdate: 0 });
    expect(summarizeImport(rows, "create")).toMatchObject({ toCreate: 2, toUpdate: 0 });
  });
});

describe("round-trip ekspor -> impor", () => {
  const sample: ExportDefect[] = [
    {
      code: "DEF-001",
      title: "Login gagal saat password mengandung '&'",
      description: "Langkah:\nHasil:\nHarapan:",
      moduleName: "Login",
      severity: "High",
      phaseFound: "SIT",
      status: "Closed",
      assignee: "Andi",
      reporter: "Putri (QA)",
      createdAt: new Date(2026, 8, 1, 9, 30),
      fixedAt: new Date(2026, 8, 3, 14, 0),
      closedAt: new Date(2026, 8, 5, 10, 15),
      reopenCount: 1,
    },
    {
      code: "DEF-002",
      title: "Tombol hilang",
      description: "",
      moduleName: null,
      severity: "Low",
      phaseFound: "UAT",
      status: "Open",
      assignee: null,
      reporter: null,
      createdAt: new Date(2026, 9, 20, 8, 0),
      fixedAt: null,
      closedAt: null,
      reopenCount: 0,
    },
  ];

  it("semua kolom kembali utuh lewat suggestMapping + normalizeRows", async () => {
    const buf = await buildExportWorkbook("Proyek", sample, [
      { code: "DEF-001", fromStatus: null, toStatus: "Open", changedAt: sample[0].createdAt },
    ]);
    const sheet = await readWorkbook(buf);
    expect(sheet.sheetName).toBe("Defects");
    const mapping = suggestMapping(sheet.headers);
    expect(Object.keys(mapping)).toHaveLength(13);

    const rows = normalizeRows(sheet.rows, mapping, {
      phases: ["SIT", "UAT"],
      modules: ["Login"],
      existingCodes: [],
      defaultPhase: "SIT",
      createModules: true,
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);

    const back = rows.map((r) => ({
      code: r.code,
      title: r.title,
      description: r.description,
      moduleName: r.module,
      severity: r.severity,
      phaseFound: r.phase,
      status: r.status,
      assignee: r.assignee,
      reporter: r.reporter,
      createdAt: r.createdAt,
      fixedAt: r.fixedAt,
      closedAt: r.closedAt,
      reopenCount: r.reopenCount,
    }));
    expect(back).toEqual(sample);
  });
});
