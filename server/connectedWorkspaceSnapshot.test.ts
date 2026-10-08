import { describe, expect, it } from "vitest";
import { resolveConnectedWorkspaceSnapshot } from "../client/src/lib/connectedWorkspaceSnapshot";

describe("connected workspace date snapshot", () => {
  it("includes only confirmed records matching the selected date", () => {
    const snapshot = resolveConnectedWorkspaceSnapshot({
      date: "2026-07-02",
      invoices: [
        { id: "INV-1", date: "2026-07-02", status: "Paid", amountPaid: 1200, customer: "Acme", items: [] },
        { id: "INV-3", date: "2026-07-02", status: "Pending", amountPaid: 0, customer: "Beta", items: [{ qty: 2, price: 300 }] },
        { id: "INV-2", date: "2026-07-01", status: "Paid", amountPaid: 900, items: [] },
      ],
      expenses: [{ id: "EXP-1", date: "2026-07-02", amount: 250 }],
      crm: [{ id: "LEAD-1", createdAt: "2026-07-02T08:30:00Z", stage: "Qualified" }],
      inventory: [{ id: "STOCK-1", updatedAt: "2026-07-02T09:00:00Z", qty: 10, unitCost: 50 }],
      workOrders: [{ id: "WO-1", date: "2026-07-02", status: "Completed" }],
      posTransactions: [{ id: "POS-1", date: "2026-07-02", total: 400, customer: "Acme" }],
      leaveRequests: [{ id: "LV-1", startDate: "2026-07-01", endDate: "2026-07-03", status: "Approved" }],
    });

    expect(snapshot.date).toBe("2026-07-02");
    expect(snapshot.invoices.map((row) => row.id)).toEqual(["INV-1", "INV-3"]);
    expect(snapshot.expenses.map((row) => row.id)).toEqual(["EXP-1"]);
    expect(snapshot.leads.map((row) => row.id)).toEqual(["LEAD-1"]);
    expect(snapshot.leaveRequests.map((row) => row.id)).toEqual(["LV-1"]);
    expect(snapshot.revenue).toBe(1200);
    expect(snapshot.expensesTotal).toBe(250);
    expect(snapshot.net).toBe(950);
    expect(snapshot.salesValue).toBe(400);
    expect(snapshot.salesCount).toBe(3);
    expect(snapshot.orders).toBe(1);
    expect(snapshot.customers).toBe(2);
    expect(snapshot.inventoryValue).toBe(500);
    expect(snapshot.receivables).toBe(600);
    expect(snapshot.totalRecords).toBe(7);
    expect(snapshot.activity).toHaveLength(7);
  });

  it("returns an explicit empty activity state for a date without records", () => {
    const snapshot = resolveConnectedWorkspaceSnapshot({ date: "2026-08-10", invoices: [{ id: "INV-1", date: "2026-07-02" }] });
    expect(snapshot.totalRecords).toBe(0);
    expect(snapshot.activity).toEqual([]);
    expect(snapshot.net).toBe(0);
  });
});
