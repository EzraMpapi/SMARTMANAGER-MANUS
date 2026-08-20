import { expect, test, type Page } from "playwright/test";

async function completeIsolatedSignup(page: Page) {
  await page.goto("/app?auth=signup", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("Your full name")).toBeVisible();

  await page.getByPlaceholder("Your full name").fill("Asha Mrema");
  await page.getByPlaceholder("you@company.tz").fill("asha@e2e.invalid");
  await page.getByPlaceholder("Create a password").fill("StrongPass!123");
  await page.getByPlaceholder("Repeat password").fill("StrongPass!123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to company setup →" }).click();

  await expect(page.getByRole("heading", { name: "Register your company" })).toBeVisible();
  await page.getByPlaceholder("e.g. Kilimanjaro Traders Ltd").fill("Kilimanjaro Traders");
  await page.getByRole("button", { name: "Continue to modules →" }).click();

  await expect(page.getByRole("heading", { name: "Choose your starting modules" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Launch Smart Manager →" })).toBeEnabled();
  await page.getByRole("button", { name: "Launch Smart Manager →" }).click();

  await expect(page.getByRole("heading", { name: "Congratulations — you’re ready." })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Isolated authenticated workspace session is active");
  await expect(page.getByRole("status")).toContainText("No authentication request or tenant record was sent");
}

test("completes an isolated post-signup workspace without contacting the configured tenant", async ({ page }) => {
  await completeIsolatedSignup(page);
  await page.route("**/ComplianceAuditLogView-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 750));
    await route.continue();
  });
  await page.getByRole("button", { name: "Preview compliance audit workspace" }).click();
  await expect(page.getByLabel("Loading compliance audit workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compliance Audit Trail" })).toBeVisible();
  await page.route("**/DashboardPreferencesDrawer-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 750));
    await route.continue();
  });
  await page.getByRole("button", { name: "Preview dashboard preferences" }).click();
  await expect(page.getByLabel("Loading dashboard preferences")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard Preferences" })).toBeVisible();
});

test("keeps the isolated authenticated signup success state readable at the mobile breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await completeIsolatedSignup(page);
  await page.route("**/ComplianceAuditLogView-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 750));
    await route.continue();
  });
  await page.getByRole("button", { name: "Preview compliance audit workspace" }).click();
  await expect(page.getByLabel("Loading compliance audit workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compliance Audit Trail" })).toBeVisible();
  await expect(page.getByRole("status")).toBeVisible();
  expect(await page.getByRole("heading", { name: "Congratulations — you’re ready." }).boundingBox()).toMatchObject({ width: expect.any(Number) });
});
