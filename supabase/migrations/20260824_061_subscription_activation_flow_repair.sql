-- Repair the deployed subscription activation flow without changing tables,
-- rows, constraints, or historical billing records. This migration only
-- replaces the two affected security-definer functions and their privileges.

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
    'profile', coalesce((SELECT to_jsonb(p) FROM public.billing_profiles p WHERE p.company_id = v_company_id), '{}'::jsonb),
    'plans', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.plan_category, p.sort_order, p.name) FROM public.billing_plans p WHERE p.company_id IS NULL OR p.company_id = v_company_id), '[]'::jsonb),
    'subscription', coalesce((SELECT to_jsonb(s) FROM public.tenant_subscriptions s WHERE s.company_id = v_company_id AND s.status IN ('Pending', 'Active', 'Grace', 'Expired', 'RequiresPlan') ORDER BY s.created_at DESC LIMIT 1), '{}'::jsonb),
    'notifications', coalesce((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC) FROM (SELECT * FROM public.subscription_notifications WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 50) n), '[]'::jsonb),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM (SELECT * FROM public.subscription_payments WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) p), '[]'::jsonb),
    'invoices', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.issued_at DESC) FROM (SELECT * FROM public.subscription_invoices WHERE company_id = v_company_id ORDER BY issued_at DESC LIMIT 100) i), '[]'::jsonb),
    'events', coalesce((SELECT jsonb_agg(to_jsonb(event_row) ORDER BY event_row.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) AS event_row), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_start_free_plan(p_plan_code text DEFAULT 'FREE_15')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_plan public.billing_plans%ROWTYPE;
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_started_at timestamptz := now();
  v_expires_at timestamptz;
  v_plan_code text := upper(trim(coalesce(p_plan_code, 'FREE_15')));
BEGIN
  PERFORM public.billing_require_manager();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'A current workspace company is required to start Free access.' USING ERRCODE = '42501';
  END IF;
  IF v_plan_code <> 'FREE_15' THEN
    RAISE EXCEPTION 'Only the FREE_15 package can be activated without payment.' USING ERRCODE = '22023';
  END IF;

  -- Serialize concurrent Free-plan requests per tenant before inspecting or
  -- inserting subscription rows. The key is stable and never grants access
  -- outside the caller's current company.
  PERFORM pg_advisory_xact_lock(hashtextextended('smart_manager:billing_free_plan:' || v_company_id::text, 0));

  SELECT * INTO v_plan
  FROM public.billing_plans
  WHERE company_id IS NULL AND status = 'Active' AND code = 'FREE_15'
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The FREE_15 package is not currently available.' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_subscription
  FROM public.tenant_subscriptions
  WHERE company_id = v_company_id AND offer_code = 'FREE_15'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  IF FOUND THEN
    RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', false, 'reason', 'free_already_granted');
  END IF;

  SELECT * INTO v_subscription
  FROM public.tenant_subscriptions
  WHERE company_id = v_company_id AND status IN ('Pending', 'Active', 'Grace')
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  IF FOUND THEN
    RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', false, 'reason', 'subscription_already_exists');
  END IF;

  v_expires_at := v_started_at + interval '15 days';
  INSERT INTO public.tenant_subscriptions(
    company_id, plan_id, offer_code, status, billing_cycle, amount, currency,
    started_at, expires_at, paid_months, bonus_months, total_months, duration_days, metadata
  ) VALUES (
    v_company_id, v_plan.id, 'FREE_15', 'Active', 'Monthly', 0, v_plan.currency,
    v_started_at, v_expires_at, 0, 0, 0, 15,
    jsonb_build_object('freePlan', true, 'durationDays', 15, 'packageCode', 'FREE_15')
  ) RETURNING * INTO v_subscription;

  INSERT INTO public.subscription_notifications(company_id, subscription_id, notification_key, title, message, metadata)
  VALUES (
    v_company_id, v_subscription.id, 'FREE_STARTED', 'FREE kwa Siku 15',
    'Free access imeanza kwa siku 15. Hakuna malipo yanayohitajika; chagua package ya kulipia kabla ya muda huu kuisha.',
    jsonb_build_object('packageCode', 'FREE_15', 'accessEndsAt', v_expires_at)
  ) ON CONFLICT (company_id, notification_key) DO NOTHING;

  PERFORM public.billing_audit('SUBSCRIPTION_FREE_STARTED', 'FREE_15', v_subscription.id, NULL, NULL, 'Active',
    jsonb_build_object('startedAt', v_started_at, 'expiresAt', v_expires_at, 'durationDays', 15));
  RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', true);
END;
$$;

REVOKE ALL ON FUNCTION public.billing_start_free_plan(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated;

COMMIT;
