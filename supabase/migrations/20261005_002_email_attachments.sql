-- Attachment metadata only. Binary files belong in private object storage.
create table if not exists public.email_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  email_message_id uuid references public.email_message_logs(id) on delete set null,
  communication_id uuid references public.customer_communications(id) on delete set null,
  storage_provider text not null default 'supabase_private',
  storage_bucket text not null default 'private-email-attachments',
  storage_key text,
  upload_session_id text,
  original_name text not null,
  mime_type text not null default 'application/octet-stream',
  byte_size bigint not null check (byte_size >= 0),
  checksum_sha256 text,
  chunk_size_bytes integer not null default 5242880 check (chunk_size_bytes > 0),
  total_chunks integer not null default 1 check (total_chunks > 0),
  uploaded_chunks jsonb not null default '[]'::jsonb,
  uploaded_bytes bigint not null default 0 check (uploaded_bytes >= 0),
  status text not null default 'pending' check (status in ('pending', 'uploading', 'ready', 'attached', 'failed', 'cancelled', 'expired')),
  error_code text,
  error_message text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_attachments_company_created_idx
  on public.email_attachments (company_id, created_at desc);
create index if not exists email_attachments_message_idx
  on public.email_attachments (email_message_id, created_at);
create index if not exists email_attachments_upload_session_idx
  on public.email_attachments (company_id, upload_session_id)
  where upload_session_id is not null;
create unique index if not exists email_attachments_storage_key_uidx
  on public.email_attachments (company_id, storage_bucket, storage_key)
  where storage_key is not null;

alter table public.email_attachments enable row level security;
create policy "email_attachments_tenant"
  on public.email_attachments
  as permissive
  for all
  to public
  using (company_id = (select public.current_company_id()))
  with check (company_id = (select public.current_company_id()));
