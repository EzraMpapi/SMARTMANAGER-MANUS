-- Corrective follow-up for the final subscription model.
-- The initial model constrained new payment checkout to Monthly, but the
-- inherited tenant_subscriptions constraint still allowed Annual. Tighten it
-- without changing existing rows or payment history.

BEGIN;

ALTER TABLE public.tenant_subscriptions
  DROP CONSTRAINT IF EXISTS tenant_subscriptions_billing_cycle_check,
  ADD CONSTRAINT tenant_subscriptions_billing_cycle_check CHECK (billing_cycle = 'Monthly');

REVOKE ALL ON FUNCTION public.billing_start_free_plan(text) FROM service_role;
REVOKE ALL ON FUNCTION public.billing_start_free_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated;

COMMIT;
