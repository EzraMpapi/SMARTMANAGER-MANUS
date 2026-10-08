import { expect, test, type Page } from "playwright/test";

type PreviewIdentity = {
  id: string;
  email: string;
  fullName: string;
  profile: Record<string, unknown> | null;
  company: Record<string, unknown> | null;
};

const OWNER: PreviewIdentity = {
  id: "preview-owner-001",
  email: "owner@preview.invalid",
  fullName: "Preview Owner",
  profile: { id: "preview-owner-001", company_id: "preview-company-001", full_name: "Preview Owner", role: "Organization Owner", customer_ref: null },
  company: { id: "preview-company-001", name: "Preview Controlled Tenant", category: "general", timezone: "Africa/Dar_es_Salaam", currency: "TZS" },
};

async function mockSupabasePreview(page: Page, identity: PreviewIdentity = OWNER) {
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    const body = route.request().postDataJSON() as { email?: string; password?: string };
    if (body.email !== identity.email || body.password !== "PreviewPass!123") {
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error_code: "invalid_credentials", msg: "Invalid login credentials" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "preview-access-token",
        refresh_token: "preview-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user: { id: identity.id, email: identity.email, user_metadata: { full_name: identity.fullName }, app_metadata: { provider: "email" } },
      }),
    });
  });

  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: identity.id, email: identity.email, user_metadata: { full_name: identity.fullName }, app_metadata: { provider: "email" } }) });
  });

  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/rpc/auth_identity_snapshot")) {
      const authorized = Boolean(identity.profile && identity.company);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authorized,
          reason: authorized ? null : "PROFILE_MISSING",
          profile: identity.profile,
          company: identity.company,
          membership: authorized ? { userId: identity.id, companyId: "preview-company-001", role: "owner" } : null,
          workspace: authorized ? { id: "preview-workspace-001", companyId: "preview-company-001", name: "Preview Workspace" } : null,
          role: authorized ? "owner" : null,
          roles: [],
          permissions: [],
        }),
      });
      return;
    }
    if (url.includes("/profiles")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(identity.profile ? [identity.profile] : []) });
      return;
    }
    if (url.includes("/companies")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(identity.company ? [identity.company] : []) });
      return;
    }
    if (url.includes("/company_memberships") || url.includes("/workspaces") || url.includes("/workforce_roles") || url.includes("/workforce_role_permissions")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
}

async function signIn(page: Page, email = OWNER.email, password = "PreviewPass!123") {
  await page.goto("/app?auth=login", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Work email")).toBeVisible();
  await page.getByLabel("Work email").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign in securely" }).click();
}

test.describe("centralized AuthProvider authenticated preview matrix", () => {
  test("signs in through the managed Supabase client and resolves the controlled tenant", async ({ page }) => {
    await mockSupabasePreview(page);
    await signIn(page);

    await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible({ timeout: 30000 });
    const managedSession = await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"));
    expect(managedSession).toContain("preview-owner-001");
    expect(await page.evaluate(() => window.localStorage.getItem("bs_access_token"))).toBeNull();
    expect(await page.evaluate(() => window.sessionStorage.getItem("bs_session_access_token"))).toBeNull();
  });

  test("keeps invalid credentials unauthenticated and exposes the provider-owned error path", async ({ page }) => {
    await mockSupabasePreview(page);
    await signIn(page, OWNER.email, "WrongPass!123");

    await expect(page.getByRole("alert")).toContainText("Invalid email or password.", { timeout: 10000 });
    await expect(page.getByRole("button", { name: "Sign in securely" })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"))).toBeNull();
  });

  test("retains a verified Supabase session but denies incomplete tenant identity", async ({ page }) => {
    await mockSupabasePreview(page, { ...OWNER, profile: null, company: null });
    await signIn(page);

    await expect(page.getByText("Secure workspace setup required", { exact: true })).toBeVisible({ timeout: 30000 });
    expect(await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"))).toContain("preview-owner-001");
  });
});
