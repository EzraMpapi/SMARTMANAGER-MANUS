import { expect, test, type Page } from "@playwright/test";
import { installManagedAuth } from "./support/authHarness";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const identity = {
  profile: {
    id: "profile-e2e-user",
    companyId: "profile-e2e-company",
    email: "profile@e2e.invalid",
    fullName: "Asha Mrema",
    preferredName: "Asha",
    firstName: "Asha",
    lastName: "Mrema",
    role: "Employee",
    phone: "+255 712 345 678",
    country: "Tanzania",
    timezone: "Africa/Dar_es_Salaam",
    dateFormat: "dd/MM/yyyy",
    currencyDisplay: "TZS",
    theme: "system",
    notificationPreferences: { email: true, push: true, sms: false },
    isActive: true,
    status: "Active",
    avatarUrl: null,
    extendedFieldsAvailable: true,
    updatedAt: "2026-08-23T08:00:00.000Z",
  },
  company: { id: "profile-e2e-company", name: "Mlimani Properties", category: "real_estate", region: "Dar es Salaam", country: "Tanzania" },
  work: { assigned: true, employeeNumber: "EMP-001", departmentId: "department-1", positionId: "position-1", timezone: "Africa/Dar_es_Salaam", status: "Active" },
  security: { lastLoginAt: "2026-08-23T08:00:00.000Z", currentSessionVerified: true, sessionDeviceDetailsAvailable: false, passwordChangeAvailable: false, note: "Password recovery and passkey controls remain managed by the existing authentication security flow." },
  preferences: { theme: "system", language: "en", currency: "TZS", timezone: "Africa/Dar_es_Salaam", dateFormat: "dd/MM/yyyy", notifications: { email: true, push: true, sms: false } },
  notifications: [],
  activity: [],
  completion: { completed: 5, total: 6, percentage: 83 },
  capabilities: { extendedFieldsAvailable: true, avatarLifecycleAvailable: true, workspaceSwitchingAvailable: false, sessionDeviceListAvailable: false, activityFeedAvailable: false },
};

async function setupIdentityPage(page: Page) {
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "profile-e2e-user", email: "profile@e2e.invalid", last_sign_in_at: "2026-08-23T08:00:00.000Z", user_metadata: { full_name: "Asha Mrema" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "profile-e2e-user", company_id: "profile-e2e-company", full_name: "Asha Mrema", role: "Employee", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "profile-e2e-company", name: "Mlimani Properties", category: "real_estate", region: "Dar es Salaam", country: "Tanzania" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const procedures = requestUrl.pathname.split("/api/trpc/")[1]?.split(",") || [];
    const responses = procedures.map((procedure) => {
      if (procedure === "profileIdentity.get") return trpcResult(identity);
      if (procedure === "profileIdentity.update") return trpcResult({ ...identity, profile: { ...identity.profile, fullName: "Asha Updated", preferredName: "Asha Updated", updatedAt: "2026-08-23T08:02:00.000Z" }, saved: true });
      if (procedure === "roleChangeApprovals.list" || procedure === "listRoleChangeApprovals") return trpcResult({ approvals: [], profile: identity.profile });
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, {
    id: "profile-e2e-user",
    email: "profile@e2e.invalid",
    fullName: "Asha Mrema",
    profile: { id: "profile-e2e-user", company_id: "profile-e2e-company", full_name: "Asha Mrema", role: "Employee", customer_ref: null },
    company: { id: "profile-e2e-company", name: "Mlimani Properties", category: "real_estate", region: "Dar es Salaam", country: "Tanzania" },
  });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Open account identity center", exact: true })).toBeVisible();
  for (const name of ["Dismiss", "Close onboarding tour", "Skip tour"]) {
    const buttons = page.getByRole("button", { name, exact: true });
    for (let index = 0; index < await buttons.count(); index += 1) {
      const button = buttons.nth(index);
      if (await button.isVisible().catch(() => false)) {
        await button.click({ force: true });
        break;
      }
    }
  }
  const tour = page.locator('[data-onboarding-tour="true"]');
  if (await tour.count()) await expect(tour).toHaveCount(0);
}

test("opens the premium account popover and navigates to the responsive My Profile experience", async ({ page }) => {
  await setupIdentityPage(page);
  await page.getByRole("button", { name: "Open account identity center" }).click();
  await expect(page.getByRole("dialog", { name: "Account identity center" })).toBeVisible();
  await expect(page.getByText("View My Profile", { exact: true })).toBeVisible();
  const serverBacked = true;
  await page.getByRole("dialog", { name: "Account identity center" }).getByRole("button").filter({ hasText: "View My Profile" }).click();
  await expect(page.getByRole("heading", { name: "My Profile", exact: true })).toBeVisible();
  await expect(page.getByText("Your operating context", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(page.getByText("Your details", { exact: true })).toBeVisible();
  const fullName = page.getByLabel("Legal / full name", { exact: true });
  await fullName.fill("Asha Updated");
  await page.getByRole("button", { name: "Save personal details", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "confirmed by the workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Security", exact: true }).click();
  await expect(page.getByText("Security and access", { exact: true })).toBeVisible();
  await expect(page.getByText("Current session verified", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await expect(page.getByText("Display and localisation", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "My Profile", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/profile-identity-center-mobile.png", fullPage: true });
});

test("signs out through the real session action from the account popover", async ({ page }) => {
  await setupIdentityPage(page);
  await page.getByRole("button", { name: "Open account identity center" }).click();
  await page.getByRole("dialog", { name: "Account identity center" }).getByRole("button").filter({ hasText: /Sign out|Exit demo/ }).click();
  await expect(page.getByRole("button", { name: "Sign in securely", exact: true })).toBeVisible();
});
