-- GENERATED REVIEW PLAN: deny-by-default policies for RLS-enabled tables with no policies.
-- Generated from the Supabase catalog audit on 2026-09-07.
-- Review each table's intended access before applying this migration.
-- service_role is not included and continues to bypass RLS.

begin;
create policy "bank_provider_webhook_account_controls_deny_unclassified_clients"
  on public."bank_provider_webhook_account_controls"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "bank_provider_webhook_drain_approvals_deny_unclassified_clients"
  on public."bank_provider_webhook_drain_approvals"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "bank_provider_webhook_drain_runs_deny_unclassified_clients"
  on public."bank_provider_webhook_drain_runs"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "bank_provider_webhook_remediation_deny_unclassified_clients"
  on public."bank_provider_webhook_remediation"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "dashboard_layout_telemetry_deny_unclassified_clients"
  on public."dashboard_layout_telemetry"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "dashboard_team_presets_deny_unclassified_clients"
  on public."dashboard_team_presets"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "platform_admin_actions_deny_unclassified_clients"
  on public."platform_admin_actions"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "schema_drift_monitors_deny_unclassified_clients"
  on public."schema_drift_monitors"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "schema_drift_runs_deny_unclassified_clients"
  on public."schema_drift_runs"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "subscription_trial_expiry_notices_deny_unclassified_clients"
  on public."subscription_trial_expiry_notices"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "users_deny_unclassified_clients"
  on public."users"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "website_feedback_submissions_deny_unclassified_clients"
  on public."website_feedback_submissions"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

commit;

-- Manual review candidates before replacing deny policies:
-- * website_feedback_submissions: decide whether anonymous feedback inserts are required.
-- * dashboard_layout_telemetry: decide whether authenticated tenant-scoped inserts are required.
-- * dashboard_team_presets: decide whether authenticated tenant/member policies are required.
-- * subscription_trial_expiry_notices: decide whether authenticated owner policies are required.
-- * users and platform/schema/webhook tables: normally service-role or admin-only.
