-- Durable outbound email audit trail.
-- OAuth access/refresh tokens are intentionally not stored here.

create table if not exists public.email_message_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  communication_id uuid references public.customer_communications(id) on delete set null,
  provider text not null default 'gmail',
  provider_message_id text,
  thread_id text,
  sender_email text not null,
  to_recipients jsonb not null default '[]'::jsonb,
  cc_recipients jsonb not null default '[]'::jsonb,
  bcc_recipients jsonb not null default '[]'::jsonb,
  subject text not null default '',
  body_text text,
  body_html text,
  body_preview text,
  attachment_metadata jsonb not null default '[]'::jsonb,
  status text not null default 'queued' check (status in ('draft', 'queued', 'sending', 'sent', 'delivered', 'failed', 'cancelled')),
  error_code text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  last_event_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_message_logs_company_created_idx
  on public.email_message_logs (company_id, created_at desc);

create index if not exists email_message_logs_company_status_idx
  on public.email_message_logs (company_id, status, created_at desc);

create index if not exists email_message_logs_communication_idx
  on public.email_message_logs (communication_id, created_at desc);

create unique index if not exists email_message_logs_provider_message_uidx
  on public.email_message_logs (company_id, provider, provider_message_id)
  where provider_message_id is not null;

create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  email_message_id uuid not null references public.email_message_logs(id) on delete cascade,
  provider text not null default 'gmail',
  provider_event_id text,
  provider_message_id text,
  event_type text not null check (event_type in ('queued', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'failed')),
  event_status text,
  error_code text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  received_at timestamptz not null default now()
);

create index if not exists email_delivery_events_message_idx
  on public.email_delivery_events (email_message_id, occurred_at desc);

create index if not exists email_delivery_events_company_idx
  on public.email_delivery_events (company_id, occurred_at desc);

create unique index if not exists email_delivery_events_provider_uidx
  on public.email_delivery_events (company_id, provider, provider_event_id)
  where provider_event_id is not null;

alter table public.email_message_logs enable row level security;
alter table public.email_delivery_events enable row level security;

create policy "email_message_logs_tenant"
  on public.email_message_logs
  as permissive
  for all
  to public
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));

create policy "email_delivery_events_tenant"
  on public.email_delivery_events
  as permissive
  for all
  to public
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));
