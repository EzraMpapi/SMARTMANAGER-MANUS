import { expect, test } from "playwright/test";

test("advances through valid account and workspace setup without submitting a real account", async ({ page }) => {
  await page.goto("/app?auth=signup", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("Your full name")).toBeVisible();

  await page.getByPlaceholder("Your full name").fill("Asha Mrema");
  await page.getByPlaceholder("you@company.tz").fill("asha.browser.test@example.com");
  await page.getByPlaceholder("Create a password").fill("StrongPass!123");
  await page.getByPlaceholder("Repeat password").fill("StrongPass!123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to company setup →" }).click();

  await expect(page.getByRole("heading", { name: "Register your company" })).toBeVisible();
  await page.getByPlaceholder("e.g. Kilimanjaro Traders Ltd").fill("Kilimanjaro Traders");
  await page.getByRole("button", { name: "Continue to modules →" }).click();

  await expect(page.getByRole("heading", { name: "Choose your starting modules" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Launch Smart Manager →" })).toBeEnabled();
});
