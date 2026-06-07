import { describe, expect, it } from "vitest";

describe("email templates", () => {
  it("projectStatusChangedEmail returns subject and body", async () => {
    const { projectStatusChangedEmail } = await import("@/lib/email");

    const tpl = projectStatusChangedEmail(
      "Acme",
      "Brand refresh",
      "IN PROGRESS",
      "http://localhost:3000/p/abc"
    );

    expect(tpl.subject).toContain("Brand refresh");
    expect(tpl.html).toContain("IN PROGRESS");
    expect(tpl.html).toContain("http://localhost:3000/p/abc");
  });

  it("projectStatusChangedEmail works without project URL", async () => {
    const { projectStatusChangedEmail } = await import("@/lib/email");

    const tpl = projectStatusChangedEmail("Acme", "Brand refresh", "DELIVERED");

    expect(tpl.html).toContain("DELIVERED");
  });
});
