-- Employee Portal security remediation: revoke default public function execution
-- and complete row-level policy coverage for timesheet entries.

BEGIN;

ALTER TABLE public.hr_timesheet_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_timesheet_entries_portal_select ON public.hr_timesheet_entries;
DROP POLICY IF EXISTS hr_timesheet_entries_portal_write ON public.hr_timesheet_entries;
CREATE POLICY hr_timesheet_entries_portal_select ON public.hr_timesheet_entries
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.hr_timesheets t
      WHERE t.id = timesheet_id
        AND (public.hr_is_privileged() OR t.employee_id = public.hr_current_employee_id() OR public.hr_can_manage_employee(t.employee_id))
    )
  );
CREATE POLICY hr_timesheet_entries_portal_write ON public.hr_timesheet_entries
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.hr_is_privileged())
  WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged());

REVOKE EXECUTE ON FUNCTION public.employee_portal_snapshot() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.employee_portal_action(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hr_is_privileged() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hr_current_employee_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hr_can_manage_employee(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hr_require_privileged() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hr_append_audit(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hr_create_notification(uuid, uuid, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.employee_portal_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.employee_portal_action(text, jsonb) TO authenticated;

COMMIT;
