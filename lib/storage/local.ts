import fs from "fs/promises";
import path from "path";

export const STORAGE_ROOT =
  process.env.STORAGE_PATH ||
  path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads");

export interface UploadResult {
  /** Internal storage path — stored in File.publicId */
  storagePath: string;
  /** Same as storagePath for local storage (legacy field name: cloudinaryUrl) */
  url: string;
  format: string;
  sizeBytes: number;
}

function resolveStoragePath(storagePath: string): string {
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(STORAGE_ROOT, normalized);
  if (!full.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid storage path");
  }
  return full;
}

export async function uploadFile(
  file: File | Buffer,
  projectId: string
): Promise<UploadResult> {
  let buffer: Buffer;
  let originalName: string;
  let contentType: string;
  let sizeBytes: number;

  if (file instanceof File) {
    buffer = Buffer.from(await file.arrayBuffer());
    originalName = file.name;
    contentType = file.type || "application/octet-stream";
    sizeBytes = file.size;
  } else {
    buffer = file;
    originalName = `file-${Date.now()}`;
    contentType = "application/octet-stream";
    sizeBytes = buffer.length;
  }

  void contentType;

  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `projects/${projectId}/${Date.now()}-${safeName}`;
  const fullPath = resolveStoragePath(storagePath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);

  const ext = originalName.split(".").pop() ?? "bin";

  return {
    storagePath,
    url: storagePath,
    format: ext,
    sizeBytes,
  };
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await fs.unlink(resolveStoragePath(storagePath));
  } catch (err) {
    console.error(`Local storage delete failed for ${storagePath}:`, err);
  }
}

export interface FileBufferResult {
  data: Buffer;
  contentType: string;
}

export async function fetchFileBuffer(storagePath: string): Promise<FileBufferResult> {
  const fullPath = resolveStoragePath(storagePath);
  const data = await fs.readFile(fullPath);
  const ext = path.extname(fullPath).slice(1).toLowerCase();
  const contentType = mimeFromExt(ext);
  return { data, contentType };
}

export async function fetchFileForRecord(file: {
  publicId: string;
  cloudinaryUrl: string;
  mimeType?: string | null;
}): Promise<FileBufferResult> {
  try {
    const result = await fetchFileBuffer(file.publicId);
    return {
      data: result.data,
      contentType: file.mimeType || result.contentType,
    };
  } catch {
    if (file.cloudinaryUrl && file.cloudinaryUrl !== file.publicId) {
      try {
        return await fetchFileBuffer(file.cloudinaryUrl);
      } catch {
        /* fall through */
      }
    }
    throw new Error("File not found");
  }
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    zip: "application/zip",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  return map[ext] || "application/octet-stream";
}
