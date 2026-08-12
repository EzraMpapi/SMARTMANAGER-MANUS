import { describe, it, expect, vi } from "vitest";
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
      actorOpenId: "sup_audit_admin",
    });

    const logs = await caller.auditLogs.list({ companyId: "company-test-1" });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.some(l => l.action === "UPDATE_BUDGET_LIMIT")).toBe(true);
  });
});
