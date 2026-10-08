-- Dashboard layout telemetry is aggregateable and intentionally excludes preference JSON,
-- business records, IP addresses, user-agent strings, and free-form user content.
create table if not exists public.dashboard_layout_telemetry (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  event_type text not null check (event_type in ('layout_applied', 'preset_applied', 'personal_reset', 'preset_created', 'preset_pushed')),
  source_type text not null check (source_type in ('personal', 'team_role', 'team_department', 'built_in')),
  source_id uuid null,
  layout_signature text null check (layout_signature is null or layout_signature ~ '^[a-z0-9_-]{8,64}$'),
  actor_role text null check (actor_role is null or char_length(actor_role) between 1 and 120),
  target_type text null check (target_type is null or target_type in ('role', 'department')),
  target_value text null check (target_value is null or char_length(target_value) between 1 and 120),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists dashboard_layout_telemetry_company_occurred_idx
  on public.dashboard_layout_telemetry (company_id, occurred_at desc);
create index if not exists dashboard_layout_telemetry_company_event_idx
  on public.dashboard_layout_telemetry (company_id, event_type, occurred_at desc);
create index if not exists dashboard_layout_telemetry_company_source_idx
  on public.dashboard_layout_telemetry (company_id, source_type, source_id, occurred_at desc);

alter table public.dashboard_layout_telemetry enable row level security;

comment on table public.dashboard_layout_telemetry is 'Aggregate-only dashboard layout adoption events. Service-role writes and admin-scoped reads are enforced by server procedures.';
comment on column public.dashboard_layout_telemetry.layout_signature is 'Opaque stable signature of presentation preferences; never contains preference JSON or identity data.';
