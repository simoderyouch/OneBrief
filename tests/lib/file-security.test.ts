import { describe, expect, it } from "vitest";
import {
  canAccessFile,
  canClientSeeFile,
  canDownloadFile,
  needsProtectedPreview,
  isPreviewableImage,
} from "@/lib/file-security";

const baseFile = {
  mimeType: "image/png",
  format: "png",
  status: "CURRENT" as const,
  clientVisible: true,
  downloadAllowed: false,
};

describe("file-security", () => {
  it("hides superseded and invisible files from clients", () => {
    expect(canClientSeeFile(baseFile)).toBe(true);
    expect(canClientSeeFile({ ...baseFile, clientVisible: false })).toBe(false);
    expect(canClientSeeFile({ ...baseFile, status: "SUPERSEDED" })).toBe(false);
  });

  it("allows download when explicitly enabled or file is FINAL", () => {
    expect(canDownloadFile("BASIC", baseFile)).toBe(false);
    expect(canDownloadFile("BASIC", { ...baseFile, downloadAllowed: true })).toBe(true);
    expect(canDownloadFile("PROTECTED", { ...baseFile, status: "FINAL" })).toBe(true);
  });

  it("requires protected preview for non-final images on PROTECTED tier", () => {
    expect(needsProtectedPreview("BASIC", baseFile)).toBe(false);
    expect(needsProtectedPreview("PROTECTED", baseFile)).toBe(true);
    expect(needsProtectedPreview("PROTECTED", { ...baseFile, status: "FINAL" })).toBe(false);
    expect(needsProtectedPreview("PROTECTED", { ...baseFile, format: "pdf", mimeType: "application/pdf" })).toBe(false);
  });

  it("detects previewable images", () => {
    expect(isPreviewableImage({ mimeType: "image/jpeg", format: null })).toBe(true);
    expect(isPreviewableImage({ mimeType: null, format: "png" })).toBe(true);
    expect(isPreviewableImage({ mimeType: "application/pdf", format: "pdf" })).toBe(false);
  });

  it("gates access by intent", () => {
    expect(canAccessFile("STANDARD", baseFile, "view")).toBe(true);
    expect(canAccessFile("STANDARD", baseFile, "download")).toBe(false);
    expect(canAccessFile("STANDARD", { ...baseFile, status: "FINAL" }, "download")).toBe(true);
  });
});
