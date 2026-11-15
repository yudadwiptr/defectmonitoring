"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Layers, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/actions/projects";

const QUICK_MODULES = [
  "Login & Profil",
  "Halaman Utama",
  "Transaksi & Keranjang",
  "Pembayaran",
  "Laporan & Ekspor",
  "Notifikasi",
];

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProject, null);
  const [modulesText, setModulesText] = useState("");

  function toggleQuickModule(mod: string) {
    const lines = modulesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.includes(mod)) {
      setModulesText(lines.filter((l) => l !== mod).join("\n"));
    } else {
      setModulesText([...lines, mod].join("\n"));
    }
  }

  const activeLines = modulesText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-sm font-semibold">
          Nama Aplikasi / Project
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Contoh: Aplikasi Kasir Toko, Portal HRD…"
          required
          minLength={2}
          maxLength={80}
          className="h-10 bg-background/80"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="modules" className="text-sm font-semibold">
            Bagian / Modul Aplikasi
          </Label>
          <span className="text-[11px] text-muted-foreground">Opsional, 1 per baris</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_MODULES.map((mod) => {
            const selected = activeLines.includes(mod);
            return (
              <button
                key={mod}
                type="button"
                onClick={() => toggleQuickModule(mod)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/12 text-primary shadow-2xs"
                    : "border-border/80 bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Plus className={`size-3 transition-transform ${selected ? "rotate-45 text-primary" : ""}`} />
                {mod}
              </button>
            );
          })}
        </div>

        <Textarea
          id="modules"
          name="modules"
          rows={3}
          value={modulesText}
          onChange={(e) => setModulesText(e.target.value)}
          placeholder={"Ketik nama bagian aplikasi atau klik pilihan di atas…\nContoh:\nLogin & Profil\nPembayaran"}
          className="font-sans text-sm bg-background/80"
        />
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Layers className="size-3.5" />
          Tahap Pengujian Otomatis
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-medium">
          {["SIT", "UAT", "REGRESI", "BETA", "PROD"].map((ph, idx, arr) => (
            <span key={ph} className="inline-flex items-center gap-1">
              <span className="rounded-md border border-primary/20 bg-background px-2 py-0.5 font-display font-semibold text-foreground shadow-2xs">
                {ph}
              </span>
              {idx < arr.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Urutan tahap ini bisa disesuaikan kapan saja di menu Pengaturan.
        </p>
      </div>

      {state && !state.ok && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-10 w-full font-display font-semibold shadow-sm">
        <Sparkles data-icon="inline-start" />
        {pending ? "Menyiapkan ruang kerja…" : "Buat Project Sekarang"}
      </Button>
    </form>
  );
}
