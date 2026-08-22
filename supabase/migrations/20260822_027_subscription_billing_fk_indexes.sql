-- Support subscription billing foreign-key joins and retention reporting at scale.

BEGIN;

CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_idx ON public.tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_source_payment_idx ON public.tenant_subscriptions(source_payment_id);
CREATE INDEX IF NOT EXISTS subscription_payments_subscription_idx ON public.subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_payments_plan_idx ON public.subscription_payments(plan_id);
CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx ON public.subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_subscription_idx ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_payment_idx ON public.subscription_events(payment_id);

COMMIT;
