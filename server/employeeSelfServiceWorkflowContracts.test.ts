import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const portalMigration = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260821_013_employee_portal_core.sql"), "utf8");
const leaveGuardMigration = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_017_leave_decision_immutability.sql"), "utf8");
const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/EmployeePortalWorkspace.jsx"), "utf8");

describe("Employee self-service payslip and leave approval contracts", () => {
  it("shows payslips only through the authenticated portal snapshot and employee-scoped RLS path", () => {
    expect(portalMigration).toContain("'payslips', coalesce((SELECT jsonb_agg");
    expect(portalMigration).toContain("FROM public.hr_payslips p WHERE p.company_id = public.current_company_id() AND p.employee_id = v_employee_id");
    expect(portalMigration).toContain("v_table || '_portal_select'");
    expect(portalMigration).toContain("'hr_payroll_items','hr_payslips'");
    expect(workspace).toContain('active === "payslips"');
    expect(workspace).toContain("No issued payslips are available.");
  });

  it("creates a pending leave request and matching approval work item for an authenticated linked employee", () => {
    expect(portalMigration).toContain("'Your authenticated account is not linked to an active employee record.'");
    expect(portalMigration).toContain("ELSIF p_action = 'leave.submit'");
    expect(portalMigration).toContain("'Pending'");
    expect(portalMigration).toContain("INSERT INTO public.hr_approval_requests");
    expect(portalMigration).toContain("'LEAVE_REQUEST_SUBMITTED'");
  });

  it("requires manager authority, synchronizes outcomes, notifies the employee, and writes an audit event", () => {
    expect(portalMigration).toContain("NOT public.hr_can_manage_employee(v_target_employee_id)");
    expect(portalMigration).toContain("'You are not authorized to decide this leave request.'");
    expect(portalMigration).toContain("UPDATE public.hr_leave_requests SET status = v_status");
    expect(portalMigration).toContain("UPDATE public.hr_approval_requests SET status = v_status");
    expect(portalMigration).toContain("hr_create_notification");
    expect(portalMigration).toContain("'LEAVE_REQUEST_' || upper(v_status)");
  });

  it("prevents a terminal leave decision from being changed into a contradictory outcome", () => {
    expect(leaveGuardMigration).toContain("OLD.status IN ('Approved', 'Rejected')");
    expect(leaveGuardMigration).toContain("A terminal leave decision cannot be changed");
    expect(leaveGuardMigration).toContain("BEFORE UPDATE OF status ON public.hr_leave_requests");
  });
});
