import { expect, test, type Page } from "playwright/test";
import { installIsolatedDashboardSession } from "./support/isolatedDashboardSession";

async function dismissBlockingUi(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 700 : 300);
    for (const name of ["Dismiss", "Close onboarding tour", "Skip tour"]) {
      const control = page.getByRole("button", { name, exact: true }).last();
      if (await control.isVisible().catch(() => false)) {
        await control.evaluate((element) => (element as HTMLButtonElement).click()).catch(() => undefined);
      }
    }
  }
}

test.describe("isolated mobile dashboard performance", () => {
  test("records production-artifact navigation and dashboard-ready timing without external tenant traffic", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile performance measurements run in the mobile project only.");
    await page.setViewportSize({ width: 375, height: 812 });
    const session = await installIsolatedDashboardSession(page);
    await page.goto("/app?auth=signup", { waitUntil: "load" });
    await dismissBlockingUi(page);
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ })).toBeVisible();
    const dashboardReadyMs = await page.evaluate(() => Math.round(performance.now()));

    const metrics = await page.evaluate((readyAt) => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const totalTransferBytes = resources.reduce((total, resource) => total + (resource.transferSize || 0), 0);
      return {
        timeToFirstByteMs: Math.round(navigation?.responseStart || 0),
        domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd || 0),
        loadEventMs: Math.round(navigation?.loadEventEnd || 0),
        dashboardReadyMs: readyAt,
        resourceCount: resources.length,
        totalTransferBytes,
      };
    }, dashboardReadyMs);

    expect(metrics.timeToFirstByteMs).toBeGreaterThan(0);
    expect(metrics.domContentLoadedMs).toBeGreaterThan(0);
    expect(metrics.loadEventMs).toBeGreaterThan(0);
    expect(metrics.dashboardReadyMs).toBeGreaterThan(0);
    expect(metrics.dashboardReadyMs).toBeLessThan(12_000);
    expect(metrics.resourceCount).toBeGreaterThan(0);
    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    console.info("[mobile-dashboard-performance]", JSON.stringify(metrics));
    await page.screenshot({ path: testInfo.outputPath("mobile-dashboard-performance-audit.png"), fullPage: false });
    await testInfo.attach("mobile-performance-metrics.json", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
  });
});
