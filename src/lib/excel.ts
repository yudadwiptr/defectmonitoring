/**
 * Baca/tulis file .xlsx dengan exceljs. Hanya untuk server (route handler,
 * server action, test). Logika pemetaan ada di excel-import.ts.
 */
import ExcelJS from "exceljs";
import { EXPORT_HEADERS, IMPORT_FIELDS, type CellValue, type ImportField } from "./excel-import";

export interface ExportDefect {
  code: string;
  title: string;
  description: string;
  moduleName: string | null;
  severity: string;
  phaseFound: string;
  status: string;
  assignee: string | null;
  reporter: string | null;
  createdAt: Date;
  fixedAt: Date | null;
  closedAt: Date | null;
  reopenCount: number;
}

export interface ExportHistory {
  code: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
}

const DATE_FMT = "dd/mm/yyyy hh:mm";

/** Urutan kolom sheet Defects mengikuti IMPORT_FIELDS supaya round-trip rapi. */
export async function buildExportWorkbook(
  projectName: string,
  defects: ExportDefect[],
  history: ExportHistory[] = [],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Defect Monitor";
  wb.created = new Date();

  const ws = wb.addWorksheet("Defects", { views: [{ state: "frozen", ySplit: 1 }] });
  const widths: Record<ImportField, number> = {
    code: 10, title: 48, description: 60, module: 16, severity: 10, phase: 10, status: 12,
    assignee: 14, reporter: 14, createdAt: 18, fixedAt: 18, closedAt: 18, reopenCount: 8,
  };
  ws.columns = IMPORT_FIELDS.map((f) => ({ header: EXPORT_HEADERS[f], key: f, width: widths[f] }));
  ws.getRow(1).font = { bold: true };

  for (const d of defects) {
    const row = ws.addRow({
      code: d.code,
      title: d.title,
      description: d.description,
      module: d.moduleName ?? "",
      severity: d.severity,
      phase: d.phaseFound,
      status: d.status,
      assignee: d.assignee ?? "",
      reporter: d.reporter ?? "",
      createdAt: d.createdAt,
      fixedAt: d.fixedAt ?? "",
      closedAt: d.closedAt ?? "",
      reopenCount: d.reopenCount,
    });
    for (const key of ["createdAt", "fixedAt", "closedAt"] as const) {
      row.getCell(key).numFmt = DATE_FMT;
    }
    row.getCell("description").alignment = { wrapText: true, vertical: "top" };
  }
  ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + IMPORT_FIELDS.length)}1` };

  if (history.length) {
    const hs = wb.addWorksheet("Riwayat status", { views: [{ state: "frozen", ySplit: 1 }] });
    hs.columns = [
      { header: "Kode", key: "code", width: 10 },
      { header: "Dari", key: "from", width: 14 },
      { header: "Ke", key: "to", width: 14 },
      { header: "Waktu", key: "at", width: 18 },
    ];
    hs.getRow(1).font = { bold: true };
    for (const h of history) {
      const row = hs.addRow({ code: h.code, from: h.fromStatus ?? "", to: h.toStatus, at: h.changedAt });
      row.getCell("at").numFmt = DATE_FMT;
    }
  }

  const info = wb.addWorksheet("Info");
  info.addRow(["Project", projectName]);
  info.addRow(["Diekspor", new Date()]);
  info.addRow(["Jumlah defect", defects.length]);
  info.getColumn(1).width = 16;
  info.getColumn(2).width = 40;

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: CellValue[][];
}

function cellToValue(v: ExcelJS.CellValue): CellValue {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v) return cellToValue(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text);
    if ("error" in v) return null;
    return String(v);
  }
  return v as string | number | boolean;
}

/** Baca sheet pertama yang punya header; baris 1 dianggap header. */
export async function readWorkbook(buffer: ArrayBuffer | Buffer, preferredSheet = "Defects"): Promise<ParsedSheet> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);
  const ws = wb.getWorksheet(preferredSheet) ?? wb.worksheets.find((w) => w.rowCount > 0) ?? wb.worksheets[0];
  if (!ws) throw new Error("File tidak punya sheet");

  const headerRow = ws.getRow(1);
  const width = Math.max(ws.columnCount, headerRow.cellCount);
  const headers: string[] = [];
  for (let c = 1; c <= width; c++) {
    const v = cellToValue(headerRow.getCell(c).value);
    headers.push(v === null ? "" : String(v).trim());
  }
  while (headers.length && headers[headers.length - 1] === "") headers.pop();
  if (headers.length === 0) throw new Error("Baris pertama (header) kosong");

  const rows: CellValue[][] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: CellValue[] = [];
    for (let c = 1; c <= headers.length; c++) cells.push(cellToValue(row.getCell(c).value));
    rows.push(cells);
  }
  // buang baris kosong di ekor
  while (rows.length && rows[rows.length - 1].every((c) => c === null || c === "")) rows.pop();

  return { sheetName: ws.name, headers, rows };
}
