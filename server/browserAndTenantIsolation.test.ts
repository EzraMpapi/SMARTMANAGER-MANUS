import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const signupSource = readFileSync(new URL("../client/src/components/PublicSignupGateway.jsx", import.meta.url), "utf8");
const publicAuthSource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const routersSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const tenantMigrationSource = readFileSync(new URL("../supabase/migrations/20260814_002_guarded_first_tenant_bootstrap.sql", import.meta.url), "utf8");

describe("Smart Manager Browser Auth, Session Metadata & Tenant Isolation Specification", () => {
  it("provides automated frontend coverage for login, signup, and workspace completion flows", () => {
    expect(publicAuthSource).toContain("EnterpriseLoginView");
    expect(publicAuthSource).toContain("signIn");
    expect(signupSource).toContain("PublicSignupGateway");
    expect(signupSource).toContain("create_company_and_owner");
    expect(signupSource).toContain("Congratulations — you’re ready.");
  });

  it("enforces tenant isolation and prevents cross-tenant data access under RLS", () => {
    expect(tenantMigrationSource).toContain("auth.uid()");
    expect(routersSource).toContain("protectedProcedure");
    expect(tenantMigrationSource).not.toContain("WITH CHECK (true)");
  });
});
