-- Persistent, per-authenticated-user trial-expiry notice gate.
-- The notice is not stored as a company-global flag: each subscription/user pair
-- receives its own durable state, with a short-lived claim lease for race control.

BEGIN;

CREATE TABLE IF NOT EXISTS public.subscription_trial_expiry_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notice_shown boolean NOT NULL DEFAULT false,
  shown_at timestamptz,
  acknowledged_at timestamptz,
  claim_token uuid,
  claim_expires_at timestamptz,
  claim_count integer NOT NULL DEFAULT 0 CHECK (claim_count >= 0),
  reset_count integer NOT NULL DEFAULT 0 CHECK (reset_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_trial_expiry_notices_pair_unique UNIQUE (subscription_id, user_id)
);

ALTER TABLE public.subscription_trial_expiry_notices
  ADD COLUMN IF NOT EXISTS notice_shown boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shown_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_token uuid,
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reset_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS subscription_trial_expiry_notices_user_idx
  ON public.subscription_trial_expiry_notices(user_id, notice_shown, updated_at DESC);
CREATE INDEX IF NOT EXISTS subscription_trial_expiry_notices_company_idx
  ON public.subscription_trial_expiry_notices(company_id, subscription_id, user_id);

CREATE OR REPLACE FUNCTION public.subscription_trial_expiry_notice_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscription_trial_expiry_notices_touch_updated_at ON public.subscription_trial_expiry_notices;
CREATE TRIGGER subscription_trial_expiry_notices_touch_updated_at
BEFORE UPDATE ON public.subscription_trial_expiry_notices
FOR EACH ROW EXECUTE FUNCTION public.subscription_trial_expiry_notice_touch_updated_at();

