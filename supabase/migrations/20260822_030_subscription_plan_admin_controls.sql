-- Extend secure billing plan administration for the official catalog and company-specific plans.

BEGIN;

CREATE OR REPLACE FUNCTION public.billing_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) IN ('super administrator', 'platform administrator')
  );
$$;

CREATE OR REPLACE FUNCTION public.billing_upsert_plan(p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_plan public.billing_plans%ROWTYPE;
  v_plan_id uuid := nullif(p_payload->>'planId', '')::uuid;
  v_code text := upper(regexp_replace(coalesce(trim(p_payload->>'code'), ''), '[^A-Za-z0-9_-]', '-', 'g'));
  v_status text := coalesce(nullif(trim(p_payload->>'status'), ''), 'Draft');
  v_category text := coalesce(nullif(trim(p_payload->>'planCategory'), ''), 'Business');
  v_visual_theme text := coalesce(nullif(trim(p_payload->>'visualTheme'), ''), 'standard');
  v_trial_days integer := coalesce(nullif(p_payload->>'trialDays', '')::integer, 30);
  v_is_global boolean := coalesce((p_payload->>'isGlobal')::boolean, false);
  v_scope_company_id uuid;
BEGIN
  PERFORM public.billing_require_manager();
  IF nullif(trim(p_payload->>'name'), '') IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'A plan name and code are required.' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('Draft', 'Active', 'Archived') THEN
    RAISE EXCEPTION 'Plan status must be Draft, Active, or Archived.' USING ERRCODE = '22023';
  END IF;
  IF v_category NOT IN ('Business', 'Football') THEN
    RAISE EXCEPTION 'Plan category must be Business or Football.' USING ERRCODE = '22023';
  END IF;
  IF v_trial_days < 0 OR v_trial_days > 90 THEN
    RAISE EXCEPTION 'Trial duration must be between 0 and 90 days.' USING ERRCODE = '22023';
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
      created_by, plan_category, badge, visual_theme, trial_days
    ) VALUES (
      v_scope_company_id, v_code, trim(p_payload->>'name'), nullif(trim(p_payload->>'description'), ''),
      v_status, coalesce(nullif(trim(p_payload->>'currency'), ''), 'TZS'),
      nullif(p_payload->>'monthlyPrice', '')::numeric, nullif(p_payload->>'annualPrice', '')::numeric,
      nullif(trim(p_payload->>'annualSavingsLabel'), ''), nullif(p_payload->>'includedUsers', '')::integer,
      nullif(p_payload->>'includedBranches', '')::integer, nullif(p_payload->>'includedStorageMb', '')::bigint,
      nullif(p_payload->>'includedTransactions', '')::integer, coalesce(p_payload->'features', '{}'::jsonb),
      coalesce(p_payload->'moduleEntitlements', '[]'::jsonb), coalesce(nullif(p_payload->>'sortOrder', '')::integer, 0),
      coalesce((p_payload->>'recommended')::boolean, false), auth.uid(), v_category,
      nullif(trim(p_payload->>'badge'), ''), v_visual_theme, v_trial_days
    ) RETURNING * INTO v_plan;
  ELSE
    SELECT * INTO v_plan FROM public.billing_plans
    WHERE id = v_plan_id
      AND (company_id = public.current_company_id() OR (company_id IS NULL AND public.billing_is_platform_admin()))
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'The billing plan was not found in this workspace.' USING ERRCODE = 'P0002'; END IF;
    UPDATE public.billing_plans SET
      code = v_code, name = trim(p_payload->>'name'), description = nullif(trim(p_payload->>'description'), ''),
      status = v_status, currency = coalesce(nullif(trim(p_payload->>'currency'), ''), currency),
      monthly_price = nullif(p_payload->>'monthlyPrice', '')::numeric,
      annual_price = nullif(p_payload->>'annualPrice', '')::numeric,
      annual_savings_label = nullif(trim(p_payload->>'annualSavingsLabel'), ''),
      included_users = nullif(p_payload->>'includedUsers', '')::integer,
      included_branches = nullif(p_payload->>'includedBranches', '')::integer,
      included_storage_mb = nullif(p_payload->>'includedStorageMb', '')::bigint,
      included_transactions = nullif(p_payload->>'includedTransactions', '')::integer,
      features = coalesce(p_payload->'features', features),
      module_entitlements = coalesce(p_payload->'moduleEntitlements', module_entitlements),
      sort_order = coalesce(nullif(p_payload->>'sortOrder', '')::integer, sort_order),
      recommended = coalesce((p_payload->>'recommended')::boolean, recommended),
      plan_category = v_category, badge = nullif(trim(p_payload->>'badge'), ''),
      visual_theme = v_visual_theme, trial_days = v_trial_days
    WHERE id = v_plan.id
    RETURNING * INTO v_plan;
  END IF;
  PERFORM public.billing_audit('BILLING_PLAN_SAVED', v_plan.id::text, NULL, NULL, NULL, v_plan.status, jsonb_build_object('planCode', v_plan.code, 'planName', v_plan.name, 'global', v_plan.company_id IS NULL, 'trialDays', v_plan.trial_days));
  RETURN to_jsonb(v_plan);
END;
$$;

REVOKE ALL ON FUNCTION public.billing_is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_upsert_plan(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_upsert_plan(jsonb) TO authenticated;

COMMIT;
