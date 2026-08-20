import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

describe("Guarded Server Boundary Integration Across All Critical Tables", () => {
  const companyId = "11111111-1111-4111-8111-111111111111";

  const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ id: "supabase-user-1" }), { status: 200 });
    }
    if (url.includes("/rest/v1/profiles?")) {
      return new Response(JSON.stringify([{ id: "supabase-user-1", company_id: companyId, role: "Organization Owner", full_name: "Test Owner" }]), { status: 200 });
    }
    return new Response(JSON.stringify([{ id: "row-confirmed-1" }]), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);

  const caller = appRouter.createCaller({
    req: { headers: { authorization: "Bearer valid-token" } } as any,
    res: {} as any,
    user: {
      id: 1,
      openId: "sup_supabase-user-1",
      name: "Test Owner",
      email: "owner@example.com",
      loginMethod: "supabase",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
  });

  it.each([
    ["finance_expenses", { company_id: companyId, vendor: "TANESCO", category: "Utilities", amount: "1000", expense_date: "2026-08-20", status: "Paid", method: "Cash" }, { company_id: companyId, vendor: "TANESCO", category: "Utilities", amount: "1000", expense_date: "2026-08-20", status: "Paid", method: "Cash", cost_center: "ILLEGAL" }],
    ["sales_invoices", { company_id: companyId, status: "Draft", amount: "500", doc_number: "INV-99", customer: "Acme", issue_date: "2026-08-20", due_date: "2026-09-20" }, { company_id: companyId, status: "Draft", amount: "500", customer: "Acme", issue_date: "2026-08-20", due_date: "2026-09-20" }],
    ["inventory_items", { company_id: companyId, name: "Item A", status: "Active", amount: "10", data: { sku: "A" } }, { company_id: companyId, name: "Item A", status: "Active", amount: "10" }],
    ["crm_leads", { company_id: companyId, name: "Lead 1", status: "New", data: { email: "a@b.com" } }, { company_id: companyId, name: "Lead 1", status: "New" }],
  ] as const)("permits valid %s payloads and actively rejects drifted payloads", async (tableName, validPayload, driftedPayload) => {
    const successRes = await caller.persistSupabaseCriticalRow({
      companyId,
      tableName,
      payload: validPayload,
    });
    expect(successRes).toEqual([{ id: "row-confirmed-1" }]);

    await expect(
      caller.persistSupabaseCriticalRow({
        companyId,
        tableName,
        payload: driftedPayload,
      }),
    ).rejects.toThrowError(/Missing required columns|Forbidden\/unsupported drift columns detected/);
  });
});
