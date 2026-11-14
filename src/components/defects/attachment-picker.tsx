"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardPaste, FileText, ImagePlus, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";

export interface PendingFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface AttachmentPickerProps {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  /** Dengarkan paste di seluruh jendela (bukan hanya saat fokus di area ini). */
  listenWindowPaste?: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,application/pdf";

function toPending(file: File): PendingFile {
  const isImage = file.type.startsWith("image/");
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: isImage ? URL.createObjectURL(file) : null,
  };
}

/** Area lampiran: paste dari clipboard, drag-drop, atau pilih file. */
export function AttachmentPicker({ files, onChange, listenWindowPaste = true }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [flash, setFlash] = useState(false);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  function add(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) => f.size > 0);
    if (!incoming.length) return;
    onChange([...filesRef.current, ...incoming.map(toPending)]);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  function remove(id: string) {
    const target = filesRef.current.find((f) => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(filesRef.current.filter((f) => f.id !== id));
  }

  useEffect(() => {
    if (!listenWindowPaste) return;
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const images: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) images.push(new File([f], `tempel-${Date.now()}.${f.type.split("/")[1] ?? "png"}`, { type: f.type }));
        }
      }
      if (images.length) {
        e.preventDefault();
        add(images);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenWindowPaste]);

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-sm transition-colors outline-none",
          "hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
          dragging && "border-primary bg-accent",
          flash && "border-st-closed bg-st-closed/10",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {flash ? <ClipboardPaste className="size-4 text-st-closed" /> : <ImagePlus className="size-4" />}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">Tempel screenshot di sini</span>
          <span className="text-xs text-muted-foreground">
            Ctrl+V dari clipboard, seret file, atau klik untuk memilih. PNG, JPG, GIF, WebP, PDF maks. 10 MB.
          </span>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="group relative flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border bg-muted"
              title={`${f.file.name} (${formatBytes(f.file.size)})`}
            >
              {f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.previewUrl} alt={f.file.name} className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 px-2 text-center text-[11px] text-muted-foreground">
                  <FileText className="size-5" />
                  <span className="line-clamp-2">{f.file.name}</span>
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`Hapus ${f.file.name}`}
                className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => remove(f.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
