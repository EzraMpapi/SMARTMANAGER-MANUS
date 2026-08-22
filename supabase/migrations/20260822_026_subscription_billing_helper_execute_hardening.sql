-- Remove inherited PUBLIC execute privileges from internal billing helpers.

BEGIN;

REVOKE ALL ON FUNCTION public.billing_is_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_require_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_audit(text, text, uuid, uuid, text, text, jsonb) FROM PUBLIC;

COMMIT;
