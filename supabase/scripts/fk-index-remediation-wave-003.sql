-- SMART MANAGER FK advisor remediation wave 003.
-- Review artifact generated from the refreshed live Supabase catalog on 2026-08-25.
-- Apply one CREATE INDEX CONCURRENTLY statement at a time outside a transaction.
-- No DDL was executed by this generator.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_journal_batches_fin_journal_batches_updated_by_fke_43a66d1d" ON public."fin_journal_batches" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_approval_requests_fin_approval_requests_created_by_7eb42c75" ON public."fin_approval_requests" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_approval_requests_fin_approval_requests_decided_by_2b59a592" ON public."fin_approval_requests" ("decided_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_approval_requests_fin_approval_requests_requested__879e343f" ON public."fin_approval_requests" ("requested_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_approval_requests_fin_approval_requests_updated_by_03f14c5b" ON public."fin_approval_requests" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_idempotency_keys_fin_idempotency_keys_created_by_f_ef2669d6" ON public."fin_idempotency_keys" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_idempotency_keys_fin_idempotency_keys_updated_by_f_1427119f" ON public."fin_idempotency_keys" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_periods_fin_periods_closed_by_fkey_fk_idx_3637fd38" ON public."fin_periods" ("closed_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_periods_fin_periods_created_by_fkey_fk_idx_49a3256b" ON public."fin_periods" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_periods_fin_periods_updated_by_fkey_fk_idx_23233c32" ON public."fin_periods" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_posting_links_fin_posting_links_created_by_fkey_fk_cf29cff6" ON public."fin_posting_links" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_reconciliation_batches_fin_reconciliation_batches__ed498e13" ON public."fin_reconciliation_batches" ("approved_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_reconciliation_batches_fin_reconciliation_batches__a4b3843a" ON public."fin_reconciliation_batches" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_reconciliation_batches_fin_reconciliation_batches__3a4b4e5d" ON public."fin_reconciliation_batches" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_reconciliation_items_fin_reconciliation_items_crea_c5cdd64b" ON public."fin_reconciliation_items" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_reconciliation_items_fin_reconciliation_items_reso_e7d2e2f1" ON public."fin_reconciliation_items" ("resolved_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fin_reconciliation_items_fin_reconciliation_items_upda_510f29df" ON public."fin_reconciliation_items" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_approval_limits_workforce_approval_limits_as_d998d89b" ON public."workforce_approval_limits" ("assigned_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_approval_limits_workforce_approval_limits_co_918a0e05" ON public."workforce_approval_limits" ("company_id", "approval_request_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_approval_limits_workforce_approval_limits_co_b6b535b9" ON public."workforce_approval_limits" ("company_id", "target_role_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_approval_limits_workforce_approval_limits_re_c49244bd" ON public."workforce_approval_limits" ("revoked_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_approval_limits_workforce_approval_limits_ta_9b428df5" ON public."workforce_approval_limits" ("target_profile_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_data_scopes_workforce_data_scopes_assigned_b_2cf4d102" ON public."workforce_data_scopes" ("assigned_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_data_scopes_workforce_data_scopes_company_id_c15c72ef" ON public."workforce_data_scopes" ("company_id", "approval_request_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_data_scopes_workforce_data_scopes_revoked_by_f3136122" ON public."workforce_data_scopes" ("revoked_by");
