import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const service = readFileSync(new URL("./dashboardPreferences.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const drawer = readFileSync(new URL("../client/src/components/DashboardPreferencesDrawer.tsx", import.meta.url), "utf8");
const context = readFileSync(new URL("../client/src/contexts/DashboardPreferencesContext.tsx", import.meta.url), "utf8");

describe("reset dashboard preferences to administrator default", () => {
  it("uses the verified profile scope and deletes only the dashboard preference key", () => {
    expect(service).toContain("export async function resetDashboardPreferences");
    expect(service).toContain("resolveVerifiedProfile(req)");
    expect(service).toContain("company_id: `eq.${profile.company_id}`");
    expect(service).toContain("user_id: `eq.${profile.id}`");
    expect(service).toContain("preference_key: `eq.${DASHBOARD_PREFERENCE_KEY}`");
    expect(service).toContain("method: \"DELETE\"");
    expect(service).toContain("return getDashboardPreferences(req)");
  });

  it("registers the reset as a protected endpoint", () => {
    expect(router).toContain("resetToTeamDefault: protectedProcedure.mutation");
    expect(router).toContain("resetDashboardPreferences(ctx.req)");
  });

  it("restores the active team preset in the client instead of built-in defaults", () => {
    expect(context).toContain("resetToTeamDefaultMutation");
    expect(context).toContain("normalizePreferences(result.preferences)");
    expect(drawer).toContain("Reset to Team Default");
    expect(drawer).toContain("Restore the administrator default?");
    expect(drawer).toContain("The active role or department preset will be restored");
  });
});
