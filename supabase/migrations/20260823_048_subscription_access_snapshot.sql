-- Platform subscription access contract.
-- Reuses the existing billing tables; no subscription data is duplicated.
-- This function exposes only the minimum tenant-scoped entitlement state needed
-- by the application shell. Payment activation remains provider/server-confirmed.

BEGIN;

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
  v_reason text := 'No company subscription has been confirmed.';
  v_access_until timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required for subscription access.' USING ERRCODE = '28000';
  END IF;

  SELECT p.company_id, p.role
    INTO v_company_id, v_role
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'An active company profile is required for subscription access.' USING ERRCODE = '42501';
  END IF;

  v_can_manage := public.billing_is_manager();

  SELECT s.*
    INTO v_subscription
  FROM public.tenant_subscriptions s
  WHERE s.company_id = v_company_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    SELECT p.*
      INTO v_plan
    FROM public.billing_plans p
    WHERE p.id = v_subscription.plan_id
    LIMIT 1;

    IF v_subscription.status = 'Trial' THEN
      v_access_until := coalesce(v_subscription.trial_ends_at, v_subscription.expires_at);
      IF v_access_until IS NULL OR v_access_until > now() THEN
        v_state := 'Trial';
        v_allowed := true;
        v_reason := 'The company is within its confirmed trial period.';
      ELSE
        v_state := 'Expired';
        v_reason := 'The company trial has expired. Workspace data is retained; a confirmed plan is required to resume operational access.';
      END IF;
    ELSIF v_subscription.status = 'Active' THEN
      v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at);
      IF v_subscription.expires_at IS NULL OR v_subscription.expires_at > now() THEN
        v_state := 'Active';
        v_allowed := true;
        v_reason := 'The company subscription is active.';
      ELSIF v_subscription.grace_expires_at IS NOT NULL AND v_subscription.grace_expires_at > now() THEN
        v_state := 'Grace';
        v_allowed := true;
        v_reason := 'The paid subscription is within its server-defined grace period.';
      ELSE
        v_state := 'Expired';
        v_reason := 'The paid subscription has expired. Workspace data is retained; a confirmed plan is required to resume operational access.';
      END IF;
    ELSIF v_subscription.status = 'Grace' THEN
      v_access_until := v_subscription.grace_expires_at;
      IF v_access_until IS NOT NULL AND v_access_until > now() THEN
        v_state := 'Grace';
        v_allowed := true;
        v_reason := 'The company is within its server-defined grace period.';
      ELSE
        v_state := 'Expired';
        v_reason := 'The subscription grace period has ended. Workspace data is retained; a confirmed plan is required to resume operational access.';
      END IF;
    ELSIF v_subscription.status = 'Pending' THEN
      v_state := 'Pending';
      v_access_until := v_subscription.expires_at;
      v_reason := 'A payment request is pending provider confirmation. Browser state cannot grant access.';
    ELSE
      v_state := 'Expired';
      v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at, v_subscription.trial_ends_at);
      v_reason := 'The company subscription is not currently active. Workspace data is retained; a confirmed plan is required to resume operational access.';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object(
      'profileId', auth.uid(),
      'role', v_role,
      'canManageBilling', v_can_manage
    ),
    'status', v_state,
    'state', lower(v_state),
    'allowed', v_allowed,
    'reason', v_reason,
    'accessUntil', v_access_until,
    'subscription', CASE WHEN v_subscription.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_subscription.id,
      'plan_id', v_subscription.plan_id,
      'status', v_subscription.status,
      'billing_cycle', v_subscription.billing_cycle,
      'amount', v_subscription.amount,
      'currency', v_subscription.currency,
      'started_at', v_subscription.started_at,
      'expires_at', v_subscription.expires_at,
      'grace_expires_at', v_subscription.grace_expires_at,
      'trial_started_at', v_subscription.trial_started_at,
      'trial_ends_at', v_subscription.trial_ends_at,
      'source_payment_id', v_subscription.source_payment_id
    ) END,
    'plan', CASE WHEN v_plan.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_plan.id,
      'code', v_plan.code,
      'name', v_plan.name,
      'features', v_plan.features,
      'moduleEntitlements', v_plan.module_entitlements
    ) END,
    'moduleEntitlements', coalesce(v_plan.module_entitlements, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.billing_access_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_access_snapshot() TO authenticated;

COMMIT;
