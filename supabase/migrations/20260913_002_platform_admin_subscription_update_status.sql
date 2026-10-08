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
  p_extension_days integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_action text := upper(btrim(coalesce(p_action, ''))); v_reason text := btrim(coalesce(p_reason, '')); v_actor_role text; v_sub public.sales_subscriptions%rowtype; v_old_status text; v_new_status text; v_old_plan text; v_new_plan text; v_new_id uuid; v_audit_id uuid;
begin
  if auth.uid() is null or not public.billing_is_platform_admin() then raise exception 'platform administrator access required' using errcode = '42501'; end if;
  if v_reason = '' or char_length(v_reason) > 1000 then raise exception 'a concise reason is required' using errcode = '22023'; end if;
  if v_action not in ('CREATE_SUBSCRIPTION','UPDATE_SUBSCRIPTION','CANCEL_SUBSCRIPTION','RESUME_SUBSCRIPTION','EXTEND_SUBSCRIPTION','CHANGE_PLAN','APPROVE_SUPPORT_TICKET','REJECT_SUPPORT_TICKET','REVOKE_INVITATION','ACTIVATE_USER','DEACTIVATE_USER') then raise exception 'unsupported platform control action' using errcode = '22023'; end if;
  select role into v_actor_role from public.profiles where id = auth.uid();
  if v_action = 'CREATE_SUBSCRIPTION' then
    if p_company_id is null or nullif(btrim(coalesce(p_plan,'')), '') is null then raise exception 'company and plan are required' using errcode = '22023'; end if;
    insert into public.sales_subscriptions(company_id, name, plan, cycle, status, amount, start_date, next_billing_date, notes) values (p_company_id, coalesce(nullif(btrim(p_name),''), p_plan), btrim(p_plan), coalesce(nullif(btrim(p_cycle),''), 'Monthly'), coalesce(nullif(btrim(p_status),''), 'Active'), p_amount, now(), case when p_extension_days is not null then now() + make_interval(days => p_extension_days) else null end, v_reason) returning id into v_new_id;
    insert into public.subscription_events(company_id, subscription_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details) values (p_company_id, v_new_id, 'PLATFORM_ADMIN_SUBSCRIPTION_CREATED', null, coalesce(nullif(btrim(p_status),''), 'Active'), auth.uid(), 'platform_admin', jsonb_build_object('reason',v_reason,'plan',p_plan,'cycle',p_cycle,'amount',p_amount));
    insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details) values (auth.uid(), coalesce(v_actor_role,'platform administrator'), v_action, 'subscription', v_new_id::text, v_reason, 'CONFIRM:'||v_action||':'||v_new_id, jsonb_build_object('companyId',p_company_id,'plan',p_plan,'cycle',p_cycle,'amount',p_amount));
    return jsonb_build_object('action',v_action,'subscriptionId',v_new_id);
  end if;
  if v_action in ('ACTIVATE_USER','DEACTIVATE_USER') then
    if p_target_id is null then raise exception 'target is required' using errcode = '22023'; end if; update public.profiles set is_active = (v_action = 'ACTIVATE_USER'), updated_at = now() where id = p_target_id; if not found then raise exception 'user profile not found' using errcode = 'P0002'; end if;
  elsif v_action in ('APPROVE_SUPPORT_TICKET','REJECT_SUPPORT_TICKET') then
    if p_target_id is null then raise exception 'target is required' using errcode = '22023'; end if; update public.support_tickets set status = case when v_action = 'APPROVE_SUPPORT_TICKET' then 'in_progress' else 'rejected' end, updated_at = now() where id = p_target_id; if not found then raise exception 'support ticket not found' using errcode = 'P0002'; end if;
  elsif v_action = 'REVOKE_INVITATION' then
    if p_target_id is null then raise exception 'target is required' using errcode = '22023'; end if; update public.team_invitations set status = 'revoked', revoked_at = now(), updated_at = now() where id = p_target_id; if not found then raise exception 'invitation not found' using errcode = 'P0002'; end if;
  else
    if p_target_id is null then raise exception 'subscription target is required' using errcode = '22023'; end if;
    select * into v_sub from public.sales_subscriptions where id = p_target_id for update; if not found then raise exception 'subscription not found' using errcode = 'P0002'; end if;
    v_old_status := v_sub.status; v_old_plan := v_sub.plan; v_new_status := coalesce(nullif(btrim(p_status),''), v_old_status); v_new_plan := coalesce(nullif(btrim(p_plan),''), v_old_plan);
    if v_action = 'CANCEL_SUBSCRIPTION' then v_new_status := 'cancelled'; elsif v_action = 'RESUME_SUBSCRIPTION' then v_new_status := 'Active'; elsif v_action = 'CHANGE_PLAN' and nullif(btrim(coalesce(p_plan,'')),'') is null then raise exception 'plan is required' using errcode = '22023'; elsif v_action = 'EXTEND_SUBSCRIPTION' and p_extension_days not in (7,15,30,60,90) then raise exception 'extension must be 7, 15, 30, 60, or 90 days' using errcode = '22023'; end if;
    update public.sales_subscriptions set status=v_new_status, plan=v_new_plan, name=coalesce(nullif(btrim(p_name),''),name), cycle=coalesce(nullif(btrim(p_cycle),''),cycle), amount=coalesce(p_amount,amount), next_billing_date=case when v_action='EXTEND_SUBSCRIPTION' then greatest(coalesce(next_billing_date,now()),now()) + make_interval(days=>p_extension_days) else next_billing_date end, updated_at=now() where id=p_target_id;
    insert into public.subscription_events(company_id, subscription_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details) values (v_sub.company_id,v_sub.id,v_action,v_old_status,v_new_status,auth.uid(),'platform_admin',jsonb_build_object('reason',v_reason,'previousPlan',v_old_plan,'newPlan',v_new_plan,'extensionDays',p_extension_days));
  end if;
  insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details) values (auth.uid(), coalesce(v_actor_role,'platform administrator'), v_action, case when v_action like '%SUBSCRIPTION' or v_action='CHANGE_PLAN' then 'subscription' when v_action like '%TICKET' then 'support_ticket' when v_action='REVOKE_INVITATION' then 'invitation' else 'profile' end, coalesce(p_target_id::text,v_new_id::text), v_reason, 'CONFIRM:'||v_action||':'||coalesce(p_target_id::text,v_new_id::text), jsonb_build_object('status',p_status,'plan',p_plan,'companyId',p_company_id)) returning id into v_audit_id;
  return jsonb_build_object('action',v_action,'targetId',coalesce(p_target_id,v_new_id),'auditId',v_audit_id);
end; $$;
revoke all on function public.platform_admin_control_action(text, uuid, text, uuid, text, text, text, numeric, text, integer) from public, anon, authenticated;
grant execute on function public.platform_admin_control_action(text, uuid, text, uuid, text, text, text, numeric, text, integer) to authenticated;
