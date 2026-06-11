import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import type { UploadResult, FileBufferResult } from "./local";

function getClient(): S3Client {
  return new S3Client({
    endpoint: `https://${process.env.SPACES_REGION}.digitaloceanspaces.com`,
    region: process.env.SPACES_REGION ?? "nyc3",
    credentials: {
      accessKeyId: process.env.SPACES_KEY ?? "",
      secretAccessKey: process.env.SPACES_SECRET ?? "",
    },
  });
}

function bucket(): string {
  return process.env.SPACES_BUCKET ?? "";
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
  return map[ext] ?? "application/octet-stream";
}

export const STORAGE_ROOT = "spaces://";

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

  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `projects/${projectId}/${Date.now()}-${safeName}`;
  const ext = originalName.split(".").pop() ?? "bin";

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: storagePath,
      Body: buffer,
      ContentType: contentType,
      ACL: "private",
    })
  );

  return { storagePath, url: storagePath, format: ext, sizeBytes };
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: bucket(), Key: storagePath })
    );
  } catch (err) {
    console.error(`Spaces delete failed for ${storagePath}:`, err);
  }
}

export async function fetchFileBuffer(
  storagePath: string
): Promise<FileBufferResult> {
  const response = await getClient().send(
    new GetObjectCommand({ Bucket: bucket(), Key: storagePath })
  );

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);

  const ext = path.extname(storagePath).slice(1).toLowerCase();
  const contentType =
    (response.ContentType as string | undefined) ?? mimeFromExt(ext);

  return { data, contentType };
}

export async function fetchFileForRecord(file: {
  publicId: string;
  cloudinaryUrl: string;
  mimeType?: string | null;
}): Promise<FileBufferResult> {
  try {
    const result = await fetchFileBuffer(file.publicId);
    return { data: result.data, contentType: file.mimeType ?? result.contentType };
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
