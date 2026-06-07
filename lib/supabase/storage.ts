/**
 * lib/supabase/storage.ts
 *
 * File upload and delete utilities backed by Supabase Storage.
 * Bucket: "project-files" (public, 50 MB limit per file).
 *
 * Storage path structure:
 *   projects/{projectId}/{timestamp}-{sanitisedFilename}
 *
 * Public URL pattern (Supabase):
 *   https://{project}.supabase.co/storage/v1/object/public/project-files/{path}
 */
import { supabase } from "./client";

export const BUCKET = "project-files";

export interface UploadResult {
  /** Public HTTPS URL for the file */
  url: string;
  /** Storage path used as the unique identifier — pass to deleteFile() */
  storagePath: string;
  /** File extension (without the dot) */
  format: string;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Upload a file to Supabase Storage.
 *
 * @param file       The file (browser File object or raw Buffer)
 * @param projectId  Scopes the file under projects/{projectId}/
 * @returns          Public URL, storage path, format and size
 */
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

  // Sanitise name: replace anything that isn't alphanumeric, dot, dash or underscore
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `projects/${projectId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const ext = originalName.split(".").pop() ?? "bin";

  return {
    url: data.publicUrl,
    storagePath,
    format: ext,
    sizeBytes,
  };
}

/**
 * Delete a file from Supabase Storage.
 *
 * @param storagePath  The path returned by uploadFile() (e.g. "projects/abc/1234-logo.pdf")
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

  if (error) {
    // Log but don't throw — the DB soft-delete is the source of truth.
    // Storage cleanup is best-effort.
    console.error(`Storage delete failed for ${storagePath}:`, error.message);
  }
}

export interface FileBufferResult {
  data: Buffer;
  contentType: string;
}

/**
 * Download file bytes from Supabase Storage (private or public bucket).
 */
export async function fetchFileBuffer(storagePath: string): Promise<FileBufferResult> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

  if (error || !data) {
    throw new Error(error?.message || "Storage download failed");
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    contentType: data.type || "application/octet-stream",
  };
}

/**
 * Fetch file bytes — Supabase path first, legacy public URL fallback.
 */
export async function fetchFileForRecord(file: {
  publicId: string;
  cloudinaryUrl: string;
  mimeType?: string | null;
}): Promise<FileBufferResult> {
  try {
    return await fetchFileBuffer(file.publicId);
  } catch {
    if (file.cloudinaryUrl.startsWith("http")) {
      const res = await fetch(file.cloudinaryUrl);
      if (!res.ok) throw new Error("File not found");
      const buf = Buffer.from(await res.arrayBuffer());
      return {
        data: buf,
        contentType: file.mimeType || res.headers.get("content-type") || "application/octet-stream",
      };
    }
    throw new Error("File not found");
  }
}

/**
 * Create a short-lived signed URL (for redirects when streaming is not needed).
 */
export async function createSignedFileUrl(
  storagePath: string,
  expiresInSeconds: number
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not create signed URL");
  }

  return data.signedUrl;
}
