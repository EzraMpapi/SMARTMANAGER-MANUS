import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_057_workforce_authorization.sql"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const workforceService = readFileSync(resolve(process.cwd(), "server/teamWorkforce.ts"), "utf8");

describe("workforce authorization migration", () => {
  it("creates the complete additive authorization table set", () => {
    for (const table of [
      "workforce_roles",
      "workforce_permissions",
      "workforce_role_permissions",
      "workforce_member_roles",
      "workforce_module_access",
      "workforce_data_scopes",
      "workforce_approval_limits",
      "workforce_permission_conflicts",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("keeps role assignments, grants, scopes, and limits tenant-safe", () => {
    expect(migration.match(/company_id uuid NOT NULL/g)?.length).toBeGreaterThanOrEqual(8);
    for (const reference of [
      "FOREIGN KEY (company_id, role_id) REFERENCES public.workforce_roles(company_id, id)",
      "FOREIGN KEY (company_id, permission_id) REFERENCES public.workforce_permissions(company_id, id)",
      "FOREIGN KEY (company_id, target_role_id) REFERENCES public.workforce_roles(company_id, id)",
      "FOREIGN KEY (company_id, approval_request_id) REFERENCES public.fin_approval_requests(company_id, id)",
      "workforce_validate_scope",
      "public.current_company_id()",
    ]) expect(migration).toContain(reference);
    expect(migration).toContain("The assigned profile does not belong to the target company.");
  });

  it("supports maker-checker approval, effective dates, revocation, and deny-overrides", () => {
    expect(migration).toContain("status text NOT NULL DEFAULT 'Pending'");
    expect(migration).toContain("approval_request_id uuid");
    expect(migration).toContain("effective_from timestamptz NOT NULL DEFAULT now()");
    expect(migration).toContain("revoked_by uuid");
    expect(migration).toContain("WHERE rp.effect = 'Deny'");
    expect(migration).toContain("AND ma.effect = 'Deny'");
    expect(migration).toContain("workforce_require(p_permission_code text)");
  });

  it("enforces bounded actions, TZS limits, target exclusivity, and conflict policy", () => {
    for (const token of [
      "permission_action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'print', 'manage', 'full_access')",
      "(target_profile_id IS NOT NULL) <> (target_role_id IS NOT NULL)",
      "currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS')",
      "resolution_policy IN ('Warn', 'Block', 'Require Exception Approval')",
      "permission_a_id <> permission_b_id",
      "UNIQUE NULLS NOT DISTINCT",
    ]) expect(migration).toContain(token);
  });

  it("enables RLS and blocks direct authenticated writes until controlled procedures exist", () => {
    expect(migration).toContain("ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated");
    expect(migration).toContain("GRANT SELECT ON public.%I TO authenticated");
    expect(migration).toContain("CREATE POLICY %I ON public.%I FOR SELECT TO authenticated");
    expect(migration).not.toContain("CREATE POLICY %I ON public.%I FOR ALL TO authenticated");
  });

  it("exposes the new authorization namespace only through protected server routing", () => {
    expect(router).toContain("teamWorkforce: router({");
    expect(router).toContain("snapshot: protectedProcedure.query");
    expect(workforceService).toContain("resolveVerifiedProfile(req)");
    expect(workforceService).toContain("const companyId = profile.company_id");
    expect(workforceService).not.toContain("input.companyId");
  });
});
