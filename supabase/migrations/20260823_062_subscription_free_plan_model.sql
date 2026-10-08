-- Final subscription commercial model: FREE_15 plus monthly paid packages.
-- The previous 30-day trial contract is retired. Existing production rows are
-- preserved; the live audit confirmed zero tenant_subscriptions rows and only
-- monthly historical payment rows before this migration was authored.

BEGIN;

ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS paid_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_days integer;

ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS offer_code text,
  ADD COLUMN IF NOT EXISTS paid_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_days integer;

DROP INDEX IF EXISTS public.tenant_subscriptions_trial_ends_idx;
DROP INDEX IF EXISTS public.tenant_subscriptions_one_trial_per_company_idx;

-- Replace all functions that referenced the retired columns before those columns
-- are removed. The new definitions use explicit schema qualification and remain
-- tenant-scoped through current_company_id().
DROP FUNCTION IF EXISTS public.billing_start_trial(text);
DROP FUNCTION IF EXISTS public.billing_select_trial_plan(text);
DROP FUNCTION IF EXISTS public.billing_reconcile_trial_expiry(uuid);

ALTER TABLE public.tenant_subscriptions
  DROP CONSTRAINT IF EXISTS tenant_subscriptions_status_check,
  ADD CONSTRAINT tenant_subscriptions_status_check CHECK (status IN ('Pending', 'Active', 'Grace', 'Expired', 'RequiresPlan', 'Cancelled', 'Superseded'));

ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_billing_cycle_check,
  ADD CONSTRAINT subscription_payments_billing_cycle_check CHECK (billing_cycle = 'Monthly');

CREATE OR REPLACE FUNCTION public.billing_audit_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_action text;
BEGIN
  v_action := CASE
    WHEN TG_OP = 'INSERT' THEN 'BILLING_PLAN_CREATED'
    WHEN OLD.monthly_price IS DISTINCT FROM NEW.monthly_price
      OR OLD.features IS DISTINCT FROM NEW.features
      OR OLD.module_entitlements IS DISTINCT FROM NEW.module_entitlements
      OR OLD.included_users IS DISTINCT FROM NEW.included_users
      OR OLD.included_branches IS DISTINCT FROM NEW.included_branches
      OR OLD.included_storage_mb IS DISTINCT FROM NEW.included_storage_mb
      OR OLD.included_transactions IS DISTINCT FROM NEW.included_transactions
      OR OLD.paid_months IS DISTINCT FROM NEW.paid_months
      OR OLD.bonus_months IS DISTINCT FROM NEW.bonus_months
      OR OLD.total_months IS DISTINCT FROM NEW.total_months
      OR OLD.duration_days IS DISTINCT FROM NEW.duration_days
      OR OLD.description IS DISTINCT FROM NEW.description
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.sort_order IS DISTINCT FROM NEW.sort_order
      OR OLD.badge IS DISTINCT FROM NEW.badge
      OR OLD.plan_category IS DISTINCT FROM NEW.plan_category
      OR OLD.visual_theme IS DISTINCT FROM NEW.visual_theme
    THEN 'BILLING_PLAN_UPDATED'
    ELSE NULL
  END;
  IF v_action IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.billing_plan_audit_log(plan_id, company_id, action, changed_by, previous_values, new_values)
  VALUES (
    NEW.id, NEW.company_id, v_action, auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_public_plan_catalog()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'code', p.code,
    'name', p.name,
    'description', p.description,
    'currency', p.currency,
    'monthlyPrice', p.monthly_price,
    'price', p.monthly_price,
    'category', p.plan_category,
    'badge', p.badge,
    'visualTheme', p.visual_theme,
    'features', p.features,
    'moduleEntitlements', p.module_entitlements,
    'paidMonths', p.paid_months,
    'bonusMonths', p.bonus_months,
    'totalMonths', p.total_months,
    'durationDays', p.duration_days,
    'isFree', p.code = 'FREE_15',
    'limits', jsonb_build_object(
      'users', p.included_users,
      'branches', p.included_branches,
      'storageMb', p.included_storage_mb,
      'transactions', p.included_transactions
    )
  ) ORDER BY p.sort_order, p.name), '[]'::jsonb)
  FROM public.billing_plans p
  WHERE p.company_id IS NULL AND p.status = 'Active';
$$;

