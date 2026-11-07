-- Additive platform-admin lifecycle controls.
-- Reuses the existing billing tables and platform_admin_actions audit ledger.
-- No physical deletion is exposed.

begin;

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
    values (auth.uid(), coalesce(v_actor_role, 'platform administrator'), v_action, 'profile', p_target_id::text, v_reason,
      'CONFIRM:' || v_action || ':' || p_target_id::text,
      jsonb_build_object('previousActive', v_user.is_active, 'newActive', v_action = 'ACTIVATE_USER')) returning id into v_audit_id;
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
    if lower(coalesce(v_old_status, '')) in ('expired', 'cancelled', 'canceled', 'suspended') then v_new_status := 'active'; end if;
  elsif v_action = 'CANCEL_SUBSCRIPTION' then
    v_new_status := 'cancelled';
  elsif v_action = 'RESUME_SUBSCRIPTION' then
    v_new_status := 'active';
  elsif v_action = 'CHANGE_PLAN' then
    v_new_plan := btrim(p_plan);
  end if;

  update public.sales_subscriptions
  set status = v_new_status, next_billing_date = v_new_expiry, plan = v_new_plan, updated_at = now()
  where id = p_target_id;

  insert into public.subscription_events(company_id, subscription_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details)
  values (v_subscription.company_id, v_subscription.id, v_action, v_old_status, v_new_status, auth.uid(), 'platform_admin',
    jsonb_build_object('reason', v_reason, 'previousExpiry', v_old_expiry, 'newExpiry', v_new_expiry, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'extensionDays', p_extension_days));

  insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details)
  values (auth.uid(), coalesce(v_actor_role, 'platform administrator'), v_action, 'subscription', p_target_id::text, v_reason,
    'CONFIRM:' || v_action || ':' || p_target_id::text,
    jsonb_build_object('companyId', v_subscription.company_id, 'previousStatus', v_old_status, 'newStatus', v_new_status, 'previousExpiry', v_old_expiry, 'newExpiry', v_new_expiry, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'extensionDays', p_extension_days)) returning id into v_audit_id;

  return jsonb_build_object('action', v_action, 'subscriptionId', p_target_id, 'companyId', v_subscription.company_id, 'previousStatus', v_old_status, 'newStatus', v_new_status, 'previousExpiry', v_old_expiry, 'newExpiry', v_new_expiry, 'previousPlan', v_old_plan, 'newPlan', v_new_plan, 'auditId', v_audit_id);
end;
$$;

revoke all on function public.platform_admin_apply_lifecycle_action(text, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.platform_admin_apply_lifecycle_action(text, uuid, text, integer, text) to authenticated;

commit;
