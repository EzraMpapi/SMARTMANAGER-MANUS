import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("passkey onboarding and readiness UI", () => {
  it("guides a signed-in eligible account to add its first passkey and keeps readiness restricted to administrators", () => {
    expect(dashboard).toContain("Set up your first passkey");
    expect(dashboard).toContain("Passkey readiness");
    expect(dashboard).toContain("isAdministrator={PASSKEY_READINESS_ROLES.has(currentUser.role)}");
    expect(dashboard).toContain("passkeyDisabled");
  });
});
