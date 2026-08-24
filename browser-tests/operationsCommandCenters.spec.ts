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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 900 : 350);
    for (const name of ["Dismiss", "Close onboarding tour", "Skip tour"]) {
      const button = page.getByRole("button", { name, exact: true }).last();
      if (await button.count() && await button.isVisible().catch(() => false)) await button.click({ force: true });
    }
  }
  const closeMenu = page.getByRole("button", { name: "Close menu", exact: true }).last();
  if (await closeMenu.count() && await closeMenu.isVisible().catch(() => false)) await closeMenu.click({ force: true });
  await page.waitForTimeout(200);
}

test.describe("operations procurement and warehouse integration journeys", () => {
  test("opens Procurement and reaches the purchase-order entry point", async ({ page }, testInfo) => {
    await mockAuthenticatedOperations(page, "Procurement Officer");
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await dismissTransientUi(page);
    const openMenu = page.getByRole("button", { name: "Open menu", exact: true }).last();
    if (await openMenu.count() && await openMenu.isVisible().catch(() => false)) await openMenu.click({ force: true });
    const procurementNav = page.locator("aside nav button").filter({ hasText: "Procurement" }).first();
    await expect(procurementNav).toBeVisible();
    await procurementNav.scrollIntoViewIfNeeded();
    await procurementNav.evaluate((element) => (element as HTMLElement).click());
    await dismissTransientUi(page);
    await expect(page.getByRole("heading", { name: "Procurement", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Purchase Order", exact: true }).first()).toBeVisible();
    await expect(page.getByText("Purchase orders, approvals, contracts, and vendor payments", { exact: true })).toBeVisible();
    await dismissTransientUi(page);
    await page.getByRole("button", { name: "New Purchase Order", exact: true }).first().click({ force: true });
    await expect(page.getByRole("heading", { name: "New Purchase Order", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("procurement-purchase-order-entry.png"), fullPage: true });
  });

  test("opens Inventory and exposes the reorder workflow boundary", async ({ page }, testInfo) => {
    await mockAuthenticatedOperations(page, "Warehouse Manager");
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await dismissTransientUi(page);
    const openMenu = page.getByRole("button", { name: "Open menu", exact: true }).last();
    if (await openMenu.count() && await openMenu.isVisible().catch(() => false)) await openMenu.click({ force: true });
    const inventoryNav = page.locator("aside nav button").filter({ hasText: "Inventory" }).first();
    await expect(inventoryNav).toBeVisible();
    await inventoryNav.scrollIntoViewIfNeeded();
    await inventoryNav.evaluate((element) => (element as HTMLElement).click());
    await dismissTransientUi(page);
    await expect(page.getByRole("heading", { name: "Inventory", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(page.getByText("Low Stock", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Out of Stock", { exact: true }).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("inventory-reorder-boundary.png"), fullPage: true });
  });
});

export {};

// Keep the file a module for TypeScript's isolatedModules setting.
void trpcResult;
