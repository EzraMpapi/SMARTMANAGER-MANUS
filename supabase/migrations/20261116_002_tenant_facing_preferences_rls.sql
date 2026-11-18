-- Tenant-facing RLS policies for dashboard preferences and personalization.
--
-- These tables are intentionally exposed only to authenticated users. Every
-- row is bound to the caller's verified company, and personal preferences are
-- additionally bound to auth.uid(). Shared presets are creator-owned for
-- mutation; reads remain tenant-scoped.

begin;

alter table public.user_table_preferences enable row level security;
alter table public.dashboard_layout_telemetry enable row level security;
alter table public.dashboard_team_presets enable row level security;

grant select, insert, update, delete on table public.user_table_preferences to authenticated;
grant select, insert on table public.dashboard_layout_telemetry to authenticated;
grant select, insert, update, delete on table public.dashboard_team_presets to authenticated;

-- A deployment may contain an earlier reviewed policy set. Replace only these
-- named policies so this migration is deterministic and re-runnable.
drop policy if exists user_table_preferences_own_tenant_select on public.user_table_preferences;
drop policy if exists user_table_preferences_own_tenant_insert on public.user_table_preferences;
drop policy if exists user_table_preferences_own_tenant_update on public.user_table_preferences;
drop policy if exists user_table_preferences_own_tenant_delete on public.user_table_preferences;

create policy user_table_preferences_own_tenant_select
  on public.user_table_preferences for select to authenticated
  using (company_id = public.current_company_id() and user_id = auth.uid());

create policy user_table_preferences_own_tenant_insert
  on public.user_table_preferences for insert to authenticated
  with check (company_id = public.current_company_id() and user_id = auth.uid());

create policy user_table_preferences_own_tenant_update
  on public.user_table_preferences for update to authenticated
  using (company_id = public.current_company_id() and user_id = auth.uid())
  with check (company_id = public.current_company_id() and user_id = auth.uid());

create policy user_table_preferences_own_tenant_delete
  on public.user_table_preferences for delete to authenticated
  using (company_id = public.current_company_id() and user_id = auth.uid());

drop policy if exists dashboard_layout_telemetry_tenant_select on public.dashboard_layout_telemetry;
drop policy if exists dashboard_layout_telemetry_tenant_insert on public.dashboard_layout_telemetry;

create policy dashboard_layout_telemetry_tenant_select
  on public.dashboard_layout_telemetry for select to authenticated
  using (company_id = public.current_company_id());

create policy dashboard_layout_telemetry_tenant_insert
  on public.dashboard_layout_telemetry for insert to authenticated
  with check (company_id = public.current_company_id());

drop policy if exists dashboard_team_presets_tenant_select on public.dashboard_team_presets;
drop policy if exists dashboard_team_presets_creator_insert on public.dashboard_team_presets;
drop policy if exists dashboard_team_presets_creator_update on public.dashboard_team_presets;
drop policy if exists dashboard_team_presets_creator_delete on public.dashboard_team_presets;

create policy dashboard_team_presets_tenant_select
  on public.dashboard_team_presets for select to authenticated
  using (company_id = public.current_company_id());

create policy dashboard_team_presets_creator_insert
  on public.dashboard_team_presets for insert to authenticated
  with check (company_id = public.current_company_id() and created_by = auth.uid());

create policy dashboard_team_presets_creator_update
  on public.dashboard_team_presets for update to authenticated
  using (company_id = public.current_company_id() and created_by = auth.uid())
  with check (company_id = public.current_company_id() and created_by = auth.uid());

create policy dashboard_team_presets_creator_delete
  on public.dashboard_team_presets for delete to authenticated
  using (company_id = public.current_company_id() and created_by = auth.uid());

commit;
