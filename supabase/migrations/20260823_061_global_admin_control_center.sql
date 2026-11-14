-- Global Admin Control Center: additive, platform-scoped visibility and action evidence.
-- This migration intentionally does not mutate existing tenant data or existing RBAC tables.

create table if not exists public.platform_admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  actor_role text not null,
  action text not null,
  target_type text not null,
  target_id text,
  reason text not null check (char_length(btrim(reason)) between 1 and 1000),
  confirmation_text text not null check (char_length(btrim(confirmation_text)) between 1 and 200),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_admin_actions_created_at_idx
  on public.platform_admin_actions (created_at desc);
create index if not exists platform_admin_actions_target_idx
  on public.platform_admin_actions (target_type, target_id, created_at desc);
create index if not exists platform_admin_actions_actor_idx
  on public.platform_admin_actions (actor_user_id, created_at desc);

alter table public.platform_admin_actions enable row level security;
revoke all on table public.platform_admin_actions from anon, authenticated;
grant select, insert, update, delete on table public.platform_admin_actions to service_role;

create or replace function public.platform_admin_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_viewer_role text;
begin
  if auth.uid() is null then
    raise exception 'authenticated platform administrator session required' using errcode = '42501';
  end if;
  if not public.billing_is_platform_admin() then
    raise exception 'platform administrator access required' using errcode = '42501';
  end if;

  select p.role into v_viewer_role
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  return jsonb_build_object(
    'generatedAt', clock_timestamp(),
    'viewer', jsonb_build_object('id', auth.uid(), 'role', v_viewer_role),
    'overview', jsonb_build_object(
      'companyCount', (select count(*)::integer from public.companies),
      'userCount', (select count(*)::integer from public.profiles),
      'activeUserCount', (select count(*)::integer from public.profiles where is_active = true),
      'activeModuleCount', (select count(*)::integer from public.company_modules where lower(coalesce(status, '')) = 'active'),
      'subscriptionCount', (select count(*)::integer from public.sales_subscriptions),
      'activeSubscriptionCount', (select count(*)::integer from public.sales_subscriptions where lower(coalesce(status, '')) = 'active'),
      'paidSubscriptionAmount', coalesce((select sum(amount)::numeric from public.subscription_payments where lower(coalesce(status, '')) in ('paid', 'completed', 'success', 'succeeded')), 0),
      'openSupportTicketCount', (select count(*)::integer from public.support_tickets where lower(coalesce(status, '')) not in ('closed', 'resolved')), 
      'whatsappAccountCount', (select count(*)::integer from public.whatsapp_accounts),
      'enabledWhatsappAccountCount', (select count(*)::integer from public.whatsapp_accounts where enabled = true),
      'failedPaymentCount', (select count(*)::integer from public.subscription_payments where lower(coalesce(status, '')) in ('failed', 'failure', 'cancelled'))
    ),
    'tenants', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select c.id, c.name, c.country, c.currency, c.category, c.business_scale, c.timezone, c.created_at,
          (select count(*)::integer from public.profiles p where p.company_id = c.id) as user_count,
          (select count(*)::integer from public.company_modules m where m.company_id = c.id and lower(coalesce(m.status, '')) = 'active') as active_module_count,
          (select count(*)::integer from public.company_modules m where m.company_id = c.id) as module_row_count,
          (select max(s.updated_at) from public.sales_subscriptions s where s.company_id = c.id) as subscription_updated_at
        from public.companies c
        order by c.created_at desc
        limit 100
      ) t
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(to_jsonb(u) order by u.created_at desc)
      from (
        select p.id, p.company_id, p.full_name, p.email, p.role, p.is_active, p.created_at, p.updated_at
        from public.profiles p
        order by p.created_at desc
        limit 200
      ) u
    ), '[]'::jsonb),
    'modules', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.module_name, m.company_count desc)
      from (
        select coalesce(nullif(btrim(m.name), ''), '(unnamed)') as module_name,
          count(*)::integer as company_count,
          count(*) filter (where lower(coalesce(m.status, '')) = 'active')::integer as active_company_count,
          count(*) filter (where lower(coalesce(m.status, '')) in ('disabled', 'inactive'))::integer as disabled_company_count
        from public.company_modules m
        group by coalesce(nullif(btrim(m.name), ''), '(unnamed)')
        order by module_name
        limit 100
      ) m
    ), '[]'::jsonb),
    'billing', jsonb_build_object(
      'events', coalesce((
        select jsonb_agg(to_jsonb(e) order by e.created_at desc)
        from (
          select id, company_id, subscription_id, payment_id, event_type, previous_status, new_status, actor_type, created_at
          from public.subscription_events
          order by created_at desc
          limit 100
        ) e
      ), '[]'::jsonb),
      'payments', coalesce((
        select jsonb_agg(to_jsonb(p) order by p.created_at desc)
        from (
          select id, company_id, subscription_id, provider, amount, fee, net_amount, currency, billing_cycle, status, verified_at, paid_at, failure_reason, created_at
          from public.subscription_payments p
          order by p.created_at desc
          limit 100
        ) p
      ), '[]'::jsonb),
      'invoices', coalesce((
        select jsonb_agg(to_jsonb(i) order by i.issued_at desc)
        from (
          select id, company_id, subscription_id, invoice_number, status, currency, subtotal, tax_amount, total_amount, paid_amount, issued_at, due_at, paid_at
          from public.subscription_invoices i
          order by i.issued_at desc
          limit 100
        ) i
      ), '[]'::jsonb)
    ),
    'support', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at desc)
      from (
        select id, company_id, category, priority, status, subject, source_channel, assigned_profile_id, team_id, created_at, due_at, resolved_at, closed_at
        from public.support_tickets s
        order by s.created_at desc
        limit 100
      ) s
    ), '[]'::jsonb),
    'whatsapp', jsonb_build_object(
      'accounts', coalesce((
        select jsonb_agg(to_jsonb(a) order by a.created_at desc)
        from (
          select id, company_id, provider, phone_number_id, display_phone_number, enabled, allowed_capabilities, created_at, updated_at
          from public.whatsapp_accounts a
          order by a.created_at desc
          limit 100
        ) a
      ), '[]'::jsonb),
      'conversationCount', (select count(*)::integer from public.whatsapp_conversations),
      'messageCount', (select count(*)::integer from public.whatsapp_messages),
      'messageEventCount', (select count(*)::integer from public.whatsapp_message_events),
      'lastMessageAt', (select max(coalesce(provider_timestamp, updated_at)) from public.whatsapp_messages)
    ),
    'rbac', jsonb_build_object(
      'roleCount', (select count(*)::integer from public.workforce_roles where lower(coalesce(status, '')) = 'active'),
      'permissionCount', (select count(*)::integer from public.workforce_permissions where lower(coalesce(status, '')) = 'active'),
      'memberRoleAssignmentCount', (select count(*)::integer from public.workforce_member_roles where lower(coalesce(status, '')) = 'active'),
      'roles', coalesce((
        select jsonb_agg(to_jsonb(r) order by r.hierarchy_level desc, r.name)
        from (
          select id, company_id, code, name, role_kind, hierarchy_level, is_assignable, status
          from public.workforce_roles
          order by hierarchy_level desc, name
          limit 100
        ) r
      ), '[]'::jsonb)
    ),
    'actions', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from (
        select id, actor_user_id, actor_role, action, target_type, target_id, reason, details, created_at
        from public.platform_admin_actions a
        order by a.created_at desc
        limit 100
      ) a
    ), '[]'::jsonb),
    'health', jsonb_build_object(
      'database', jsonb_build_object('status', 'healthy', 'checkedAt', clock_timestamp(), 'source', 'platform_admin_snapshot'),
      'runtime', jsonb_build_object('status', 'unavailable', 'reason', 'No persisted application runtime health source is configured'),
      'ai', jsonb_build_object('status', 'unavailable', 'reason', 'No persisted AI provider health source is configured'),
      'integrations', jsonb_build_object('status', 'unavailable', 'reason', 'No generic integration registry is configured; WhatsApp is reported separately'),
      'api', jsonb_build_object('status', 'unavailable', 'reason', 'No persisted API latency/error telemetry source is configured')
    )
  );
