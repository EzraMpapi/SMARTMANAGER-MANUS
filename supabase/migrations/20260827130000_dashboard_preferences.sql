-- Dashboard preferences persistence
-- Idempotent and non-destructive. The authenticated API derives company_id and
-- user_id from the verified session; clients never supply those scope values.

create table if not exists public.user_table_preferences (
  company_id uuid not null default public.current_company_id()
    references public.companies(id) on delete cascade,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  preference_key text not null
    check (preference_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  schema_version smallint not null default 1,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (preference_key, company_id, user_id)
);

alter table public.user_table_preferences
  add column if not exists schema_version smallint not null default 1;

-- These columns are retained for installations that started from the generic
-- preference table before creation timestamps were introduced.
alter table public.user_table_preferences
  add column if not exists created_at timestamptz not null default now();

alter table public.user_table_preferences
  add column if not exists updated_at timestamptz not null default now();

-- Constraint names are checked first so re-running this migration is safe.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_table_preferences'::regclass
      and conname = 'user_table_preferences_value_object_check'
  ) then
    alter table public.user_table_preferences
      add constraint user_table_preferences_value_object_check
      check (jsonb_typeof(value) = 'object') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_table_preferences'::regclass
      and conname = 'user_table_preferences_schema_version_check'
  ) then
    alter table public.user_table_preferences
      add constraint user_table_preferences_schema_version_check
      check (schema_version >= 1) not valid;
  end if;
end $$;

create unique index if not exists user_table_preferences_scope_key_idx
  on public.user_table_preferences (company_id, user_id, preference_key);

create index if not exists user_table_preferences_user_company_idx
  on public.user_table_preferences (user_id, company_id);

create index if not exists user_table_preferences_dashboard_idx
  on public.user_table_preferences (company_id, user_id)
  where preference_key = 'dashboard';

alter table public.user_table_preferences enable row level security;

-- Existing project RLS policies remain authoritative for identity and tenant
-- membership. Do not create a permissive policy here. If the deployment does
-- not already have the project’s verified own-user/company policy, add it only
-- through the project’s approved identity helper and review it independently.
