import { describe, it, expect } from "vitest";
import { feedbackSubmitterLabel } from "@/lib/feedback-display";

describe("feedbackSubmitterLabel", () => {
  it("prefers portal account name when present", () => {
    expect(feedbackSubmitterLabel("ignored", null, { fullName: "Portal User" })).toBe("Portal User");
  });

  it("uses name when present", () => {
    expect(feedbackSubmitterLabel("  Ada  ", null)).toBe("Ada");
  });

  it("uses guest tail when only session", () => {
    expect(feedbackSubmitterLabel(null, "550e8400-e29b-41d4-a716-446655440000")).toBe("Guest · 0000");
  });

  it("uses Client when neither", () => {
    expect(feedbackSubmitterLabel(null, null)).toBe("Client");
  });
});
