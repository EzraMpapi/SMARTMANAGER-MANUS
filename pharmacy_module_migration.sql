-- Pharmacy Module: tenant-safe catalog, purchasing, stock, dispensing, sales, compliance, and audit records.
-- Every table uses the established BusinessSphere generic tenant envelope.

create table if not exists public.phm_categories (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_brands (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_purchase_orders (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_purchase_order_items (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Ordered', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_stock_receipts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Received', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_batches (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_stock_movements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Posted', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_stock_transfers (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Requested', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_stock_adjustments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Posted', amount numeric not null default 0, notes text not null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_dispense_items (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Dispensed', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_controlled_medicine_register (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Issued', amount numeric not null default 0, notes text not null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_sales (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Open', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_sale_items (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Sold', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_payments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Recorded', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_returns (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Pending inspection', amount numeric not null default 0, notes text not null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_return_items (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Quarantined', amount numeric not null default 0, notes text not null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_insurance_claims (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_notifications (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Unread', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.phm_audit_logs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Recorded', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create unique index if not exists phm_categories_company_name_idx on public.phm_categories (company_id, lower(name));
create unique index if not exists phm_brands_company_name_idx on public.phm_brands (company_id, lower(name));
create unique index if not exists phm_drugs_company_barcode_idx on public.phm_drugs (company_id, (data ->> 'barcode')) where coalesce(data ->> 'barcode', '') <> '';
create index if not exists phm_drugs_company_category_idx on public.phm_drugs (company_id, (data ->> 'categoryId'));
create index if not exists phm_batches_company_drug_expiry_idx on public.phm_batches (company_id, (data ->> 'drugId'), (data ->> 'expiryDate'));
create unique index if not exists phm_batches_company_batch_idx on public.phm_batches (company_id, (data ->> 'drugId'), (data ->> 'batchNumber')) where coalesce(data ->> 'batchNumber', '') <> '';
create index if not exists phm_stock_movements_company_drug_idx on public.phm_stock_movements (company_id, (data ->> 'drugId'), created_at desc);
create index if not exists phm_dispense_items_company_dispense_idx on public.phm_dispense_items (company_id, (data ->> 'dispenseId'), created_at desc);
create index if not exists phm_sales_company_date_idx on public.phm_sales (company_id, (data ->> 'saleDate'), created_at desc);
create index if not exists phm_payments_company_reference_idx on public.phm_payments (company_id, (data ->> 'saleId'), created_at desc);
create index if not exists phm_notifications_company_status_idx on public.phm_notifications (company_id, status, created_at desc);
create index if not exists phm_audit_logs_company_created_idx on public.phm_audit_logs (company_id, created_at desc);

do $$
declare pharmacy_table text;
begin
  foreach pharmacy_table in array array[
    'phm_categories','phm_brands','phm_purchase_orders','phm_purchase_order_items','phm_stock_receipts','phm_batches',
    'phm_stock_movements','phm_stock_transfers','phm_stock_adjustments','phm_dispense_items','phm_controlled_medicine_register',
    'phm_sales','phm_sale_items','phm_payments','phm_returns','phm_return_items','phm_insurance_claims','phm_notifications','phm_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', pharmacy_table);
    execute format('drop policy if exists %I on public.%I', pharmacy_table || '_company_scope', pharmacy_table);
    execute format('create policy %I on public.%I for all using (company_id = current_company_id()) with check (company_id = current_company_id())', pharmacy_table || '_company_scope', pharmacy_table);
  end loop;
end $$;
