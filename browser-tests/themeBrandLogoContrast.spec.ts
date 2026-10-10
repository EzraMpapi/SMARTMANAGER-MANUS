import { expect, test, type Page } from "@playwright/test";
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

test.describe("brand logo theme contrast", () => {
  test("keeps the uploaded logo visible and transparent across light, dark, and auto themes", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("bs_theme_mode", "light");
      window.localStorage.removeItem("bs_dark_shell");
      window.localStorage.removeItem("bs_dark");
    });
    await installIsolatedDashboardSession(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await dismissBlockingUi(page);
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ }).first()).toBeVisible();

    const logo = page.locator('[aria-label="Smart Manager Enterprise Suite"]');
    const logoImage = logo.locator('img[alt="Smart Manager official logo"]');
    const header = page.locator('header[aria-label="Workspace command bar"]');
    const themeToggle = page.getByRole("button", { name: /Theme mode:/ });
    const themes = ["light", "dark", "auto"] as const;
    const headerBackgrounds: string[] = [];

    for (const [index, theme] of themes.entries()) {
      if (index > 0) await themeToggle.click();
      await expect(header).toHaveAttribute("data-theme-mode", theme);
      await expect(logo).toBeVisible();
      await expect(logoImage).toHaveAttribute("src", /\/brand\/smart-manager-logo\.png$/);
      await expect(logoImage).toHaveAttribute("alt", "Smart Manager official logo");

      const rendering = await logo.evaluate((element) => {
        const image = element.querySelector("img");
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext("2d");
        if (!image || !context) return { transparentPixels: 0, naturalWidth: 0, background: "" };
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const alpha = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let transparentPixels = 0;
        for (let offset = 3; offset < alpha.length; offset += 4) {
          if (alpha[offset] === 0) transparentPixels += 1;
        }
        return {
          transparentPixels,
          naturalWidth: image.naturalWidth,
          background: getComputedStyle(element).backgroundColor,
        };
      });
      headerBackgrounds.push(await header.evaluate((element) => getComputedStyle(element).backgroundColor));
      expect(rendering.naturalWidth).toBeGreaterThan(0);
      expect(rendering.transparentPixels).toBeGreaterThan(0);
      expect(rendering.background).toBe("rgba(0, 0, 0, 0)");
      await expect(logo).toHaveScreenshot(`${theme}-header-logo.png`, { animations: "disabled" });
    }

    expect(new Set(headerBackgrounds).size).toBeGreaterThan(1);
  });
});
