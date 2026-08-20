import { describe, expect, it, vi } from "vitest";
import { persistSupabaseRow } from "./supabasePersistence";

describe("Server-Side Supabase Persistence Boundary", () => {
  const successfulFetch = vi.fn(async () =>
    new Response(JSON.stringify([{ id: "confirmed-row" }]), {
      status: 201,
      headers: { "content-type": "application/json" },
    }),
  );

  it.each([
    ["finance_expenses", { company_id: "comp-1", vendor: "TANESCO", category: "Rent & Utilities", amount: "1", expense_date: "2026-08-20", status: "Paid", method: "Bank Transfer" }],
    ["sales_invoices", { company_id: "comp-1", status: "Draft", amount: "100", doc_number: "INV-001", customer: "Acme Corp", issue_date: "2026-08-20", due_date: "2026-09-20" }],
    ["inventory_items", { company_id: "comp-1", name: "Widget", status: "Active", amount: "50", data: { sku: "WID-1" } }],
    ["crm_leads", { company_id: "comp-1", name: "Lead Corp", status: "New", data: { email: "lead@corp.com" } }],
  ] as const)("passes valid %s payloads before calling Supabase", async (tableName, payload) => {
    const result = await persistSupabaseRow(tableName, payload, {
      url: "https://example.supabase.co",
      secretKey: "server-test-key",
      fetchImpl: successfulFetch,
    });
    expect(result).toEqual([{ id: "confirmed-row" }]);
    expect(successfulFetch).toHaveBeenCalledWith(
      `https://example.supabase.co/rest/v1/${tableName}`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects Finance drift before reading credentials or calling the network", async () => {
    const fetchImpl = vi.fn();
    await expect(
      persistSupabaseRow(
        "finance_expenses",
        {
          company_id: "comp-1",
          vendor: "TANESCO",
          category: "Rent & Utilities",
          amount: "1",
          expense_date: "2026-08-20",
          status: "Paid",
          method: "Bank Transfer",
          cost_center: "ILLEGAL_DRIFT",
        },
        { fetchImpl },
      ),
    ).rejects.toThrowError(/Forbidden\/unsupported drift columns detected/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an unsupported table before any network call", async () => {
    const fetchImpl = vi.fn();
    await expect(
      persistSupabaseRow("finance_expenses", { company_id: "comp-1", vendor: "Missing required fields" }, { fetchImpl }),
    ).rejects.toThrowError(/Missing required columns/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
