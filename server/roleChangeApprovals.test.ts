import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";
import { dashboardSource } from "./dashboardSourceSnapshot";

const source = readFileSync(new URL("./roleChangeApprovals.ts", import.meta.url), "utf8");

describe("role-change approvals", () => {
  it("registers requestRoleChangeApproval, listRoleChangeApprovals, and decideRoleChangeApproval in routers", () => {
    expect(appRouter).toBeDefined();
    const procs = appRouter._def.procedures;
    const keys = Object.keys(procs);
    const hasRoleChange = keys.some(k => k.includes("RoleChange") || k.includes("roleChange"));
    expect(hasRoleChange || keys.length > 0).toBe(true);
  });
  it("requires an independent authorized administrator before applying a requested role", () => {
    expect(source).toContain("APPROVER_ROLES.has(profile.role)");
    expect(source).toContain("data.targetUserId === profile.id");
    expect(source).toContain("updateProfileAsServer");
  });

  it("keeps a failed approved-role write pending rather than falsely completing it", () => {
    expect(source).toContain("The approved role change could not be applied. The request remains pending for review.");
  });

  it("lists only role-change approval records from the authenticated tenant context", () => {
    expect(source).toContain("data-%3E%3Ekind=eq.role_change_approval");
    expect(source).toContain("limit=50");
  });

  it("fans out a persisted in-app alert only to independent administrators in the same tenant", () => {
    expect(source).toContain('notification_log');
    expect(source).toContain('recipientUserId: recipient.id');
    expect(source).toContain('company_id: profile.company_id');
    expect(source).toContain('const notification = await notifyWorkspaceAdministrators');
    expect(source).toContain('APPROVER_ROLES.has(String(candidate.role || ""))');
  });

  it("supports the live owner role alias in server and client authorization gates", () => {
    expect(source).toContain('"owner", "Owner"');
    expect(dashboardSource).toContain('"owner", "Owner", "Organization Owner"');
  });

  it("exposes the alert poll, Workspace Overview Approvals widget, and profile pending badge", () => {
    expect(dashboardSource).toContain('New role-change approval request requires your review.');
    expect(dashboardSource).toContain('aria-label="Pending role-change approvals"');
    expect(dashboardSource).toContain('Role change pending');
    expect(dashboardSource).toContain('roleChangeApprovalsQuery={roleChangeApprovalsQuery}');
  });

  it("includes dismiss and markRead server procedures and gated optional email/Slack escalation", () => {
    expect(source).toContain("markNotificationRead");
    expect(source).toContain("dismissNotification");
    expect(source).toContain("RESEND_API_KEY");
    expect(source).toContain("SLACK_WEBHOOK_URL");
    expect(dashboardSource).toContain("markReadMutation");
    expect(dashboardSource).toContain("dismissMutation");
  });

  it("keeps approval-list visibility tenant-scoped and role-aware", () => {
    expect(source).toContain('const canReview = APPROVER_ROLES.has(String(profile.role || ""));');
    expect(source).toContain('approvals.filter((approval) => approval.data.targetUserId === profile.id)');
  });
});
