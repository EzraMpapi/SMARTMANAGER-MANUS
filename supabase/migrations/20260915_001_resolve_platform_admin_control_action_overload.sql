-- Resolve an ambiguous overloaded RPC.
--
-- The database previously contained two public functions named
-- platform_admin_control_action. Both signatures had defaults for their
-- parameters, so a call with the original ten arguments could match both
-- functions and PostgreSQL raised: "function ... is not unique".
--
-- Keep the established ten-argument sales/control-plane function under its
-- public name for backward compatibility. Give the newer eleven-argument
-- tenant-subscription variant an explicit name. Its function body is kept
-- unchanged by PostgreSQL's function rename operation.
ALTER FUNCTION public.platform_admin_control_action(
  text,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  numeric,
  text,
  integer,
  text
) RENAME TO platform_admin_tenant_control_action;

COMMENT ON FUNCTION public.platform_admin_tenant_control_action(
  text,
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  numeric,
  text,
  integer,
  text
) IS 'Tenant-subscription variant of the platform administrator control action RPC. Renamed from the overloaded platform_admin_control_action signature to keep ten-argument callers unambiguous.';
