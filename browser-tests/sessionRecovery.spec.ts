import { expect, test } from "playwright/test";

const user = { id: "e2e-user", email: "launch@e2e.invalid", user_metadata: { full_name: "Asha Mrema" } };
const profile = { id: user.id, company_id: "e2e-company", full_name: "Asha Mrema", role: "Organization Owner", customer_ref: null };
const company = { id: "e2e-company", name: "Kilimanjaro Traders", category: "general", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" };

function session(accessToken: string, refreshToken: string, expiresAt: number) {
  return { access_token: accessToken, refresh_token: refreshToken, expires_in: 3600, expires_at: expiresAt, token_type: "bearer", user };
}

async function seedManagedSession(page: Parameters<typeof test>[0]["page"], storedSession: ReturnType<typeof session>) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("smart-manager-auth", JSON.stringify(value));
  }, storedSession);
}

async function mockIdentityEndpoints(page: Parameters<typeof test>[0]["page"], snapshot: () => { status: number; body: unknown }) {
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/rpc/auth_identity_snapshot")) {
      const result = snapshot();
      await route.fulfill({ status: result.status, contentType: "application/json", body: JSON.stringify(result.body) });
      return;
    }
    if (url.includes("/profiles")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([profile]) });
      return;
    }
    if (url.includes("/companies")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([company]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

function authorizedSnapshot() {
  return {
    authorized: true,
    reason: null,
    profile,
    company,
    membership: { userId: user.id, companyId: company.id, role: "owner" },
    workspace: { id: "e2e-workspace", companyId: company.id, name: "Kilimanjaro Traders" },
    role: "owner",
    permissions: [],
  };
}

test("recovers a stored managed session after a one-time access-token refresh", async ({ page }) => {
  let refreshRequests = 0;
  await seedManagedSession(page, session("expired-access-token", "valid-refresh-token", 1));
  await page.route("**/auth/v1/token?grant_type=refresh_token", async (route) => {
    refreshRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...session("fresh-access-token", "fresh-refresh-token", Math.floor(Date.now() / 1000) + 3600), user }),
    });
  });
  await mockIdentityEndpoints(page, () => ({ status: 200, body: authorizedSnapshot() }));

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible({ timeout: 30000 });
  expect(refreshRequests).toBeGreaterThanOrEqual(1);
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("smart-manager-auth") || "{}").access_token)).toBe("fresh-access-token");
  await expect(page.getByText("Your session has expired. Sign in again, then retry joining the company.")).toHaveCount(0);
});

test("offers an in-app retry for a transient identity-snapshot failure without signing the user out", async ({ page }) => {
  let snapshotRequests = 0;
  let allowSnapshot = false;
  await seedManagedSession(page, session("valid-access-token", "valid-refresh-token", Math.floor(Date.now() / 1000) + 3600));
  await mockIdentityEndpoints(page, () => {
    snapshotRequests += 1;
    return allowSnapshot
      ? { status: 200, body: authorizedSnapshot() }
      : { status: 503, body: { message: "Temporary workspace lookup issue" } };
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Retry secure workspace recovery" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Diagnostic:")).toHaveCount(0);
  allowSnapshot = true;
  await page.getByRole("button", { name: "Retry secure workspace recovery" }).click();
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible({ timeout: 30000 });
  expect(snapshotRequests).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"))).toContain("valid-access-token");
});

test("keeps a verified session recoverable when identity bootstrap loses authorization", async ({ page }) => {
  await seedManagedSession(page, session("stale-access-token", "stale-refresh-token", Math.floor(Date.now() / 1000) + 3600));
  await mockIdentityEndpoints(page, () => ({ status: 401, body: { message: "JWT expired" } }));

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("alert")).toContainText("cannot verify the account identity", { timeout: 30000 });
  await expect(page.getByRole("button", { name: "Retry secure workspace recovery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in securely" })).toHaveCount(0);
});
