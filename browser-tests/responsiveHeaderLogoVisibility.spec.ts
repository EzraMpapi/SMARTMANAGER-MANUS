import { expect, test } from "@playwright/test";
import { installIsolatedDashboardSession } from "./support/isolatedDashboardSession";

const viewports = [
  { name: "small-phone", width: 320, height: 740, logoVisible: false, menuVisible: true },
  { name: "phone", width: 390, height: 844, logoVisible: false, menuVisible: true },
  { name: "tablet", width: 768, height: 1024, logoVisible: true, menuVisible: true },
  { name: "desktop", width: 1280, height: 800, logoVisible: true, menuVisible: false },
];

test.describe("responsive header logo visibility", () => {
  test("hides branding on small screens and preserves it from medium width upward", async ({ page }) => {
    await installIsolatedDashboardSession(page);
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ }).first()).toBeVisible();

    const logo = page.locator('[aria-label="Smart Manager Enterprise Suite"]');
    const logoImage = logo.locator('img[alt="Smart Manager official logo"]');
    const menu = page.getByRole("button", { name: "Open menu" });

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      if (viewport.logoVisible) {
        await expect(logo).toBeVisible();
        await expect(logoImage).toHaveAttribute("src", /\/brand\/smart-manager-logo\.png$/);
      } else {
        await expect(logo).toBeHidden();
      }
      if (viewport.menuVisible) await expect(menu).toBeVisible();
      else await expect(menu).toBeHidden();
    }
  });
});
