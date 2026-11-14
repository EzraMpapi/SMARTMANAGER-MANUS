import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_058_workforce_role_assignment_approval.sql"), "utf8");
const authorizationMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_057_workforce_authorization.sql"), "utf8");

describe("workforce role assignment and approval migration", () => {
  it("adds protected request and decision procedures without replacing existing authorization tables", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.workforce_request_role_assignment(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.workforce_decide_role_assignment(");
    expect(migration).toContain("ALTER TABLE public.workforce_member_roles");
    expect(migration).toContain("workforce_member_roles_status_check");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
  });

  it("requires verified workspace identity, assignment authority, targets, hashes, keys, and valid dates", () => {
    for (const token of [
      "v_company_id uuid := public.current_company_id();",
      "v_actor_id uuid := auth.uid();",
      "PERFORM public.workforce_require_assignment_authority();",
      "p_target_profile_id uuid",
      "p_role_id uuid",
      "p_idempotency_key text",
      "p_request_hash text",
      "p_effective_from timestamptz",
      "length(v_key) > 160",
      "length(v_hash) > 128",
      "p_effective_to <= p_effective_from",
      "The target profile is not an active member of this workspace.",
    ]) expect(migration).toContain(token);
  });

  it("uses tenant-scoped role/profile/employee validation and refuses self-assignment", () => {
    expect(migration).toContain("p_target_profile_id = v_actor_id");
    expect(migration).toContain("p.company_id = v_company_id");
    expect(migration).toContain("e.company_id = v_company_id");
    expect(authorizationMigration).toContain("workforce_roles(company_id, id)");
    expect(authorizationMigration).toContain("FOREIGN KEY (company_id, role_id) REFERENCES public.workforce_roles(company_id, id)");
  });

  it("uses idempotency locks and request-hash conflict protection for both request and decision paths", () => {
    expect(migration).toContain("workforce.role.assignment");
    expect(migration).toContain("workforce.role.decision");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("v_idempotency.request_hash <> v_hash");
    expect(migration).toContain("status = 'Failed'");
    expect(migration).toContain("response = v_response");
  });

  it("enforces maker-checker status transitions and optimistic concurrency", () => {
    expect(migration).toContain("v_assignment.assigned_by = v_actor_id");
    expect(migration).toContain("The requester cannot approve or reject their own role assignment.");
    expect(migration).toContain("p_expected_version IS NOT NULL AND v_assignment.version <> p_expected_version");
    expect(migration).toContain("v_status := CASE WHEN p_decision = 'approve' THEN 'Active' ELSE 'Rejected' END");
    expect(migration).toContain("status = CASE WHEN p_decision = 'approve' THEN 'Approved' ELSE 'Rejected' END");
    expect(migration).toContain("decided_by = v_actor_id");
    expect(migration).toContain("decided_at = now()");
  });

  it("writes audit evidence and keeps direct authenticated table writes blocked", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.workforce_audit(");
    expect(migration).toContain("WORKFORCE_ROLE_ASSIGNMENT_REQUESTED");
    expect(migration).toContain("WORKFORCE_ROLE_ASSIGNMENT_APPROVED");
    expect(migration).toContain("WORKFORCE_ROLE_ASSIGNMENT_REJECTED");
    expect(authorizationMigration).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER");
    expect(migration).toContain("SET LOCAL app.internal_write = 'on'");
  });

  it("exposes only the two write procedures to authenticated callers, with public and anon execution revoked", () => {
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.workforce_request_role_assignment");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.workforce_decide_role_assignment");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.workforce_request_role_assignment");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.workforce_decide_role_assignment");
    expect(migration).not.toContain("GRANT EXECUTE ON FUNCTION public.workforce_audit");
  });
});
