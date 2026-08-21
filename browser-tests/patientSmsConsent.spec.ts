import { expect, test } from "@playwright/test";

function trpcResult(data: unknown) {
  return { result: { data: { json: data } } };
}

test("lets a linked patient update and revoke SMS appointment consent without rendering clinical data", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("bs_access_token", "patient-e2e-token"));
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure) => {
      if (procedure === "healthcare.patientSmsConsent") return trpcResult({ preference: "Granted", capturedAt: "2026-08-20T08:00:00.000Z", method: "Signed form", revokedAt: null, eligibleWhenProviderEnabled: true, providerStatus: "unconfigured", providerMessage: "SMS delivery is not active." });
      if (procedure === "healthcare.updatePatientSmsConsent") return trpcResult({ preference: "Revoked", capturedAt: "2026-08-20T08:00:00.000Z", method: "Signed form", revokedAt: "2026-08-21T08:00:00.000Z", eligibleWhenProviderEnabled: false, providerStatus: "unconfigured", providerMessage: "SMS delivery is not active." });
      return trpcResult(null);
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await page.goto("/patient/sms-preferences", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Appointment SMS preferences" })).toBeVisible();
  await expect(page.getByText("+255700000000", { exact: true })).toHaveCount(0);
  await page.getByLabel("Revoke consent").check();
  await page.getByLabel(/I understand that this withdraws my SMS reminder consent/).check();
  await page.getByRole("button", { name: "Confirm SMS consent revocation" }).click();
  await expect(page.getByText("Your SMS preference has been updated.", { exact: true })).toBeVisible();
});
