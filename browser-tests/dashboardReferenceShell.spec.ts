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
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ })).toBeVisible();
  return session;
}

test.describe("reference-directed enterprise dashboard", () => {
  test("keeps the desktop command center, dark operational rail, live-data panels, and responsive width intact", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop command-center assertions run in the desktop project only.");
    await page.setViewportSize({ width: 1440, height: 960 });
    const session = await openDashboard(page);

    await expect(page.getByRole("navigation", { name: "Operational workspaces" })).toBeVisible();
    await expect(page.getByRole("banner", { name: "Workspace command bar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Revenue & Sales Performance", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sales by category", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sales by channel", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inventory health", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick actions", exact: true })).toBeVisible();
    await expect(page.getByText("Total revenue", { exact: true })).toBeVisible();
    await expect(page.getByText("Receivables", { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("reference-dashboard-desktop.png"), fullPage: true });
  });

  test("keeps mobile navigation, menu access, command-center panels, and horizontal containment intact", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile drawer and bottom-navigation assertions run in the mobile project only.");
    await page.setViewportSize({ width: 375, height: 812 });
    const session = await openDashboard(page);

    await expect(page.getByRole("navigation", { name: "Mobile workspace navigation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Customize dashboard layout", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open account identity center", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Operational workspaces" })).toBeVisible();
    await page.getByRole("button", { name: "Close menu", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Revenue & Sales Performance", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Business health", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick actions", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("reference-dashboard-mobile.png"), fullPage: true });
  });

  test("keeps the rebuilt mobile command header clear of dashboard content across supported phone widths", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Phone header overlap assertions run in the mobile project only.");
    const phoneWidths = [320, 360, 375, 390, 412];

    for (const width of phoneWidths) {
      await page.setViewportSize({ width, height: 812 });
      const session = await openDashboard(page);
      const result = await page.evaluate(() => {
        const header = document.querySelector('header[aria-label="Workspace command bar"]');
        const greeting = Array.from(document.querySelectorAll("h1, h2, h3")).find((element) => /Good (morning|afternoon|evening), Layout/.test(element.textContent || ""));
        const controls = Array.from(header?.querySelectorAll("button") || []).filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        }).map((element) => {
          const rect = element.getBoundingClientRect();
          return { label: element.getAttribute("aria-label") || "", left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        });
        const headerRect = header?.getBoundingClientRect();
        const greetingRect = greeting?.getBoundingClientRect();
        const overlaps = controls.some((control, index) => controls.slice(index + 1).some((other) => control.left < other.right && control.right > other.left && control.top < other.bottom && control.bottom > other.top));
        return {
          headerBottom: headerRect?.bottom || 0,
          greetingTop: greetingRect?.top || 0,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          overlappingVisibleHeaderControls: overlaps,
        };
      });

      expect(result.headerBottom).toBeLessThanOrEqual(result.greetingTop);
      expect(result.horizontalOverflow).toBe(false);
      expect(result.overlappingVisibleHeaderControls).toBe(false);
      expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    }
  });

  test("keeps the Create-menu backdrop above fixed mobile workspace navigation and closes it safely", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Create-menu stacking assertions run in the mobile project only.");
    await page.setViewportSize({ width: 375, height: 812 });
    const session = await openDashboard(page);
    const createToggle = page.locator('button[aria-haspopup="menu"]').first();
    const createMenu = page.getByRole("menu", { name: "Create a new record" });
    const mobileNavigation = page.getByRole("navigation", { name: "Mobile workspace navigation" });
    const salesTab = mobileNavigation.getByRole("button", { name: "Sales", exact: true });

    await expect(createToggle).toHaveAttribute("aria-expanded", "false");
    await createToggle.click();
    await expect(createToggle).toHaveAttribute("aria-expanded", "true");
    await expect(createMenu).toBeVisible();

    const salesBox = await salesTab.boundingBox();
    expect(salesBox).not.toBeNull();
    const elementAtSalesTab = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute("aria-label"), {
      x: (salesBox?.x || 0) + (salesBox?.width || 0) / 2,
      y: (salesBox?.y || 0) + (salesBox?.height || 0) / 2,
    });
    expect(elementAtSalesTab).toBe("Close create menu");

    await salesTab.click({ force: true });
    await expect(createMenu).toBeHidden();
    await expect(page.getByRole("heading", { name: "Revenue & Sales Performance", exact: true })).toBeVisible();
    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("create-menu-mobile-stacking.png"), fullPage: false });
  });

  test("keeps Notification Center and Command Palette interactive and isolated in the production build", async ({ page }, testInfo) => {
    await page.setViewportSize(testInfo.project.name === "chromium-mobile" ? { width: 375, height: 812 } : { width: 1440, height: 960 });
    const session = await openDashboard(page);
    const notificationToggle = page.getByLabel("Notifications", { exact: true });

    await expect(notificationToggle).toBeVisible();
    await notificationToggle.click();
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /View Today Daily Brief/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeHidden();
    await notificationToggle.click();
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    await page.locator("div.fixed.inset-0.z-30").last().click({ position: { x: 8, y: 8 } });
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeHidden();

    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: "Search workspace" });
    const search = page.getByRole("textbox", { name: "Search customers, invoices, products, modules, and actions" });
    await expect(palette).toBeVisible();
    await expect(search).toBeFocused();
    await search.fill("sales");
    await expect(page.getByRole("listbox", { name: "Workspace search results" })).toContainText("Sales");
    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();

    expect(session.observedRequests.every((url) => url.includes("e2e.supabase.invalid") || url.includes("/api/trpc/"))).toBe(true);
  });
});
