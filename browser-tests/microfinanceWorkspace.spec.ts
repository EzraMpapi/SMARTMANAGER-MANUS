import { expect, test } from "@playwright/test";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const dashboard = {
  permissions: { canManage: true, canApprove: true, canDisburse: true, canCollect: true, canAudit: true },
  currency: "TZS", timezone: "Africa/Dar_es_Salaam",
  metrics: { borrowerCount: 1, verifiedBorrowerCount: 1, activeLoanCount: 1, portfolioOutstanding: 780_000, overdueAmount: 100_000, par30Amount: 100_000, par30Ratio: 12.8, savingsBalance: 42_000, repaymentCollected: 120_000 },
  borrowers: [{ id: "0f1d66a4-f1b0-4c8d-9e0c-82dfc10457d1", name: "Neema Mushi", status: "Active", phone: "0712000111", nationalId: "19900101-00000-00001-00", kycStatus: "Verified", village: "Moshi mjini", district: "Moshi", region: "Kilimanjaro", groupId: null, monthlyIncome: 650000 }],
  groups: [],
  products: [{ id: "5407ce52-3e93-4960-9c48-54790f3e703f", name: "Business working capital", status: "Active", code: "BWC-01", minimumPrincipal: 100000, maximumPrincipal: 5000000, annualInterestRate: 24, setupFeeRate: 2, insuranceFeeRate: 1, penaltyRateMonthly: 3, collectorCommissionRate: 1, termMinMonths: 1, termMaxMonths: 12, repaymentFrequency: "monthly" }],
  applications: [{ id: "fc415a61-1c54-4d55-8c4d-0c0d0f0fc382", borrowerName: "Neema Mushi", productName: "Business working capital", amount: 800000, termMonths: 6, kycStatus: "Verified", status: "Submitted" }],
  loans: [{ id: "b90609db-53cf-43df-83d0-bafc7e7b1c39", number: "MFI-20260821-NEEMA", borrowerName: "Neema Mushi", productName: "Business working capital", principal: 800000, totalDue: 930000, outstanding: 780000, disbursedOn: "2026-06-21", status: "Active", repaymentFrequency: "monthly", termMonths: 6, paymentMethod: "cash", mobileMoneyState: "Not applicable" }],
  schedules: [{ id: "0c2b4336-004c-45b6-a13b-31bedc6b490b", loanId: "b90609db-53cf-43df-83d0-bafc7e7b1c39", loanNumber: "MFI-20260821-NEEMA", borrowerName: "Neema Mushi", dueDate: "2026-07-01", outstanding: 100000, status: "Due", daysPastDue: 51 }],
  repayments: [], savings: [], collections: [], cashSessions: [], scorecards: [{ id: "b3c7f6cf-44e9-45d7-8c1a-0ed1527a83a2", name: "Scorecard · Neema Mushi", status: "Manual review", score: 62, createdAt: "2026-08-21T07:00:00.000Z" }],
  notifications: [{ id: "5a527bd3-8d52-4a94-814a-0bb9b066657f", name: "Loan application awaiting credit decision", status: "Unread", severity: "Info", createdAt: "2026-08-21T07:00:00.000Z" }],
};

