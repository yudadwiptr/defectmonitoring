"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  FIELD_LABEL,
  IMPORT_FIELDS,
  normalizeRows,
  summarizeImport,
  type CellValue,
  type ColumnMapping,
  type ImportField,
} from "@/lib/excel-import";
import { commitImport, parseImportFile, type CommitResult, type ParseResult } from "@/lib/actions/import";
import { SeverityPill, StatusLabel } from "@/components/defects/badges";
import { formatDate } from "@/lib/format";

interface ImportWizardProps {
  projectId: string;
  phases: string[];
  activePhase: string;
  modules: string[];
}

type Parsed = Extract<ParseResult, { ok: true }>;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function cellText(v: CellValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return formatDate(v);
  return String(v);
}

export function ImportWizard({ projectId, phases, activePhase, modules }: ImportWizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [onDuplicate, setOnDuplicate] = useState<"update" | "skip" | "create">("update");
  const [createModules, setCreateModules] = useState(true);
  const [result, setResult] = useState<Extract<CommitResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  function parse() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Pilih file .xlsx dulu");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await parseImportFile(projectId, fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setParsed(res);
      setMapping(res.mapping);
      setResult(null);
    });
  }

  const rows = useMemo(() => {
    if (!parsed) return [];
    return normalizeRows(parsed.rows, mapping, {
      phases,
      modules,
      existingCodes: parsed.existingCodes,
      defaultPhase: activePhase,
      createModules,
    });
  }, [parsed, mapping, phases, modules, activePhase, createModules]);

  const summary = useMemo(() => summarizeImport(rows, onDuplicate), [rows, onDuplicate]);
  const mappedFields = Object.values(mapping);
  const duplicateField = mappedFields.find((f, i) => mappedFields.indexOf(f) !== i);
  const titleMapped = mappedFields.includes("title");
  const canImport = parsed && titleMapped && !duplicateField && summary.valid > 0 && !pending;

  function setField(col: number, field: ImportField | "") {
    setMapping((prev) => {
      const next = { ...prev };
      if (field === "") delete next[col];
      else next[col] = field;
      return next;
    });
  }

  function commit() {
    if (!parsed) return;
    startTransition(async () => {
      const res = await commitImport(projectId, { rows: parsed.rows, mapping, onDuplicate, createModules });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult(res);
      toast.success(`${res.created} dibuat, ${res.updated} diperbarui`);
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <CheckCircle2 className="size-5 text-st-closed" />
          Impor selesai
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          {[
            ["Dibuat", result.created],
            ["Diperbarui", result.updated],
            ["Dilewati", result.skipped],
            ["Baris error", result.invalid],
            ["Modul baru", result.modulesCreated],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border px-3 py-2">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-display text-2xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-2">
          <Button nativeButton={false} render={<Link href={`/projects/${projectId}/defects?scope=all`} />}>
            Lihat daftar defect
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setParsed(null);
              setResult(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Impor file lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-display text-base font-semibold">1. Pilih file</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
          Format .xlsx, baris pertama berisi nama kolom. File hasil ekspor aplikasi ini bisa langsung dipakai.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label="File Excel"
            className="text-sm file:mr-3 file:rounded-lg file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <Button onClick={parse} disabled={pending}>
            <FileSpreadsheet data-icon="inline-start" />
            {pending && !parsed ? "Membaca…" : "Baca file"}
          </Button>
          {parsed && (
            <span className="text-xs text-muted-foreground">
              {parsed.fileName} · sheet {parsed.sheetName} · {parsed.rows.length} baris
            </span>
          )}
        </div>
      </section>

      {parsed && (
        <>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-base font-semibold">2. Petakan kolom</h2>
            <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
              Tebakan otomatis dari nama kolom. Judul wajib. Severity kosong jadi Medium, fase kosong jadi {activePhase}, status kosong jadi Open.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Kolom di file</th>
                    <th className="px-2 py-2 font-medium">Contoh isi</th>
                    <th className="w-56 py-2 pl-2 font-medium">Masuk ke field</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.headers.map((h, col) => {
                    const samples = parsed.rows.slice(0, 2).map((r) => cellText(r[col])).filter(Boolean);
                    const field = mapping[col] ?? "";
                    const dup = field && duplicateField === field;
                    return (
                      <tr key={col} className="border-b last:border-b-0">
                        <td className="py-1.5 pr-3 font-medium">{h || <span className="text-muted-foreground">(kolom {col + 1})</span>}</td>
                        <td className="max-w-[320px] truncate px-2 py-1.5 text-muted-foreground">{samples.join(" · ")}</td>
                        <td className="py-1.5 pl-2">
                          <select
                            value={field}
                            onChange={(e) => setField(col, e.target.value as ImportField | "")}
                            aria-label={`Field untuk kolom ${h || col + 1}`}
                            className={cn(selectClass, dup && "border-sev-critical")}
                          >
                            <option value="">Abaikan</option>
                            {IMPORT_FIELDS.map((f) => (
                              <option key={f} value={f}>
                                {FIELD_LABEL[f]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!titleMapped && <p className="mt-2 text-sm text-sev-critical">Pilih kolom yang jadi Judul.</p>}
            {duplicateField && (
              <p className="mt-2 text-sm text-sev-critical">{FIELD_LABEL[duplicateField]} dipetakan ke lebih dari satu kolom.</p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <fieldset className="rounded-xl border p-3 text-sm">
                <legend className="px-1 text-xs text-muted-foreground">Kalau kode sudah ada di project</legend>
                {(
                  [
                    ["update", "Perbarui defect yang ada"],
                    ["skip", "Lewati baris itu"],
                    ["create", "Buat defect baru dengan kode baru"],
                  ] as const
                ).map(([v, label]) => (
                  <label key={v} className="flex items-center gap-2 py-0.5">
                    <input type="radio" name="dup" checked={onDuplicate === v} onChange={() => setOnDuplicate(v)} />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
                <input type="checkbox" className="mt-1" checked={createModules} onChange={(e) => setCreateModules(e.target.checked)} />
                <span>
                  Buat modul baru otomatis
                  <span className="block text-xs text-muted-foreground">Kalau dimatikan, modul yang tidak dikenal disimpan sebagai tanpa modul.</span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-base font-semibold">3. Preview</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Chip label="baris" value={summary.total} />
              <Chip label="akan dibuat" value={summary.toCreate} tone="good" />
              <Chip label="akan diperbarui" value={summary.toUpdate} />
              <Chip label="error (dilewati)" value={summary.invalid} tone={summary.invalid ? "bad" : undefined} />
              <Chip label="peringatan" value={summary.warnings} tone={summary.warnings ? "warn" : undefined} />
              {summary.newModules.length > 0 && <Chip label="modul baru" value={summary.newModules.join(", ")} />}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-2 font-medium">Baris</th>
                    <th className="px-2 py-2 font-medium">Kode</th>
                    <th className="px-2 py-2 font-medium">Judul</th>
                    <th className="px-2 py-2 font-medium">Modul</th>
                    <th className="px-2 py-2 font-medium">Severity</th>
                    <th className="px-2 py-2 font-medium">Fase</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Dibuat</th>
                    <th className="py-2 pl-2 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 25).map((r) => (
                    <tr key={r.rowNumber} className={cn("border-b last:border-b-0", r.errors.length && "bg-sev-critical/5")}>
                      <td className="py-1.5 pr-2 text-muted-foreground tnum">{r.rowNumber}</td>
                      <td className="px-2 py-1.5 font-display text-xs font-semibold">
                        {r.code ?? <span className="text-muted-foreground">baru</span>}
                        {r.existing && <span className="ml-1 text-[10px] font-normal text-muted-foreground">ada</span>}
                      </td>
                      <td className="max-w-[260px] truncate px-2 py-1.5">{r.title || <span className="text-sev-critical">–</span>}</td>
                      <td className="px-2 py-1.5">
                        {r.module ?? <span className="text-muted-foreground">–</span>}
                        {r.newModule && <span className="ml-1 text-[10px] text-primary">baru</span>}
                      </td>
                      <td className="px-2 py-1.5"><SeverityPill severity={r.severity} /></td>
                      <td className="px-2 py-1.5 font-display text-xs font-semibold">{r.phase}</td>
                      <td className="px-2 py-1.5"><StatusLabel status={r.status} /></td>
                      <td className="px-2 py-1.5 text-muted-foreground tnum">{r.createdAt ? formatDate(r.createdAt) : "sekarang"}</td>
                      <td className="py-1.5 pl-2 text-xs">
                        {r.errors.map((e) => (
                          <div key={e} className="text-sev-critical">{e}</div>
                        ))}
                        {r.warnings.map((w) => (
                          <div key={w} className="text-muted-foreground">{w}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 25 && (
                <p className="mt-2 text-xs text-muted-foreground">Menampilkan 25 dari {rows.length} baris. Semua baris valid tetap diimpor.</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {summary.invalid > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="size-3.5" />
                  {summary.invalid} baris error akan dilewati
                </span>
              )}
              <Button onClick={commit} disabled={!canImport}>
                <Upload data-icon="inline-start" />
                {pending ? "Mengimpor…" : `Impor ${summary.toCreate + summary.toUpdate} defect`}
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: number | string; tone?: "good" | "bad" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        tone === "good" && "border-st-closed/40 text-st-closed",
        tone === "bad" && "border-sev-critical/40 text-sev-critical",
        tone === "warn" && "border-sev-medium/50",
      )}
    >
      <span className="font-display text-sm font-semibold">{value}</span>
      {label}
    </span>
  );
}
