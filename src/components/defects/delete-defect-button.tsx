"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { deleteDefect } from "@/lib/actions/defects";

export function DeleteDefectButton({ defectId, code }: { defectId: string; code: string }) {
  return (
    <ConfirmDialog
      title={`Hapus ${code}?`}
      description="Defect, riwayat status, dan semua lampirannya akan dihapus permanen. Kalau defect ini ternyata bukan bug, lebih baik ubah statusnya ke Rejected supaya tetap tercatat."
      confirmLabel="Hapus permanen"
      onConfirm={() => deleteDefect(defectId)}
      trigger={
        <Button variant="destructive" size="sm">
          <Trash2 data-icon="inline-start" />
          Hapus
        </Button>
      }
    />
  );
}
