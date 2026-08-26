import { expect, test } from "@playwright/test";
import { installManagedAuth } from "./support/authHarness";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const propertySnapshot = {
  permissions: { canManage: true, canFinance: true, canApprove: true, canAudit: true },
  metrics: { propertyCount: 2, portfolioCount: 1, occupiedUnits: 1, vacantUnits: 1, occupancyRate: 50, rentalIncome: 1_250_000, outstandingRent: 350_000, overdueAccounts: 1, upcomingLeaseExpiries: 1, openMaintenance: 1, maintenanceCosts: 150_000, propertyExpenses: 280_000 },
  portfolios: [{ id: "10000000-0000-4000-8000-000000000001", portfolioCode: "DSM-PORT-01", name: "Dar es Salaam Residential", description: "Verified portfolio" }],
  buildings: [{ id: "10000000-0000-4000-8000-000000000002", propertyCode: "KIN-001", name: "Kijitonyama Apartments", propertyType: "Apartment Block", portfolioName: "Dar es Salaam Residential", address: "Kijitonyama", region: "Dar es Salaam", district: "Kinondoni", ward: "Kijitonyama", status: "Active" }],
  units: [{ id: "10000000-0000-4000-8000-000000000003", unitCode: "A-101", unitType: "Apartment", buildingName: "Kijitonyama Apartments", rentAmount: 1_250_000, status: "Occupied" }, { id: "10000000-0000-4000-8000-000000000004", unitCode: "A-102", unitType: "Apartment", buildingName: "Kijitonyama Apartments", rentAmount: 1_100_000, status: "Available" }],
  owners: [{ id: "10000000-0000-4000-8000-000000000005", legalName: "Mlimani Properties Ltd", kycStatus: "Verified" }],
  tenants: [{ id: "10000000-0000-4000-8000-000000000006", tenantCode: "TEN-001", fullName: "Asha Mrema", phone: "0712345678", kycStatus: "Verified", status: "Active" }],
  applications: [],
  leases: [{ id: "10000000-0000-4000-8000-000000000007", leaseNumber: "PL-2026-001", startDate: "2026-01-01", endDate: "2026-12-31", rentAmount: 1_250_000, depositAmount: 2_500_000, rentFrequency: "Monthly", status: "Active" }],
  invoices: [{ id: "10000000-0000-4000-8000-000000000008", invoiceNumber: "PI-2026-001", invoiceType: "Rent", dueDate: "2026-08-07", totalAmount: 1_250_000, amountPaid: 900_000, status: "Overdue" }],
  payments: [], receipts: [], maintenanceRequests: [{ id: "10000000-0000-4000-8000-000000000009", requestNumber: "MR-2026-001", title: "Leaking tap", description: "Kitchen tap requires repair", category: "Plumbing", priority: "Medium", status: "Open" }], workOrders: [], expenses: [], reconciliations: [], documents: [], notifications: [], audit: [], taxRules: [], meters: [], contractors: [], integrationEvents: [],
};

test("loads the Property Management workspace and submits a guarded portfolio form", async ({ page }) => {
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "property-e2e-user", email: "property@e2e.invalid", user_metadata: { full_name: "Property Administrator" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "property-e2e-user", company_id: "property-e2e-company", full_name: "Property Administrator", role: "Property Administrator", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "property-e2e-company", name: "Mlimani Properties", category: "real_estate", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const procedures = requestUrl.pathname.split("/api/trpc/")[1]?.split(",") || [];
    console.log(`[property-e2e] ${route.request().method()} ${requestUrl.pathname} procedures=${procedures.join(",")}`);
    const responses = procedures.map((procedure) => {
      if (procedure === "propertyManagement.snapshot") return trpcResult(propertySnapshot);
      if (procedure === "propertyManagement.action") return trpcResult({ id: "10000000-0000-4000-8000-000000000010", status: "Active" });
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, {
    id: "property-e2e-user",
    email: "property@e2e.invalid",
    fullName: "Property Administrator",
    profile: { id: "property-e2e-user", company_id: "property-e2e-company", full_name: "Property Administrator", role: "Property Administrator", customer_ref: null },
    company: { id: "property-e2e-company", name: "Mlimani Properties", category: "real_estate", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" },
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Dashboard", exact: true }).first()).toBeVisible();
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true }); if (await dismiss.count()) await dismiss.last().click({ force: true });
  const tour = page.locator('[data-onboarding-tour="true"]');
  const skipTour = tour.locator("button").filter({ hasText: "Skip tour" });
  if (await skipTour.count()) await skipTour.evaluate((node) => (node as HTMLButtonElement).click());
  if (await tour.count()) await expect(tour).toHaveCount(0);
  const propertyNavigation = page.locator("aside nav button").filter({ hasText: "Property Management" });
  const isMobileViewport = await page.evaluate(() => window.innerWidth < 1024);
  if (isMobileViewport) await page.getByRole("button", { name: "Open menu" }).click();
  await expect(propertyNavigation).toHaveCount(1);
  await propertyNavigation.evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.getByRole("heading", { name: "Portfolio, leases, rent, and property operations" })).toBeVisible();
  await expect(page.getByText("50.00%", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Portfolio", exact: true }).click();
  await expect(page.getByText("Kijitonyama Apartments", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Add portfolio" }).click();
  await expect(page.getByRole("dialog", { name: "Register portfolio" })).toBeVisible();
  const dialog = page.getByRole("dialog", { name: "Register portfolio" });
  await dialog.locator("input").nth(0).fill("DSM-PORT-02");
  await dialog.locator("input").nth(1).fill("Northern Residential");
  await dialog.getByRole("button", { name: "Save confirmed workflow" }).click();
  await expect(page.getByText("Server-confirmed status: Active.", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Register portfolio" })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Portfolio, leases, rent, and property operations" })).toBeVisible();
  await page.screenshot({ path: "test-results/property-management-workspace-mobile.png", fullPage: true });
});
