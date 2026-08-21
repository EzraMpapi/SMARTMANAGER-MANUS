-- Configurable credit scoring and daily portfolio-risk escalation settings.
-- Each business row uses the same tenant envelope used by the existing MFI module.

create table if not exists public.mfi_credit_scoring_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Credit scoring configuration',
  status text not null default 'Configured',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_credit_scorecards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Manual review',
  amount numeric not null default 0,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_par_escalation_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Daily PAR and collections escalation configuration',
  status text not null default 'Configured — inactive',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mfi_credit_scoring_settings_company_idx on public.mfi_credit_scoring_settings (company_id);
create index if not exists mfi_credit_scorecards_company_application_idx on public.mfi_credit_scorecards (company_id, (data ->> 'applicationId'), created_at desc);
create index if not exists mfi_credit_scorecards_company_borrower_idx on public.mfi_credit_scorecards (company_id, (data ->> 'borrowerId'), created_at desc);
create unique index if not exists mfi_par_escalation_settings_company_idx on public.mfi_par_escalation_settings (company_id);
create index if not exists mfi_par_escalation_task_idx on public.mfi_par_escalation_settings ((data ->> 'scheduleCronTaskUid')) where data ? 'scheduleCronTaskUid';

alter table public.mfi_credit_scoring_settings enable row level security;
alter table public.mfi_credit_scorecards enable row level security;
alter table public.mfi_par_escalation_settings enable row level security;

drop policy if exists mfi_credit_scoring_settings_company_scope on public.mfi_credit_scoring_settings;
create policy mfi_credit_scoring_settings_company_scope on public.mfi_credit_scoring_settings for all using (company_id = current_company_id()) with check (company_id = current_company_id());
drop policy if exists mfi_credit_scorecards_company_scope on public.mfi_credit_scorecards;
create policy mfi_credit_scorecards_company_scope on public.mfi_credit_scorecards for all using (company_id = current_company_id()) with check (company_id = current_company_id());
drop policy if exists mfi_par_escalation_settings_company_scope on public.mfi_par_escalation_settings;
create policy mfi_par_escalation_settings_company_scope on public.mfi_par_escalation_settings for all using (company_id = current_company_id()) with check (company_id = current_company_id());
