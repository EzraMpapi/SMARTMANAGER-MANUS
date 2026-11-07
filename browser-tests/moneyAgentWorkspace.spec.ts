import { expect, test } from "playwright/test";
import { installManagedAuth } from "./support/authHarness";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const customerSnapshot = {
  customer: { id: "7d2b7f0a-9b08-4a6f-b312-3d5a59e0b4c1", fullName: "Neema Mushi", phone: "0712000111", kycStatus: "Verified", status: "Active" },
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  wallets: [{ walletType: "Settlement", currency: "TZS", availableBalance: 125000, status: "Active" }],
  transactions: [{ id: "a1a6e0b7-3e96-4c9b-bc99-5a77288e0b8b", transactionRef: "MA-20260823-NEEMA", transactionType: "Cash In", amount: 125000, fee: 0, status: "Successful", requestedAt: "2026-08-23T06:30:00.000Z" }],
  receipts: [{ id: "e70a6570-6ee6-4c49-86ea-3c8b0d6a4cbb", transactionId: "a1a6e0b7-3e96-4c9b-bc99-5a77288e0b8b", receiptNumber: "MA-RCPT-NEEMA001", channel: "Dashboard", issuedAt: "2026-08-23T06:31:00.000Z" }],
  notifications: [{ id: "542bd7fb-b8ec-4b2d-b4d4-5fa0c29e6b31", title: "Money Agent transaction successful", body: "Your Cash In was completed and recorded in the TZS ledger.", status: "Queued", createdAt: "2026-08-23T06:31:00.000Z" }],
};

test("loads the customer-only Money Agent portal with server-confirmed wallet history", async ({ page }, testInfo) => {
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "customer-e2e-user", email: "customer@e2e.invalid", user_metadata: { full_name: "Neema Mushi" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "customer-e2e-user", company_id: "customer-e2e-company", full_name: "Neema Mushi", role: "Customer", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "customer-e2e-company", name: "Kilimanjaro Finance", category: "money-agent", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure) => procedure === "moneyAgent.customerSnapshot" ? trpcResult(customerSnapshot) : trpcResult(null));
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, {
    id: "customer-e2e-user",
    email: "customer@e2e.invalid",
    fullName: "Neema Mushi",
    profile: { id: "customer-e2e-user", company_id: "customer-e2e-company", full_name: "Neema Mushi", role: "Customer", customer_ref: null },
    company: { id: "customer-e2e-company", name: "Kilimanjaro Finance", category: "money-agent", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" },
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Open permitted Money Agent workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Open permitted Money Agent workspace" }).click();
  await expect(page.getByRole("heading", { name: "Your wallet, safely in view" })).toBeVisible();
  await expect(page.getByText("Customer-only access", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText("Neema Mushi", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("main").getByText("TZS 125,000", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA-RCPT-NEEMA001", { exact: true })).toBeVisible();
  await expect(page.getByText("Your Cash In was completed and recorded in the TZS ledger.", { exact: true })).toBeVisible();
  await expect(page.getByText("Agent register and KYC/KYB", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Maker-checker approvals", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("money-agent-customer-portal.png"), fullPage: true });
});
