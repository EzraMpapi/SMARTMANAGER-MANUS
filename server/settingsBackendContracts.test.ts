import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const settingsSource = dashboardSource.slice(dashboardSource.indexOf("function SettingsPage("), dashboardSource.indexOf("function TeamManagement("));
const rootSource = dashboardSource.slice(dashboardSource.indexOf("async function toggleModule(id)"), dashboardSource.indexOf("// Tables read by more than one module"));
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const settingsServiceSource = readFileSync(new URL("./workspaceSettings.ts", import.meta.url), "utf8");

describe("Settings backend integration contracts", () => {
  it("hydrates Settings from a protected backend query and saves profile state only after the server confirms it", () => {
    expect(settingsSource).toContain("trpc.workspaceSettings.get.useQuery");
    expect(settingsSource).toContain("trpc.workspaceSettings.save.useMutation");
    expect(settingsSource).toContain("const saved = await workspaceSettingsMutation.mutateAsync");
    expect(settingsSource).toContain("setCompany(confirmedDraft);");
    expect(settingsSource).toContain("persistenceFailureMessage(\"Saving company settings\", e)");
    expect(settingsSource).not.toContain('localStorage.setItem("bs_company_profile"');
  });

  it("prevents non-administrator Settings writes and disables duplicate profile submissions", () => {
    expect(settingsSource).toContain("const canManageCompanySettings");
    expect(settingsSource).toContain('canonicalRoleId(currentUser.role)');
    expect(settingsSource).toContain("{canManageCompanySettings && (");
    expect(settingsSource).toContain("disabled={!dirty || workspaceSettingsMutation.isPending}");
    expect(settingsServiceSource).toContain("Only an organization administrator can change company settings.");
    expect(settingsServiceSource).toContain('"owner"');
    expect(settingsServiceSource).toContain("requireSettingsManager(profile.role)");
  });

  it("keeps extended profile data server-only for writes while preserving authenticated tenant reads", () => {
    expect(settingsServiceSource).toContain("company_profile_settings");
    expect(settingsServiceSource).toContain("ENV.supabaseSecretKey");
    expect(settingsServiceSource).toContain("resolveVerifiedProfile(req)");
    expect(settingsServiceSource).toContain("fetchCompany(profile.company_id, token)");
    expect(settingsServiceSource).toContain("company_id: companyId");
    expect(routerSource).toContain("workspaceSettings: router({");
    expect(routerSource).toContain("saveWorkspaceSettings(ctx.req, input)");
  });

  it("exposes truthful protected-workspace connection states with a retry control", () => {
    expect(settingsSource).toContain('role="status" aria-live="polite"');
    expect(settingsSource).toContain("Server-confirmed workspace settings are loaded for this session.");
    expect(settingsSource).toContain("The protected workspace settings service could not be reached.");
    expect(settingsSource).toContain("workspaceSettingsQuery.refetch()");
    expect(settingsSource).toContain("Retry connection");
    expect(settingsSource).toContain("disabled={workspaceSettingsQuery.isFetching}");
  });

  it("updates module entitlements only after a confirmed server response and surfaces a recoverable failure", () => {
    expect(dashboardSource).toContain("const [moduleSettingPending, setModuleSettingPending] = useState(false)");
    expect(rootSource).toContain("if (!saved?.id) throw buildConfirmedMutationError");
    expect(rootSource).toContain("setEnabledModules(next);");
    expect(rootSource).toContain("persistenceFailureMessage(\"Updating the module setting\", error)");
    expect(rootSource.indexOf("setEnabledModules(next);")).toBeGreaterThan(rootSource.indexOf("await sb(\"company_modules\")"));
  });

  it("keeps Settings branches and departments out of live state until their database inserts succeed", () => {
    expect(dashboardSource).toContain("persistenceFailureMessage(\"Adding the branch\", error)");
    expect(dashboardSource).toContain("persistenceFailureMessage(\"Deleting the branch\", error)");
    expect(dashboardSource).toContain("persistenceFailureMessage(\"Adding the department\", error)");
    expect(dashboardSource).toContain("persistenceFailureMessage(`Installing the ${kit} department kit`, error)");
    const branchesSource = dashboardSource.slice(dashboardSource.indexOf("function BranchesManager()"), dashboardSource.indexOf("function DepartmentsManager("));
    const departmentsSource = dashboardSource.slice(dashboardSource.indexOf("function DepartmentsManager("), dashboardSource.indexOf("function AppLockManager("));
    expect(branchesSource).not.toContain("Branch added locally, but saving to the server failed.");
    expect(departmentsSource).not.toContain("Saved locally, but the server update failed.");
  });
});
