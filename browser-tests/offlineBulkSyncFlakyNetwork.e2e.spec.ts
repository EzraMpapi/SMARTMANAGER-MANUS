import { expect, test } from "@playwright/test";
import { installIsolatedDashboardSession } from "./support/isolatedDashboardSession";

test.describe("bulk offline synchronization over a flaky network", () => {
  test("queues bulk inserts offline, survives transient failures, and reconciles when online", async ({ page, context }) => {
    await installIsolatedDashboardSession(page);
    let flakyFailuresRemaining = 3;
    let serverWrites = 0;
    await page.route("**/rest/v1/rpc/create_company_and_owner", async (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "bulk-offline-company", name: "Bulk Offline E2E Company", category: "general", country: "Tanzania", currency: "TZS", timezone: "Africa/Dar_es_Salaam" }),
    }));
    await page.route("**/rest/v1/inventory_items**", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      serverWrites += 1;
      if (flakyFailuresRemaining > 0) {
        flakyFailuresRemaining -= 1;
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "temporary network failure" }) });
      }
      const payload = JSON.parse(route.request().postData() || "{}");
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify([{ id: payload.id || `server-${serverWrites}`, ...payload }]) });
    });

    await page.goto("/app?auth=signup&offline-e2e=bulk-sync", { waitUntil: "domcontentloaded" });
    const createCompany = page.getByRole("button", { name: "Create a company", exact: true });
    const companyName = page.getByPlaceholder("e.g. Kilimanjaro Traders Ltd");
    if (!(await companyName.isVisible().catch(() => false)) && await createCompany.isVisible().catch(() => false)) {
      await createCompany.click();
    }
    await companyName.fill("Bulk Offline E2E Company");
    await page.getByRole("button", { name: /Continue to modules/i }).click();
    await page.getByRole("button", { name: /Launch Smart Manager/i }).click();
    const continueToSignIn = page.getByRole("button", { name: /Continue to sign in/i });
    if (await continueToSignIn.isVisible().catch(() => false)) await continueToSignIn.click();
    await page.waitForFunction(() => Boolean((window as any).__SMART_MANAGER_OFFLINE_TEST__));
    await context.setOffline(true);

    const queued = await page.evaluate(async () => {
      const bridge = (window as any).__SMART_MANAGER_OFFLINE_TEST__;
      for (let index = 0; index < 25; index += 1) {
        await bridge.queue("inventory_items", { sku: `OFFLINE-${index}`, name: `Offline bulk item ${index}`, qty_on_hand: index + 1, reorder_level: 2, unit_cost: 100 });
      }
      return bridge.summary();
    });
    expect(queued.pending).toBe(25);
    await expect(page.getByRole("button", { name: /Outbox/ })).toBeVisible();
    await page.getByRole("button", { name: /Outbox/ }).click();
    await expect(page.getByText("Offline outbox (25)")).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, value: true }));
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    const firstSync = await page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.sync());
    await expect.poll(() => flakyFailuresRemaining, { timeout: 30_000 }).toBeLessThan(3);
    expect(firstSync.some((result: { status: string }) => result.status === "failed") || flakyFailuresRemaining < 3).toBe(true);

    const afterFlake = await page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.summary());
    if (afterFlake.failed > 0 || afterFlake.pending > 0) {
      await page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.sync());
    }

    await expect.poll(async () => page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.summary().pending)).toBe(0);
    await expect.poll(async () => page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.summary().failed)).toBe(0);
    expect(serverWrites).toBeGreaterThan(25);
  });
});
