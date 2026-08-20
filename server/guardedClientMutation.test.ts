import { beforeEach, describe, expect, it, vi } from "vitest";

const guardedMutation = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

vi.mock("../client/src/lib/guardedPersistenceClient", () => ({
  getGuardedPersistenceCompanyId: () => "00000000-0000-4000-8000-000000000001",
  guardedPersistenceClient: { persistSupabaseCriticalRow: guardedMutation },
  setGuardedPersistenceCompanyId: vi.fn(),
}));

const { runCompanyTableMutation, sb } = await import("../client/src/BusinessSphereDashboard.jsx");

describe("Guarded client mutation routing", () => {
  beforeEach(() => guardedMutation.mutate.mockReset());

  it("routes valid Finance inserts to the authenticated server boundary", async () => {
    guardedMutation.mutate.mockResolvedValueOnce([{ id: "server-expense-1" }]);

    const result = await runCompanyTableMutation("finance_expenses", "insert", {
      vendor: "Tanesco",
      category: "Utilities",
      expense_date: "2026-08-20",
      due_date: "2026-09-20",
      amount: 100,
      status: "Paid",
      method: "Bank Transfer",
    });

    expect(guardedMutation.mutate).toHaveBeenCalledWith({
      companyId: "00000000-0000-4000-8000-000000000001",
      tableName: "finance_expenses",
      payload: expect.objectContaining({ vendor: "Tanesco", amount: 100 }),
    });
    expect(result).toEqual({ data: { id: "server-expense-1" }, error: null });
  });

  it("returns guarded server rejection without bypassing to direct Supabase", async () => {
    guardedMutation.mutate.mockRejectedValueOnce(new Error("Forbidden/unsupported drift columns detected"));

    const result = await runCompanyTableMutation("finance_expenses", "insert", {
      vendor: "Tanesco",
      category: "Utilities",
      expense_date: "2026-08-20",
      due_date: "2026-09-20",
      amount: 100,
      status: "Paid",
      method: "Bank Transfer",
      department: "Operations",
    });

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ message: "Forbidden/unsupported drift columns detected" });
    expect(guardedMutation.mutate).toHaveBeenCalledTimes(1);
  });

  it("preserves every row in a guarded bulk CRM lead insert", async () => {
    guardedMutation.mutate
      .mockResolvedValueOnce([{ id: "lead-1" }])
      .mockResolvedValueOnce([{ id: "lead-2" }]);

    const result = await sb("crm_leads").insert([
      { name: "Lead One", status: "New", data: { email: "one@example.com" } },
      { name: "Lead Two", status: "New", data: { email: "two@example.com" } },
    ]).run();

    expect(guardedMutation.mutate).toHaveBeenCalledTimes(2);
    expect(guardedMutation.mutate).toHaveBeenNthCalledWith(1, expect.objectContaining({ tableName: "crm_leads", payload: { name: "Lead One", status: "New", data: { email: "one@example.com" } } }));
    expect(guardedMutation.mutate).toHaveBeenNthCalledWith(2, expect.objectContaining({ tableName: "crm_leads", payload: { name: "Lead Two", status: "New", data: { email: "two@example.com" } } }));
    expect(result).toEqual([{ id: "lead-1" }, { id: "lead-2" }]);
  });
});
