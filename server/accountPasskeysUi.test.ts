import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("account passkey management UI", () => {
  it("renders the registered-credential manager inside Security Settings", () => {
    expect(source).toContain("function AccountPasskeyManager");
    expect(source).toContain("<AccountPasskeyManager session={accountSession} isAdministrator={PASSKEY_READINESS_ROLES.has(currentUser.role)} />");
    expect(source).toContain("Account passkeys");
  });

  it("uses the authenticated Supabase session without a browser-local credential fallback", () => {
    expect(source).toContain("createAccountPasskeyClient");
    expect(source).toContain("revokeAccountPasskey");
    expect(source).not.toContain('localStorage.setItem("bs_account_passkey"');
  });
});
