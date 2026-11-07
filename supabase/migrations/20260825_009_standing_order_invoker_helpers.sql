-- Reduce the SECURITY DEFINER surface for non-mutating Standing Order helpers.
-- Financial write RPCs remain SECURITY DEFINER because they perform protected
-- multi-table ledger/event writes under server-enforced authorization.
BEGIN;

ALTER FUNCTION public.bank_standing_order_raise(text, text)
  SECURITY INVOKER;
ALTER FUNCTION public.bank_standing_order_response(uuid, boolean, uuid, uuid, uuid)
  SECURITY INVOKER;
ALTER FUNCTION public.bank_get_standing_order(uuid)
  SECURITY INVOKER;

-- Keep all exposed Standing Order RPCs unavailable to anonymous and PUBLIC
-- callers. Authenticated execution is retained only where the function is an
-- intentional application entry point and performs its own tenant, role,
-- maker-checker, version, and audit checks.
REVOKE ALL ON FUNCTION public.bank_standing_order_raise(text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_response(uuid, boolean, uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_get_standing_order(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_get_standing_order(uuid) TO authenticated;

COMMENT ON FUNCTION public.bank_get_standing_order(uuid)
  IS 'Tenant-scoped read model; SECURITY INVOKER so caller SELECT privileges and RLS policies apply directly.';

COMMIT;
