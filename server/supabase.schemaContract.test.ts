import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const verifierSource = readFileSync(new URL("./verifySupabaseSchema.mjs", import.meta.url), "utf8");
const baselineMigration = readFileSync(new URL("../supabase/migrations/20260812_001_complete_erp_schema_baseline.sql", import.meta.url), "utf8");
const tenantBootstrapMigration = readFileSync(new URL("../supabase/migrations/20260814_002_guarded_first_tenant_bootstrap.sql", import.meta.url), "utf8");

describe("Supabase production schema contract guard", () => {
  it("derives the required table contract from the single preserved ERP dashboard", () => {
    const referencedTables = [...new Set(
      [...dashboardSource.matchAll(/(?:sb|useCompanyTable|runCompanyTableQuery|runCompanyTableMutation)\("([^\"]+)"/g)].map((match) => match[1]),
    )];

    expect(referencedTables).toHaveLength(149);
    expect(referencedTables).toContain("finance_expenses");
    expect(referencedTables).toContain("inventory_items");
    expect(referencedTables).toContain("crm_leads");
    expect(referencedTables).toContain("procurement_purchase_orders");
    expect(referencedTables).toContain("manufacturing_work_orders");
    expect(referencedTables).not.toContain("emails");
  });

  it("uses the protected Supabase OpenAPI metadata rather than browser credentials or hardcoded schemas", () => {
    expect(verifierSource).toContain("SUPABASE_SECRET_KEY");
    expect(verifierSource).toContain("/rest/v1/");
    expect(verifierSource).toContain("BusinessSphereDashboard.jsx");
    expect(verifierSource).toContain("useCompanyTable");
    expect(verifierSource).toContain("runCompanyTableMutation");
    expect(verifierSource).toContain("missingTables");
    expect(verifierSource).toContain("tenantTableIssues");
    expect(verifierSource).toContain("attempt <= 3");
    expect(verifierSource).not.toContain("sb_secret_");
  });

  it("requires all tenant-scoped dashboard tables to expose stable ownership and audit columns", () => {
    expect(verifierSource).toContain('["id", "company_id", "created_at", "updated_at"]');
    expect(verifierSource).toContain("globalTables");
  });

  it("keeps the audited timestamp repair additive, idempotent, and free of destructive table operations", () => {
    expect(baselineMigration).toContain("ADD COLUMN IF NOT EXISTS updated_at timestamptz");
    expect(baselineMigration).toContain("UPDATE public.audit_log");
    expect(baselineMigration).toContain("WHERE updated_at IS NULL");
    expect(baselineMigration).toContain("DROP TRIGGER IF EXISTS businesssphere_audit_log_updated_at");
    expect(baselineMigration).not.toContain("DROP TABLE");
    expect(baselineMigration).not.toContain("TRUNCATE");
    expect(baselineMigration).not.toContain("DELETE FROM");
  });

  it("provisions a first tenant only from auth context and preserves explicit setup once an organization exists", () => {
    expect(tenantBootstrapMigration).toContain("CREATE OR REPLACE FUNCTION public.ensure_current_company()");
    expect(tenantBootstrapMigration).toContain("v_user_id uuid := auth.uid()");
    expect(tenantBootstrapMigration).toContain("pg_advisory_xact_lock");
    expect(tenantBootstrapMigration).toContain("IF EXISTS (SELECT 1 FROM public.companies)");
    expect(tenantBootstrapMigration).toContain("RAISE EXCEPTION 'company setup required'");
    expect(tenantBootstrapMigration).toContain("GRANT EXECUTE ON FUNCTION public.ensure_current_company() TO authenticated");
    expect(tenantBootstrapMigration).not.toContain("WITH CHECK (true)");
    expect(tenantBootstrapMigration).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });
});
