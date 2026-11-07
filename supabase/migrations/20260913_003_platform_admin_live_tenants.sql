create or replace function public.platform_admin_control_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_subscriptions jsonb; v_support jsonb; v_invitations jsonb; v_tenants jsonb;
begin
  if auth.uid() is null or not public.billing_is_platform_admin() then raise exception 'platform administrator access required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_sign_in_at desc nulls last, x.company_name), '[]'::jsonb) into v_tenants
  from (
    select c.id, c.name as company_name, c.category, c.country, c.currency,
      count(distinct p.id)::int as user_count,
      count(distinct p.id) filter (where p.is_active)::int as active_user_count,
      max(u.last_sign_in_at) as last_sign_in_at,
      count(distinct s.id)::int as subscription_count,
      count(distinct s.id) filter (where lower(coalesce(s.status,'')) not in ('cancelled','canceled','expired') and (s.next_billing_date is null or s.next_billing_date >= now()))::int as current_subscription_count,
      max(s.next_billing_date) as latest_next_billing_date,
      bool_or(u.last_sign_in_at is not null) as has_logged_in_user
    from public.companies c
    join public.profiles p on p.company_id = c.id
    join auth.users u on u.id = p.id
    left join public.sales_subscriptions s on s.company_id = c.id
    group by c.id, c.name, c.category, c.country, c.currency
    having bool_or(u.last_sign_in_at is not null)
    order by max(u.last_sign_in_at) desc nulls last
    limit 100
  ) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_sign_in_at desc nulls last, x.updated_at desc), '[]'::jsonb) into v_subscriptions
  from (
    select s.id, s.company_id, c.name as company_name, s.name, s.plan, s.cycle, s.status, s.amount, s.start_date, s.next_billing_date, s.updated_at,
      max(u.last_sign_in_at) as last_sign_in_at,
      (lower(coalesce(s.status,'')) in ('cancelled','canceled','expired') or (s.next_billing_date is not null and s.next_billing_date < now())) as is_expired,
      case when lower(coalesce(s.status,'')) in ('cancelled','canceled','expired') then 'Cancelled' when s.next_billing_date is not null and s.next_billing_date < now() then 'Expired' when s.next_billing_date is null then 'No expiry date' else 'Active' end as access_status
    from public.sales_subscriptions s
    join public.companies c on c.id = s.company_id
    join public.profiles p on p.company_id = c.id
    join auth.users u on u.id = p.id
    where u.last_sign_in_at is not null
    group by s.id, c.name
    order by max(u.last_sign_in_at) desc nulls last, s.updated_at desc
    limit 200
  ) x;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.updated_at desc), '[]'::jsonb) into v_support from (select id, company_id, subject, category, priority, status, customer, created_at, updated_at from public.support_tickets order by updated_at desc limit 100) t;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc), '[]'::jsonb) into v_invitations from (select id, company_id, email, full_name, role, status, expires_at, created_at, updated_at from public.team_invitations order by created_at desc limit 100) i;
  return jsonb_build_object('tenants', v_tenants, 'subscriptions', v_subscriptions, 'support', v_support, 'invitations', v_invitations, 'generatedAt', now());
end; $$;
revoke all on function public.platform_admin_control_snapshot() from public, anon, authenticated;
grant execute on function public.platform_admin_control_snapshot() to authenticated;
