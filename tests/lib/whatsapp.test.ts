import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
} from "@/lib/whatsapp";

describe("whatsapp", () => {
  it("normalizes Moroccan local numbers", () => {
    expect(normalizeWhatsAppPhone("0612345678", "212")).toBe("212612345678");
    expect(normalizeWhatsAppPhone("212612345678", "212")).toBe("212612345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeWhatsAppPhone("123", "212")).toBeNull();
    expect(normalizeWhatsAppPhone("", "212")).toBeNull();
  });

  it("builds wa.me URL", () => {
    const url = buildWhatsAppUrl("212612345678", "Hello");
    expect(url).toContain("wa.me/212612345678");
    expect(url).toContain(encodeURIComponent("Hello"));
  });

  it("builds portal link message", () => {
    const msg = buildWhatsAppMessage({
      template: "portal_link",
      clientName: "Karim",
      projectTitle: "Logo",
      portalUrl: "http://localhost:3000/p/abc",
      studioName: "Studio",
    });
    expect(msg).toContain("Karim");
    expect(msg).toContain("Logo");
    expect(msg).toContain("http://localhost:3000/p/abc");
  });
});
