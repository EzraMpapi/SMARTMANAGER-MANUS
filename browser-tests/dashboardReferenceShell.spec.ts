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

async function openDashboard(page: Page) {
  const session = await installIsolatedDashboardSession(page);
  await page.goto("/app?auth=signup", { waitUntil: "domcontentloaded" });
  await dismissBlockingUi(page);
  await expect(page.getByRole("button", { name: "Customize dashboard", exact: true })).toBeVisible();
  return session;
}

test.describe("reference-directed enterprise dashboard", () => {
  test("keeps the desktop command center, dark operational rail, live-data panels, and responsive width intact", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop command-center assertions run in the desktop project only.");
    await page.setViewportSize({ width: 1440, height: 960 });
    const session = await openDashboard(page);

    await expect(page.getByRole("navigation", { name: "Operational workspaces" })).toBeVisible();
    await expect(page.getByRole("banner", { name: "Workspace command bar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout\./ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Revenue overview", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sales document status", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick actions", exact: true })).toBeVisible();
    await expect(page.getByText("Collected revenue", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("reference-dashboard-desktop.png"), fullPage: true });
  });

  test("keeps mobile navigation, menu access, command-center panels, and horizontal containment intact", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile drawer and bottom-navigation assertions run in the mobile project only.");
    await page.setViewportSize({ width: 375, height: 812 });
    const session = await openDashboard(page);

    await expect(page.getByRole("navigation", { name: "Mobile workspace navigation" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Operational workspaces" })).toBeVisible();
    await page.getByRole("button", { name: "Close menu", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Revenue overview", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick actions", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("reference-dashboard-mobile.png"), fullPage: true });
  });
});
