import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const verifierSource = readFileSync(new URL("./verifySupabaseSchema.mjs", import.meta.url), "utf8");

describe("Supabase production schema contract guard", () => {
  it("derives the required table contract from the single preserved ERP dashboard", () => {
    const referencedTables = [...new Set(
      [...dashboardSource.matchAll(/sb\("([^\"]+)"/g)].map((match) => match[1]),
    )];

    expect(referencedTables).toHaveLength(110);
    expect(referencedTables).toContain("finance_expenses");
    expect(referencedTables).toContain("inventory_items");
    expect(referencedTables).toContain("crm_leads");
    expect(referencedTables).toContain("procurement_purchase_orders");
    expect(referencedTables).toContain("manufacturing_work_orders");
  });

  it("uses the protected Supabase OpenAPI metadata rather than browser credentials or hardcoded schemas", () => {
    expect(verifierSource).toContain("SUPABASE_SECRET_KEY");
    expect(verifierSource).toContain("/rest/v1/");
    expect(verifierSource).toContain("BusinessSphereDashboard.jsx");
    expect(verifierSource).toContain("missingTables");
    expect(verifierSource).toContain("tenantTableIssues");
    expect(verifierSource).toContain("attempt <= 3");
    expect(verifierSource).not.toContain("sb_secret_");
  });

  it("requires all tenant-scoped dashboard tables to expose stable ownership and audit columns", () => {
    expect(verifierSource).toContain('["id", "company_id", "created_at", "updated_at"]');
    expect(verifierSource).toContain("globalTables");
  });
});
