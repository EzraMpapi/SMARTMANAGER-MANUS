-- Allow policy evaluation for authenticated users without exposing helper
-- functions to anonymous callers or the public role.
-- These helpers are SECURITY DEFINER and are called by tenant/role-aware RLS
-- policies. Their search paths are pinned before execution is granted.
BEGIN;

ALTER FUNCTION public.bank_is_privileged()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.billing_is_manager()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.fleet_is_manager()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.hr_current_employee_id()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.hr_is_privileged()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.hr_can_manage_employee(uuid)
  SET search_path = pg_catalog, public, auth;

REVOKE ALL ON FUNCTION public.bank_is_privileged() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.billing_is_manager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fleet_is_manager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hr_current_employee_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hr_is_privileged() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hr_can_manage_employee(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bank_is_privileged() TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fleet_is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_is_privileged() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_can_manage_employee(uuid) TO authenticated;

COMMIT;
