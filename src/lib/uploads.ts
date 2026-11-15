import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function isAllowedAttachment(file: File): boolean {
  return file.type in EXT_BY_MIME;
}

export interface SavedAttachment {
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/** Simpan file ke public/uploads/<defectId>/ dan kembalikan metadata untuk DB. */
export async function saveAttachmentFile(file: File, defectId: string): Promise<SavedAttachment> {
  if (!isAllowedAttachment(file)) {
    throw new Error(`Tipe file ${file.type || "tidak dikenal"} tidak didukung (PNG, JPG, GIF, WebP, PDF)`);
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Ukuran ${file.name} melebihi 10 MB`);
  }
  const ext = EXT_BY_MIME[file.type];
  const dir = path.join(UPLOAD_ROOT, defectId);
  const stored = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      throw new Error("Server ini tidak bisa menyimpan file (sistem file hanya-baca), lampiran dilewati");
    }
    throw e;
  }
  return {
    filePath: `/uploads/${defectId}/${stored}`,
    fileName: file.name && file.name !== "blob" ? file.name : `screenshot.${ext}`,
    mimeType: file.type,
    size: file.size,
  };
}

/** Hapus file fisik; tidak error jika sudah tidak ada. */
export async function deleteAttachmentFile(filePath: string): Promise<void> {
  if (!filePath.startsWith("/uploads/")) return;
  const abs = path.join(process.cwd(), "public", filePath);
  await rm(abs, { force: true });
}

/** Hapus seluruh folder lampiran sebuah defect. */
export async function deleteDefectUploadDir(defectId: string): Promise<void> {
  await rm(path.join(UPLOAD_ROOT, defectId), { recursive: true, force: true });
}