CREATE OR REPLACE FUNCTION public.billing_upsert_plan(p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_plan public.billing_plans%ROWTYPE;
  v_plan_id uuid := nullif(p_payload->>'planId', '')::uuid;
  v_code text := upper(regexp_replace(coalesce(trim(p_payload->>'code'), ''), '[^A-Za-z0-9_-]', '-', 'g'));
  v_status text := coalesce(nullif(trim(p_payload->>'status'), ''), 'Draft');
  v_category text := coalesce(nullif(trim(p_payload->>'planCategory'), ''), 'Business');
  v_visual_theme text := coalesce(nullif(trim(p_payload->>'visualTheme'), ''), 'standard');
  v_is_global boolean := coalesce((p_payload->>'isGlobal')::boolean, false);
  v_paid_months integer := coalesce(nullif(p_payload->>'paidMonths', '')::integer, CASE WHEN v_code = 'FREE_15' THEN 0 ELSE 1 END);
  v_bonus_months integer := coalesce(nullif(p_payload->>'bonusMonths', '')::integer, CASE WHEN v_code = 'FREE_15' THEN 0 ELSE 1 END);
  v_total_months integer := coalesce(nullif(p_payload->>'totalMonths', '')::integer, CASE WHEN v_code = 'FREE_15' THEN 0 ELSE 2 END);
  v_duration_days integer := nullif(p_payload->>'durationDays', '')::integer;
  v_scope_company_id uuid;
BEGIN
  PERFORM public.billing_require_manager();
  IF nullif(trim(p_payload->>'name'), '') IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'A package name and code are required.' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('Draft', 'Active', 'Archived') THEN
    RAISE EXCEPTION 'Package status must be Draft, Active, or Archived.' USING ERRCODE = '22023';
  END IF;
  IF v_category NOT IN ('Business', 'Football') THEN
    RAISE EXCEPTION 'Package category must be Business or Football.' USING ERRCODE = '22023';
  END IF;
  IF v_code = 'FREE_15' THEN
    v_paid_months := 0;
    v_bonus_months := 0;
    v_total_months := 0;
    v_duration_days := 15;
  ELSIF v_paid_months <> 1 OR v_bonus_months <> 1 OR v_total_months <> 2 OR v_duration_days IS NOT NULL THEN
    RAISE EXCEPTION 'Paid packages must use 1 paid month, 1 bonus month, 2 total months, and no fixed-day duration.' USING ERRCODE = '22023';
  END IF;
  IF v_is_global AND NOT public.billing_is_platform_admin() THEN
    RAISE EXCEPTION 'Only a platform administrator can manage the official package catalog.' USING ERRCODE = '42501';
  END IF;

  IF v_plan_id IS NULL THEN
    v_scope_company_id := CASE WHEN v_is_global THEN NULL ELSE public.current_company_id() END;
    INSERT INTO public.billing_plans(
      company_id, code, name, description, status, currency, monthly_price, annual_price,
      annual_savings_label, included_users, included_branches, included_storage_mb,
      included_transactions, features, module_entitlements, sort_order, recommended,
      created_by, plan_category, badge, visual_theme, paid_months, bonus_months,
      total_months, duration_days
    ) VALUES (
      v_scope_company_id, v_code, trim(p_payload->>'name'), nullif(trim(p_payload->>'description'), ''),
      v_status, coalesce(nullif(trim(p_payload->>'currency'), ''), 'TZS'),
      CASE WHEN v_code = 'FREE_15' THEN 0 ELSE nullif(p_payload->>'monthlyPrice', '')::numeric END, NULL,
      NULL, nullif(p_payload->>'includedUsers', '')::integer,
      nullif(p_payload->>'includedBranches', '')::integer, nullif(p_payload->>'includedStorageMb', '')::bigint,
      nullif(p_payload->>'includedTransactions', '')::integer, coalesce(p_payload->'features', '{}'::jsonb),
      coalesce(p_payload->'moduleEntitlements', '[]'::jsonb), coalesce(nullif(p_payload->>'sortOrder', '')::integer, 0),
      coalesce((p_payload->>'recommended')::boolean, false), auth.uid(), v_category,
      nullif(trim(p_payload->>'badge'), ''), v_visual_theme, v_paid_months, v_bonus_months,
      v_total_months, v_duration_days
    ) RETURNING * INTO v_plan;
  ELSE
    SELECT * INTO v_plan FROM public.billing_plans
    WHERE id = v_plan_id
      AND (company_id = public.current_company_id() OR (company_id IS NULL AND public.billing_is_platform_admin()))
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'The billing package was not found in this workspace.' USING ERRCODE = 'P0002'; END IF;
    UPDATE public.billing_plans SET
      code = v_code, name = trim(p_payload->>'name'), description = nullif(trim(p_payload->>'description'), ''),
      status = v_status, currency = coalesce(nullif(trim(p_payload->>'currency'), ''), currency),
      monthly_price = CASE WHEN v_code = 'FREE_15' THEN 0 ELSE nullif(p_payload->>'monthlyPrice', '')::numeric END, annual_price = NULL,
      annual_savings_label = NULL, included_users = nullif(p_payload->>'includedUsers', '')::integer,
      included_branches = nullif(p_payload->>'includedBranches', '')::integer,
      included_storage_mb = nullif(p_payload->>'includedStorageMb', '')::bigint,
      included_transactions = nullif(p_payload->>'includedTransactions', '')::integer,
      features = coalesce(p_payload->'features', features),
      module_entitlements = coalesce(p_payload->'moduleEntitlements', module_entitlements),
      sort_order = coalesce(nullif(p_payload->>'sortOrder', '')::integer, sort_order),
      recommended = coalesce((p_payload->>'recommended')::boolean, recommended),
      plan_category = v_category, badge = nullif(trim(p_payload->>'badge'), ''),
      visual_theme = v_visual_theme, paid_months = v_paid_months,
      bonus_months = v_bonus_months, total_months = v_total_months, duration_days = v_duration_days
    WHERE id = v_plan.id
    RETURNING * INTO v_plan;
  END IF;
  PERFORM public.billing_audit('BILLING_PACKAGE_SAVED', v_plan.id::text, NULL, NULL, NULL, v_plan.status,
    jsonb_build_object('packageCode', v_plan.code, 'packageName', v_plan.name, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months, 'durationDays', v_plan.duration_days, 'global', v_plan.company_id IS NULL));
  RETURN to_jsonb(v_plan);
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
  SELECT * INTO v_plan FROM public.billing_plans
  WHERE company_id IS NULL AND status = 'Active' AND code = 'FREE_15'
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The FREE_15 package is not currently available.' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_subscription
  FROM public.tenant_subscriptions
  WHERE company_id = v_company_id AND offer_code = 'FREE_15'
  ORDER BY created_at DESC
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', false, 'reason', 'free_already_granted');
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_subscriptions WHERE company_id = v_company_id AND status IN ('Pending', 'Active', 'Grace')) THEN
    SELECT * INTO v_subscription FROM public.tenant_subscriptions
    WHERE company_id = v_company_id AND status IN ('Pending', 'Active', 'Grace')
    ORDER BY created_at DESC LIMIT 1;
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
      AND expires_at IS NOT NULL
      AND expires_at <= now()
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
      v_subscription.company_id, v_subscription.id, 'FREE_EXPIRED', 'Your Free access has ended',
      'Free access has ended. No automatic charge was made. Choose a package to continue using SMART MANAGER; data yako imehifadhiwa.',
      jsonb_build_object('accessEndedAt', v_subscription.expires_at)
    ) ON CONFLICT (company_id, notification_key) DO NOTHING;
    IF FOUND THEN v_notified := v_notified + 1; END IF;
    PERFORM public.billing_audit('SUBSCRIPTION_FREE_EXPIRED', 'FREE_15', v_subscription.id, NULL, 'Active', 'RequiresPlan',
      jsonb_build_object('accessEndedAt', v_subscription.expires_at));
    v_processed := v_processed + 1;
    v_expired := v_expired + 1;
  END LOOP;
  RETURN jsonb_build_object('processed', v_processed, 'expired', v_expired, 'notificationsCreated', v_notified);
