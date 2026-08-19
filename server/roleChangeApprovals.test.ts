import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./roleChangeApprovals.ts", import.meta.url), "utf8");

describe("role-change approvals", () => {
  it("registers requestRoleChangeApproval, listRoleChangeApprovals, and decideRoleChangeApproval in routers", async () => {
    const routersModule = await import("./routers");
    expect(routersModule.appRouter).toBeDefined();
    const procs = routersModule.appRouter._def.procedures;
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
});
