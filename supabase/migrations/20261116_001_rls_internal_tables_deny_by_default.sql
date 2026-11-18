-- Defense-in-depth RLS hardening for internal and privileged tables.
--
-- These relations are accessed by trusted backend jobs, migrations, or
-- privileged RPCs. They must not be directly readable or writable by the
-- public PostgREST roles. service_role continues to bypass RLS as intended.
--
-- This migration deliberately does not alter Supabase-managed auth.* tables,
-- tenant-facing tables, or tables that require an authenticated application
-- policy. Those policies must remain table-specific.

begin;

do $$
declare
  table_name text;
  protected_tables constant text[] := array[
    'bank_provider_webhook_account_controls',
    'bank_provider_webhook_drain_approvals',
    'bank_provider_webhook_drain_runs',
    'bank_provider_webhook_remediation',
    'platform_admin_actions',
    'schema_drift_monitors',
    'schema_drift_runs',
    'users'
  ];
  policy_name constant text := 'rls_internal_tables_deny_client_access_v1';
begin
  foreach table_name in array protected_tables loop
    if to_regclass(format('public.%I', table_name)) is null then
      raise exception 'Required RLS table public.% is missing', table_name;
    end if;

    execute format('alter table public.%I enable row level security', table_name);

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
        policy_name,
        table_name
      );
    end if;
  end loop;
end;
$$;

commit;

comment on table public.platform_admin_actions is
  'Internal administrative action ledger; direct anon/authenticated access is denied by RLS.';
comment on table public.schema_drift_monitors is
  'Internal schema monitoring configuration; direct anon/authenticated access is denied by RLS.';
comment on table public.schema_drift_runs is
  'Internal schema monitoring executions; direct anon/authenticated access is denied by RLS.';
