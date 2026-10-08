import { expect, test } from "playwright/test";

test.describe("public auth gateway controls", () => {
  test("opens recovery, returns to login, and enters the existing signup wizard", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: "Forgot password?", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Recover access", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sign in securely", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create your workspace", exact: true }).click();
    await expect(page).toHaveURL(/\/app\?auth=signup$/);
    await expect(page.getByPlaceholder("Your full name")).toBeVisible();
  });

  test("shows safe validation feedback and keeps password visibility interactive", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    const password = page.getByPlaceholder("Enter your password");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(page.getByPlaceholder("Enter your password")).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password", exact: true }).click();
    await expect(page.getByPlaceholder("Enter your password")).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Sign in securely", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Enter your work email and password to continue.");
  });
});
