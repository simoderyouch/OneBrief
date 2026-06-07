/** Default client link validity from project creation / token rotation */
export const CLIENT_TOKEN_TTL_DAYS = 90;

/** Max upload size for project files (bytes) */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Allowed extensions for uploads (lowercase, no dot) — design + common deliverables */
export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "fig",
  "svg",
  "psd",
  "ai",
  "eps",
  "indd",
  "xd",
  "sketch",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "mp4",
  "mov",
  "webm",
  "mkv",
  "mp3",
  "wav",
  "ttf",
  "otf",
  "woff",
  "woff2",
  "bmp",
  "tif",
  "tiff",
  "heic",
  "glb",
  "obj",
  "blend",
]);

/** Public client routes: max requests per token per hour */
export const PUBLIC_RATE_LIMIT_PER_HOUR = 100;

/** Short-lived signed URL TTL for file delivery (seconds) */
export const SIGNED_URL_TTL_SECONDS = 300;

/** Default validity for per-file share links (days) */
export const FILE_SHARE_LINK_TTL_DAYS = 30;

/** Image formats eligible for watermarked preview (PROTECTED tier) */
export const IMAGE_PREVIEW_FORMATS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "svg",
]);
