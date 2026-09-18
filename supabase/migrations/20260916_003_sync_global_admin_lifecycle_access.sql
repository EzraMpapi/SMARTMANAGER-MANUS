begin;

-- Global Admin's company cards target sales_subscriptions, while workspace
-- access is decided from tenant_subscriptions. Keep both sources synchronized.
create or replace function public.platform_admin_apply_lifecycle_action(
  p_action text,
  p_target_id uuid,
  p_reason text,
  p_extension_days integer default null,
  p_plan text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_action text := upper(btrim(coalesce(p_action, '')));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_actor_role text;
  v_subscription public.sales_subscriptions%rowtype;
  v_user public.profiles%rowtype;
  v_tenant_id uuid;
  v_tenant_plan_id uuid;
  v_tenant_expiry timestamptz;
  v_tenant_status text;
  v_new_tenant_expiry timestamptz;
  v_plan_id uuid;
  v_old_status text;
  v_new_status text;
  v_old_expiry timestamptz;
  v_new_expiry timestamptz;
  v_old_plan text;
  v_new_plan text;
  v_audit_id uuid;
begin
  if auth.uid() is null or not public.billing_is_platform_admin() then
    raise exception 'platform administrator access required' using errcode = '42501';
  end if;
  if p_target_id is null or v_reason = '' or char_length(v_reason) > 1000 then
    raise exception 'target and concise reason are required' using errcode = '22023';
  end if;
  if v_action not in ('EXTEND_SUBSCRIPTION', 'CANCEL_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN', 'ACTIVATE_USER', 'DEACTIVATE_USER') then
    raise exception 'unsupported platform lifecycle action' using errcode = '22023';
  end if;
  if v_action = 'EXTEND_SUBSCRIPTION' and (p_extension_days is null or p_extension_days not in (7, 15, 30, 60, 90)) then
    raise exception 'extension must be 7, 15, 30, 60, or 90 days' using errcode = '22023';
  end if;
  if v_action = 'CHANGE_PLAN' and nullif(btrim(coalesce(p_plan, '')), '') is null then
    raise exception 'a plan is required for plan changes' using errcode = '22023';
  end if;

  select role into v_actor_role from public.profiles where id = auth.uid();

  if v_action in ('ACTIVATE_USER', 'DEACTIVATE_USER') then
    select * into v_user from public.profiles where id = p_target_id for update;
    if not found then raise exception 'user profile not found' using errcode = 'P0002'; end if;
    if lower(coalesce(v_user.role, '')) in ('platform administrator', 'super administrator') and v_action = 'DEACTIVATE_USER' then
      raise exception 'platform administrator accounts require a separate protected workflow' using errcode = '42501';
    end if;
    update public.profiles set is_active = (v_action = 'ACTIVATE_USER'), updated_at = now() where id = p_target_id;
    insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details)
    values (auth.uid(), coalesce(v_actor_role, 'platform administrator'), v_action, 'profile', p_target_id::text, v_reason, 'CONFIRM:' || v_action || ':' || p_target_id::text, jsonb_build_object('previousActive', v_user.is_active, 'newActive', v_action = 'ACTIVATE_USER')) returning id into v_audit_id;
    return jsonb_build_object('action', v_action, 'targetId', p_target_id, 'previousActive', v_user.is_active, 'newActive', v_action = 'ACTIVATE_USER', 'auditId', v_audit_id);
  end if;

  select * into v_subscription from public.sales_subscriptions where id = p_target_id for update;
  if not found then raise exception 'subscription not found' using errcode = 'P0002'; end if;
  v_old_status := v_subscription.status;
  v_old_expiry := v_subscription.next_billing_date;
  v_old_plan := v_subscription.plan;
  v_new_status := v_old_status;
  v_new_expiry := v_old_expiry;
  v_new_plan := v_old_plan;

  if v_action = 'EXTEND_SUBSCRIPTION' then
    v_new_expiry := greatest(coalesce(v_old_expiry, now()), now()) + make_interval(days => p_extension_days);
    v_new_status := 'active';
  elsif v_action = 'CANCEL_SUBSCRIPTION' then
    v_new_status := 'cancelled';
  elsif v_action = 'RESUME_SUBSCRIPTION' then
    v_new_status := 'active';
    v_new_expiry := case when v_old_expiry is null or v_old_expiry < now() then now() + interval '30 days' else v_old_expiry end;
  elsif v_action = 'CHANGE_PLAN' then
    v_new_plan := btrim(p_plan);
    v_new_status := 'active';
    v_new_expiry := case when v_old_expiry is null or v_old_expiry < now() then now() + interval '30 days' else v_old_expiry end;
  end if;

  update public.sales_subscriptions
     set status = v_new_status, next_billing_date = v_new_expiry, plan = v_new_plan, updated_at = now()
   where id = p_target_id;

  -- Resolve the plan before synchronizing the tenant access source.
  select id into v_plan_id
    from public.billing_plans
   where lower(name) = lower(btrim(coalesce(v_new_plan, '')))
      or lower(code) = lower(btrim(coalesce(v_new_plan, '')))
   order by company_id nulls first
   limit 1;

  select ts.id, ts.plan_id, ts.expires_at, ts.status
    into v_tenant_id, v_tenant_plan_id, v_tenant_expiry, v_tenant_status
    from public.tenant_subscriptions ts
   where ts.company_id = v_subscription.company_id
   order by ts.created_at desc
   limit 1
   for update;

  if v_tenant_id is not null then
    v_new_tenant_expiry := case
      when v_action = 'EXTEND_SUBSCRIPTION' then greatest(coalesce(v_tenant_expiry, now()), now()) + make_interval(days => p_extension_days)
      when v_action in ('RESUME_SUBSCRIPTION', 'CHANGE_PLAN') and (v_tenant_expiry is null or v_tenant_expiry < now()) then now() + interval '30 days'
      else v_tenant_expiry
    end;
    update public.tenant_subscriptions
       set plan_id = coalesce(case when v_action = 'CHANGE_PLAN' then v_plan_id end, v_tenant_plan_id),
           status = case when v_action = 'CANCEL_SUBSCRIPTION' then 'Cancelled' when v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN') then 'Active' else v_tenant_status end,
           expires_at = v_new_tenant_expiry,
           cancelled_at = case when v_action = 'CANCEL_SUBSCRIPTION' then now() when v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN') then null else cancelled_at end,
           metadata = case
             when v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN') then coalesce(metadata, '{}'::jsonb) || jsonb_build_object('unlimitedAccess', true, 'accessMode', 'unlimited', 'platformApprovedAt', now())
             else coalesce(metadata, '{}'::jsonb)
           end,
           updated_at = now()
     where id = v_tenant_id;
  end if;

  insert into public.subscription_events(company_id, subscription_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details)
  values (v_subscription.company_id, v_subscription.id, v_action, v_old_status, v_new_status, auth.uid(), 'platform_admin', jsonb_build_object('reason', v_reason, 'previousExpiry', v_old_expiry, 'newExpiry', v_new_expiry, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'extensionDays', p_extension_days, 'tenantSubscriptionId', v_tenant_id, 'unlimitedAccess', v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN')));

  insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details)
  values (auth.uid(), coalesce(v_actor_role, 'platform administrator'), v_action, 'subscription', p_target_id::text, v_reason, 'CONFIRM:' || v_action || ':' || p_target_id::text, jsonb_build_object('companyId', v_subscription.company_id, 'previousStatus', v_old_status, 'newStatus', v_new_status, 'previousExpiry', v_old_expiry, 'newExpiry', v_new_expiry, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'extensionDays', p_extension_days, 'tenantSubscriptionId', v_tenant_id, 'unlimitedAccess', v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN'))) returning id into v_audit_id;

  return jsonb_build_object('action', v_action, 'subscriptionId', p_target_id, 'companyId', v_subscription.company_id, 'previousStatus', v_old_status, 'newStatus', v_new_status, 'previousExpiry', v_old_expiry, 'newExpiry', v_new_expiry, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'tenantSubscriptionId', v_tenant_id, 'unlimitedAccess', v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN'), 'auditId', v_audit_id);
end;
$$;

revoke all on function public.platform_admin_apply_lifecycle_action(text, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.platform_admin_apply_lifecycle_action(text, uuid, text, integer, text) to authenticated;
notify pgrst, 'reload schema';
commit;
