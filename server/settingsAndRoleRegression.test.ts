import { describe, expect, it } from "vitest";
import { canonicalVerifiedRole } from "./aiApprovals";
import { healthcareAccessForRole } from "./healthcareOperations";
import { pharmacyAccessForRole } from "./pharmacyOperations";
import { readFileSync } from "node:fs";

const contextSource = readFileSync(new URL("../client/src/contexts/DashboardPreferencesContext.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const preferenceServiceSource = readFileSync(new URL("./dashboardPreferences.ts", import.meta.url), "utf8");


describe("workspace role and settings regressions", () => {
  it("canonicalizes administrator aliases before vertical authorization", () => {
    expect(canonicalVerifiedRole("owner")).toBe("Organization Owner");
    expect(canonicalVerifiedRole("ADMIN")).toBe("Super Administrator");
    expect(pharmacyAccessForRole("owner").canRead).toBe(true);
    expect(pharmacyAccessForRole("owner").canGovern).toBe(true);
    expect(healthcareAccessForRole("owner").canRead.hc_patients).toBe(true);
    expect(healthcareAccessForRole("owner").canArchive.hc_patients).toBe(true);
  });

  it("uses the protected database-backed dashboard preference API", () => {
    expect(routerSource).toContain("dashboardPreferences: router({");
    expect(routerSource).toContain("getDashboardPreferences(ctx.req)");
    expect(routerSource).toContain("saveDashboardPreferences(ctx.req, input)");
    expect(preferenceServiceSource).toContain("user_table_preferences");
    expect(preferenceServiceSource).toContain("company_id: profile.company_id");
    expect(preferenceServiceSource).toContain("user_id: profile.id");
    expect(preferenceServiceSource).toContain("DASHBOARD_NAVIGATION_GROUP_IDS");
    expect(preferenceServiceSource).toContain('requestedNavigationGroups.add("home")');
    expect(contextSource).toContain("trpc.dashboardPreferences.get.useQuery");
    expect(contextSource).toContain("trpc.dashboardPreferences.save.useMutation");
    expect(contextSource).toContain("visibleNavigationGroupIds");
    expect(contextSource).toContain("showGuidedTour");
    expect(contextSource).toContain("if (!liveSession");
    expect(contextSource).toContain('localStorage.setItem("smart_manager_dashboard_prefs"');
  });
});
