import { expect, test } from "@playwright/test";

function trpcResult(data: unknown) { return { result: { data: { json: data } } }; }

const student = { id: "8b91f860-9a59-4cd2-bf87-996d0d924c9f", name: "Asha Mrema", admissionNo: "ADM-2026-0001", status: "Active" };
const schoolAccess = { canRead: true, canConfigure: true, canManageAdmissions: true, canManageAcademic: true, canTeach: true, canManageFinance: true, canManageServices: true, canManageWelfare: true, canCommunicate: true, canGovern: true, canUsePortal: false };
const dashboard = { access: schoolAccess, totals: { activeStudents: 1, pendingAdmissions: 0, todayAttendanceRate: 100, outstandingFees: 80_000, todayCollections: 20_000, publishedReportCards: 0, pendingApprovals: 0 }, notifications: [], announcements: [], pendingAdmissions: [] };
const reports = { learners: { activeStudents: 1, pendingAdmissions: 0, activeEnrollments: 1, attendanceRate: 100 }, academics: { assessments: 0, averageScore: 0, publishedReportCards: 0 }, finance: { invoiced: 100_000, collected: 20_000, outstanding: 80_000, scholarshipsApproved: 0 }, services: { openLibraryLoans: 0, inventoryValue: 0, disciplineCases: 0 } };

async function mockAuthenticatedSchool(page: Parameters<typeof test>[0]["page"], access = schoolAccess, portal: unknown = null) {
  await page.addInitScript(() => {
    window.localStorage.setItem("bs_access_token", "e2e-school-access-token");
    window.localStorage.setItem("bs_refresh_token", "e2e-school-refresh-token");
    window.localStorage.setItem("bs_brief_2026-07-02", "1");
    window.localStorage.setItem("bs_onboarding_tour_school-e2e-user_school-e2e-company", JSON.stringify({ status: "dismissed", completedAt: new Date().toISOString() }));
  });
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "school-e2e-user", email: "school@e2e.invalid", user_metadata: { full_name: "School Test" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "school-e2e-user", company_id: "school-e2e-company", full_name: "School Test", role: "School Administrator", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "school-e2e-company", name: "Mwanza Academy", category: "education", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure) => {
      if (procedure === "school.dashboard") return trpcResult({ ...dashboard, access });
      if (procedure === "school.access") return trpcResult(access);
      if (procedure === "school.portal") return trpcResult(portal);
      if (procedure === "school.list") return trpcResult({ access, records: [student] });
      if (procedure === "school.reports") return trpcResult(reports);
      if (procedure === "school.audit") return trpcResult([]);
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
}

async function openSchoolWorkspace(page: Parameters<typeof test>[0]["page"]) {
  const closeMenu = page.getByRole("button", { name: "Close menu" });
  if (await closeMenu.isVisible().catch(() => false)) await closeMenu.click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("aside nav button").filter({ hasText: "School Management" }).click();
}

test("loads the School Management Command Center and live learner metrics responsively", async ({ page }, testInfo) => {
  await mockAuthenticatedSchool(page);
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await openSchoolWorkspace(page);
  await expect(page.getByRole("heading", { name: "School Management Command Center" })).toBeVisible();
  await expect(page.getByText("Active students", { exact: true })).toBeVisible();
  await expect(page.getByText("Outstanding fees", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Admissions" }).click();
  await expect(page.getByText("Submit student admission", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Asha Mrema" }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("school-command-center-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "School Management Command Center" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit admission" })).toBeVisible();
});

test("keeps School Management admission actions unavailable for a read-only role", async ({ page }) => {
  const restricted = { canRead: true, canConfigure: false, canManageAdmissions: false, canManageAcademic: false, canTeach: false, canManageFinance: false, canManageServices: false, canManageWelfare: false, canCommunicate: false, canGovern: false, canUsePortal: false };
  await mockAuthenticatedSchool(page, restricted);
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await openSchoolWorkspace(page);
  await page.getByRole("button", { name: "Admissions" }).click();
  await expect(page.getByText("Restricted action.", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Asha Mrema" }).first()).toBeVisible();
});

test("renders the server-filtered School Portal for a portal-only role", async ({ page }) => {
  const portalAccess = { canRead: false, canConfigure: false, canManageAdmissions: false, canManageAcademic: false, canTeach: false, canManageFinance: false, canManageServices: false, canManageWelfare: false, canCommunicate: false, canGovern: false, canUsePortal: true };
  await mockAuthenticatedSchool(page, portalAccess, { students: [student], teachers: [], invoices: [{ id: "invoice-1", invoiceNo: "INV-001", amount: 100_000, balance: 80_000, status: "Open", termName: "Term I" }], reports: [{ id: "report-1", name: "Term I report", average: 78.5, grade: "A", status: "Published" }], attendance: [{ id: "attendance-1", status: "Present" }], assignments: [{ id: "assignment-1", name: "Mathematics exercise", dueAt: "2026-07-10T10:00:00.000Z" }], announcements: [{ id: "announcement-1", name: "School opening", notes: "Term opens on Monday." }], messages: [] });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await openSchoolWorkspace(page);
  await expect(page.getByRole("heading", { name: "School Portal" })).toBeVisible();
  await expect(page.getByText("INV-001", { exact: true })).toBeVisible();
  await expect(page.getByText("Mathematics exercise", { exact: true })).toBeVisible();
});
