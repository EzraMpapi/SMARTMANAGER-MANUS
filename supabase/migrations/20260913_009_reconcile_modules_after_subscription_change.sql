begin;

-- Reconcile effective module access after platform-admin extension or plan changes.
-- The plan remains the billing source of truth, while explicitly enabled company
-- modules are preserved so a subscription mutation does not hide configured modules.
create or replace function public.billing_access_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_company_id uuid;
  v_role text;
  v_can_manage boolean := false;
  v_subscription public.tenant_subscriptions%rowtype;
  v_plan public.billing_plans%rowtype;
  v_state text := 'Required';
  v_allowed boolean := false;
  v_reason text := 'No company subscription has been confirmed.';
  v_access_until timestamptz;
  v_effective_modules jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'An authenticated workspace session is required for subscription access.' using errcode = '28000';
  end if;

  select p.company_id, p.role into v_company_id, v_role
  from public.profiles p
  where p.id = auth.uid() and p.is_active = true
  limit 1;

  if v_company_id is null then
    raise exception 'An active company profile is required for subscription access.' using errcode = '42501';
  end if;

  v_can_manage := public.billing_is_manager();

  select s.* into v_subscription
  from public.tenant_subscriptions s
  where s.company_id = v_company_id
  order by s.created_at desc
  limit 1;

  if found then
    select p.* into v_plan
    from public.billing_plans p
    where p.id = v_subscription.plan_id
    limit 1;

    if v_subscription.status = 'Trial' then
      v_access_until := coalesce(v_subscription.trial_ends_at, v_subscription.expires_at);
      if v_access_until is null or v_access_until > now() then
        v_state := 'Trial'; v_allowed := true; v_reason := 'The company is within its confirmed trial period.';
      else
        v_state := 'Expired'; v_reason := 'The company trial has expired. Workspace data is retained; a confirmed plan is required to resume operational access.';
      end if;
    elsif v_subscription.status = 'Active' then
      v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at);
      if v_subscription.expires_at is null or v_subscription.expires_at > now() then
        v_state := 'Active'; v_allowed := true; v_reason := 'The company subscription is active.';
      elsif v_subscription.grace_expires_at is not null and v_subscription.grace_expires_at > now() then
        v_state := 'Grace'; v_allowed := true; v_reason := 'The paid subscription is within its server-defined grace period.';
      else
        v_state := 'Expired'; v_reason := 'The paid subscription has expired. Workspace data is retained; a confirmed plan is required to resume operational access.';
      end if;
    elsif v_subscription.status = 'Grace' then
      v_access_until := v_subscription.grace_expires_at;
      if v_access_until is not null and v_access_until > now() then
        v_state := 'Grace'; v_allowed := true; v_reason := 'The company is within its server-defined grace period.';
      else
        v_state := 'Expired'; v_reason := 'The subscription grace period has ended. Workspace data is retained; a confirmed plan is required to resume operational access.';
      end if;
    elsif v_subscription.status = 'Pending' then
      v_state := 'Pending'; v_access_until := v_subscription.expires_at; v_reason := 'A payment request is pending provider confirmation. Browser state cannot grant access.';
    else
      v_state := 'Expired'; v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at, v_subscription.trial_ends_at); v_reason := 'The company subscription is not currently active. Workspace data is retained; a confirmed plan is required to resume operational access.';
    end if;
  end if;

  -- Merge plan entitlements with enabled company modules. Duplicate historical
  -- rows are collapsed by module key; an enabled row wins over stale disabled data.
  select coalesce(jsonb_agg(m.module_key order by m.module_key), '[]'::jsonb)
  into v_effective_modules
  from (
    select lower(trim(module_key)) as module_key, bool_or(enabled) as enabled
    from (
      select jsonb_array_elements_text(coalesce(v_plan.module_entitlements, '[]'::jsonb)) as module_key, true as enabled
      union all
      select coalesce(cm.data->>'module_key', cm.name) as module_key,
             lower(coalesce(cm.status, '')) = 'active' and coalesce(cm.data->>'enabled', 'true') <> 'false' as enabled
      from public.company_modules cm
      where cm.company_id = v_company_id
    ) sources
    where nullif(trim(module_key), '') is not null
    group by lower(trim(module_key))
  ) m
  where m.enabled;

  return jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object('profileId', auth.uid(), 'role', v_role, 'canManageBilling', v_can_manage),
    'status', v_state,
    'state', lower(v_state),
    'allowed', v_allowed,
    'reason', v_reason,
    'accessUntil', v_access_until,
    'subscription', case when v_subscription.id is null then null else jsonb_build_object(
      'id', v_subscription.id, 'plan_id', v_subscription.plan_id, 'status', v_subscription.status,
      'billing_cycle', v_subscription.billing_cycle, 'amount', v_subscription.amount, 'currency', v_subscription.currency,
      'started_at', v_subscription.started_at, 'expires_at', v_subscription.expires_at,
      'grace_expires_at', v_subscription.grace_expires_at, 'trial_started_at', v_subscription.trial_started_at,
      'trial_ends_at', v_subscription.trial_ends_at, 'source_payment_id', v_subscription.source_payment_id
    ) end,
    'plan', case when v_plan.id is null then null else jsonb_build_object(
      'id', v_plan.id, 'code', v_plan.code, 'name', v_plan.name, 'features', v_plan.features,
      'moduleEntitlements', v_effective_modules
    ) end,
    'moduleEntitlements', v_effective_modules
  );
end;
$$;

revoke all on function public.billing_access_snapshot() from public, anon;
grant execute on function public.billing_access_snapshot() to authenticated;

commit;
