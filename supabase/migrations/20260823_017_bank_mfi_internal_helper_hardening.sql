-- Bank & MFI internal helper hardening
-- Helpers are used by security-definer procedures and triggers, not called by clients.

BEGIN;
REVOKE EXECUTE ON FUNCTION public.bank_is_privileged() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bank_has_role(text[]) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bank_audit(text,text,uuid,text,jsonb,text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bank_assert_balanced_journal() FROM authenticated, anon, PUBLIC;
COMMIT;
