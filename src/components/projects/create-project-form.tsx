"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/actions/projects";

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProject, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama project</Label>
        <Input id="name" name="name" placeholder="Contoh: Portal E-Procurement" required minLength={2} maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="modules">
          Modul <span className="font-normal text-muted-foreground">(opsional, satu per baris)</span>
        </Label>
        <Textarea
          id="modules"
          name="modules"
          rows={4}
          placeholder={"Autentikasi\nDashboard\nLaporan"}
          className="font-sans"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Fase default: SIT → UAT → REGRESI → BETA → PROD. Bisa diubah nanti di Pengaturan.
      </p>
      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Membuat…" : "Buat project"}
        </Button>
      </div>
    </form>
  );
}
