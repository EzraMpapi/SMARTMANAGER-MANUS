create table if not exists public.theme_preset_usage_events (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.user_theme_presets(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists theme_preset_usage_company_preset_idx on public.theme_preset_usage_events(company_id, preset_id, created_at desc);
alter table public.theme_preset_usage_events enable row level security;
drop policy if exists theme_preset_usage_insert_company on public.theme_preset_usage_events;
create policy theme_preset_usage_insert_company on public.theme_preset_usage_events for insert with check (profile_id = auth.uid() and company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));
drop policy if exists theme_preset_usage_select_company on public.theme_preset_usage_events;
create policy theme_preset_usage_select_company on public.theme_preset_usage_events for select using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));

create table if not exists public.theme_preset_likes (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.user_theme_presets(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(preset_id, profile_id)
);
create index if not exists theme_preset_likes_company_preset_idx on public.theme_preset_likes(company_id, preset_id);
alter table public.theme_preset_likes enable row level security;
drop policy if exists theme_preset_likes_insert_company on public.theme_preset_likes;
create policy theme_preset_likes_insert_company on public.theme_preset_likes for insert with check (profile_id = auth.uid() and company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));
drop policy if exists theme_preset_likes_select_company on public.theme_preset_likes;
create policy theme_preset_likes_select_company on public.theme_preset_likes for select using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()));
drop policy if exists theme_preset_likes_delete_own on public.theme_preset_likes;
create policy theme_preset_likes_delete_own on public.theme_preset_likes for delete using (profile_id = auth.uid());
