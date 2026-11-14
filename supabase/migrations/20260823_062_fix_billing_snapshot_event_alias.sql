-- Forward-only correction for the production billing snapshot alias failure.
-- Reuses existing subscription billing tables; no data or permissions are changed.

BEGIN;

CREATE OR REPLACE FUNCTION public.billing_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
BEGIN
  PERFORM public.billing_require_manager();
  RETURN jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object('profileId', auth.uid(), 'canManageBilling', true),
    'profile', coalesce((SELECT to_jsonb(profile_row) FROM public.billing_profiles AS profile_row WHERE profile_row.company_id = v_company_id), '{}'::jsonb),
    'plans', coalesce((SELECT jsonb_agg(to_jsonb(plan_row) ORDER BY plan_row.plan_category, plan_row.sort_order, plan_row.name) FROM public.billing_plans AS plan_row WHERE plan_row.company_id IS NULL OR plan_row.company_id = v_company_id), '[]'::jsonb),
    'subscription', coalesce((SELECT to_jsonb(subscription_row) FROM public.tenant_subscriptions AS subscription_row WHERE subscription_row.company_id = v_company_id AND subscription_row.status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired') ORDER BY subscription_row.created_at DESC LIMIT 1), '{}'::jsonb),
    'notifications', coalesce((SELECT jsonb_agg(to_jsonb(notification_row) ORDER BY notification_row.created_at DESC) FROM (SELECT * FROM public.subscription_notifications WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 50) AS notification_row), '[]'::jsonb),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(payment_row) ORDER BY payment_row.created_at DESC) FROM (SELECT * FROM public.subscription_payments WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) AS payment_row), '[]'::jsonb),
    'invoices', coalesce((SELECT jsonb_agg(to_jsonb(invoice_row) ORDER BY invoice_row.issued_at DESC) FROM (SELECT * FROM public.subscription_invoices WHERE company_id = v_company_id ORDER BY issued_at DESC LIMIT 100) AS invoice_row), '[]'::jsonb),
    'events', coalesce((SELECT jsonb_agg(to_jsonb(event_row) ORDER BY event_row.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) AS event_row), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.billing_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_snapshot() TO authenticated;

COMMIT;
