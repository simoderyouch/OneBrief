import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_BYTES } from "./constants";

/** When the filename has no extension, infer from browser MIME type */
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/heic": "heic",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "image/vnd.adobe.photoshop": "psd",
  "application/postscript": "eps",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function getExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() || "";
  const i = base.lastIndexOf(".");
  if (i <= 0) return "";
  return base.slice(i + 1).toLowerCase();
}

function resolvedExtension(file: { name: string; size: number; type?: string }): string {
  const fromName = getExtension(file.name);
  if (fromName) return fromName;
  const mime = (file.type || "").split(";")[0]?.trim().toLowerCase() || "";
  return MIME_TO_EXT[mime] || "";
}

export function validateUploadFile(file: { name: string; size: number; type?: string }): {
  ok: true;
} | {
  ok: false;
  error: string;
} {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)` };
  }
  const ext = resolvedExtension(file);
  if (!ext || !ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `File type not allowed (.${getExtension(file.name) || "no extension"}). Allowed types include: pdf, png, jpg, psd, ai, zip, svg, mp4, and more — see server config.`,
    };
  }
  return { ok: true };
}
