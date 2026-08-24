import { expect, test } from "@playwright/test";
import { installManagedAuth } from "./support/authHarness";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const medicine = { id: "9b91f860-9a59-4cd2-bf87-996d0d924c9f", name: "Paracetamol", genericName: "Acetaminophen", form: "Tablet", strength: "500 mg", barcode: "TZ-PCM-500", sellingPrice: 1000, unitCost: 500, availableQuantity: 36, reorderLevel: 50, requiresPrescription: false, controlled: false, taxRate: 0, status: "Active" };
const dashboard = { access: { canRead: true, canCatalog: true, canPurchase: true, canStock: true, canDispense: true, canControlled: true, canSale: true, canFinance: true, canGovern: true }, totals: { medicines: 1, activeBatches: 1, stockValue: 18_000, lowStock: 1, expiring: 0, todaySales: 3_000, pendingDispenses: 0, supplierBalance: 0 }, lowStock: [medicine], expiring: [], notifications: [] };

async function mockAuthenticatedPharmacy(page: Parameters<typeof test>[0]["page"], access = dashboard.access) {
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_brief_2026-07-02", "1");
    window.localStorage.setItem("bs_onboarding_tour_pharmacy-e2e-user_pharmacy-e2e-company", JSON.stringify({ status: "dismissed", completedAt: new Date().toISOString() }));
  });
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "pharmacy-e2e-user", email: "pharmacy@e2e.invalid", user_metadata: { full_name: "Pharmacy Test" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "pharmacy-e2e-user", company_id: "pharmacy-e2e-company", full_name: "Pharmacy Test", role: "Pharmacist", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "pharmacy-e2e-company", name: "Kilimanjaro Clinic", category: "healthcare", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure) => {
      if (procedure === "pharmacy.dashboard") return trpcResult({ ...dashboard, access });
      if (procedure === "pharmacy.access") return trpcResult(access);
      if (procedure === "pharmacy.list") return trpcResult({ access, records: [medicine] });
      if (procedure === "pharmacy.clinicalQueue") return trpcResult({ patients: [], prescriptions: [] });
      if (procedure === "pharmacy.reports") return trpcResult({ stock: { skuCount: 1, activeBatchCount: 1, stockValue: 18_000, movements: 0 }, finance: { salesTotal: 3_000, cashReceived: 3_000, supplierBalance: 0, receivables: 0, returnValue: 0 }, compliance: { controlledIssues: 0, insuranceClaims: 0, claimsOutstanding: 0 } });
      if (procedure === "pharmacy.audit") return trpcResult([]);
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, {
    id: "pharmacy-e2e-user",
    email: "pharmacy@e2e.invalid",
    fullName: "Pharmacy Test",
    profile: { id: "pharmacy-e2e-user", company_id: "pharmacy-e2e-company", full_name: "Pharmacy Test", role: "Pharmacist", customer_ref: null },
    company: { id: "pharmacy-e2e-company", name: "Kilimanjaro Clinic", category: "healthcare", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" },
  });
}

async function openPharmacyWorkspace(page: Parameters<typeof test>[0]["page"]) {
  const closeMenu = page.getByRole("button", { name: "Close menu" });
  if (await closeMenu.isVisible().catch(() => false)) await closeMenu.click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("aside nav button").filter({ hasText: "Pharmacy" }).click();
}

test("loads the Pharmacy Command Center and renders live catalogue signals responsively", async ({ page }, testInfo) => {
  await mockAuthenticatedPharmacy(page);
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await openPharmacyWorkspace(page);
  await expect(page.getByRole("heading", { name: "Pharmacy Command Center" })).toBeVisible();
  await expect(page.getByText("Stock value", { exact: true })).toBeVisible();
  await expect(page.getByText(/18,000/).first()).toBeVisible();
  await page.getByRole("button", { name: "Catalog" }).click();
  await expect(page.getByText("Medicine catalogue", { exact: true })).toBeVisible();
  await expect(page.getByText("Paracetamol", { exact: true }).last()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("pharmacy-command-center-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Pharmacy Command Center" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add medicine" })).toBeVisible();
});

test("keeps catalogue changes unavailable when the Pharmacy role is read only", async ({ page }) => {
  const restricted = { canRead: true, canCatalog: false, canPurchase: false, canStock: false, canDispense: false, canControlled: false, canSale: false, canFinance: false, canGovern: false };
  await mockAuthenticatedPharmacy(page, restricted);
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await openPharmacyWorkspace(page);
  await page.getByRole("button", { name: "Catalog" }).click();
  await expect(page.getByText("Restricted action.", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Paracetamol", { exact: true }).last()).toBeVisible();
});