ALTER TABLE public.subscription_trial_expiry_notices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.billing_trial_expiry_notice_claim()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_notice public.subscription_trial_expiry_notices%ROWTYPE;
  v_now timestamptz := now();
  v_claim_token uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated session is required to check trial status.' USING ERRCODE = '28000';
  END IF;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'A current workspace is required to check trial status.' USING ERRCODE = '42501';
  END IF;

  -- The newest subscription is authoritative. A later paid, pending, renewed,
  -- superseded, or cancelled record suppresses any older trial notice.
  SELECT * INTO v_subscription
  FROM public.tenant_subscriptions
  WHERE company_id = v_company_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('show', false, 'reason', 'no_subscription');
  END IF;

  IF v_subscription.status IN ('Active', 'Grace', 'Pending', 'Superseded', 'Cancelled') THEN
    RETURN jsonb_build_object('show', false, 'reason', lower(v_subscription.status));
  END IF;
  IF v_subscription.trial_started_at IS NULL OR v_subscription.trial_ends_at IS NULL THEN
    RETURN jsonb_build_object('show', false, 'reason', 'not_a_trial');
  END IF;
  IF v_subscription.trial_ends_at > v_now THEN
    RETURN jsonb_build_object(
      'show', false,
      'reason', 'trial_active',
      'subscriptionId', v_subscription.id,
      'trialStartedAt', v_subscription.trial_started_at,
      'trialEndsAt', v_subscription.trial_ends_at
    );
  END IF;
  IF v_subscription.status NOT IN ('Trial', 'Expired') THEN
    RETURN jsonb_build_object('show', false, 'reason', lower(v_subscription.status));
  END IF;

  -- Make expiry visible immediately even if the scheduled reconciliation has not
  -- run yet. The row lock prevents two sessions from racing this transition.
  IF v_subscription.status = 'Trial' THEN
    UPDATE public.tenant_subscriptions
    SET status = 'Expired',
        expires_at = COALESCE(expires_at, trial_ends_at),
        metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{trialExpiredAt}', to_jsonb(v_now), true),
        updated_at = v_now
    WHERE id = v_subscription.id;
  END IF;

  INSERT INTO public.subscription_trial_expiry_notices(company_id, subscription_id, user_id)
  VALUES (v_company_id, v_subscription.id, v_user_id)
  ON CONFLICT (subscription_id, user_id) DO NOTHING;

  SELECT * INTO v_notice
  FROM public.subscription_trial_expiry_notices
  WHERE subscription_id = v_subscription.id AND user_id = v_user_id
  FOR UPDATE;

  IF v_notice.notice_shown THEN
    RETURN jsonb_build_object(
      'show', false,
      'reason', 'already_shown',
      'subscriptionId', v_subscription.id,
      'trialStartedAt', v_subscription.trial_started_at,
      'trialEndsAt', v_subscription.trial_ends_at
    );
  END IF;

  -- A short lease prevents duplicate displays from two tabs/devices while still
  -- allowing recovery if a browser crashes before acknowledgement.
  IF v_notice.claim_token IS NOT NULL AND v_notice.claim_expires_at > v_now THEN
    RETURN jsonb_build_object('show', false, 'reason', 'claim_in_progress');
  END IF;

  v_claim_token := gen_random_uuid();
  UPDATE public.subscription_trial_expiry_notices
  SET claim_token = v_claim_token,
      claim_expires_at = v_now + interval '5 minutes',
      claim_count = claim_count + 1,
      updated_at = v_now
  WHERE id = v_notice.id
  RETURNING * INTO v_notice;

  PERFORM public.billing_audit(
    'SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_CLAIMED',
    v_notice.id::text,
    v_subscription.id,
    NULL,
    'Trial',
    'Expired',
    jsonb_build_object('userId', v_user_id, 'trialStartedAt', v_subscription.trial_started_at, 'trialEndsAt', v_subscription.trial_ends_at, 'claimCount', v_notice.claim_count)
  );

  RETURN jsonb_build_object(
    'show', true,
    'claimToken', v_notice.claim_token,
    'noticeId', v_notice.id,
    'userId', v_user_id,
    'subscriptionId', v_subscription.id,
    'trialStartedAt', v_subscription.trial_started_at,
    'trialEndsAt', v_subscription.trial_ends_at,
    'status', 'Expired'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_trial_expiry_notice_acknowledge(p_claim_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_notice public.subscription_trial_expiry_notices%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated session is required to acknowledge trial status.' USING ERRCODE = '28000';
  END IF;
  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'A trial notice claim token is required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_notice
  FROM public.subscription_trial_expiry_notices
  WHERE user_id = v_user_id AND claim_token = p_claim_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('acknowledged', false, 'reason', 'claim_not_found');
  END IF;
  IF v_notice.notice_shown THEN
    RETURN jsonb_build_object('acknowledged', true, 'alreadyAcknowledged', true, 'noticeId', v_notice.id);
  END IF;
  IF v_notice.claim_expires_at IS NOT NULL AND v_notice.claim_expires_at < now() THEN
    RETURN jsonb_build_object('acknowledged', false, 'reason', 'claim_expired');
  END IF;

  UPDATE public.subscription_trial_expiry_notices
  SET notice_shown = true,
      shown_at = COALESCE(shown_at, now()),
      acknowledged_at = now(),
      claim_token = NULL,
      claim_expires_at = NULL,
      updated_at = now()
  WHERE id = v_notice.id
  RETURNING * INTO v_notice;

  PERFORM public.billing_audit(
    'SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_ACKNOWLEDGED',
    v_notice.id::text,
    v_notice.subscription_id,
    NULL,
    'Expired',
    'Expired',
    jsonb_build_object('userId', v_user_id, 'noticeId', v_notice.id)
  );

  RETURN jsonb_build_object('acknowledged', true, 'noticeId', v_notice.id, 'userId', v_user_id, 'subscriptionId', v_notice.subscription_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_admin_trial_expiry_notice_snapshot(
  p_company_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_subscription_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT jsonb_build_object(
    'companyId', p_company_id,
    'userId', p_user_id,
    'subscriptionId', p_subscription_id,
    'notices', coalesce((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.updated_at DESC)
      FROM (
        SELECT n.*
        FROM public.subscription_trial_expiry_notices n
        WHERE (p_company_id IS NULL OR n.company_id = p_company_id)
          AND (p_user_id IS NULL OR n.user_id = p_user_id)
          AND (p_subscription_id IS NULL OR n.subscription_id = p_subscription_id)
        ORDER BY n.updated_at DESC
        LIMIT 200
      ) x
    ), '[]'::jsonb)
  )
  WHERE public.billing_is_platform_admin();
$$;

CREATE OR REPLACE FUNCTION public.billing_admin_trial_expiry_notice_reset(
  p_company_id uuid,
  p_user_id uuid,
  p_subscription_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_notice public.subscription_trial_expiry_notices%ROWTYPE;
  v_reason text := nullif(trim(p_reason), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated session is required for a notice reset.' USING ERRCODE = '28000';
  END IF;
  IF NOT public.billing_is_platform_admin() THEN
    RAISE EXCEPTION 'Only a Global Admin can reset a trial-expiry notice.' USING ERRCODE = '42501';
  END IF;
  IF p_company_id IS NULL OR p_user_id IS NULL OR p_subscription_id IS NULL OR v_reason IS NULL OR char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'Company, user, subscription, and a reset reason of at least five characters are required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_notice
  FROM public.subscription_trial_expiry_notices
  WHERE company_id = p_company_id AND user_id = p_user_id AND subscription_id = p_subscription_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The trial-expiry notice record was not found.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.subscription_trial_expiry_notices
  SET notice_shown = false,
      shown_at = NULL,
      acknowledged_at = NULL,
      claim_token = NULL,
      claim_expires_at = NULL,
      reset_count = reset_count + 1,
      updated_at = now()
  WHERE id = v_notice.id
  RETURNING * INTO v_notice;

  PERFORM public.billing_audit(
    'SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_RESET',
    v_notice.id::text,
    v_notice.subscription_id,
    NULL,
    'Expired',
    'Expired',
    jsonb_build_object('targetCompanyId', p_company_id, 'targetUserId', p_user_id, 'targetSubscriptionId', p_subscription_id, 'reason', left(v_reason, 1000), 'resetBy', auth.uid(), 'resetCount', v_notice.reset_count)
  );

  RETURN jsonb_build_object('reset', true, 'noticeId', v_notice.id, 'companyId', p_company_id, 'userId', p_user_id, 'subscriptionId', p_subscription_id, 'resetCount', v_notice.reset_count);
END;
$$;

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
    'viewer', jsonb_build_object('profileId', auth.uid(), 'canManageBilling', true, 'isPlatformAdmin', public.billing_is_platform_admin()),
    'profile', coalesce((SELECT to_jsonb(p) FROM public.billing_profiles p WHERE p.company_id = v_company_id), '{}'::jsonb),
    'plans', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.plan_category, p.sort_order, p.name) FROM public.billing_plans p WHERE p.company_id IS NULL OR p.company_id = v_company_id), '[]'::jsonb),
    'subscription', coalesce((SELECT to_jsonb(s) FROM public.tenant_subscriptions s WHERE s.company_id = v_company_id AND s.status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired') ORDER BY s.created_at DESC LIMIT 1), '{}'::jsonb),
    'notifications', coalesce((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC) FROM (SELECT * FROM public.subscription_notifications WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 50) n), '[]'::jsonb),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM (SELECT * FROM public.subscription_payments WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) p), '[]'::jsonb),
    'invoices', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.issued_at DESC) FROM (SELECT * FROM public.subscription_invoices WHERE company_id = v_company_id ORDER BY issued_at DESC LIMIT 100) i), '[]'::jsonb),
    'events', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY e.created_at DESC LIMIT 100) e), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON TABLE public.subscription_trial_expiry_notices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.subscription_trial_expiry_notice_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_trial_expiry_notice_claim() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.billing_trial_expiry_notice_acknowledge(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.billing_admin_trial_expiry_notice_snapshot(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.billing_admin_trial_expiry_notice_reset(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_trial_expiry_notice_claim() TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_trial_expiry_notice_acknowledge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_admin_trial_expiry_notice_snapshot(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_admin_trial_expiry_notice_reset(uuid, uuid, uuid, text) TO authenticated;

COMMIT;
