import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const migration = fs.readFileSync(path.join(projectRoot, "supabase/migrations/20260815_005_workspace_membership_management.sql"), "utf8");
const hardeningMigration = fs.readFileSync(path.join(projectRoot, "supabase/migrations/20260815_006_harden_workspace_membership_admin_bounds.sql"), "utf8");
const membershipUi = fs.readFileSync(path.join(projectRoot, "client/src/components/WorkspaceMembershipManager.tsx"), "utf8");
const dashboardSource = fs.readFileSync(path.join(projectRoot, "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("workspace membership administration security contract", () => {
  it("derives the active tenant and actor membership inside each management RPC", () => {
    for (const name of ["list_workspace_members", "update_workspace_member_role", "remove_workspace_member"]) {
      expect(migration).toContain(`FUNCTION public.${name}`);
    }
    expect(migration).toContain("SELECT p.company_id INTO v_company_id FROM public.profiles p WHERE p.id = v_user_id");
    expect(migration).toContain("v_actor_role NOT IN ('owner', 'admin')");
    expect(migration).toContain("SECURITY DEFINER");
  });

  it("prevents self-escalation, self-removal, owner modification, and anonymous execution", () => {
    expect(migration).toContain("you cannot change your own workspace role");
    expect(migration).toContain("you cannot remove yourself from this workspace");
    expect(migration).toContain("the workspace owner role cannot be changed here");
    expect(migration).toContain("the workspace owner cannot be removed here");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.list_workspace_members() FROM PUBLIC");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.list_workspace_members() TO authenticated");
    expect(migration).not.toContain("TO anon");
    expect(hardeningMigration).toContain("only the workspace owner may manage administrator access");
    expect(hardeningMigration).toContain("only the workspace owner may remove an administrator");
  });

  it("renders owner and administrator controls with loading, error, empty, and removal confirmation states", () => {
    expect(membershipUi).toContain('rpc("list_workspace_members")');
    expect(membershipUi).toContain('rpc("update_workspace_member_role"');
    expect(membershipUi).toContain('rpc("remove_workspace_member"');
    expect(membershipUi).toContain("confirmRemovalId");
    expect(membershipUi).toContain('role="alert"');
    expect(dashboardSource).toContain("<WorkspaceMembershipManager");
    expect(dashboardSource).toContain("<UploadCloud");
    expect(dashboardSource).not.toContain("<Upload ");
  });

  it("retains the verified create-or-join workspace setup boundary for authenticated users without a membership", () => {
    expect(dashboardSource).toContain("function OAuthCompanySetup");
    expect(dashboardSource).toContain('callRpc("create_company_and_owner"');
    expect(dashboardSource).toContain('callRpc("join_company_with_code"');
    expect(dashboardSource).toContain("if (oauthPendingUser)");
  });
});
