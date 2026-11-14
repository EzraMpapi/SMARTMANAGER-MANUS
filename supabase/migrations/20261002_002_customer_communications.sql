create table if not exists public.customer_communications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null default 'Customer communication',
  status text not null default 'saved',
  notes text,
  data jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_communications_company_created_idx
  on public.customer_communications (company_id, created_at desc);

alter table public.customer_communications enable row level security;

create policy "customer communications company members can read"
  on public.customer_communications for select
  using (public.is_company_member(company_id));

create policy "customer communications company members can insert"
  on public.customer_communications for insert
  with check (public.is_company_member(company_id));

create policy "customer communications company members can update"
  on public.customer_communications for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

create policy "customer communications company members can delete"
  on public.customer_communications for delete
  using (public.is_company_member(company_id));
