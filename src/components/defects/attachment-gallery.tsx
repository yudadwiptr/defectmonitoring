"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addAttachments, deleteAttachment } from "@/lib/actions/defects";
import { formatBytes } from "@/lib/format";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { AttachmentPicker, type PendingFile } from "./attachment-picker";

interface AttachmentItem {
  id: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export function AttachmentGallery({ defectId, items }: { defectId: string; items: AttachmentItem[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [pending, startTransition] = useTransition();

  function upload() {
    if (!files.length) return;
    const fd = new FormData();
    for (const f of files) fd.append("files", f.file, f.file.name);
    startTransition(async () => {
      const res = await addAttachments(defectId, fd);
      if (res.ok) {
        toast.success(res.message ?? "Lampiran ditambahkan");
        for (const f of files) if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        setFiles([]);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function remove(id: string) {
    const res = await deleteAttachment(id);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada lampiran.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((a) => {
            const isImage = a.mimeType.startsWith("image/");
            return (
              <li key={a.id} className="group relative overflow-hidden rounded-lg border bg-muted">
                <a
                  href={a.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-28 items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  title={`${a.fileName} (${formatBytes(a.size)})`}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.filePath} alt={a.fileName} className="size-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 px-2 text-center text-xs text-muted-foreground">
                      <FileText className="size-6" />
                      <span className="line-clamp-2">{a.fileName}</span>
                    </span>
                  )}
                </a>
                <ConfirmDialog
                  title="Hapus lampiran?"
                  description={`${a.fileName} akan dihapus permanen.`}
                  confirmLabel="Hapus"
                  onConfirm={() => remove(a.id)}
                  trigger={
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      aria-label={`Hapus ${a.fileName}`}
                      className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <AttachmentPicker files={files} onChange={setFiles} />
      {files.length > 0 && (
        <div className="flex justify-end">
          <Button size="sm" onClick={upload} disabled={pending}>
            <Upload data-icon="inline-start" />
            {pending ? "Mengunggah…" : `Unggah ${files.length} file`}
          </Button>
        </div>
      )}
    </div>
  );
}