END;
$$;

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
    'events', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY e.created_at DESC LIMIT 100) e), '[]'::jsonb)
  );
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
  v_reason text := 'No company package has been confirmed.';
  v_access_until timestamptz;
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
    IF v_subscription.status = 'Active' THEN
      v_access_until := v_subscription.expires_at;
      IF v_access_until IS NULL OR v_access_until > now() THEN
        v_state := 'Active';
        v_allowed := true;
        v_reason := CASE WHEN v_subscription.offer_code = 'FREE_15' THEN 'The company has active FREE_15 access.' ELSE 'The company package is active.' END;
      ELSIF v_subscription.offer_code = 'FREE_15' THEN
        v_state := 'Required';
        v_reason := 'Free access has ended. A paid package is required to continue.';
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
      v_state := 'Required'; v_access_until := v_subscription.expires_at;
      v_reason := 'A paid package is required to continue using SMART MANAGER.';
    ELSE
      v_state := 'Expired'; v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at);
      v_reason := 'The company package is not currently active. Workspace data is retained.';
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object('profileId', auth.uid(), 'role', v_role, 'canManageBilling', v_can_manage),
    'status', v_state, 'state', lower(v_state), 'allowed', v_allowed, 'reason', v_reason, 'accessUntil', v_access_until,
    'subscription', CASE WHEN v_subscription.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_subscription.id, 'plan_id', v_subscription.plan_id, 'offerCode', v_subscription.offer_code,
      'status', v_subscription.status, 'billing_cycle', v_subscription.billing_cycle, 'amount', v_subscription.amount,
      'currency', v_subscription.currency, 'started_at', v_subscription.started_at, 'expires_at', v_subscription.expires_at,
      'grace_expires_at', v_subscription.grace_expires_at, 'paidMonths', v_subscription.paid_months,
      'bonusMonths', v_subscription.bonus_months, 'totalMonths', v_subscription.total_months,
      'durationDays', v_subscription.duration_days, 'source_payment_id', v_subscription.source_payment_id
    ) END,
    'plan', CASE WHEN v_plan.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_plan.id, 'code', v_plan.code, 'name', v_plan.name, 'features', v_plan.features,
      'moduleEntitlements', v_plan.module_entitlements, 'paidMonths', v_plan.paid_months,
      'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months, 'durationDays', v_plan.duration_days
    ) END,
    'moduleEntitlements', coalesce(v_plan.module_entitlements, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_create_payment_intent(
  p_plan_id uuid,
  p_billing_cycle text,
  p_phone text,
  p_description text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_plan public.billing_plans%ROWTYPE;
  v_payment public.subscription_payments%ROWTYPE;
  v_phone text;
  v_amount numeric(18,2);
  v_key text := coalesce(nullif(trim(p_idempotency_key), ''), 'SM-SUB-' || replace(gen_random_uuid()::text, '-', ''));
  v_reference text;
BEGIN
  PERFORM public.billing_require_manager();
  IF coalesce(p_billing_cycle, 'Monthly') <> 'Monthly' THEN
    RAISE EXCEPTION 'All packages are billed monthly.' USING ERRCODE = '22023';
  END IF;
  v_phone := regexp_replace(coalesce(trim(p_phone), ''), '[^0-9+]', '', 'g');
  IF v_phone !~ '^(?:\+?255|0)[67][0-9]{8}$' THEN
    RAISE EXCEPTION 'Enter a valid Tanzanian mobile number.' USING ERRCODE = '22023';
  END IF;
  IF left(v_phone, 1) = '0' THEN v_phone := '255' || substr(v_phone, 2); END IF;
  IF left(v_phone, 1) = '+' THEN v_phone := substr(v_phone, 2); END IF;
  SELECT * INTO v_plan FROM public.billing_plans
  WHERE id = p_plan_id AND status = 'Active' AND company_id IS NULL AND code <> 'FREE_15';
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected paid package is unavailable.' USING ERRCODE = 'P0002'; END IF;
  v_amount := v_plan.monthly_price;
  IF v_amount IS NULL OR v_amount <= 0 OR v_plan.paid_months <> 1 OR v_plan.bonus_months <> 1 OR v_plan.total_months <> 2 THEN
    RAISE EXCEPTION 'This package does not have a valid paid-plus-bonus configuration.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_payment FROM public.subscription_payments
  WHERE company_id = public.current_company_id() AND idempotency_key = v_key LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('paymentId', v_payment.id, 'reference', v_payment.internal_reference, 'amount', v_payment.amount, 'currency', v_payment.currency, 'phone', v_payment.phone, 'status', v_payment.status, 'reused', true);
  END IF;
  IF EXISTS (SELECT 1 FROM public.subscription_payments WHERE company_id = public.current_company_id() AND status = 'Pending') THEN
    RAISE EXCEPTION 'A payment request is already pending for this workspace. Verify or cancel it before starting another request.' USING ERRCODE = '23505';
  END IF;
  v_reference := 'SM-SUB-' || replace(public.current_company_id()::text, '-', '') || '-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.subscription_payments(company_id, plan_id, provider, internal_reference, idempotency_key, amount, currency, phone, description, billing_cycle, status, initiated_by, provider_response)
  VALUES (public.current_company_id(), v_plan.id, 'HarakaPay', v_reference, v_key, v_amount, v_plan.currency, v_phone, nullif(trim(p_description), ''), 'Monthly', 'Pending', auth.uid(), jsonb_build_object('planCode', v_plan.code, 'planName', v_plan.name, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months))
  RETURNING * INTO v_payment;
  PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_INITIATED', v_payment.internal_reference, NULL, v_payment.id, NULL, 'Pending', jsonb_build_object('planId', v_plan.id, 'cycle', 'Monthly', 'amount', v_payment.amount, 'currency', v_payment.currency, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months));
  RETURN jsonb_build_object('paymentId', v_payment.id, 'reference', v_payment.internal_reference, 'amount', v_payment.amount, 'currency', v_payment.currency, 'phone', v_payment.phone, 'status', v_payment.status, 'planName', v_plan.name, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months, 'reused', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_apply_provider_status(
  p_payment_id uuid,
  p_provider_order_id text,
  p_provider_status text,
  p_provider_response jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_payment public.subscription_payments%ROWTYPE;
  v_plan public.billing_plans%ROWTYPE;
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_invoice public.subscription_invoices%ROWTYPE;
  v_normalized_status text := lower(trim(coalesce(p_provider_status, '')));
  v_previous_status text;
  v_provider_amount numeric(18,2);
  v_period_end timestamptz;
BEGIN
  SELECT * INTO v_payment FROM public.subscription_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription payment was not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_payment.provider_order_id IS NULL OR v_payment.provider_order_id <> nullif(trim(p_provider_order_id), '') THEN
    RAISE EXCEPTION 'Provider order verification failed.' USING ERRCODE = '42501';
  END IF;
  IF v_payment.status = 'Completed' THEN RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'idempotent', true); END IF;
  IF p_provider_response ? 'amount' AND nullif(p_provider_response->>'amount', '') IS NOT NULL THEN
    v_provider_amount := (p_provider_response->>'amount')::numeric;
    IF v_provider_amount <> v_payment.amount THEN
      UPDATE public.subscription_payments SET status = 'VerificationRequired', failure_reason = 'Provider amount did not match the expected subscription amount.', provider_response = coalesce(p_provider_response, '{}'::jsonb)
      WHERE id = v_payment.id RETURNING * INTO v_payment;
      PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_AMOUNT_MISMATCH', v_payment.internal_reference, NULL, v_payment.id, 'Pending', 'VerificationRequired', jsonb_build_object('expectedAmount', v_payment.amount, 'providerAmount', v_provider_amount));
      RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'idempotent', false);
    END IF;
  END IF;
  v_previous_status := v_payment.status;
  IF v_normalized_status IN ('completed', 'success', 'successful', 'paid') THEN
    SELECT * INTO v_plan FROM public.billing_plans WHERE id = v_payment.plan_id AND code <> 'FREE_15';
    IF NOT FOUND OR v_plan.monthly_price <> v_payment.amount OR v_plan.paid_months <> 1 OR v_plan.bonus_months <> 1 OR v_plan.total_months <> 2 THEN
      RAISE EXCEPTION 'Paid package and provider amount verification failed.' USING ERRCODE = '42501';
    END IF;
    v_period_end := now() + make_interval(months => v_plan.total_months);
    UPDATE public.tenant_subscriptions SET status = 'Superseded', updated_at = now()
    WHERE company_id = v_payment.company_id AND status IN ('Pending', 'Active', 'Grace', 'Expired', 'RequiresPlan');
    INSERT INTO public.tenant_subscriptions(company_id, plan_id, offer_code, status, billing_cycle, amount, currency, started_at, renewed_at, expires_at, paid_months, bonus_months, total_months, duration_days, source_payment_id, metadata)
    VALUES (v_payment.company_id, v_payment.plan_id, v_plan.code, 'Active', 'Monthly', v_payment.amount, v_payment.currency, now(), now(), v_period_end, v_plan.paid_months, v_plan.bonus_months, v_plan.total_months, NULL, v_payment.id, jsonb_build_object('provider', v_payment.provider, 'providerOrderId', v_payment.provider_order_id, 'packageCode', v_plan.code, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months))
    RETURNING * INTO v_subscription;
    UPDATE public.subscription_payments SET subscription_id = v_subscription.id, status = 'Completed', fee = nullif(p_provider_response->>'fee', '')::numeric, net_amount = nullif(p_provider_response->>'net_amount', '')::numeric, provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now(), paid_at = now(), failure_reason = NULL
    WHERE id = v_payment.id RETURNING * INTO v_payment;
    INSERT INTO public.subscription_invoices(company_id, subscription_id, payment_id, invoice_number, status, currency, subtotal, total_amount, paid_amount, paid_at, document_data)
    VALUES (v_payment.company_id, v_subscription.id, v_payment.id, 'SM-INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(v_payment.id::text, '-', ''), 1, 8)), 'Paid', v_payment.currency, v_payment.amount, v_payment.amount, v_payment.amount, now(), jsonb_build_object('provider', v_payment.provider, 'providerOrderId', v_payment.provider_order_id, 'packageCode', v_plan.code, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months, 'subscriptionExpiresAt', v_subscription.expires_at))
    RETURNING * INTO v_invoice;
    PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_COMPLETED', v_payment.internal_reference, v_subscription.id, v_payment.id, v_previous_status, 'Completed', jsonb_build_object('invoiceId', v_invoice.id, 'providerOrderId', v_payment.provider_order_id, 'expiresAt', v_subscription.expires_at, 'paidMonths', v_plan.paid_months, 'bonusMonths', v_plan.bonus_months, 'totalMonths', v_plan.total_months));
  ELSIF v_normalized_status IN ('failed', 'failure', 'cancelled', 'canceled', 'declined') THEN
    UPDATE public.subscription_payments SET status = CASE WHEN v_normalized_status IN ('cancelled', 'canceled') THEN 'Cancelled' ELSE 'Failed' END, provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now(), failure_reason = coalesce(nullif(p_provider_response->>'message', ''), 'Provider reported that the payment was not completed.') WHERE id = v_payment.id RETURNING * INTO v_payment;
    PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_FAILED', v_payment.internal_reference, NULL, v_payment.id, v_previous_status, v_payment.status, jsonb_build_object('providerOrderId', v_payment.provider_order_id));
  ELSE
    UPDATE public.subscription_payments SET status = 'Pending', provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now() WHERE id = v_payment.id RETURNING * INTO v_payment;
  END IF;
  RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'subscription', coalesce(to_jsonb(v_subscription), '{}'::jsonb), 'invoice', coalesce(to_jsonb(v_invoice), '{}'::jsonb), 'idempotent', false);
END;
$$;

-- Migrate the exact approved initial catalog before enforcing the new contract.
UPDATE public.billing_plans SET
  name = CASE code WHEN 'FREE_15' THEN 'FREE' WHEN 'SIMBA_SC' THEN 'SIMBA SC' WHEN 'YANGA_SC' THEN 'YANGA SC' WHEN 'AZAM_FC' THEN 'AZAM FC' ELSE code END,
  description = CASE code
    WHEN 'FREE_15' THEN 'Introductory access for 15 days with no payment required.'
    WHEN 'TWIGA' THEN 'Essential SMART MANAGER operations with one promotional bonus month.'
    WHEN 'TEMBO' THEN 'Broader operating visibility and controls with one promotional bonus month.'
    WHEN 'SIMBA' THEN 'Professional operating package with one promotional bonus month.'
    WHEN 'SIMBA_SC' THEN 'SIMBA SC special package with one promotional bonus month.'
    WHEN 'YANGA_SC' THEN 'YANGA SC special package with one promotional bonus month.'
    WHEN 'AZAM_FC' THEN 'AZAM FC special package with one promotional bonus month.'
    ELSE description END,
  currency = 'TZS',
  annual_price = NULL,
  annual_savings_label = NULL,
  monthly_price = CASE code WHEN 'FREE_15' THEN 0 WHEN 'TWIGA' THEN 5000 WHEN 'TEMBO' THEN 10000 WHEN 'SIMBA' THEN 15000 WHEN 'SIMBA_SC' THEN 4500 WHEN 'YANGA_SC' THEN 9000 WHEN 'AZAM_FC' THEN 7000 ELSE monthly_price END,
  paid_months = CASE WHEN code = 'FREE_15' THEN 0 ELSE 1 END,
  bonus_months = CASE WHEN code = 'FREE_15' THEN 0 ELSE 1 END,
  total_months = CASE WHEN code = 'FREE_15' THEN 0 ELSE 2 END,
  duration_days = CASE WHEN code = 'FREE_15' THEN 15 ELSE NULL END,
  badge = CASE WHEN code = 'TEMBO' THEN 'POPULAR' WHEN code = 'FREE_15' THEN 'START HERE' ELSE badge END,
  recommended = (code = 'TEMBO'),
  sort_order = CASE code WHEN 'FREE_15' THEN 0 WHEN 'TWIGA' THEN 10 WHEN 'TEMBO' THEN 20 WHEN 'SIMBA' THEN 30 WHEN 'SIMBA_SC' THEN 110 WHEN 'YANGA_SC' THEN 120 WHEN 'AZAM_FC' THEN 130 ELSE sort_order END,
  updated_at = now()
WHERE company_id IS NULL AND code IN ('FREE_15', 'TWIGA', 'TEMBO', 'SIMBA', 'SIMBA_SC', 'YANGA_SC', 'AZAM_FC');

-- The previous catalog had TWIGA/TEMBO/SIMBA/SIMBA_SC/YANGA_SC/AZAM_FC only.
-- Add FREE_15 idempotently if an older environment lacks it; no duplicate row is created.
INSERT INTO public.billing_plans(
  company_id, code, name, description, status, currency, monthly_price, annual_price,
  included_users, included_branches, included_storage_mb, included_transactions,
  features, module_entitlements, sort_order, recommended, plan_category, badge, visual_theme,
  paid_months, bonus_months, total_months, duration_days
) VALUES (
  NULL, 'FREE_15', 'FREE', 'Introductory access for 15 days with no payment required.', 'Active', 'TZS', 0, NULL,
  3, 1, 512, 300, '{"coreOperations": true, "basicReports": true, "support": true}'::jsonb,
  '["finance", "sales", "inventory", "hr"]'::jsonb, 0, false, 'Business', 'START HERE', 'free', 0, 0, 0, 15
) ON CONFLICT ON CONSTRAINT billing_plans_scope_code_unique DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status,
  currency = EXCLUDED.currency, monthly_price = EXCLUDED.monthly_price, annual_price = NULL,
  annual_savings_label = NULL, paid_months = EXCLUDED.paid_months, bonus_months = EXCLUDED.bonus_months,
  total_months = EXCLUDED.total_months, duration_days = EXCLUDED.duration_days, badge = EXCLUDED.badge,
  visual_theme = EXCLUDED.visual_theme, sort_order = EXCLUDED.sort_order, updated_at = now();

ALTER TABLE public.billing_plans
  DROP CONSTRAINT IF EXISTS billing_plans_duration_contract_check,
  ADD CONSTRAINT billing_plans_duration_contract_check CHECK (
    (code = 'FREE_15' AND monthly_price = 0 AND paid_months = 0 AND bonus_months = 0 AND total_months = 0 AND duration_days = 15)
    OR
    (code <> 'FREE_15' AND monthly_price > 0 AND paid_months = 1 AND bonus_months = 1 AND total_months = 2 AND duration_days IS NULL)
  );

ALTER TABLE public.billing_plans DROP COLUMN IF EXISTS trial_days;
ALTER TABLE public.tenant_subscriptions DROP COLUMN IF EXISTS trial_started_at;
ALTER TABLE public.tenant_subscriptions DROP COLUMN IF EXISTS trial_ends_at;

CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_offer_status_idx
  ON public.tenant_subscriptions(company_id, offer_code, status, expires_at DESC);

DROP POLICY IF EXISTS billing_plans_read ON public.billing_plans;
CREATE POLICY billing_plans_read ON public.billing_plans FOR SELECT TO authenticated
USING (status = 'Active' AND (company_id IS NULL OR company_id = public.current_company_id()));

REVOKE ALL ON FUNCTION public.billing_public_plan_catalog() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_start_free_plan(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.billing_reconcile_free_plan_expiry(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_public_plan_catalog() TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_reconcile_free_plan_expiry(uuid) TO service_role;

COMMIT;
