create table if not exists public.hc_portal_reference_imports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Staged',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_portal_reference_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Pending',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hc_portal_reference_imports_company_status_created_idx
  on public.hc_portal_reference_imports (company_id, status, created_at desc);
create index if not exists hc_portal_reference_imports_company_batch_idx
  on public.hc_portal_reference_imports (company_id, (data ->> 'batchId'));
create index if not exists hc_portal_reference_approvals_company_status_created_idx
  on public.hc_portal_reference_approvals (company_id, status, created_at desc);
create unique index if not exists hc_portal_reference_approvals_pending_patient_idx
  on public.hc_portal_reference_approvals (company_id, (data ->> 'patientId'))
  where status = 'Pending';

alter table public.hc_portal_reference_imports enable row level security;
alter table public.hc_portal_reference_approvals enable row level security;

drop policy if exists hc_portal_reference_imports_company_scope on public.hc_portal_reference_imports;
create policy hc_portal_reference_imports_company_scope on public.hc_portal_reference_imports
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists hc_portal_reference_approvals_company_scope on public.hc_portal_reference_approvals;
create policy hc_portal_reference_approvals_company_scope on public.hc_portal_reference_approvals
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());
