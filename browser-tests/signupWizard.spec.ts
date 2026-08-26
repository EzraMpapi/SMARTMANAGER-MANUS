import { expect, test, type Page } from "playwright/test";
import { installIsolatedDashboardSession } from "./support/isolatedDashboardSession";

async function dismissBlockingUi(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 700 : 300);
    for (const name of ["Dismiss", "Close onboarding tour", "Skip tour"]) {
      const button = page.getByRole("button", { name, exact: true }).last();
      if (await button.isVisible().catch(() => false)) await button.evaluate((element) => (element as HTMLButtonElement).click()).catch(() => undefined);
    }
  }
}

async function openIsolatedDashboard(page: Page) {
  const session = await installIsolatedDashboardSession(page);
  await page.goto("/app?auth=signup", { waitUntil: "domcontentloaded" });
  await dismissBlockingUi(page);
  await expect(page.getByRole("button", { name: "Customize dashboard", exact: true })).toBeVisible();
  return session;
}

async function openPreferences(page: Page) {
  await page.getByRole("button", { name: "Customize dashboard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dashboard Preferences" })).toBeVisible();
}

test("opens the real dashboard preferences drawer in a disposable mocked tenant session", async ({ page }, testInfo) => {
  const session = await openIsolatedDashboard(page);
  await openPreferences(page);
  await expect(page.getByRole("group", { name: "Default dashboard performance range" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Move Sales mix up" })).toBeVisible();
  expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("isolated-dashboard-preferences-open.png"), fullPage: true });
});

test("updates and saves dashboard layout preferences through only mocked tenant endpoints", async ({ page }, testInfo) => {
  const session = await openIsolatedDashboard(page);
  await openPreferences(page);

  const range = page.getByRole("group", { name: "Default dashboard performance range" });
  await range.getByRole("button", { name: "1Y", exact: true }).click();
  await expect(range.getByRole("button", { name: "1Y", exact: true })).toHaveAttribute("aria-pressed", "true");

  const expensesKpi = page.getByRole("button", { name: "Expenses", exact: true });
  await expensesKpi.click();
  await expect(expensesKpi).toHaveAttribute("aria-pressed", "false");

  const quickActionsToggle = page.locator('button[aria-pressed]').filter({ hasText: "Quick actions" }).first();
  await quickActionsToggle.click();
  await expect(quickActionsToggle).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Move Sales mix up" }).click();
  await expect(page.getByRole("button", { name: "Move Sales mix up" })).toBeDisabled();
  await expect.poll(session.preferenceSaveCount).toBeGreaterThan(0);
  expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);

  await page.screenshot({ path: testInfo.outputPath("isolated-dashboard-preferences-updated.png"), fullPage: true });
});

test("keeps the real preference controls reachable in the disposable tenant session at a mobile viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const session = await openIsolatedDashboard(page);
  await openPreferences(page);
  await expect(page.getByRole("group", { name: "Default dashboard performance range" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Move Sales mix up" })).toBeVisible();
  await expect(page.locator('button[aria-pressed]').filter({ hasText: "Quick actions" }).first()).toBeVisible();
  expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("isolated-dashboard-preferences-mobile.png"), fullPage: true });
});
