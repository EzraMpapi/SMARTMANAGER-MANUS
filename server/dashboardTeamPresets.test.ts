import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dashboardTeamPresetDefaultsForRole } from "./dashboardTeamPresets";

const presetService = readFileSync(new URL("./dashboardTeamPresets.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260827143000_dashboard_team_presets.sql", import.meta.url), "utf8");
const preferenceService = readFileSync(new URL("./dashboardPreferences.ts", import.meta.url), "utf8");

describe("dashboard team preset boundaries", () => {
  it("prefers a matching department preset over a matching role preset", () => {
    const roleValue = { compactDensity: false };
    const departmentValue = { compactDensity: true };
    const rows = [
      { target_type: "role", target_value: "Employee", is_active: true, value: roleValue },
      { target_type: "department", target_value: "dept-finance", is_active: true, value: departmentValue },
    ];

    expect(dashboardTeamPresetDefaultsForRole("Employee", "dept-finance", rows)).toEqual(departmentValue);
    expect(dashboardTeamPresetDefaultsForRole("Employee", "dept-sales", rows)).toEqual(roleValue);
  });

  it("ignores inactive and cross-target presets", () => {
    const rows = [
      { target_type: "role", target_value: "Employee", is_active: false, value: { compactDensity: true } },
      { target_type: "role", target_value: "Finance Manager", is_active: true, value: { compactDensity: true } },
    ];

    expect(dashboardTeamPresetDefaultsForRole("Employee", null, rows)).toBeUndefined();
  });

  it("keeps preset administration protected and explicitly company scoped", () => {
    expect(presetService).toContain("Only an organization administrator can manage team dashboard presets.");
    expect(presetService).toContain("company_id=eq.");
    expect(presetService).toContain("created_by: profile.id");
    expect(preferenceService).toContain("getActiveTeamPreset(profile, token)");
    expect(preferenceService).toContain("...(personal?.value");
  });

  it("keeps the database preset table private to the server-side API", () => {
    expect(migration).toContain("create table if not exists public.dashboard_team_presets");
    expect(migration).toContain("alter table public.dashboard_team_presets enable row level security");
    expect(migration).not.toContain("create policy");
    expect(migration).toContain("company_id, target_type, target_value");
  });
});
