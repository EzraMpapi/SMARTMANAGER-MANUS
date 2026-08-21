create table if not exists public.hc_reminder_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Inactive',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id)
);

create table if not exists public.hc_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Queued',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists hc_reminder_deliveries_company_idempotency_unique
  on public.hc_reminder_deliveries (company_id, (data ->> 'idempotencyKey'))
  where data ? 'idempotencyKey';

create index if not exists hc_reminder_deliveries_company_status_created_idx
  on public.hc_reminder_deliveries (company_id, status, created_at desc);

alter table public.hc_reminder_settings enable row level security;
alter table public.hc_reminder_deliveries enable row level security;

drop policy if exists hc_reminder_settings_company_scope on public.hc_reminder_settings;
create policy hc_reminder_settings_company_scope on public.hc_reminder_settings
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists hc_reminder_deliveries_company_scope on public.hc_reminder_deliveries;
create policy hc_reminder_deliveries_company_scope on public.hc_reminder_deliveries
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());
