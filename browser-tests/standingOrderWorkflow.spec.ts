import { expect, test } from "@playwright/test";
import { installManagedAuth } from "./support/authHarness";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const sourceAccount = { id: "11111111-1111-4111-8111-111111111111", account_number: "TZ-SOURCE-001", customer_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", currency: "TZS", ledger_balance: 250000, available_balance: 250000, status: "ACTIVE", version: 4 };
const destinationAccount = { id: "22222222-2222-4222-8222-222222222222", account_number: "TZ-DEST-001", customer_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", currency: "TZS", ledger_balance: 50000, available_balance: 50000, status: "ACTIVE", version: 1 };
const customer = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", customer_number: "CUS-001", full_name: "Asha Mrema", customer_kind: "INDIVIDUAL", kyc_status: "VERIFIED", risk_rating: "STANDARD" };
const company = { id: "standing-order-e2e-company", name: "Standing Order E2E MFI", category: "banking", tax_rate: 18, timezone: "Africa/Dar_es_Salaam", currency: "TZS" };

function snapshot(standingOrders: unknown[]) {
  return {
    companyId: company.id,
    viewer: { id: "standing-order-e2e-user", name: "Maker Checker", role: "Admin" },
    institution: [{ id: "institution-1", legal_name: company.name, trading_name: "SO E2E MFI", institution_type: "MFI", currency: "TZS", timezone: "Africa/Dar_es_Salaam" }],
    branches: [], accountTypes: [], loanProducts: [], customers: [customer], customerDocuments: [], beneficialOwners: [],
    accounts: [sourceAccount, destinationAccount], beneficiaries: [], transactions: [], tellers: [], cashMovements: [], agents: [], wallets: [], paymentInstructions: [], applications: [], approvals: [], guarantors: [], collateral: [], loans: [], schedules: [], repayments: [], groups: [], groupMembers: [], shares: [], standingOrders, reconciliations: [], amlAlerts: [], notifications: [], errors: [],
  };
}

function extractInput(request: import("@playwright/test").Request): unknown {
  try {
    const postData = request.postData();
    if (postData) return JSON.parse(postData);
  } catch { /* The assertion below still verifies the server route was reached. */ }
  try {
    const input = new URL(request.url()).searchParams.get("input");
    return input ? JSON.parse(input) : null;
  } catch { return null; }
}

function unwrapInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};
  const batchItem = (input as Record<string, unknown>)["0"];
  if (batchItem && typeof batchItem === "object") {
    const json = (batchItem as Record<string, unknown>).json;
    if (json && typeof json === "object") return json as Record<string, unknown>;
  }
  return input as Record<string, unknown>;
}

async function dismissTransientUi(page: import("@playwright/test").Page) {
  for (const name of ["Dismiss", "Close onboarding tour", "Skip tour", "Close menu"]) {
    const buttons = page.getByRole("button", { name, exact: true });
    for (let index = 0; index < await buttons.count(); index += 1) {
      const button = buttons.nth(index);
      if (await button.isVisible().catch(() => false)) {
        await button.click({ force: true });
        break;
      }
    }
  }
}

