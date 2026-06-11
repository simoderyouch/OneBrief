// Auto-selects storage backend:
// - STORAGE_PROVIDER=spaces  → DigitalOcean Spaces (production)
// - default                  → local disk (development)

export type { UploadResult, FileBufferResult } from "./local";

const useSpaces = process.env.STORAGE_PROVIDER === "spaces";

const storage = useSpaces
  ? await import("./spaces")
  : await import("./local");

export const { uploadFile, deleteFile, fetchFileBuffer, fetchFileForRecord, STORAGE_ROOT } =
  storage;
