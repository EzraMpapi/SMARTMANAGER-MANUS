-- Additive FREE_15 trial contract.
-- The existing subscription tables remain authoritative; no duplicate tables are created.
-- Active FREE_15 access is unlimited only while the server confirms trial_ends_at > now().

BEGIN;

ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Existing FREE_15 records already have server-derived access dates. Backfill the
-- explicit trial columns without changing any tenant's effective expiry.
UPDATE public.tenant_subscriptions
SET trial_started_at = COALESCE(trial_started_at, started_at),
    trial_ends_at = COALESCE(trial_ends_at, expires_at),
    updated_at = updated_at
WHERE offer_code = 'FREE_15'
  AND (trial_started_at IS NULL OR trial_ends_at IS NULL);

CREATE INDEX IF NOT EXISTS tenant_subscriptions_free_trial_lookup_idx
  ON public.tenant_subscriptions(company_id, offer_code, status, trial_ends_at DESC);

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

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('smart_manager:billing_free_plan:' || v_company_id::text, 0)
  );

  SELECT * INTO v_plan
  FROM public.billing_plans
  WHERE company_id IS NULL AND status = 'Active' AND code = 'FREE_15'
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The FREE_15 package is not currently available.' USING ERRCODE = 'P0002';
  END IF;
  IF coalesce(v_plan.monthly_price, -1) <> 0 OR coalesce(v_plan.duration_days, 0) <= 0 THEN
    RAISE EXCEPTION 'The FREE_15 package is not configured for zero-cost introductory access.' USING ERRCODE = '22023';
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

  v_expires_at := v_started_at + make_interval(days => v_plan.duration_days);
  INSERT INTO public.tenant_subscriptions(
    company_id, plan_id, offer_code, status, billing_cycle, amount, currency,
    started_at, expires_at, trial_started_at, trial_ends_at,
    paid_months, bonus_months, total_months, duration_days, metadata
  ) VALUES (
    v_company_id, v_plan.id, 'FREE_15', 'Active', 'Monthly', 0, v_plan.currency,
    v_started_at, v_expires_at, v_started_at, v_expires_at,
    0, 0, 0, v_plan.duration_days,
    jsonb_build_object('freePlan', true, 'unlimitedTrial', true, 'durationDays', v_plan.duration_days, 'packageCode', v_plan.code)
  ) RETURNING * INTO v_subscription;

  INSERT INTO public.subscription_notifications(company_id, subscription_id, notification_key, title, message, metadata)
  VALUES (
    v_company_id, v_subscription.id, 'FREE_STARTED', 'FREE trial imeanza',
    format('Free access imeanza kwa siku %s. Una unlimited access kwa modules zote; chagua package ya kulipia kabla ya trial kuisha.', v_plan.duration_days),
    jsonb_build_object('packageCode', 'FREE_15', 'trialStartedAt', v_started_at, 'trialEndsAt', v_expires_at, 'unlimitedAccess', true)
  ) ON CONFLICT (company_id, notification_key) DO NOTHING;
  PERFORM public.billing_audit('SUBSCRIPTION_FREE_STARTED', v_plan.code, v_subscription.id, NULL, NULL, 'Active',
    jsonb_build_object('startedAt', v_started_at, 'expiresAt', v_expires_at, 'trialStartedAt', v_started_at, 'trialEndsAt', v_expires_at, 'durationDays', v_plan.duration_days, 'unlimitedAccess', true));
  RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_reconcile_free_plan_expiry(p_company_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_processed integer := 0;
  v_expired integer := 0;
  v_notified integer := 0;
BEGIN
  FOR v_subscription IN
    SELECT * FROM public.tenant_subscriptions
    WHERE offer_code = 'FREE_15'
      AND status = 'Active'
      AND COALESCE(trial_ends_at, expires_at) IS NOT NULL
      AND COALESCE(trial_ends_at, expires_at) <= now()
      AND (p_company_id IS NULL OR company_id = p_company_id)
    FOR UPDATE
  LOOP
    UPDATE public.tenant_subscriptions
    SET status = 'RequiresPlan',
        metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{freeExpiredAt}', to_jsonb(now()), true),
        updated_at = now()
    WHERE id = v_subscription.id;
    INSERT INTO public.subscription_notifications(company_id, subscription_id, notification_key, title, message, metadata)
    VALUES (
      v_subscription.company_id, v_subscription.id, 'FREE_EXPIRED', 'Your Free trial has ended',
      'Free trial imeisha. Hakuna malipo ya moja kwa moja yaliyofanyika. Chagua package kuendelea kutumia SMART MANAGER; data yako imehifadhiwa.',
      jsonb_build_object('trialStartedAt', v_subscription.trial_started_at, 'trialEndsAt', COALESCE(v_subscription.trial_ends_at, v_subscription.expires_at))
    ) ON CONFLICT (company_id, notification_key) DO NOTHING;
    IF FOUND THEN v_notified := v_notified + 1; END IF;
    PERFORM public.billing_audit('SUBSCRIPTION_FREE_EXPIRED', 'FREE_15', v_subscription.id, NULL, 'Active', 'RequiresPlan',
      jsonb_build_object('trialStartedAt', v_subscription.trial_started_at, 'trialEndsAt', COALESCE(v_subscription.trial_ends_at, v_subscription.expires_at)));
    v_processed := v_processed + 1;
    v_expired := v_expired + 1;
  END LOOP;
  RETURN jsonb_build_object('processed', v_processed, 'expired', v_expired, 'notificationsCreated', v_notified);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_access_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_can_manage boolean := false;
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_plan public.billing_plans%ROWTYPE;
  v_state text := 'Required';
  v_allowed boolean := false;
  v_trial_active boolean := false;
  v_reason text := 'No company package has been confirmed.';
  v_access_until timestamptz;
  v_trial_ends_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required for subscription access.' USING ERRCODE = '28000';
  END IF;
  SELECT p.company_id, p.role INTO v_company_id, v_role
  FROM public.profiles p WHERE p.id = auth.uid() AND p.is_active = true LIMIT 1;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'An active company profile is required for subscription access.' USING ERRCODE = '42501';
  END IF;
  v_can_manage := public.billing_is_manager();
  SELECT s.* INTO v_subscription FROM public.tenant_subscriptions s
  WHERE s.company_id = v_company_id ORDER BY s.created_at DESC LIMIT 1;
  IF FOUND THEN
    SELECT p.* INTO v_plan FROM public.billing_plans p WHERE p.id = v_subscription.plan_id LIMIT 1;
    v_trial_ends_at := COALESCE(v_subscription.trial_ends_at, v_subscription.expires_at);
    v_trial_active := v_subscription.offer_code = 'FREE_15'
      AND v_subscription.status = 'Active'
      AND v_trial_ends_at IS NOT NULL
      AND v_trial_ends_at > now();

    IF v_trial_active THEN
      v_state := 'Trial';
      v_allowed := true;
      v_access_until := v_trial_ends_at;
      v_reason := 'The company has an active FREE_15 trial with unlimited access to all modules.';
    ELSIF v_subscription.status = 'Active' THEN
      v_access_until := v_subscription.expires_at;
      IF v_access_until IS NULL OR v_access_until > now() THEN
        v_state := 'Active';
        v_allowed := true;
        v_reason := 'The company package is active.';
      ELSIF v_subscription.offer_code = 'FREE_15' THEN
        v_state := 'Required';
        v_reason := 'The FREE_15 trial has ended. A paid package is required to continue.';
      ELSE
        v_state := 'Expired';
        v_reason := 'The paid package has expired. A confirmed package is required to resume operational access.';
      END IF;
    ELSIF v_subscription.status = 'Grace' THEN
      v_access_until := v_subscription.grace_expires_at;
      IF v_access_until IS NOT NULL AND v_access_until > now() THEN
        v_state := 'Grace'; v_allowed := true; v_reason := 'The company is within its server-defined grace period.';
      ELSE
        v_state := 'Expired'; v_reason := 'The package grace period has ended. A confirmed package is required.';
      END IF;
    ELSIF v_subscription.status = 'Pending' THEN
      v_state := 'Pending'; v_access_until := v_subscription.expires_at;
      v_reason := 'A payment request is pending provider confirmation. Browser state cannot grant access.';
    ELSIF v_subscription.status = 'RequiresPlan' THEN
      v_state := 'Required'; v_access_until := COALESCE(v_subscription.trial_ends_at, v_subscription.expires_at);
      v_reason := 'The FREE_15 trial has ended. Choose a paid package to continue using SMART MANAGER.';
    ELSE
      v_state := 'Expired'; v_access_until := COALESCE(v_subscription.grace_expires_at, v_subscription.expires_at, v_subscription.trial_ends_at);
      v_reason := 'The company package is not currently active. Workspace data is retained.';
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object('profileId', auth.uid(), 'role', v_role, 'canManageBilling', v_can_manage),
    'status', v_state, 'state', lower(v_state), 'allowed', v_allowed, 'reason', v_reason, 'accessUntil', v_access_until,
    'trialActive', v_trial_active, 'unlimitedAccess', v_trial_active,
    'trialStartedAt', v_subscription.trial_started_at, 'trialEndsAt', v_trial_ends_at,
    'subscription', CASE WHEN v_subscription.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_subscription.id, 'plan_id', v_subscription.plan_id, 'offerCode', v_subscription.offer_code,
      'status', v_subscription.status, 'billing_cycle', v_subscription.billing_cycle, 'amount', v_subscription.amount,
      'currency', v_subscription.currency, 'started_at', v_subscription.started_at, 'expires_at', v_subscription.expires_at,
      'grace_expires_at', v_subscription.grace_expires_at, 'trial_started_at', v_subscription.trial_started_at,
      'trial_ends_at', v_subscription.trial_ends_at, 'paidMonths', v_subscription.paid_months,
      'bonusMonths', v_subscription.bonus_months, 'totalMonths', v_subscription.total_months,
      'durationDays', v_subscription.duration_days, 'source_payment_id', v_subscription.source_payment_id
    ) END,
    'plan', CASE WHEN v_plan.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_plan.id, 'code', v_plan.code, 'name', v_plan.name, 'features', v_plan.features,
      'moduleEntitlements', v_plan.module_entitlements, 'paidMonths', v_plan.paid_months,
      'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months, 'durationDays', v_plan.duration_days
    ) END,
    'moduleEntitlements', CASE WHEN v_trial_active THEN '["*"]'::jsonb ELSE coalesce(v_plan.module_entitlements, '[]'::jsonb) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.billing_start_free_plan(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated;
REVOKE ALL ON FUNCTION public.billing_reconcile_free_plan_expiry(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_reconcile_free_plan_expiry(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.billing_access_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_access_snapshot() TO authenticated;

COMMIT;
