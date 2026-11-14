-- Cloud-synced personal theme presets.
-- Ownership is profile-scoped; sharing is an explicit user flag and does not
-- grant another profile access without a future sharing policy.
create table if not exists public.user_theme_presets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  mode text not null check (mode in ('light', 'dark', 'auto')),
  accent_color text not null check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, name)
);

create index if not exists user_theme_presets_profile_updated_idx
  on public.user_theme_presets (profile_id, updated_at desc);

alter table public.user_theme_presets enable row level security;

 drop policy if exists user_theme_presets_select_own on public.user_theme_presets;
create policy user_theme_presets_select_own
  on public.user_theme_presets for select
  using (profile_id = auth.uid());

 drop policy if exists user_theme_presets_insert_own on public.user_theme_presets;
create policy user_theme_presets_insert_own
  on public.user_theme_presets for insert
  with check (profile_id = auth.uid());

 drop policy if exists user_theme_presets_update_own on public.user_theme_presets;
create policy user_theme_presets_update_own
  on public.user_theme_presets for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

 drop policy if exists user_theme_presets_delete_own on public.user_theme_presets;
create policy user_theme_presets_delete_own
  on public.user_theme_presets for delete
  using (profile_id = auth.uid());
