-- Keep the legacy 10-argument control RPC for create/support/invitation/sales actions.
-- The 11-argument wrapper adds tenant billing routing and protected user actions.
create or replace function public.platform_admin_control_action(p_action text,p_target_id uuid default null,p_reason text default null,p_company_id uuid default null,p_plan text default null,p_name text default null,p_cycle text default null,p_amount numeric default null,p_status text default null,p_extension_days integer default null,p_subscription_source text default 'sales')
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_action text:=upper(btrim(coalesce(p_action,''))); v_source text:=lower(coalesce(p_subscription_source,'sales')); v_role text; v_company_id uuid; v_old_status text; v_new_status text; v_old_plan text; v_new_plan text; v_plan_id uuid; v_audit_id uuid; v_result jsonb;
begin
 if auth.uid() is null or not public.billing_is_platform_admin() then raise exception 'platform administrator access required' using errcode='42501'; end if;
 if btrim(coalesce(p_reason,''))='' then raise exception 'a concise reason is required' using errcode='22023'; end if;
 if v_action in ('CHANGE_PLAN','CANCEL_SUBSCRIPTION','RESUME_SUBSCRIPTION','EXTEND_SUBSCRIPTION') and v_source='tenant' then
   select ts.company_id,ts.status,coalesce(bp.name,bp.code) into v_company_id,v_old_status,v_old_plan from public.tenant_subscriptions ts left join public.billing_plans bp on bp.id=ts.plan_id where ts.id=p_target_id for update;
   if v_company_id is null then raise exception 'tenant subscription not found' using errcode='P0002'; end if;
   v_new_status:=v_old_status; v_new_plan:=v_old_plan;
   if v_action='CHANGE_PLAN' then
     if nullif(btrim(coalesce(p_plan,'')),'') is null then raise exception 'plan is required' using errcode='22023'; end if;
     select id into v_plan_id from public.billing_plans where lower(name)=lower(btrim(p_plan)) or lower(code)=lower(btrim(p_plan)) limit 1;
     if v_plan_id is null then raise exception 'billing plan not found' using errcode='P0002'; end if;
     v_new_plan:=btrim(p_plan);
   elsif v_action='CANCEL_SUBSCRIPTION' then v_new_status:='Cancelled';
   elsif v_action='RESUME_SUBSCRIPTION' then v_new_status:='Active';
   elsif p_extension_days not in(7,15,30,60,90) then raise exception 'extension must be 7,15,30,60,90' using errcode='22023'; else v_new_status:='Active'; end if;
   update public.tenant_subscriptions set plan_id=coalesce(v_plan_id,plan_id),status=v_new_status,cancelled_at=case when v_action='CANCEL_SUBSCRIPTION' then now() when v_action='RESUME_SUBSCRIPTION' then null else cancelled_at end,expires_at=case when v_action='EXTEND_SUBSCRIPTION' then greatest(coalesce(expires_at,now()),now())+make_interval(days=>p_extension_days) when v_action='RESUME_SUBSCRIPTION' and (expires_at is null or expires_at<now()) then now()+interval '30 days' else expires_at end,updated_at=now() where id=p_target_id;
   insert into public.subscription_events(company_id,subscription_id,event_type,previous_status,new_status,actor_profile_id,actor_type,details) values(v_company_id,null,v_action,v_old_status,v_new_status,auth.uid(),'platform_admin',jsonb_build_object('reason',p_reason,'tenantSubscriptionId',p_target_id,'previousPlan',v_old_plan,'newPlan',v_new_plan,'extensionDays',p_extension_days));
   insert into public.platform_admin_actions(actor_user_id,actor_role,action,target_type,target_id,reason,confirmation_text,details) values(auth.uid(),'platform administrator',v_action,'subscription',p_target_id::text,p_reason,'CONFIRM:'||v_action||':'||p_target_id::text,jsonb_build_object('plan',p_plan,'subscriptionSource',v_source,'companyId',v_company_id)) returning id into v_audit_id;
   return jsonb_build_object('action',v_action,'targetId',p_target_id,'auditId',v_audit_id,'source',v_source);
 end if;
 if v_action in ('ACTIVATE_USER','DEACTIVATE_USER') then
   select role into v_role from public.profiles where id=p_target_id for update;
   if v_role is null then raise exception 'user profile not found' using errcode='P0002'; end if;
   if lower(v_role) in ('platform administrator','super administrator') then raise exception 'platform administrator access cannot be changed from this control plane' using errcode='42501'; end if;
 end if;
 select public.platform_admin_control_action(p_action,p_target_id,p_reason,p_company_id,p_plan,p_name,p_cycle,p_amount,p_status,p_extension_days) into v_result;
 return v_result || jsonb_build_object('source',v_source);
end; $$;
revoke all on function public.platform_admin_control_action(text,uuid,text,uuid,text,text,text,numeric,text,integer,text) from public,anon,authenticated;
grant execute on function public.platform_admin_control_action(text,uuid,text,uuid,text,text,text,numeric,text,integer,text) to authenticated;
