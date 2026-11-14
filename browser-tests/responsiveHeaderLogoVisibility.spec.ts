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

  test("renders the uploaded logo with transparent pixels and no forced wrapper background", async ({ page }) => {
    await installIsolatedDashboardSession(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ }).first()).toBeVisible();

    const logo = page.locator('[aria-label="Smart Manager Enterprise Suite"]');
    const logoImage = logo.locator('img[alt="Smart Manager official logo"]');
    await expect(logo).toBeVisible();
    await expect(logoImage).toHaveAttribute("src", /\/brand\/smart-manager-logo\.png$/);

    const rendering = await logo.evaluate((element) => {
      const image = element.querySelector("img");
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d");
      if (!image || !context) return { background: "", transparentPixels: 0, naturalWidth: 0 };
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const alpha = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparentPixels = 0;
      for (let offset = 3; offset < alpha.length; offset += 4) {
        if (alpha[offset] === 0) transparentPixels += 1;
      }
      return {
        background: getComputedStyle(element).backgroundColor,
        transparentPixels,
        naturalWidth: image.naturalWidth,
      };
    });

    expect(rendering.naturalWidth).toBeGreaterThan(0);
    expect(rendering.transparentPixels).toBeGreaterThan(0);
    expect(rendering.background).toBe("rgba(0, 0, 0, 0)");
  });
});
