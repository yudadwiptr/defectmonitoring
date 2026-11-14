"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { deleteProject, renameProject } from "@/lib/actions/projects";

export function RenameProjectForm({ projectId, name }: { projectId: string; name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await renameProject(projectId, value);
          if (res.ok) {
            toast.success(res.message);
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="project-name">Nama project</Label>
        <Input id="project-name" value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} />
      </div>
      <Button type="submit" disabled={pending || value.trim() === name || value.trim().length < 2}>
        Simpan nama
      </Button>
    </form>
  );
}

export function DeleteProjectButton({ projectId, name, defectCount }: { projectId: string; name: string; defectCount: number }) {
  return (
    <ConfirmDialog
      title={`Hapus project ${name}?`}
      description={`Semua ${defectCount} defect, modul, riwayat, dan lampiran ikut terhapus permanen. Tidak bisa dibatalkan.`}
      confirmLabel="Hapus project"
      onConfirm={() => deleteProject(projectId)}
      trigger={
        <Button variant="destructive">
          <Trash2 data-icon="inline-start" />
          Hapus project
        </Button>
      }
    />
  );
}
