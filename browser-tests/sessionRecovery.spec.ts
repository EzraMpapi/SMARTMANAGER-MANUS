import { expect, test } from "playwright/test";

test("recovers a stored launch session and opens its verified workspace after a one-time access-token refresh", async ({ page }) => {
  let userRequests = 0;
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_access_token", "expired-access-token");
    window.localStorage.setItem("bs_refresh_token", "valid-refresh-token");
  });
  await page.route("**/auth/v1/user", async (route) => {
    userRequests += 1;
    if (userRequests === 1) {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "JWT expired" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-user", email: "launch@e2e.invalid", user_metadata: { full_name: "Asha Mrema" } }) });
  });
  await page.route("**/auth/v1/token?grant_type=refresh_token", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ access_token: "fresh-access-token", refresh_token: "fresh-refresh-token" }) });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-user", company_id: "e2e-company", full_name: "Asha Mrema", role: "Organization Owner", customer_ref: null }]) });
      return;
    }
    if (url.includes("/companies")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-company", name: "Kilimanjaro Traders", category: "general", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible();
  expect(userRequests).toBe(2);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("bs_access_token"))).toBe("fresh-access-token");
  await expect(page.getByText("Your session has expired. Sign in again, then retry joining the company.")).toHaveCount(0);
});

test("offers an in-app retry for a transient workspace launch failure without signing the user out", async ({ page }) => {
  let profileRequests = 0;
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_access_token", "valid-access-token");
    window.localStorage.setItem("bs_refresh_token", "valid-refresh-token");
  });
  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-user", email: "launch@e2e.invalid", user_metadata: { full_name: "Asha Mrema" } }) });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) {
      profileRequests += 1;
      if (profileRequests === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Temporary workspace lookup issue" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-user", company_id: "e2e-company", full_name: "Asha Mrema", role: "Organization Owner", customer_ref: null }]) });
      return;
    }
    if (url.includes("/companies")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-company", name: "Kilimanjaro Traders", category: "general", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Retry secure workspace recovery" })).toBeVisible();
  await expect(page.getByText("Diagnostic:")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry secure workspace recovery" }).click();
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible();
  expect(profileRequests).toBeGreaterThanOrEqual(2);
  const telemetry = await page.evaluate(() => window.localStorage.getItem("bs_session_refresh_telemetry") || "");
  expect(telemetry).toContain('"outcome":"retryable_failure"');
  expect(telemetry).not.toMatch(/token|email|tenant|company|href|error/i);
});
