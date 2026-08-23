import { expect, test } from "@playwright/test";

function trpcResult(data: unknown) {
  return { result: { data: { json: data } } };
}

const company = {
  id: "operations-e2e-company",
  name: "Operations E2E Company",
  category: "general",
  tax_rate: 18,
  timezone: "Africa/Dar_es_Salaam",
  currency: "TZS",
};

const inventoryRows = [
  { id: "inventory-1", sku: "SKU-FAST", name: "Fast Moving Part", category: "Hardware", warehouse: "WH-DSM", qty_on_hand: 10, reorder_level: 20, unit_cost: 100, unit: "unit", expiry_date: null },
  { id: "inventory-2", sku: "SKU-STABLE", name: "Stable Stock", category: "Hardware", warehouse: "WH-DSM", qty_on_hand: 80, reorder_level: 15, unit_cost: 50, unit: "unit", expiry_date: null },
];

const supplierRows = [
  { id: "supplier-1", name: "Confirmed Supplier Tanzania", contact_person: "Asha Mrema", email: "supplier@example.invalid", status: "Active" },
];

const expenseRows = [
  { id: "expense-1", vendor: "Confirmed Supplier Tanzania", category: "Inventory Purchases", expense_date: "2026-08-20", amount: 12500, status: "Pending", method: "Bank Transfer" },
];

const invoiceRows = [
  {
    id: "invoice-1",
    doc_number: "INV-E2E-001",
    customer: "Confirmed Customer",
    issue_date: "2026-08-20",
    status: "Paid",
    amount_paid: 2500,
    sales_invoice_items: [{ item_sku: "SKU-FAST", item_name: "Fast Moving Part", qty: 25, rate: 100 }],
  },
];

const workOrderRows = [
  { id: "work-order-1", bom_id: "bom-1", product: "Confirmed Fulfillment Batch", qty: 4, status: "In Progress", start_date: "2026-08-01", due_date: "2026-08-10" },
];

async function mockAuthenticatedOperations(page: Parameters<typeof test>[0]["page"], role: "Procurement Officer" | "Warehouse Manager") {
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_access_token", "operations-e2e-access-token");
    window.localStorage.setItem("bs_refresh_token", "operations-e2e-refresh-token");
    window.localStorage.setItem("bs_brief_2026-08-23", "1");
    window.localStorage.setItem("bs_onboarding_tour_operations-e2e-user_operations-e2e-company", JSON.stringify({ status: "dismissed", completedAt: new Date().toISOString() }));
  });

  await page.route("**/auth/v1/user", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ id: "operations-e2e-user", email: "operations@example.invalid", user_metadata: { full_name: role } }),
  }));

  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    let rows: unknown[] = [];
    if (url.includes("/profiles")) rows = [{ id: "operations-e2e-user", company_id: company.id, full_name: role, role, customer_ref: null }];
    else if (url.includes("/companies")) rows = [company];
    else if (url.includes("/inventory_items")) rows = inventoryRows;
    else if (url.includes("/inventory_suppliers")) rows = supplierRows;
    else if (url.includes("/finance_expenses")) rows = expenseRows;
    else if (url.includes("/sales_invoices")) rows = invoiceRows;
    else if (url.includes("/manufacturing_work_orders")) rows = workOrderRows;
    else if (url.includes("/pos_transactions")) rows = [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
  });

  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map(() => trpcResult(null));
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
}

async function dismissTransientUi(page: Parameters<typeof test>[0]["page"]) {
  await page.waitForTimeout(900);
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true });
  if (await dismiss.count() && await dismiss.last().isVisible().catch(() => false)) await dismiss.last().click({ force: true });
  await page.waitForTimeout(300);
  const closeTour = page.getByRole("button", { name: "Close onboarding tour", exact: true });
  if (await closeTour.count() && await closeTour.last().isVisible().catch(() => false)) await closeTour.last().click({ force: true });
  const skipTour = page.getByRole("button", { name: "Skip tour", exact: true });
  if (await skipTour.count() && await skipTour.last().isVisible().catch(() => false)) await skipTour.last().click({ force: true });
  const closeMenu = page.getByRole("button", { name: "Close menu", exact: true });
  if (await closeMenu.count() && await closeMenu.last().isVisible().catch(() => false)) await closeMenu.last().click({ force: true });
  await page.waitForTimeout(200);
}

test.describe("operations role command-center widgets", () => {
  test("Procurement Officer sees confirmed supplier spend and replenishment signals and can drill down", async ({ page }, testInfo) => {
    await mockAuthenticatedOperations(page, "Procurement Officer");
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await dismissTransientUi(page);

    const procurementWidget = page.getByRole("region", { name: "Procurement spend and replenishment widget" });
    await expect(procurementWidget).toBeVisible();
    await expect(procurementWidget.getByRole("heading", { name: "Supplier spend and replenishment signals" })).toBeVisible();
    await expect(procurementWidget.getByText("TZS 12,500k", { exact: true }).first()).toBeVisible();
    await expect(procurementWidget.getByText("1 replenishment signal require review", { exact: true })).toBeVisible();
    await expect(procurementWidget.getByText("Out of stock", { exact: true })).toBeVisible();
    await expect(procurementWidget.getByText("Live source snapshot", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Open replenishment queue" }).click();
    await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("procurement-widget-drilldown.png"), fullPage: true });
  });

  test("Warehouse Manager sees movement and fulfillment latency boundaries and renders responsively", async ({ page }, testInfo) => {
    await mockAuthenticatedOperations(page, "Warehouse Manager");
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await dismissTransientUi(page);

    await expect(page.getByRole("region", { name: "Warehouse turnover and fulfillment widget" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stock turnover and fulfillment latency" })).toBeVisible();
    await expect(page.getByText("60-day movement available through 2026-08-20", { exact: true })).toBeVisible();
    await expect(page.getByText("25 units sold against 90 units on hand", { exact: true })).toBeVisible();
    await expect(page.getByText("Insufficient", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("1 open work order past the confirmed due date", { exact: true })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("region", { name: "Warehouse turnover and fulfillment widget" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review fulfillment work" })).toBeVisible();
    await page.getByRole("button", { name: "Review fulfillment work" }).click();
    await expect(page.getByRole("heading", { name: "Manufacturing" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("warehouse-widget-mobile.png"), fullPage: true });
  });
});

export {};

// The browser routes above intentionally use confirmed rows and leave unsupported
// endpoints empty. This keeps the journeys focused on the role-specific widgets
// without inventing unrelated module data.

// eslint-disable-next-line no-empty
if (false) {}

// Keep the file a module for TypeScript's isolatedModules setting.
void trpcResult;
