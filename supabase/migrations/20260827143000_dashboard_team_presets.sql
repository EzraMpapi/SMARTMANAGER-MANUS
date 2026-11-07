create table if not exists public.dashboard_team_presets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 80),
  target_type text not null check (target_type in ('role', 'department')),
  target_value text not null check (char_length(trim(target_value)) between 1 and 120),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  schema_version integer not null default 1 check (schema_version = 1),
  is_active boolean not null default false,
  pushed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dashboard_team_presets_company_target_idx
  on public.dashboard_team_presets(company_id, target_type, target_value);
create index if not exists dashboard_team_presets_active_idx
  on public.dashboard_team_presets(company_id, is_active, updated_at desc);
create unique index if not exists dashboard_team_presets_company_name_idx
  on public.dashboard_team_presets(company_id, lower(name));

alter table public.dashboard_team_presets enable row level security;

-- Service-role API procedures explicitly filter by the verified profile company_id.
-- No permissive client policy is added: regular users cannot read or write presets directly.
