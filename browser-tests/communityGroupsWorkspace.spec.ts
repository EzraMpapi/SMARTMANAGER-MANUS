import { expect, test } from "playwright/test";
import { installManagedAuth } from "./support/authHarness";

test("registers a group, onboards a member, and posts a TZS contribution", async ({ page }) => {
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "community-e2e-user", email: "owner@community.e2e", user_metadata: { full_name: "Community Owner" } }) }));
  let persistedGroup: Record<string, unknown> | null = null;
  let persistedMember: Record<string, unknown> | null = null;
  let persistedContribution: Record<string, unknown> | null = null;
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const url = request.url();
    const table = new URL(url).pathname.split("/").pop();
    if (table === "profiles") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "community-e2e-user", company_id: "community-e2e-company", full_name: "Community Owner", role: "Organization Owner" }]) });
    if (table === "companies") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "community-e2e-company", name: "Community Demo", timezone: "Africa/Dar_es_Salaam", category: "cooperative" }]) });
    if (table === "community_groups" && request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(persistedGroup ? [persistedGroup] : []) });
    if (table === "community_group_members" && request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(persistedMember ? [persistedMember] : []) });
    if (table === "community_group_contributions" && request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(persistedContribution ? [persistedContribution] : []) });
    if (request.method() === "POST" && table === "community_groups") { persistedGroup = { id: "group-e2e-1", group_number: "CG-E2E-1", name: "Umoja E2E Group", group_type: "Chama", contribution_frequency: "Monthly", meeting_frequency: "Monthly", country: "Tanzania", currency: "TZS", status: "Active" }; return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(persistedGroup) }); }
    if (request.method() === "POST" && table === "community_group_members") { persistedMember = { id: "member-e2e-1", group_id: "group-e2e-1", member_number: "MB-E2E-1", full_name: "Amina Kweka", phone: "+255 712 000 001", national_id: "19900101-00000-00001-00", id_type: "NIDA", role: "Member", kyc_status: "Pending", membership_status: "Active", join_date: "2026-08-23" }; return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(persistedMember) }); }
    if (request.method() === "POST" && table === "community_group_contributions") { persistedContribution = { id: "contribution-e2e-1", group_id: "group-e2e-1", member_id: "member-e2e-1", contribution_type: "Contribution", amount: 25000, contribution_date: "2026-08-23", payment_method: "Mobile Money", mobile_money_provider: "M-Pesa", payment_reference: "MPESA-E2E-1", status: "Paid", receipt_number: "RCT-E2E-1" }; return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(persistedContribution) }); }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await installManagedAuth(page, {
    id: "community-e2e-user",
    email: "owner@community.e2e",
    fullName: "Community Owner",
    profile: { id: "community-e2e-user", company_id: "community-e2e-company", full_name: "Community Owner", role: "Organization Owner" },
    company: { id: "community-e2e-company", name: "Community Demo", timezone: "Africa/Dar_es_Salaam", category: "cooperative" },
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible();
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true }); if (await dismiss.count()) await dismiss.click();
  const closeMenu = page.getByRole("button", { name: "Close menu" }); if (await closeMenu.count()) await closeMenu.click();
  const skipTour = page.getByRole("button", { name: "Skip tour" }); if (await skipTour.count()) await skipTour.click();
  const communityNav = page.locator("aside nav button").filter({ hasText: "Community Groups" });
  if (!(await communityNav.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await communityNav.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page.getByRole("heading", { name: "Community Groups Manager" })).toBeVisible();
  await page.getByRole("button", { name: "Groups", exact: true }).click();
  await page.getByRole("button", { name: "Register group" }).click();
  await page.locator("form").filter({ hasText: "Group name" }).locator("input").first().fill("Umoja E2E Group");
  await page.getByRole("button", { name: "Save and confirm" }).click();
  await expect(page.getByText("Umoja E2E Group", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Members & KYC" }).click();
  await page.getByRole("button", { name: "Add member" }).click();
  const memberForm = page.locator("form").filter({ hasText: "Full name" }).first();
  await memberForm.locator("input").nth(0).fill("Amina Kweka");
  await memberForm.locator("input").nth(3).fill("19900101-00000-00001-00");
  await page.getByRole("button", { name: "Save and confirm" }).click();
  await expect(page.getByText("Amina Kweka", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Funds & Savings", exact: true }).click();
  await page.getByRole("button", { name: "Post transaction" }).click();
  const financeForm = page.locator("form").filter({ hasText: "Amount (TZS)" }).first();
  const memberSelect = financeForm.locator("select").nth(2);
  await expect(memberSelect.locator("option").filter({ hasText: "Amina Kweka" })).toHaveCount(1);
  await memberSelect.selectOption({ index: 1 });
  await financeForm.locator('input[type="number"]').fill("25000");
  await financeForm.locator("input").nth(1).fill("MPESA-E2E-1");
  await page.getByRole("button", { name: "Save and confirm" }).click();
  await expect(page.getByText("TZS 25,000", { exact: true }).first()).toBeVisible();
});
