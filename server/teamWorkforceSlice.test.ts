import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboard = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const service = readFileSync(resolve(process.cwd(), "server/teamWorkforce.ts"), "utf8");

describe("Team & Workforce read-only slice", () => {
  it("is opt-in and keeps the existing Settings/HR path as the fallback", () => {
    expect(dashboard).toContain('const TEAM_WORKFORCE_CENTER_ENABLED = import.meta.env.VITE_TEAM_WORKFORCE_CENTER === "true";');
    expect(dashboard).toContain("TEAM_WORKFORCE_CENTER_ENABLED && canManage");
    expect(dashboard).toContain("TeamManagement currentUser={currentUser} canManage={canManage}");
    expect(dashboard).toContain('data-testid="team-workforce-center"');
  });

  it("uses a protected tRPC query and verified profile identity rather than client company input", () => {
    expect(router).toContain("teamWorkforce: router({");
    expect(router).toContain("snapshot: protectedProcedure.query(({ ctx }) => getTeamWorkforceSnapshot(ctx.req))");
    expect(service).toContain("resolveVerifiedProfile(req)");
    expect(service).toContain("const companyId = profile.company_id");
    expect(service).not.toContain("input.companyId");
  });

  it("reads only tenant-scoped employee, department, position, onboarding, and invitation data", () => {
    for (const token of [
      "hr_employees?select=id,profile_id",
      "departments?select=id,name,status",
      "hr_positions?select=id,title,department_id,status",
      "hr_onboarding_cases?select=id,employee_id,status",
      "listTeamInvitations(req)",
      "company_id=eq.",
    ]) expect(service).toContain(token);
    expect(service).toContain("limit=500");
    expect(service).toContain("Promise.all");
  });

  it("does not fabricate unavailable authentication security metrics", () => {
    expect(service).toContain("membersOnline: null");
    expect(service).toContain("accessRequests: null");
    expect(service).toContain("accountsWithoutMfa: null");
    expect(service).toContain("recentlyFailedLogins: null");
    expect(service).toContain("dormantAccounts: null");
    expect(dashboard).toContain("unavailable Auth metrics are not fabricated");
  });

  it("does not expose invitation token material or sensitive profile fields in the projection", () => {
    expect(service).toContain("fullName: invitation.fullName");
    expect(service).toContain("expiresAt: invitation.expiresAt");
    expect(service).not.toContain("tokenHash");
    expect(service).not.toContain("password");
    expect(service).not.toContain("nida");
  });
});
