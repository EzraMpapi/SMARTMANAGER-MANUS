-- Allow authorized billing administrators to manage draft and archived plans in the secure billing snapshot.

BEGIN;

CREATE OR REPLACE FUNCTION public.billing_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
BEGIN
  PERFORM public.billing_require_manager();
  RETURN jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object('profileId', auth.uid(), 'canManageBilling', true),
    'profile', coalesce((SELECT to_jsonb(p) FROM public.billing_profiles p WHERE p.company_id = v_company_id), '{}'::jsonb),
    'plans', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.recommended DESC, p.sort_order, p.name) FROM public.billing_plans p WHERE p.company_id IS NULL OR p.company_id = v_company_id), '[]'::jsonb),
    'subscription', coalesce((SELECT to_jsonb(s) FROM public.tenant_subscriptions s WHERE s.company_id = v_company_id AND s.status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired') ORDER BY s.created_at DESC LIMIT 1), '{}'::jsonb),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM (SELECT * FROM public.subscription_payments WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) p), '[]'::jsonb),
    'invoices', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.issued_at DESC) FROM (SELECT * FROM public.subscription_invoices WHERE company_id = v_company_id ORDER BY issued_at DESC LIMIT 100) i), '[]'::jsonb),
    'events', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) e), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.billing_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_snapshot() TO authenticated;

COMMIT;
