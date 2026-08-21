create table if not exists public.hc_portal_reference_summary_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Configured — inactive',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id)
);

alter table public.hc_portal_reference_summary_settings enable row level security;

drop policy if exists hc_portal_reference_summary_settings_company_scope on public.hc_portal_reference_summary_settings;
create policy hc_portal_reference_summary_settings_company_scope on public.hc_portal_reference_summary_settings
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());
