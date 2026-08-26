import type { Page } from "playwright/test";
import { installManagedAuth } from "./authHarness";

const company = {
  id: "layout-e2e-company",
  name: "Layout E2E Company",
  category: "general",
  tax_rate: 18,
  timezone: "Africa/Dar_es_Salaam",
  currency: "TZS",
};

const profile = {
  id: "layout-e2e-user",
  company_id: company.id,
  full_name: "Layout Test Administrator",
  role: "Super Administrator",
  customer_ref: null,
};

function trpcResult(data: unknown) {
  return { result: { data: { json: data } } };
}

export async function installIsolatedDashboardSession(page: Page) {
  const observedRequests: string[] = [];
  let preferenceSaveCount = 0;

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/")) observedRequests.push(url);
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("bs_brief_2026-08-23", "1");
    window.localStorage.setItem("bs_onboarding_tour_layout-e2e-user_layout-e2e-company", JSON.stringify({ status: "dismissed", completedAt: new Date().toISOString() }));
  });

  await page.route("**/auth/v1/user", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ id: profile.id, email: "layout-admin@e2e.invalid", user_metadata: { full_name: profile.full_name } }),
  }));

  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    let rows: unknown[] = [];
    if (url.includes("/profiles")) rows = [profile];
    else if (url.includes("/companies")) rows = [company];
    else if (url.includes("/sales_invoices")) rows = [{ id: "invoice-e2e-1", doc_number: "INV-LAYOUT-001", customer: "E2E Customer", issue_date: "2026-08-20", status: "Paid", amount_paid: 2500, sales_invoice_items: [{ item_name: "Confirmed item", qty: 1, rate: 2500 }] }];
    else if (url.includes("/finance_expenses")) rows = [{ id: "expense-e2e-1", vendor: "E2E Supplier", category: "Operations", expense_date: "2026-08-20", amount: 450, status: "Recorded" }];
    else if (url.includes("/inventory_items")) rows = [{ id: "inventory-e2e-1", sku: "E2E-001", name: "Confirmed stock", qty_on_hand: 12, reorder_level: 4, unit_cost: 100 }];
    else if (url.includes("/crm_leads")) rows = [{ id: "lead-e2e-1", name: "Confirmed opportunity", value: 5000, status: "Open" }];
    else if (url.includes("/hr_employees")) rows = [{ id: "employee-e2e-1", full_name: "Test Employee", status: "Active" }];
    else if (url.includes("/hr_leave_requests") || url.includes("/pos_transactions") || url.includes("/manufacturing_work_orders") || url.includes("/user_table_preferences")) rows = [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
  });

  await installManagedAuth(page, {
    id: profile.id,
    email: "layout-admin@e2e.invalid",
    fullName: profile.full_name,
    profile,
    company,
    role: profile.role,
  });

  await page.route("**/api/trpc/**", async (route) => {
    if (route.request().url().includes("dashboardPreferences.save")) preferenceSaveCount += 1;
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(procedures.map(() => trpcResult(null))) });
  });

  return {
    observedRequests,
    preferenceSaveCount: () => preferenceSaveCount,
  };
}
