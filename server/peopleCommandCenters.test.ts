import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/PeopleCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const portal = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/EmployeePortalWorkspace.jsx"), "utf8");

describe("people and work command-center contracts", () => {
  it("covers HR and Employee Portal confirmed workflows", () => {
    for (const text of ["People operations", "Workforce capacity, leave, and payroll readiness", "Active employees", "Pending leave", "Payroll base", "Employee self-service", "Personal workflow status", "Attendance records", "Role-scoped portal approvals"]) expect(workspace).toContain(text);
    expect(workspace).toContain("employee_portal_snapshot RPC · tenant and role scoped");
    expect(portal).toContain("<EmployeePortalCommandCenter snapshot={snapshot}/>");
  });

  it("covers Documents, Workflow, and Collaboration control surfaces", () => {
    for (const text of ["Document operations", "Operational files, linkage, and version control", "Total documents", "Linked records", "Automation control", "Workflow readiness and execution coverage", "Enabled workflows", "Collaboration command center", "Cross-functional activity and communication readiness", "Realtime readiness"]) expect(workspace).toContain(text);
    for (const source of ["documents", "workflows + workflow_marketplace_templates + notification_channels", "hr_leave_requests + shared workspace records"]) expect(workspace).toContain(source);
  });

  it("keeps existing module routes and source-of-truth boundaries", () => {
    for (const route of [
      '{active === "hr" && <HR',
      '{active === "documents" && <Documents',
      '{active === "workflows" && (',
      '<WorkflowStudio company={company}',
      '{active === "collaboration" && (',
      '<CollaborationHub currentUser={currentUser}',
    ]) expect(dashboard).toContain(route);
    for (const source of ["hr_employees", "hr_leave_requests", "documents", "workflows", "collab_channels"]) expect(workspace + dashboard).toContain(source);
    expect(workspace).toContain("Insufficient confirmed push/event telemetry");
  });
});
