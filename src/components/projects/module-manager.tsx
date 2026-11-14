"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { addModule, deleteModule, renameModule } from "@/lib/actions/projects";

interface ModuleItem {
  id: string;
  name: string;
  defectCount: number;
}

export function ModuleManager({ projectId, modules }: { projectId: string; modules: ModuleItem[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        if (res.message) toast.success(res.message);
        after?.();
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y rounded-xl border">
        {modules.length === 0 && (
          <li className="px-3 py-3 text-sm text-muted-foreground">Belum ada modul. Tambahkan di bawah.</li>
        )}
        {modules.map((m) => (
          <li key={m.id} className="flex items-center gap-2 px-3 py-2">
            {editing?.id === m.id ? (
              <form
                className="flex flex-1 items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => renameModule(m.id, editing.name), () => setEditing(null));
                }}
              >
                <Input
                  autoFocus
                  value={editing.name}
                  onChange={(e) => setEditing({ id: m.id, name: e.target.value })}
                  className="h-8"
                  maxLength={60}
                />
                <Button type="submit" size="icon-sm" variant="default" aria-label="Simpan" disabled={pending}>
                  <Check />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" aria-label="Batal" onClick={() => setEditing(null)}>
                  <X />
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground tnum">{m.defectCount} defect</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Ubah nama ${m.name}`}
                  onClick={() => setEditing({ id: m.id, name: m.name })}
                >
                  <Pencil />
                </Button>
                <ConfirmDialog
                  title={`Hapus modul ${m.name}?`}
                  description={
                    m.defectCount > 0
                      ? `${m.defectCount} defect di modul ini akan tetap ada, tapi jadi "tanpa modul".`
                      : "Modul ini belum dipakai defect mana pun."
                  }
                  confirmLabel="Hapus modul"
                  onConfirm={async () => {
                    const res = await deleteModule(m.id);
                    if (res.ok) {
                      toast.success(res.message);
                      router.refresh();
                    } else toast.error(res.error);
                  }}
                  trigger={
                    <Button size="icon-sm" variant="ghost" aria-label={`Hapus ${m.name}`}>
                      <Trash2 />
                    </Button>
                  }
                />
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          run(() => addModule(projectId, newName), () => setNewName(""));
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama modul baru"
          maxLength={60}
          className="h-9"
          aria-label="Nama modul baru"
        />
        <Button type="submit" disabled={pending || !newName.trim()}>
          <Plus data-icon="inline-start" />
          Tambah
        </Button>
      </form>
    </div>
  );
}
