import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authContext = readFileSync(resolve(process.cwd(), "client/src/contexts/AuthContext.tsx"), "utf8");
const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("AuthProvider identity snapshot integration contract", () => {
  it("hydrates identity through the single server-side snapshot RPC", () => {
    expect(authContext).toContain('client.rpc("auth_identity_snapshot")');
    expect(authContext).toContain("payload.authorized === true");
    expect(authContext).toContain('type: "INCOMPLETE_IDENTITY"');
    expect(authContext).not.toContain('from("company_memberships")');
    expect(authContext).not.toContain('from("workforce_role_permissions")');
    expect(authContext).not.toContain('from("workforce_module_access")');
  });

  it("blocks every unauthorized identity, not only profiles that are missing", () => {
    expect(app).toContain('if (auth.status === "UNAUTHORIZED")');
    expect(app).not.toContain('auth.status === "UNAUTHORIZED" && !auth.profile');
  });
});
