import { describe, it, expect } from "vitest";
import { validateUploadFile, getExtension } from "@/lib/file-validation";

describe("file-validation", () => {
  it("rejects oversize files", () => {
    const r = validateUploadFile({ name: "x.pdf", size: 999 * 1024 * 1024 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("large");
  });

  it("rejects bad extension", () => {
    const r = validateUploadFile({ name: "x.exe", size: 100 });
    expect(r.ok).toBe(false);
  });

  it("accepts valid pdf", () => {
    const r = validateUploadFile({ name: "doc.pdf", size: 1024 });
    expect(r.ok).toBe(true);
  });

  it("getExtension works", () => {
    expect(getExtension("foo.bar.pdf")).toBe("pdf");
  });

  it("accepts extensionless name when MIME maps to allowed type", () => {
    const r = validateUploadFile({ name: "Untitled", size: 1024, type: "image/png" });
    expect(r.ok).toBe(true);
  });

  it("accepts .psd by filename", () => {
    const r = validateUploadFile({ name: "layers.psd", size: 1024 });
    expect(r.ok).toBe(true);
  });
});
