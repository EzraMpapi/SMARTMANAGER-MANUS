import type { Page } from "playwright/test";

type ManagedIdentity = {
  id: string;
  email: string;
  fullName: string;
  profile: Record<string, unknown>;
  company: Record<string, unknown> & { id: string; name: string };
  role?: string;
};

export async function installManagedAuth(page: Page, identity: ManagedIdentity) {
  const role = identity.role || String(identity.profile.role || "Organization Owner");
  const accessToken = `${identity.id}-access-token`;
  const refreshToken = `${identity.id}-refresh-token`;
  await page.addInitScript((storedSession) => {
    window.localStorage.setItem("smart-manager-auth", JSON.stringify(storedSession));
    window.localStorage.setItem("bs_brief_2026-08-23", "1");
    window.localStorage.setItem(`bs_onboarding_tour_${storedSession.user.id}_${storedSession.companyId}`, JSON.stringify({ status: "dismissed", completedAt: new Date().toISOString() }));
  }, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: { id: identity.id, email: identity.email, user_metadata: { full_name: identity.fullName } },
    companyId: identity.company.id,
  });
  // Register after each spec's broad /rest/v1/** route so this narrow route wins.
  await page.route("**/rest/v1/rpc/auth_identity_snapshot", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authorized: true,
        reason: null,
        profile: identity.profile,
        company: identity.company,
        membership: { userId: identity.id, companyId: identity.company.id, role },
        workspace: { id: `${identity.company.id}-workspace`, companyId: identity.company.id, name: identity.company.name },
        role,
        permissions: [],
      }),
    });
  });
}
