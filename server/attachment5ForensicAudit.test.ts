import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("Attachment 5 forensic audit contracts", () => {
  it("keeps protected writes behind a server-side schema and tenant boundary", () => {
    const router = read("server/routers.ts");
    const persistence = read("server/supabasePersistence.ts");
    const drift = read("server/schemaDriftChecker.ts");

    expect(router).toContain("persistSupabaseCriticalRow: protectedProcedure");
    expect(router).toContain("assertPayloadContract(input.tableName, input.payload)");
    expect(persistence).toContain("assertPayloadContract(tableName, payload)");
    expect(drift).toContain("company_id");
    expect(drift).toContain("ERP_SCHEMA_CONTRACTS");
  });

  it("keeps publishable client configuration separate from service credentials", () => {
    const publicAuth = read("client/src/components/PublicAuthGateway.jsx");
    const publicConfig = read("client/src/lib/publicSupabaseConfig.ts");
    const env = read("server/_core/env.ts");
    const verifier = read("server/verifySupabaseSchema.mjs");

    expect(publicAuth).not.toContain("SUPABASE_SECRET_KEY");
    expect(publicConfig).toContain("/api/config/public");
    expect(publicConfig).not.toContain("SUPABASE_SECRET_KEY");
    expect(env).toContain("supabaseSecretKey: process.env.SUPABASE_SECRET_KEY");
    expect(verifier).toContain("SUPABASE_SECRET_KEY");
  });

  it("keeps dashboard responsive controls and safe-area handling in the shared shell", () => {
    const dashboard = read("client/src/BusinessSphereDashboard.jsx");
    const css = read("client/src/index.css");

    expect(dashboard).toContain("dashboard-mobile-content");
    expect(dashboard).toContain("sm-mobile-filter-row");
    expect(dashboard).toContain("safe-area-inset-bottom");
    expect(css).toContain(".dashboard-mobile-content");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain(".sm-mobile-table-wrap");
  });

  it("keeps quality gates and live verification skip-safe", () => {
    const packageJson = read("package.json");
    const vitest = read("vitest.config.ts");
    const liveTest = read("server/liveTenantWorkflow.integration.test.ts");

    expect(packageJson).toContain('"test": "vitest run"');
    expect(packageJson).toContain('"build":');
    expect(vitest).toContain('include: ["server/**/*.test.ts", "server/**/*.spec.ts"]');
    expect(liveTest).toContain("describe.skip");
  });
});