end;
$$;

create or replace function public.platform_admin_record_action(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_confirmation_text text,
  p_details jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
  v_role text;
  v_expected text;
  v_action text := upper(btrim(coalesce(p_action, '')));
  v_target_type text := btrim(coalesce(p_target_type, ''));
  v_target_id text := btrim(coalesce(p_target_id, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_confirmation text := btrim(coalesce(p_confirmation_text, ''));
begin
  if auth.uid() is null or not public.billing_is_platform_admin() then
    raise exception 'platform administrator access required' using errcode = '42501';
  end if;
  if v_action = '' or char_length(v_action) > 120 or v_target_type = '' or char_length(v_target_type) > 80 then
    raise exception 'action and target type are required' using errcode = '22023';
  end if;
  if v_reason = '' or char_length(v_reason) > 1000 then
    raise exception 'a concise reason is required' using errcode = '22023';
  end if;
  v_expected := 'CONFIRM:' || v_action || ':' || coalesce(nullif(v_target_id, ''), 'GLOBAL');
  if v_confirmation <> v_expected then
    raise exception 'confirmation text does not match the requested action and target' using errcode = '22023';
  end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' then
    raise exception 'action details must be a JSON object' using errcode = '22023';
  end if;

  select p.role into v_role from public.profiles p where p.id = auth.uid() limit 1;
  insert into public.platform_admin_actions(actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details)
  values (auth.uid(), coalesce(v_role, 'Platform Administrator'), v_action, v_target_type, nullif(v_target_id, ''), v_reason, v_confirmation, p_details)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'action', v_action, 'targetType', v_target_type, 'targetId', nullif(v_target_id, ''), 'recordedAt', clock_timestamp());
end;
$$;

revoke all on function public.platform_admin_snapshot() from public, anon, authenticated;
revoke all on function public.platform_admin_record_action(text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.platform_admin_snapshot() to authenticated;
grant execute on function public.platform_admin_record_action(text, text, text, text, text, jsonb) to authenticated;
