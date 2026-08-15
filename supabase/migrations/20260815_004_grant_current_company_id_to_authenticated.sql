-- The tenant resolver is called by RLS policies during authenticated REST queries.
-- It remains a read-only security-definer function; this only grants its execution
-- to the authenticated role and deliberately does not grant it to anon.
BEGIN;
REVOKE ALL ON FUNCTION public.current_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
COMMIT;
