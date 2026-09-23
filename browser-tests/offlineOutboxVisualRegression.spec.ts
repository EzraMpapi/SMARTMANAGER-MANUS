import { expect, test } from "@playwright/test";
import { installIsolatedDashboardSession } from "./support/isolatedDashboardSession";

test.describe("offline Outbox visual regression", () => {
  test("keeps the expanded queue stable while a sync retry is active", async ({ page, context }) => {
    await installIsolatedDashboardSession(page);
    let releaseInventoryWrite: (() => void) | undefined;

    await page.route("**/rest/v1/inventory_items**", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await new Promise<void>((resolve) => { releaseInventoryWrite = resolve; });
      const payload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: payload.id || "visual-retry-server-row", ...payload }]),
      });
    });

    await page.goto("/app?auth=signup&offline-e2e=outbox-visual", { waitUntil: "domcontentloaded" });
    const createCompany = page.getByRole("button", { name: "Create a company", exact: true });
    const companyName = page.getByPlaceholder("e.g. Kilimanjaro Traders Ltd");
    if (!(await companyName.isVisible().catch(() => false)) && await createCompany.isVisible().catch(() => false)) {
      await createCompany.click();
    }
    await companyName.fill("Outbox Visual Regression Company");
    await page.getByRole("button", { name: /Continue to modules/i }).click();
    await page.getByRole("button", { name: /Launch Smart Manager/i }).click();
    const continueToSignIn = page.getByRole("button", { name: /Continue to sign in/i });
    if (await continueToSignIn.isVisible().catch(() => false)) await continueToSignIn.click();
    await page.waitForFunction(() => Boolean((window as any).__SMART_MANAGER_OFFLINE_TEST__));

    await context.setOffline(true);
    const queued = await page.evaluate(async () => {
      const bridge = (window as any).__SMART_MANAGER_OFFLINE_TEST__;
      await bridge.queue("inventory_items", {
        sku: "VISUAL-RETRY-001",
        name: "Visual retry inventory item",
        qty_on_hand: 7,
        reorder_level: 2,
        unit_cost: 125,
      });
      return bridge.summary();
    });
    expect(queued.pending).toBe(1);

    await expect(page.getByRole("button", { name: /Outbox/ })).toBeVisible();
    await page.getByRole("button", { name: /Outbox/ }).click();
    await expect(page.getByText("Offline outbox (1)")).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, value: true }));
    const syncPromise = page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.sync());
    await expect(page.getByRole("button", { name: "Syncing…", exact: true })).toBeVisible();
    await expect(page.locator("p").filter({ hasText: /^syncing · attempts/ })).toBeVisible();

    const banner = page.getByRole("status").filter({ hasText: "Outbox" }).first();
    await expect(banner).toHaveScreenshot("outbox-active-sync-retry-desktop.png", {
      animations: "disabled",
      caret: "hide",
    });

    releaseInventoryWrite?.();
    await syncPromise;
    await expect.poll(async () => page.evaluate(() => (window as any).__SMART_MANAGER_OFFLINE_TEST__.summary().pending)).toBe(0);
  });
});
