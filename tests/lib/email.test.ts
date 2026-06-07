import { describe, it, expect } from "vitest";

describe("email templates", () => {
  it("renders a project link when URL is provided", async () => {
    process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test";
    const { projectStatusChangedEmail } = await import("@/lib/email");

    const html = projectStatusChangedEmail(
      "Karim",
      "Brand Identity",
      "IN PROGRESS",
      "https://example.com/p/abc123"
    );

    expect(html).toContain("View project");
    expect(html).toContain("https://example.com/p/abc123");
  });

  it("renders fallback text when URL is missing", async () => {
    process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test";
    const { projectStatusChangedEmail } = await import("@/lib/email");

    const html = projectStatusChangedEmail(
      "Karim",
      "Brand Identity",
      "IN PROGRESS"
    );

    expect(html).toContain("private link your designer sent you");
    expect(html).not.toContain("View project</a>");
  });
});
