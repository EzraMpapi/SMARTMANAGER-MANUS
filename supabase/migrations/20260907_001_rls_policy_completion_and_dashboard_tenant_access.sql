-- Close policy gaps for RLS-enabled public tables that previously had zero policies.
-- Applied to Supabase project rlhngsrihahhyxnjxrxm on 2026-09-07.
-- service_role remains the server-side access path and bypasses RLS.

create policy bank_provider_webhook_account_controls_deny_unclassified_clients
  on public.bank_provider_webhook_account_controls as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy bank_provider_webhook_drain_approvals_deny_unclassified_clients
  on public.bank_provider_webhook_drain_approvals as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy bank_provider_webhook_drain_runs_deny_unclassified_clients
  on public.bank_provider_webhook_drain_runs as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy bank_provider_webhook_remediation_deny_unclassified_clients
  on public.bank_provider_webhook_remediation as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy platform_admin_actions_deny_unclassified_clients
  on public.platform_admin_actions as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy schema_drift_monitors_deny_unclassified_clients
  on public.schema_drift_monitors as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy schema_drift_runs_deny_unclassified_clients
  on public.schema_drift_runs as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy subscription_trial_expiry_notices_deny_unclassified_clients
  on public.subscription_trial_expiry_notices as restrictive for all
  to anon, authenticated using (false) with check (false);
create policy users_deny_unclassified_clients
  on public.users as restrictive for all
  to anon, authenticated using (false) with check (false);

grant insert on table public.website_feedback_submissions to anon;
create policy website_feedback_submissions_public_insert
  on public.website_feedback_submissions for insert to anon
  with check (source = 'public_website' and status = 'new'
    and reviewed_at is null and reviewed_by is null and admin_notes is null);

grant select, insert on table public.dashboard_layout_telemetry to authenticated;
create policy dashboard_layout_telemetry_tenant_select
  on public.dashboard_layout_telemetry for select to authenticated
  using (company_id = public.current_company_id());
create policy dashboard_layout_telemetry_tenant_insert
  on public.dashboard_layout_telemetry for insert to authenticated
  with check (company_id = public.current_company_id());

grant select, insert, update, delete on table public.dashboard_team_presets to authenticated;
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
