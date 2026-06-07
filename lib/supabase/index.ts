/**
 * lib/supabase/index.ts
 *
 * Public API for the supabase module.
 * Import from here in API routes and server components.
 *
 * @example
 *   import { supabase, uploadFile, deleteFile } from "@/lib/supabase";
 */
export { supabase } from "./client";
export {
  uploadFile,
  deleteFile,
  fetchFileBuffer,
  fetchFileForRecord,
  createSignedFileUrl,
  BUCKET,
} from "./storage";
export type { UploadResult, FileBufferResult } from "./storage";
