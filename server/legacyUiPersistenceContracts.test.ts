import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("legacy UI persistence boundaries", () => {
  it("uses the server-backed team invitation procedures for HR invitations", () => {
    const employeesStart = dashboardSource.indexOf("function Employees(");
    const employeesEnd = dashboardSource.indexOf("function EmployeePanel(", employeesStart);
    const employeesSource = dashboardSource.slice(employeesStart, employeesEnd);

    expect(employeesSource).toContain("trpc.teamInvitations.list.useQuery");
    expect(employeesSource).toContain("trpc.teamInvitations.create.useMutation");
    expect(employeesSource).toContain("No browser-only invite codes are created.");
    expect(employeesSource).not.toContain("hr_invite_codes");
    expect(employeesSource).not.toContain("ep_self_");
    expect(employeesSource).not.toContain("localStorage");
  });

  it("does not claim integration settings saved when storage is unavailable", () => {
    const integrationStart = dashboardSource.indexOf("function IntegrationConnections(");
    const integrationEnd = dashboardSource.indexOf("function MobileMoneyReconciliation(", integrationStart);
    const integrationSource = dashboardSource.slice(integrationStart, integrationEnd);

    expect(integrationSource).toContain("storageUnavailable");
    expect(integrationSource).toContain('runCompanyTableMutation("integration_connections", "update"');
    expect(integrationSource).toContain("The server did not confirm the integration update.");
    expect(integrationSource).not.toContain("saved locally regardless");
  });

  it("persists Integration Hub settings through the deployed JSONB envelope", () => {
    const integrationStart = dashboardSource.indexOf("function IntegrationConnections(");
    const integrationEnd = dashboardSource.indexOf("function MobileMoneyReconciliation(", integrationStart);
    const integrationSource = dashboardSource.slice(integrationStart, integrationEnd);

    expect(dashboardSource).toContain("data.integrationId || r.name || r.id");
    expect(integrationSource).toContain("integrationId: id");
    expect(integrationSource).toContain("status: next.enabled ? \"Connected\" : \"Disconnected\"");
    expect(integrationSource).toContain('matchCol: "id", matchVal: existing.dbId');
    expect(integrationSource).toContain('runCompanyTableMutation("integration_connections", "insert", payload)');
    expect(integrationSource).not.toContain('"integration_id"');
    expect(integrationSource).not.toContain('"tenant_id"');
  });

  it("reads employee announcements from the persisted HR table without a static seed", () => {
    expect(dashboardSource).toContain('useCompanyTable("hr_announcements", []');
    expect(dashboardSource).toContain("No local copy was used.");
    expect(dashboardSource).not.toContain("ANNOUNCEMENTS_SEED");
  });

  it("does not restore business identity from browser-only company-profile storage", () => {
    expect(dashboardSource).not.toContain("bs_company_profile");
    expect(dashboardSource).toContain("persisted workspace settings query below");
  });

  it("does not retain the copied CRM invite-code action", () => {
    const crmStart = dashboardSource.indexOf("function CRM(");
    const hrStart = dashboardSource.indexOf("function HR(");
    const crmSource = dashboardSource.slice(crmStart, hrStart);

    expect(crmSource).not.toContain("Invite Code");
    expect(crmSource).not.toContain("setShowInvite");
  });
});
