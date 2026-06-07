import { describe, it, expect } from "vitest";
import { hashToken, tokenToStoredValue, generateToken } from "@/lib/token";

describe("token", () => {
  it("hashToken is deterministic for same input", () => {
    const a = hashToken("hello");
    const b = hashToken("hello");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("tokenToStoredValue hashes raw 32-char hex", () => {
    const raw = "a".repeat(32);
    expect(tokenToStoredValue(raw)).toBe(hashToken(raw));
  });

  it("tokenToStoredValue passes through 64-char sha256 hex", () => {
    const h = "b".repeat(64);
    expect(tokenToStoredValue(h)).toBe(h);
  });

  it("generateToken returns 32 hex chars", () => {
    const t = generateToken();
    expect(t).toMatch(/^[0-9a-f]{32}$/);
  });
});
