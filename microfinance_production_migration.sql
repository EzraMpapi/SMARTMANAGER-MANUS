-- Tenant-scoped generic-envelope tables for the Microfinance operational domain.
-- Monetary values use numeric columns in Tanzanian shillings; business attributes
-- and relationship identifiers are held in the audited JSONB envelope.

create table if not exists public.mfi_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Active',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_loan_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Active',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_loan_applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Draft',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_repayment_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Due',
  amount numeric not null default 0,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_repayments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Posted',
  amount numeric not null check (amount > 0),
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_guarantors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Pending verification',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_collateral (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Pledged',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_collections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Open',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Open',
  amount numeric not null default 0,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_cash_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Posted',
  amount numeric not null check (amount > 0),
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_staff_commissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Accrued',
  amount numeric not null default 0,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Unread',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mfi_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'Recorded',
  amount numeric null,
  notes text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mfi_clients_company_status_idx on public.mfi_clients (company_id, status, created_at desc);
create index if not exists mfi_loans_company_status_idx on public.mfi_loans (company_id, status, created_at desc);
create index if not exists mfi_loans_company_borrower_idx on public.mfi_loans (company_id, (data ->> 'borrowerId'));
create index if not exists mfi_savings_company_borrower_idx on public.mfi_savings (company_id, (data ->> 'borrowerId'), created_at desc);
create index if not exists mfi_groups_company_status_idx on public.mfi_groups (company_id, status, created_at desc);
create unique index if not exists mfi_loan_products_company_code_idx on public.mfi_loan_products (company_id, (data ->> 'code')) where status <> 'Archived';
create index if not exists mfi_loan_applications_company_status_idx on public.mfi_loan_applications (company_id, status, created_at desc);
create index if not exists mfi_loan_applications_company_borrower_idx on public.mfi_loan_applications (company_id, (data ->> 'borrowerId'));
create index if not exists mfi_repayment_schedules_company_loan_due_idx on public.mfi_repayment_schedules (company_id, (data ->> 'loanId'), (data ->> 'dueDate'));
create index if not exists mfi_repayments_company_loan_created_idx on public.mfi_repayments (company_id, (data ->> 'loanId'), created_at desc);
create index if not exists mfi_collections_company_status_idx on public.mfi_collections (company_id, status, created_at desc);
create index if not exists mfi_cash_sessions_company_status_idx on public.mfi_cash_sessions (company_id, status, created_at desc);
create index if not exists mfi_cash_transactions_company_session_idx on public.mfi_cash_transactions (company_id, (data ->> 'cashSessionId'), created_at desc);
create index if not exists mfi_notifications_company_status_idx on public.mfi_notifications (company_id, status, created_at desc);
create index if not exists mfi_audit_logs_company_created_idx on public.mfi_audit_logs (company_id, created_at desc);

alter table public.mfi_clients enable row level security;
alter table public.mfi_loans enable row level security;
alter table public.mfi_savings enable row level security;
alter table public.mfi_groups enable row level security;
alter table public.mfi_loan_products enable row level security;
alter table public.mfi_loan_applications enable row level security;
alter table public.mfi_repayment_schedules enable row level security;
alter table public.mfi_repayments enable row level security;
alter table public.mfi_guarantors enable row level security;
alter table public.mfi_collateral enable row level security;
alter table public.mfi_collections enable row level security;
alter table public.mfi_cash_sessions enable row level security;
alter table public.mfi_cash_transactions enable row level security;
alter table public.mfi_staff_commissions enable row level security;
alter table public.mfi_notifications enable row level security;
alter table public.mfi_audit_logs enable row level security;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'mfi_clients', 'mfi_loans', 'mfi_savings', 'mfi_groups', 'mfi_loan_products',
    'mfi_loan_applications', 'mfi_repayment_schedules', 'mfi_repayments', 'mfi_guarantors',
    'mfi_collateral', 'mfi_collections', 'mfi_cash_sessions', 'mfi_cash_transactions',
    'mfi_staff_commissions', 'mfi_notifications', 'mfi_audit_logs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', target_table || '_company_scope', target_table);
    execute format('create policy %I on public.%I for all using (company_id = current_company_id()) with check (company_id = current_company_id())', target_table || '_company_scope', target_table);
  end loop;
end $$;
