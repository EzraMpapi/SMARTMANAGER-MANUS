import { expect, test } from "playwright/test";

const productionHost = "smartmanager-manus-render.onrender.com";

function assertProductionTarget() {
  const configured = process.env.E2E_BASE_URL?.trim();
  if (!configured)
    throw new Error("E2E_BASE_URL must point to the production deployment.");

  const url = new URL(configured);
  if (url.protocol !== "https:" || url.hostname !== productionHost) {
    throw new Error(
      `Production smoke tests refuse non-production target: ${url.origin}`
    );
  }
}

test.beforeAll(() => {
  assertProductionTarget();
});

test.describe("production synthetic smoke", () => {
  test("serves the public shell and auth configuration", async ({
    request,
  }) => {
    const landing = await request.get("/");
    expect(landing.status()).toBe(200);
    expect(await landing.text()).toContain("Smart Manager | Enterprise ERP");

    const app = await request.get("/app");
    expect(app.status()).toBe(200);
    expect(await app.text()).toContain('<div id="root"></div>');

    const config = await request.get("/api/config/public");
    expect(config.status()).toBe(200);
    const configBody = await config.json();
    expect(configBody).toEqual(
      expect.objectContaining({
        url: expect.stringMatching(/^https:\/\/.+/),
        anonKey: expect.any(String),
      })
    );

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.status()).toBe(200);
    expect(manifest.headers()["content-type"] || "").toMatch(/manifest|json/i);
  });

  test("renders login, recovery, and safe empty-submit behavior", async ({
    page,
  }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Welcome back", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in securely", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in with a passkey", exact: true })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Forgot password?", exact: true })
      .click();
    await expect(page).toHaveURL(/\/app\?auth=forgot$/);
    await expect(
      page.getByRole("heading", { name: "Recover access", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link", exact: true })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Back to sign in", exact: true })
      .click();
    await expect(page).toHaveURL(/\/app$/);
    await page
      .getByRole("button", { name: "Sign in securely", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      "Enter your work email and password to continue."
    );
  });

  test("keeps read-only ERP billing catalog public and protects authenticated access", async ({
    request,
  }) => {
    const catalog = await request.get("/api/billing/catalog");
    expect(catalog.status()).toBe(200);
    const catalogBody = await catalog.json();
    expect(catalogBody).toEqual(
      expect.objectContaining({ plans: expect.anything() })
    );

    const access = await request.get("/api/billing/access");
    expect([401, 403]).toContain(access.status());
  });
});
