"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEVERITIES, SEVERITY_HINT, type Severity } from "@/lib/constants";
import { createDefect, updateDefect, type DefectActionResult } from "@/lib/actions/defects";
import { SEVERITY_CLASS } from "./badges";
import { AttachmentPicker, type PendingFile } from "./attachment-picker";

export interface DefectFormValues {
  title: string;
  description: string;
  moduleId: string;
  severity: Severity;
  phaseFound: string;
  assignee: string;
  reporter: string;
}

interface DefectFormProps {
  projectId: string;
  modules: { id: string; name: string }[];
  phases: string[];
  defaults: DefectFormValues;
  mode: "create" | "edit";
  defectId?: string;
  /** Dipanggil setelah sukses. `keepOpen` true jika pengguna memilih "lanjut lagi". */
  onSaved?: (result: Extract<DefectActionResult, { ok: true }>, keepOpen: boolean) => void;
  autoFocusTitle?: boolean;
}

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function DefectForm({
  projectId,
  modules,
  phases,
  defaults,
  mode,
  defectId,
  onSaved,
  autoFocusTitle,
}: DefectFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [severity, setSeverity] = useState<Severity>(defaults.severity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const keepOpenRef = useRef(false);

  function submit(keepOpen: boolean) {
    const form = formRef.current;
    if (!form) return;
    keepOpenRef.current = keepOpen;
    const fd = new FormData(form);
    fd.set("severity", severity);
    for (const f of files) fd.append("files", f.file, f.file.name);
    setError(null);

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createDefect(projectId, fd)
          : await updateDefect(defectId!, fd);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? (mode === "create" ? `${res.code} dicatat` : "Perubahan disimpan"));
      for (const f of files) if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      setFiles([]);
      if (mode === "create") {
        // Reset isian yang berubah tiap defect, pertahankan modul/fase/severity untuk input beruntun
        (form.elements.namedItem("title") as HTMLInputElement).value = "";
        (form.elements.namedItem("description") as HTMLTextAreaElement).value = "";
        if (keepOpen) titleRef.current?.focus();
      }
      router.refresh();
      onSaved?.(res, keepOpen);
    });
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          submit(mode === "create");
        }
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Judul</Label>
        <Input
          ref={titleRef}
          id="title"
          name="title"
          defaultValue={defaults.title}
          placeholder="Apa yang rusak, di mana. Contoh: Tombol simpan tidak respon di form vendor"
          autoFocus={autoFocusTitle}
          required
          minLength={3}
          maxLength={200}
          className="h-10 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="moduleId">Modul</Label>
          <select id="moduleId" name="moduleId" defaultValue={defaults.moduleId} className={selectClass}>
            <option value="">Tanpa modul</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phaseFound">Fase ditemukan</Label>
          <select id="phaseFound" name="phaseFound" defaultValue={defaults.phaseFound} className={selectClass}>
            {phases.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">Severity</legend>
        <div role="radiogroup" className="grid grid-cols-4 gap-1.5">
          {SEVERITIES.map((s) => {
            const active = severity === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                title={SEVERITY_HINT[s]}
                onClick={() => setSeverity(s)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-all outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? cn("border-transparent ring-2 ring-inset", SEVERITY_CLASS[s].pill)
                    : "border-input text-muted-foreground hover:bg-muted/60",
                )}
              >
                <span className={cn("size-2 rounded-full", SEVERITY_CLASS[s].dot)} />
                {s}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{SEVERITY_HINT[severity]}</p>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
          placeholder={"Langkah:\nHasil:\nHarapan:"}
          rows={5}
          maxLength={5000}
          className="min-h-28 font-sans"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Lampiran {mode === "edit" && <span className="font-normal text-muted-foreground">(tambahan)</span>}</Label>
        <AttachmentPicker files={files} onChange={setFiles} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reporter">Pelapor</Label>
          <Input id="reporter" name="reporter" defaultValue={defaults.reporter} placeholder="Nama QA" maxLength={60} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assignee">Assignee</Label>
          <Input id="assignee" name="assignee" defaultValue={defaults.assignee} placeholder="Nama developer" maxLength={60} />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <span className="mr-auto text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 font-mono">Ctrl</kbd>+
          <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd>{" "}
          {mode === "create" ? "simpan dan lanjut" : "simpan"}
        </span>
        {mode === "create" && (
          <Button type="button" variant="outline" disabled={pending} onClick={() => submit(true)}>
            Simpan, lanjut lagi
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : mode === "create" ? "Simpan defect" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
