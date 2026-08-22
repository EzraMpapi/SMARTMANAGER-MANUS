-- Explicitly harden Supabase function execution grants for subscription billing.
-- Supabase may grant function EXECUTE to anon/authenticated by default; public revoke alone is insufficient.

BEGIN;

REVOKE ALL ON FUNCTION public.billing_is_manager() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_require_manager() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_audit(text, text, uuid, uuid, text, text, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_record_provider_dispatch(uuid, text, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_mark_payment_dispatch_failure(uuid, text, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_apply_provider_status(uuid, text, text, jsonb) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.billing_snapshot() FROM anon;
REVOKE ALL ON FUNCTION public.billing_upsert_profile(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.billing_upsert_plan(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.billing_create_payment_intent(uuid, text, text, text, text) FROM anon;

REVOKE ALL ON FUNCTION public.billing_snapshot() FROM authenticated;
REVOKE ALL ON FUNCTION public.billing_upsert_profile(jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.billing_upsert_plan(jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.billing_create_payment_intent(uuid, text, text, text, text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.billing_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_upsert_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_upsert_plan(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_create_payment_intent(uuid, text, text, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.billing_record_provider_dispatch(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_mark_payment_dispatch_failure(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_apply_provider_status(uuid, text, text, jsonb) TO service_role;

COMMIT;
