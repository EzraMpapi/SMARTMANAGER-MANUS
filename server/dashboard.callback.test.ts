import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./reportSchedules", () => ({
  getReportScheduleByTaskUid: vi.fn(),
  markReportSent: vi.fn(),
}));

import { runScheduledDashboardReport } from "./dashboardReports";
import { getReportScheduleByTaskUid, markReportSent } from "./reportSchedules";

afterEach(() => vi.restoreAllMocks());

describe("scheduled dashboard report callback", () => {
  it("does not falsely mark a scheduled report as sent when workspace email delivery is disabled", async () => {
    vi.mocked(getReportScheduleByTaskUid).mockResolvedValue({
      id: 17,
      companyId: "company-1",
      name: "Weekly executive report",
      recipientEmail: "reports@example.com",
      frequency: "weekly",
      format: "csv",
      modules: { finance: true, sales: true, crm: true, inventory: true, operations: true },
      dateRange: { start: "2026-08-01", end: "2026-08-12" },
      scheduleCronTaskUid: "cron_test_task_123",
      isActive: true,
    } as any);
    const fetchMock = vi.fn(async (url: string) => {
      const table = new URL(url).pathname.split("/").pop();
      const rows: Record<string, unknown[]> = {
        sales_invoices: [{ company_id: "company-1", issue_date: "2026-08-05", status: "Paid", amount_paid: 4800000, customer: "Sample Retail Group", sales_invoice_items: [{ qty: 1, rate: 4800000 }] }],
        finance_expenses: [{ company_id: "company-1", expense_date: "2026-08-06", amount: 900000 }],
        crm_leads: [{ company_id: "company-1", created_at: "2026-08-07", stage: "Proposal", value_amount: 12000000 }],
        inventory_items: [{ company_id: "company-1", category: "Storage", qty_on_hand: 10, unit_cost: 400 }],
        manufacturing_work_orders: [{ company_id: "company-1", start_date: "2026-08-08", status: "Planned" }],
        companies: [{ id: "company-1", name: "Sample Retail Group", currency: "TZS" }],
      };
      return { ok: true, status: 200, json: async () => rows[table || ""] || [] } as any;
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(runScheduledDashboardReport("cron_test_task_123")).resolves.toEqual({ ok: true, skipped: "delivery-disabled" });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("api.resend.com"))).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(markReportSent).not.toHaveBeenCalled();
  });
});
