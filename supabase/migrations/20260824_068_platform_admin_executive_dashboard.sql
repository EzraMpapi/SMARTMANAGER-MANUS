-- Platform Administrator executive dashboard: additive settings and aggregated control-plane read model.
-- This migration does not create tenant subscriptions, financial transactions, customer reviews, or customer-facing records.

create table if not exists public.platform_admin_dashboard_settings (
  settings_key text primary key default 'global' check (settings_key = 'global'),
  refresh_seconds integer not null default 60 check (refresh_seconds between 30 and 300),
  display_timezone text not null default 'Africa/Dar_es_Salaam',
  attention_thresholds jsonb not null default '{"criticalSupport":1,"failedPayments":1,"renewalWindowDays":7}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_admin_dashboard_settings enable row level security;
revoke all on table public.platform_admin_dashboard_settings from anon, authenticated;
grant select, insert, update, delete on table public.platform_admin_dashboard_settings to service_role;
create policy platform_admin_dashboard_settings_direct_rpc_only
  on public.platform_admin_dashboard_settings
  as restrictive
  for all
  to public
  using (false)
  with check (false);

insert into public.platform_admin_dashboard_settings (
  settings_key,
  refresh_seconds,
  display_timezone,
  attention_thresholds
)
values (
  'global',
  60,
  'Africa/Dar_es_Salaam',
  '{"criticalSupport":1,"failedPayments":1,"renewalWindowDays":7}'::jsonb
)
on conflict (settings_key) do nothing;

create or replace function public.platform_admin_executive_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_settings jsonb;
begin
  if auth.uid() is null or not public.billing_is_platform_admin() then
    raise exception 'platform administrator access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'refreshSeconds', refresh_seconds,
    'displayTimezone', display_timezone,
    'attentionThresholds', attention_thresholds,
    'updatedAt', updated_at
  )
  into v_settings
  from public.platform_admin_dashboard_settings
  where settings_key = 'global';

  return jsonb_build_object(
    'generatedAt', clock_timestamp(),
    'settings', coalesce(v_settings, '{"refreshSeconds":60,"displayTimezone":"Africa/Dar_es_Salaam","attentionThresholds":{}}'::jsonb),
    'kpis', jsonb_build_object(
      'companies', (select count(*)::integer from public.companies),
      'activeProfiles', (select count(*)::integer from public.profiles where is_active = true),
      'activeSubscriptions', (select count(*)::integer from public.sales_subscriptions where lower(coalesce(status, '')) = 'active'),
      'activeModules', (select count(*)::integer from public.company_modules where lower(coalesce(status, '')) = 'active'),
      'openSupport', (select count(*)::integer from public.support_tickets where lower(coalesce(status, '')) not in ('closed', 'resolved')),
      'enabledWhatsApp', (select count(*)::integer from public.whatsapp_accounts where enabled = true)
    ),
    'attention', jsonb_build_object(
      'failedPayments', (select count(*)::integer from public.subscription_payments where lower(coalesce(status, '')) in ('failed', 'failure', 'cancelled')),
      'criticalSupport', (select count(*)::integer from public.support_tickets where lower(coalesce(status, '')) not in ('closed', 'resolved') and lower(coalesce(priority, '')) in ('critical', 'urgent')),
      'renewalsWithin7Days', (select count(*)::integer from public.sales_subscriptions where next_billing_date >= now() and next_billing_date < now() + interval '7 days' and lower(coalesce(status, '')) not in ('cancelled', 'expired'))
    ),
    'trend', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', to_char(day_bucket, 'YYYY-MM-DD'),
        'subscriptionEvents', (select count(*)::integer from public.subscription_events e where e.created_at::date = day_bucket),
        'adminActions', (select count(*)::integer from public.platform_admin_actions a where a.created_at::date = day_bucket),
        'supportOpened', (select count(*)::integer from public.support_tickets t where t.created_at::date = day_bucket)
      ) order by day_bucket)
      from generate_series(current_date - 6, current_date, interval '1 day') as day_bucket
    ), '[]'::jsonb),
    'activity', jsonb_build_object(
      'recentActions', coalesce((
        select jsonb_agg(to_jsonb(x) order by x.created_at desc)
        from (
          select action, target_type, target_id, actor_role, created_at
          from public.platform_admin_actions
          order by created_at desc
          limit 8
        ) x
      ), '[]'::jsonb),
      'recentSubscriptionEvents', coalesce((
        select jsonb_agg(to_jsonb(x) order by x.created_at desc)
        from (
          select event_type, previous_status, new_status, actor_type, created_at
          from public.subscription_events
          order by created_at desc
          limit 8
        ) x
      ), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.platform_admin_executive_snapshot() from public, anon, authenticated;
grant execute on function public.platform_admin_executive_snapshot() to authenticated;
