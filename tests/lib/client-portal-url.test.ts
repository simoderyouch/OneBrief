import { describe, it, expect } from "vitest";
import {
  buildClientPortalPath,
  buildClientPortalUrl,
  buildProjectSlug,
  parsePortalTokenFromParams,
  parsePortalTokenFromUrlSegment,
} from "@/lib/client-portal-url";
import { hashToken } from "@/lib/token";

const SAMPLE_HASH = hashToken("test-secret");

describe("client-portal-url", () => {
  it("buildProjectSlug from title and client", () => {
    expect(buildProjectSlug("Acme Brand Identity", "Sarah Chen")).toBe(
      "sarah-chen-acme-brand-identity"
    );
  });

  it("buildClientPortalPath joins slug and stored hash with slash", () => {
    const path = buildClientPortalPath({
      title: "Acme Brand Identity",
      clientName: "Sarah Chen",
      token: SAMPLE_HASH,
    });
    expect(path).toBe(`sarah-chen-acme-brand-identity/${SAMPLE_HASH}`);
  });

  it("buildClientPortalUrl produces full URL", () => {
    const url = buildClientPortalUrl("http://localhost:3000", {
      title: "Acme Brand Identity",
      clientName: "Sarah Chen",
      token: SAMPLE_HASH,
    });
    expect(url).toBe(
      `http://localhost:3000/p/sarah-chen-acme-brand-identity/${SAMPLE_HASH}`
    );
  });

  it("parsePortalTokenFromParams extracts hash from slug/token routes", () => {
    expect(parsePortalTokenFromParams("sarah-chen-acme-brand-identity", SAMPLE_HASH)).toBe(
      SAMPLE_HASH
    );
  });

  it("parsePortalTokenFromUrlSegment supports legacy slug--hash", () => {
    const segment = `sarah-chen-acme-brand-identity--${SAMPLE_HASH}`;
    expect(parsePortalTokenFromUrlSegment(segment)).toBe(SAMPLE_HASH);
  });

  it("parsePortalTokenFromUrlSegment supports slug/hash in one segment", () => {
    const segment = `sarah-chen-acme-brand-identity/${SAMPLE_HASH}`;
    expect(parsePortalTokenFromUrlSegment(segment)).toBe(SAMPLE_HASH);
  });

  it("parsePortalTokenFromUrlSegment accepts bare 64-char hash", () => {
    expect(parsePortalTokenFromUrlSegment(SAMPLE_HASH)).toBe(SAMPLE_HASH);
  });

  it("parsePortalTokenFromUrlSegment hashes legacy raw tokens", () => {
    const raw = "a".repeat(32);
    expect(parsePortalTokenFromUrlSegment(raw)).toBe(hashToken(raw));
  });
});
