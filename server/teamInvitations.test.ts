import { describe, expect, it } from "vitest";
import { hashInvitationToken, invitationOrigin, isInvitationExpired } from "./teamInvitations";

describe("team invitation security helpers", () => {
  it("hashes opaque invitation tokens deterministically without exposing the token in storage", () => {
    expect(hashInvitationToken("opaque-invitation-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken("opaque-invitation-token")).toBe(hashInvitationToken("opaque-invitation-token"));
    expect(hashInvitationToken("opaque-invitation-token")).not.toContain("opaque-invitation-token");
  });

  it("treats invitation expiry as an absolute server-side boundary", () => {
    expect(isInvitationExpired(new Date("2026-08-14T09:59:59.000Z"), Date.parse("2026-08-14T10:00:00.000Z"))).toBe(true);
    expect(isInvitationExpired(new Date("2026-08-14T10:00:01.000Z"), Date.parse("2026-08-14T10:00:00.000Z"))).toBe(false);
  });

  it("uses the forwarded secure application origin when generating invitation links", () => {
    expect(invitationOrigin({ protocol: "http", headers: { host: "internal:3000", "x-forwarded-host": "erp.example.com", "x-forwarded-proto": "https" } } as any)).toBe("https://erp.example.com");
  });
});
