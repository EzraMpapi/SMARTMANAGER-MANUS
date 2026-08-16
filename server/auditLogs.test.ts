import { describe, it, expect, vi } from "vitest";

vi.mock("./auditLogs", () => ({
  recordAuditLog: vi.fn(async (user, input) => ({
    id: 101,
    actorOpenId: user.openId,
    actorName: user.name,
    companyId: input.companyId,
    action: input.action,
    module: input.module,
    details: input.details,
    createdAt: new Date(),
  })),
  listAuditLogs: vi.fn(async (companyId) => ([
    {
      id: 101,
      actorOpenId: "sup_audit_admin",
      actorName: "Compliance Admin",
      companyId,
      action: "UPDATE_BUDGET_LIMIT",
      module: "Finance",
      details: "Changed Operations budget limit to 25000",
      createdAt: new Date(),
    }
  ])),
}));

vi.mock("./aiApprovals", () => ({
  resolveVerifiedProfile: vi.fn(async () => ({
    profile: { id: "supabase-profile-1", company_id: "company-test-1", role: "Organization Owner", full_name: "Compliance Admin" },
    token: "test-token",
  })),
  requestActionApproval: vi.fn(),
  decideActionApproval: vi.fn(),
}));

import { appRouter } from "./routers";

describe("Audit Logs tRPC Router and Persistence", () => {
  it("records and lists compliance audit logs correctly", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { id: 1, openId: "sup_audit_admin", name: "Compliance Admin", email: "admin@example.com", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any,
    });

    const recorded = await caller.auditLogs.record({
      companyId: "company-test-1",
      action: "UPDATE_BUDGET_LIMIT",
      module: "Finance",
      details: "Changed Operations budget limit to 25000",
    });

    expect(recorded).toMatchObject({
      companyId: "company-test-1",
      action: "UPDATE_BUDGET_LIMIT",
      module: "Finance",
      actorOpenId: "supabase-profile-1",
    });

    const logs = await caller.auditLogs.list({ companyId: "company-test-1" });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.some(l => l.action === "UPDATE_BUDGET_LIMIT")).toBe(true);
  });

  it("rejects a forged company identifier for both audit history reads and writes", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { id: 1, openId: "sup_audit_admin", name: "Compliance Admin", email: "admin@example.com", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any,
    });

    await expect(caller.auditLogs.list({ companyId: "company-forged" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.auditLogs.record({ companyId: "company-forged", action: "READ_AUDIT", module: "Security" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