test("loads the Microfinance Command Center and completes guarded borrower registration feedback", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_access_token", "e2e-microfinance-access-token");
    window.localStorage.setItem("bs_refresh_token", "e2e-microfinance-refresh-token");
  });
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "mfi-e2e-user", email: "microfinance@e2e.invalid", user_metadata: { full_name: "Mussa Mrema" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "mfi-e2e-user", company_id: "mfi-e2e-company", full_name: "Mussa Mrema", role: "Organization Owner", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "mfi-e2e-company", name: "Kilimanjaro Finance", category: "microfinance", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure) => {
      if (procedure === "microfinance.dashboard") return trpcResult(dashboard);
      if (procedure === "microfinance.createBorrower") return trpcResult({ id: "new-borrower-id", name: "Amina Kweka", status: "Active", kycStatus: "Pending" });
      if (procedure === "microfinance.auditHistory") return trpcResult({ rows: [] });
      if (procedure === "microfinance.creditScoringSettings") return trpcResult({ settings: { id: "score-settings", kycWeight: 20, affordabilityWeight: 30, repaymentHistoryWeight: 20, guarantorWeight: 15, collateralWeight: 15, maxDebtServiceRatio: 40, approvalThreshold: 70, reviewThreshold: 50 }, canManage: true });
      if (procedure === "microfinance.escalationSettings") return trpcResult({ settings: { id: "escalation-settings", recipientMode: "roles", managedRecipients: [], roleRecipients: ["Company Administrator", "Collections Officer"], scheduleLocalTime: "08:00", timezone: "Africa/Dar_es_Salaam", par30AlertThreshold: 10, overdueAmountAlertThreshold: 100000, deliveryEnabled: false, scheduleState: "Inactive pending explicit time and activation confirmation", nextRunAt: null }, canManage: true });
      if (procedure === "microfinance.escalationHistory") return trpcResult({ rows: [] });
      if (procedure === "microfinance.saveCreditScoringSettings") return trpcResult({ settings: { id: "score-settings", kycWeight: 20, affordabilityWeight: 30, repaymentHistoryWeight: 20, guarantorWeight: 15, collateralWeight: 15, maxDebtServiceRatio: 40, approvalThreshold: 70, reviewThreshold: 50 } });
      if (procedure === "microfinance.saveEscalationSettings") return trpcResult({ message: "Escalation configuration saved. Daily delivery remains inactive until an explicit activation is confirmed.", settings: { id: "escalation-settings", deliveryEnabled: false } });
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible();
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true }); if (await dismiss.count()) await dismiss.click();
  const closeMenu = page.getByRole("button", { name: "Close menu" }); if (await closeMenu.count()) await closeMenu.click();
  const skipTour = page.getByRole("button", { name: "Skip tour" }); if (await skipTour.count()) await skipTour.click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("aside nav button").filter({ hasText: "Microfinance" }).click();
  await expect(page.getByRole("heading", { name: "Microfinance Command Center" })).toBeVisible();
  await expect(page.getByText("12.8%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Borrowers & KYC" }).click();
  await expect(page.getByText("Neema Mushi", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("microfinance-command-center-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Microfinance Command Center" })).toBeVisible();
  await page.getByRole("button", { name: "Borrower" }).first().click();
  await expect(page.getByRole("dialog", { name: "Register borrower" })).toBeVisible();
  await page.getByLabel("First name").fill("Amina");
  await page.getByLabel("Last name").fill("Kweka");
  await page.getByLabel("Mobile number").fill("0712345678");
  await page.getByLabel("National ID").fill("19990101-00000-00002-00");
  await page.getByLabel("Date of birth").fill("1999-01-01");
  await page.getByLabel("Village / ward").fill("Mbezi");
  await page.getByLabel("District").fill("Kinondoni");
  await page.getByLabel("Region").fill("Dar es Salaam");
  await page.getByRole("button", { name: "Save borrower" }).click();
  await expect(page.getByText("Borrower and KYC record saved", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Register borrower" })).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Credit desk" }).click();
  await expect(page.getByText("Approval threshold", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Configure rules" }).first().click();
  await expect(page.getByRole("dialog", { name: "Configure credit scoring rules" })).toBeVisible();
  await expect(page.getByText("100 / 100 points allocated.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save scoring rules" }).click();
  await expect(page.getByText("Credit scoring rules saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Governance" }).click();
  await expect(page.getByText("Inactive pending explicit time and activation confirmation", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Configure", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Daily PAR and collections escalation" })).toBeVisible();
  await expect(page.getByLabel("Recipient role Company Administrator")).toBeChecked();
  await expect(page.getByLabel("Recipient role Collections Officer")).toBeChecked();
  await expect(page.getByLabel("Enable daily PAR escalation")).not.toBeChecked();
  await page.getByRole("button", { name: "Save escalation settings" }).click();
  await expect(page.getByText("Daily escalation configuration saved", { exact: true })).toBeVisible();
});
