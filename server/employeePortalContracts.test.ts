import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { dashboardSource } from "./dashboardSourceSnapshot";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/EmployeePortalWorkspace.jsx"), "utf8");
const dashboard = dashboardSource;
const migration = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260821_013_employee_portal_core.sql"), "utf8");

describe("Employee Portal production contracts", () => {
  it("uses confirmed database snapshots and command procedures rather than browser-local workflow authority", () => {
    expect(workspace).toContain('rpc("employee_portal_snapshot", {})');
    expect(workspace).toContain('rpc("employee_portal_action", { p_action: action, p_payload: payload })');
    expect(workspace).not.toContain("localStorage");
    expect(workspace).not.toContain("sessionStorage");
    expect(dashboard).toContain('fetch(`${SUPABASE_URL}/rest/v1/rpc/${procedure}`');
    expect(dashboard).toContain('import { EmployeePortalWorkspace } from "./components/EmployeePortalWorkspace"');
    expect(dashboard).toContain("return <EmployeePortalWorkspace");
    expect(dashboard).toContain('rpc={(procedure, payload) => callRpc(procedure, payload, getStoredAccessToken() || "")}');
    expect(dashboard).toContain("<EmployeePortal\n              currentUser={currentUser}");
  });

  it("covers employee self-service, management approvals, and the requested connected portal areas", () => {
    for (const label of [
      "Attendance", "Leave", "Timesheets", "Payslips", "Benefits", "Expenses",
      "Goals & KPIs", "Learning", "Documents", "Requests", "Announcements", "Approvals", "My Team"
    ]) expect(workspace).toContain(label);
    for (const action of [
      "attendance.clock_in", "attendance.clock_out", "leave.submit", "leave.decide",
      "timesheet.submit", "timesheet.decide", "expense.submit", "expense.decide",
      "goal.save", "training.complete", "request.submit", "request.decide"
    ]) expect(`${workspace}\n${migration}`).toContain(action);
  });

  it("enforces tenant-scoped identity, role helpers, audit writes, and typed HR persistence in the migration", () => {
    for (const token of [
      "profile_id uuid", "employee_portal_snapshot", "employee_portal_action",
      "hr_is_privileged", "hr_current_employee_id", "hr_can_manage_employee",
      "hr_append_audit", "hr_create_notification", "ROW LEVEL SECURITY",
      "hr_statutory_rules", "Africa/Dar_es_Salaam", "DEFAULT 'TZS'"
    ]) expect(migration).toContain(token);
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.employee_portal_snapshot() TO authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.employee_portal_action(text, jsonb) TO authenticated");
  });
});
