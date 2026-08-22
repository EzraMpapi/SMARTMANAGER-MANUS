-- Explicit grant hardening for the subscription trial lifecycle.
-- The catalog remains publicly reachable only through the server's curated endpoint;
-- no anonymous PostgREST RPC execution is permitted.

BEGIN;

REVOKE ALL ON FUNCTION public.billing_public_plan_catalog() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_start_trial(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_select_trial_plan(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_reconcile_trial_expiry(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.billing_public_plan_catalog() TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_start_trial(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_select_trial_plan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_reconcile_trial_expiry(uuid) TO service_role;

COMMIT;
