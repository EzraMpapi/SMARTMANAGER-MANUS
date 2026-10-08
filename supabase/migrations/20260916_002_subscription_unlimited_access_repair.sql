begin;

-- Lock the tenant subscription base row directly. PostgreSQL rejects FOR UPDATE
-- on the nullable side of a LEFT JOIN, which previously blocked Extend.
create or replace function public.platform_admin_control_action(
  p_action text,
  p_target_id uuid default null,
  p_reason text default null,
  p_company_id uuid default null,
  p_plan text default null,
  p_name text default null,
  p_cycle text default null,
  p_amount numeric default null,
  p_status text default null,
  p_extension_days integer default null,
  p_subscription_source text default 'sales'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_action text := upper(btrim(coalesce(p_action, '')));
  v_source text := lower(coalesce(p_subscription_source, 'sales'));
  v_role text;
  v_company_id uuid;
  v_old_status text;
  v_new_status text;
  v_old_plan text;
  v_new_plan text;
  v_plan_id uuid;
  v_audit_id uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.billing_is_platform_admin() then
    raise exception 'platform administrator access required' using errcode = '42501';
  end if;
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'a concise reason is required' using errcode = '22023';
  end if;

  if v_action in ('CHANGE_PLAN', 'CANCEL_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'EXTEND_SUBSCRIPTION') and v_source = 'tenant' then
    -- Lock the non-nullable base row first; look up the optional plan separately.
    select ts.company_id, ts.status
      into v_company_id, v_old_status
      from public.tenant_subscriptions ts
     where ts.id = p_target_id
     for update;
    if v_company_id is null then
      raise exception 'tenant subscription not found' using errcode = 'P0002';
    end if;

    select coalesce(bp.name, bp.code)
      into v_old_plan
      from public.billing_plans bp
     where bp.id = (select ts.plan_id from public.tenant_subscriptions ts where ts.id = p_target_id);

    v_new_status := v_old_status;
    v_new_plan := v_old_plan;
    if v_action = 'CHANGE_PLAN' then
      if nullif(btrim(coalesce(p_plan, '')), '') is null then
        raise exception 'plan is required' using errcode = '22023';
      end if;
      select id into v_plan_id
        from public.billing_plans
       where lower(name) = lower(btrim(p_plan)) or lower(code) = lower(btrim(p_plan))
       limit 1;
      if v_plan_id is null then
        raise exception 'billing plan not found' using errcode = 'P0002';
      end if;
      v_new_plan := btrim(p_plan);
    elsif v_action = 'CANCEL_SUBSCRIPTION' then
      v_new_status := 'Cancelled';
    elsif v_action = 'RESUME_SUBSCRIPTION' then
      v_new_status := 'Active';
    elsif p_extension_days not in (7, 15, 30, 60, 90) then
      raise exception 'extension must be 7,15,30,60,90' using errcode = '22023';
    else
      v_new_status := 'Active';
    end if;

    update public.tenant_subscriptions
       set plan_id = coalesce(v_plan_id, plan_id),
           status = v_new_status,
           cancelled_at = case
             when v_action = 'CANCEL_SUBSCRIPTION' then now()
             when v_action = 'RESUME_SUBSCRIPTION' then null
             else cancelled_at
           end,
           expires_at = case
             when v_action = 'EXTEND_SUBSCRIPTION' then greatest(coalesce(expires_at, now()), now()) + make_interval(days => p_extension_days)
             when v_action = 'RESUME_SUBSCRIPTION' and (expires_at is null or expires_at < now()) then now() + interval '30 days'
             else expires_at
           end,
           metadata = case
             when v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION') then
               coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
                 'unlimitedAccess', true,
                 'accessMode', 'unlimited',
                 'platformApprovedAt', now()
               )
             else coalesce(metadata, '{}'::jsonb)
           end,
           updated_at = now()
     where id = p_target_id;

    insert into public.subscription_events(company_id, subscription_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details)
    values (v_company_id, p_target_id, v_action, v_old_status, v_new_status, auth.uid(), 'platform_admin', jsonb_build_object('reason', p_reason, 'tenantSubscriptionId', p_target_id, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'extensionDays', p_extension_days, 'unlimitedAccess', v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION')));
    insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details)
    values (auth.uid(), 'platform administrator', v_action, 'subscription', p_target_id::text, p_reason, 'CONFIRM:' || v_action || ':' || p_target_id::text, jsonb_build_object('plan', p_plan, 'subscriptionSource', v_source, 'companyId', v_company_id, 'unlimitedAccess', v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION')))
    returning id into v_audit_id;
    return jsonb_build_object('action', v_action, 'targetId', p_target_id, 'auditId', v_audit_id, 'source', v_source);
  end if;

  if v_action in ('ACTIVATE_USER', 'DEACTIVATE_USER') then
    select role into v_role from public.profiles where id = p_target_id for update;
    if v_role is null then raise exception 'user profile not found' using errcode = 'P0002'; end if;
    if lower(v_role) in ('platform administrator', 'super administrator') then
      raise exception 'platform administrator access cannot be changed from this control plane' using errcode = '42501';
    end if;
  end if;

  select public.platform_admin_control_action_legacy(p_action, p_target_id, p_reason, p_company_id, p_plan, p_name, p_cycle, p_amount, p_status, p_extension_days) into v_result;
  return v_result || jsonb_build_object('source', v_source);
end;
$$;

revoke all on function public.platform_admin_control_action(text, uuid, text, uuid, text, text, text, numeric, text, integer, text) from public, anon, authenticated;
grant execute on function public.platform_admin_control_action(text, uuid, text, uuid, text, text, text, numeric, text, integer, text) to authenticated;

-- Provider-confirmed paid subscriptions and platform-admin resumed/extended
-- subscriptions share the same server-authoritative unlimited access marker.
create or replace function public.mark_active_subscription_unlimited()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('Active', 'Grace') then
    new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
      'unlimitedAccess', true,
      'accessMode', 'unlimited'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tenant_subscription_unlimited_access on public.tenant_subscriptions;
create trigger tenant_subscription_unlimited_access
before insert or update of status, metadata on public.tenant_subscriptions
for each row execute function public.mark_active_subscription_unlimited();

update public.tenant_subscriptions
   set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('unlimitedAccess', true, 'accessMode', 'unlimited'), updated_at = now()
 where status in ('Active', 'Grace');

-- Rebuild the access RPC with the unlimited marker exposed to the client.
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
  v_unlimited_access boolean := false;
begin
  if auth.uid() is null then raise exception 'An authenticated workspace session is required for subscription access.' using errcode = '28000'; end if;
  select p.company_id, p.role into v_company_id, v_role from public.profiles p where p.id = auth.uid() and p.is_active = true limit 1;
  if v_company_id is null then raise exception 'An active company profile is required for subscription access.' using errcode = '42501'; end if;
  v_can_manage := public.billing_is_manager();
  select s.* into v_subscription from public.tenant_subscriptions s where s.company_id = v_company_id order by s.created_at desc limit 1;
  if found then
    select p.* into v_plan from public.billing_plans p where p.id = v_subscription.plan_id limit 1;
    v_unlimited_access := lower(coalesce(v_subscription.metadata->>'unlimitedAccess', 'false')) = 'true';
    if v_subscription.status = 'Trial' then
      v_access_until := coalesce(v_subscription.trial_ends_at, v_subscription.expires_at);
      if v_access_until is null or v_access_until > now() then v_state := 'Trial'; v_allowed := true; v_reason := 'The company is within its confirmed trial period.'; else v_state := 'Expired'; v_reason := 'The company trial has expired. Workspace data is retained; a confirmed plan is required to resume operational access.'; end if;
    elsif v_subscription.status = 'Active' then
      v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at);
      if v_subscription.expires_at is null or v_subscription.expires_at > now() then v_state := 'Active'; v_allowed := true; v_reason := 'The company subscription is active.'; elsif v_subscription.grace_expires_at is not null and v_subscription.grace_expires_at > now() then v_state := 'Grace'; v_allowed := true; v_reason := 'The paid subscription is within its server-defined grace period.'; else v_state := 'Expired'; v_reason := 'The paid subscription has expired. Workspace data is retained; a confirmed plan is required to resume operational access.'; end if;
    elsif v_subscription.status = 'Grace' then
      v_access_until := v_subscription.grace_expires_at;
      if v_access_until is not null and v_access_until > now() then v_state := 'Grace'; v_allowed := true; v_reason := 'The company is within its server-defined grace period.'; else v_state := 'Expired'; v_reason := 'The subscription grace period has ended. Workspace data is retained; a confirmed plan is required to resume operational access.'; end if;
    elsif v_subscription.status = 'Pending' then v_state := 'Pending'; v_access_until := v_subscription.expires_at; v_reason := 'A payment request is pending provider confirmation. Browser state cannot grant access.';
    else v_state := 'Expired'; v_access_until := coalesce(v_subscription.grace_expires_at, v_subscription.expires_at, v_subscription.trial_ends_at); v_reason := 'The company subscription is not currently active. Workspace data is retained; a confirmed plan is required to resume operational access.';
    end if;
  end if;
  select coalesce(jsonb_agg(m.module_key order by m.module_key), '[]'::jsonb) into v_effective_modules from (select lower(trim(module_key)) as module_key, bool_or(enabled) as enabled from (select jsonb_array_elements_text(coalesce(v_plan.module_entitlements, '[]'::jsonb)) as module_key, true as enabled union all select coalesce(cm.data->>'module_key', cm.name) as module_key, lower(coalesce(cm.status, '')) = 'active' and coalesce(cm.data->>'enabled', 'true') <> 'false' as enabled from public.company_modules cm where cm.company_id = v_company_id) sources where nullif(trim(module_key), '') is not null group by lower(trim(module_key))) m where m.enabled;
  return jsonb_build_object('companyId', v_company_id, 'viewer', jsonb_build_object('profileId', auth.uid(), 'role', v_role, 'canManageBilling', v_can_manage), 'status', v_state, 'state', lower(v_state), 'allowed', v_allowed, 'reason', v_reason, 'accessUntil', v_access_until, 'unlimitedAccess', v_unlimited_access, 'subscription', case when v_subscription.id is null then null else jsonb_build_object('id', v_subscription.id, 'plan_id', v_subscription.plan_id, 'status', v_subscription.status, 'billing_cycle', v_subscription.billing_cycle, 'amount', v_subscription.amount, 'currency', v_subscription.currency, 'started_at', v_subscription.started_at, 'expires_at', v_subscription.expires_at, 'grace_expires_at', v_subscription.grace_expires_at, 'trial_started_at', v_subscription.trial_started_at, 'trial_ends_at', v_subscription.trial_ends_at, 'source_payment_id', v_subscription.source_payment_id, 'metadata', v_subscription.metadata) end, 'plan', case when v_plan.id is null then null else jsonb_build_object('id', v_plan.id, 'code', v_plan.code, 'name', v_plan.name, 'features', v_plan.features, 'moduleEntitlements', v_effective_modules) end, 'moduleEntitlements', v_effective_modules);
end;
$$;

revoke all on function public.billing_access_snapshot() from public, anon;
grant execute on function public.billing_access_snapshot() to authenticated;
notify pgrst, 'reload schema';
commit;
