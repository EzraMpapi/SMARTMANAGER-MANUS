import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const employees = source.slice(source.indexOf("function Employees("), source.indexOf("function EmployeePanel("));
const employeePanel = source.slice(source.indexOf("function EmployeePanel("), source.indexOf("function EmployeeFormPanel("));
const employeeForm = source.slice(source.indexOf("function EmployeeFormPanel("), source.indexOf("function LeaveRequests("));
const leaveRequests = source.slice(source.indexOf("function LeaveRequests("), source.indexOf("function Recruitment("));

describe("Human Resources persistence boundaries", () => {
  it("uses confirmed server rows before showing employee creates, status changes, deletions, and leave decisions", () => {
    const employeeInsertAt = employees.indexOf('const header = await sb("hr_employees").insert');
    const employeeStateAt = employees.indexOf("setEmployees((prev) => [confirmed, ...prev]);");
    const statusUpdateAt = employees.indexOf('const saved = await sb("hr_employees").eq("id", emp.dbId).update');
    const statusStateAt = employees.indexOf("setEmployees((prev) => prev.map((employee) => (employee.id === id ? confirmed : employee)));");
    const deleteAt = employees.indexOf('await sb("hr_employees").eq("id", emp.dbId).delete().single().run();');
    const deleteStateAt = employees.indexOf("setEmployees((prev) => prev.filter((employee) => employee.id !== id));");
    const leaveUpdateAt = leaveRequests.indexOf('const saved = await sb("hr_leave_requests").eq("id", id).update');
    const leaveStateAt = leaveRequests.indexOf("setRequests((prev) => prev.map((request) => request.id === id ? { ...request, status: saved.status } : request));");

    expect(employeeStateAt).toBeGreaterThan(employeeInsertAt);
    expect(statusStateAt).toBeGreaterThan(statusUpdateAt);
    expect(deleteStateAt).toBeGreaterThan(deleteAt);
    expect(leaveStateAt).toBeGreaterThan(leaveUpdateAt);
    expect(employees).not.toContain("Employee created locally, but saving to the server failed.");
  });

  it("preserves employee and leave context on failed writes and blocks duplicate employee actions", () => {
    expect(employees).toContain("The current status remains unchanged.");
    expect(employees).toContain("The roster remains unchanged.");
    expect(employees).toContain('if (created) setShowForm(false);');
    expect(leaveRequests).toContain("The request remains unchanged.");
    expect(employeePanel).toContain("const [saving, setSaving] = useState(false);");
    expect(employeePanel).toContain("const deleted = await onDelete(employee.id);");
    expect(employeePanel).toContain("if (deleted) onClose();");
    expect(employeeForm).toContain("const [submitting, setSubmitting] = useState(false);");
    expect(employeeForm).toContain("if (!valid || submitting) return;");
    expect(employeeForm).toContain("disabled={submitting}");
    expect(employeeForm).toContain('{submitting ? "Saving…" : "Create Employee"}');
  });
});