test("Standing Order workflow stays server-confirmed across maker-checker and lifecycle transitions", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_brief_2026-08-25", "1");
    window.localStorage.setItem("bs_onboarding_tour_standing-order-e2e-user_standing-order-e2e-company", JSON.stringify({ status: "dismissed", completedAt: new Date().toISOString() }));
  });
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "standing-order-e2e-user", email: "maker@example.invalid", user_metadata: { full_name: "Maker Checker" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    const rows = url.includes("/profiles")
      ? [{ id: "standing-order-e2e-user", company_id: company.id, full_name: "Maker Checker", role: "Admin", customer_ref: null }]
      : url.includes("/companies") ? [company] : [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
  });

  let standingOrder: Record<string, unknown> | null = null;
  const lifecycleCalls: Array<{ procedure: string; input: unknown }> = [];
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure) => {
      const input = extractInput(route.request());
      if (procedure === "bankMfi.snapshot") return trpcResult(snapshot(standingOrder ? [standingOrder] : []));
      if (procedure === "bankMfi.createStandingOrder") {
        lifecycleCalls.push({ procedure, input });
        standingOrder = { id: "33333333-3333-4333-8333-333333333333", order_number: "SO-E2E-001", source_account_id: sourceAccount.id, destination_account_id: destinationAccount.id, amount: 25000, currency: "TZS", channel: "INTERNAL_TRANSFER", frequency: "MONTHLY", next_run_date: "2026-09-01", status: "PENDING_APPROVAL", approval_required: true, run_count: 0, failure_count: 0, version: 0 };
        return trpcResult({ standingOrderId: standingOrder.id, status: standingOrder.status, version: standingOrder.version });
      }
      const transitions: Record<string, { status: string; version: number }> = {
        "bankMfi.approveStandingOrder": { status: "APPROVED", version: 1 },
        "bankMfi.activateStandingOrder": { status: "ACTIVE", version: 2 },
        "bankMfi.pauseStandingOrder": { status: "PAUSED", version: 3 },
        "bankMfi.resumeStandingOrder": { status: "ACTIVE", version: 4 },
        "bankMfi.cancelStandingOrder": { status: "CANCELLED", version: 5 },
      };
      if (transitions[procedure]) {
        lifecycleCalls.push({ procedure, input });
        standingOrder = { ...standingOrder, status: transitions[procedure].status, version: transitions[procedure].version };
        return trpcResult({ standingOrderId: standingOrder.id, status: standingOrder.status, version: standingOrder.version });
      }
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, { id: "standing-order-e2e-user", email: "maker@example.invalid", fullName: "Maker Checker", profile: { id: "standing-order-e2e-user", company_id: company.id, full_name: "Maker Checker", role: "Admin", customer_ref: null }, company, role: "Admin" });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await dismissTransientUi(page);
  const workspaceAside = page.locator("aside").first();
  const isMobile = await page.evaluate(() => window.innerWidth < 1024);
  if (isMobile && (await workspaceAside.getAttribute("aria-hidden")) === "true") {
    const openMenu = page.getByRole("button", { name: "Open menu", exact: true }).last();
    await expect(openMenu).toBeVisible();
    await openMenu.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(workspaceAside).toHaveAttribute("aria-hidden", "false");
  }
  const bankingNav = page.locator('aside nav button[data-tour-target="banking"]');
  if (await bankingNav.count()) {
    await expect(bankingNav).toBeVisible();
    await bankingNav.evaluate((element) => (element as HTMLButtonElement).click());
  } else {
    const financeNav = page.locator('aside nav button[aria-controls="navigation-items-finance"]');
    if (await financeNav.count()) {
      await expect(financeNav).toBeVisible();
      if ((await financeNav.getAttribute("aria-expanded")) !== "true") await financeNav.click({ force: true });
      await expect(financeNav).toHaveAttribute("aria-expanded", "true");
      await expect(bankingNav).toBeVisible();
      await bankingNav.evaluate((element) => (element as HTMLButtonElement).click());
    } else {
      await page.goto("/app?module=banking", { waitUntil: "domcontentloaded" });
    }
  }
  await page.waitForTimeout(750);
  await dismissTransientUi(page);
  await expect(page.getByRole("heading", { name: /SO E2E MFI|Institution configuration/ })).toBeVisible();
  await page.getByRole("button", { name: "Cash & channels", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Standing order workflow", exact: true })).toBeVisible();

  const standingPanel = page.getByRole("heading", { name: "Standing order workflow", exact: true }).locator("..").locator("..").locator("..");
  const sourceSelect = standingPanel.locator("select").nth(0);
  await sourceSelect.selectOption(sourceAccount.id);
  await standingPanel.locator("select").nth(1).selectOption("INTERNAL_TRANSFER");
  const destinationSelect = standingPanel.locator("select").nth(2);
  await destinationSelect.selectOption(destinationAccount.id);
  await page.getByLabel("Amount (TZS)").fill("25000");
  await page.getByLabel("First run date").fill("2026-09-01");
  await page.getByRole("button", { name: "Create pending approval", exact: true }).click();
  await expect(page.getByText("SO-E2E-001", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Activate", exact: true }).click();
  await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("scheduled maintenance"));
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("customer request"));
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();

  expect(lifecycleCalls.map((call) => call.procedure)).toEqual([
    "bankMfi.createStandingOrder",
    "bankMfi.approveStandingOrder",
    "bankMfi.activateStandingOrder",
    "bankMfi.pauseStandingOrder",
    "bankMfi.resumeStandingOrder",
    "bankMfi.cancelStandingOrder",
  ]);
  expect(unwrapInput(lifecycleCalls[0]?.input)).toEqual(expect.objectContaining({ payload: expect.objectContaining({ idempotencyKey: expect.any(String), channel: "INTERNAL_TRANSFER", currency: "TZS" }) }));
  expect(unwrapInput(lifecycleCalls[1]?.input)).toEqual(expect.objectContaining({ expectedVersion: 0 }));
  expect(unwrapInput(lifecycleCalls[2]?.input)).toEqual(expect.objectContaining({ expectedVersion: 1 }));
  expect(unwrapInput(lifecycleCalls[3]?.input)).toEqual(expect.objectContaining({ expectedVersion: 2, reason: "scheduled maintenance" }));
  expect(unwrapInput(lifecycleCalls[4]?.input)).toEqual(expect.objectContaining({ expectedVersion: 3 }));
  expect(unwrapInput(lifecycleCalls[5]?.input)).toEqual(expect.objectContaining({ expectedVersion: 4, reason: "customer request" }));
});

export {};
