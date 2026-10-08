import { expect, test, type Page } from "@playwright/test";

const enabled = process.env.E2E_REAL_AUTH === "1";
const baseURL = process.env.E2E_BASE_URL?.trim() || "";
const approvedPreviewHost = process.env.E2E_PREVIEW_HOST?.trim().toLowerCase() || "";
const tenantAMarker = process.env.E2E_TENANT_A_MARKER?.trim() || "";
const tenantBMarker = process.env.E2E_TENANT_B_MARKER?.trim() || "";

const credentials = {
  userA: { email: process.env.E2E_USER_A_EMAIL?.trim() || "", password: process.env.E2E_USER_A_PASSWORD || "" },
  userB: { email: process.env.E2E_USER_B_EMAIL?.trim() || "", password: process.env.E2E_USER_B_PASSWORD || "" },
  incomplete: { email: process.env.E2E_INCOMPLETE_EMAIL?.trim() || "", password: process.env.E2E_INCOMPLETE_PASSWORD || "" },
};

const requiredEnvironment = [
  ["E2E_BASE_URL", baseURL],
  ["E2E_PREVIEW_HOST", approvedPreviewHost],
  ["E2E_TENANT_A_MARKER", tenantAMarker],
  ["E2E_TENANT_B_MARKER", tenantBMarker],
  ["E2E_USER_A_EMAIL", credentials.userA.email],
  ["E2E_USER_A_PASSWORD", credentials.userA.password],
  ["E2E_USER_B_EMAIL", credentials.userB.email],
  ["E2E_USER_B_PASSWORD", credentials.userB.password],
  ["E2E_INCOMPLETE_EMAIL", credentials.incomplete.email],
  ["E2E_INCOMPLETE_PASSWORD", credentials.incomplete.password],
] as const;

function assertApprovedPreviewUrl() {
  if (!baseURL || !approvedPreviewHost) throw new Error("Remote auth E2E requires E2E_BASE_URL and the exact approved E2E_PREVIEW_HOST.");
  const parsed = new URL(baseURL);
  const productionHosts = new Set(["menejajanja.vercel.app", "smartmanager-manus.vercel.app"]);
  if (parsed.protocol !== "https:") throw new Error("Remote auth E2E requires an HTTPS Vercel preview URL.");
  if (parsed.hostname !== approvedPreviewHost) throw new Error("E2E_BASE_URL does not match the exact approved E2E_PREVIEW_HOST.");
  if (!parsed.hostname.endsWith(".vercel.app") || productionHosts.has(parsed.hostname)) throw new Error("The real-auth suite refuses production or non-Vercel hosts.");
}

function assertEnvironment() {
  const missing = requiredEnvironment.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Remote auth E2E is enabled but required fixture variables are missing: ${missing.join(", ")}`);
  assertApprovedPreviewUrl();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/app?auth=login", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Work email")).toBeVisible();
  await page.getByLabel("Work email").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign in securely" }).click();
}

async function assertAuthorized(page: Page, marker: string) {
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.locator("body")).toContainText(marker, { timeout: 30000 });
  await expect(page.getByText("Secure workspace setup required", { exact: true })).toHaveCount(0);
}

test.describe("centralized AuthProvider against an approved Vercel preview", () => {
  test.skip(!enabled, "Skipped: set E2E_REAL_AUTH=1 to run against a deployed preview; no synthetic responses are used by this suite.");

  test.beforeAll(() => {
    if (enabled) assertEnvironment();
  });

  test("real user A signs in, restores the protected state after reload, and can sign out", async ({ page }) => {
    await signIn(page, credentials.userA.email, credentials.userA.password);
    await assertAuthorized(page, tenantAMarker);

    await page.reload({ waitUntil: "domcontentloaded" });
    await assertAuthorized(page, tenantAMarker);

    await page.getByRole("button", { name: "Sign out", exact: true }).last().click();
    await expect(page.getByRole("button", { name: "Sign in securely" })).toBeVisible({ timeout: 15000 });
    expect(await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"))).toBeNull();
  });

  test("invalid credentials do not establish a session", async ({ page }) => {
    await signIn(page, credentials.userA.email, `${credentials.userA.password}-invalid`);
    await expect(page.getByRole("alert")).toContainText("Invalid email or password.", { timeout: 10000 });
    await expect(page.getByRole("button", { name: "Sign in securely" })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"))).toBeNull();
  });

  test("a valid auth session with no tenant identity remains fail-closed", async ({ page }) => {
    await signIn(page, credentials.incomplete.email, credentials.incomplete.password);
    await expect(page.getByText("Secure workspace setup required", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Workspace overview", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => window.localStorage.getItem("smart-manager-auth"))).toContain(credentials.incomplete.email);
  });

  test("real user B resolves only tenant B and cannot display tenant A’s marker", async ({ page }) => {
    await signIn(page, credentials.userB.email, credentials.userB.password);
    await assertAuthorized(page, tenantBMarker);
    await expect(page.locator("body")).not.toContainText(tenantAMarker);
  });
});
