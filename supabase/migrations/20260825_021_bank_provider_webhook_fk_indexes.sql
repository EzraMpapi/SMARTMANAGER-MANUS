-- FK advisor remediation for the bank-provider webhook control plane.
-- Evidence: live Supabase performance advisor on 2026-08-25 identified eight
-- uncovered foreign keys on the recent bank-provider tables. All statements are
-- additive and idempotent; they do not modify rows, RLS, policies, grants, or constraints.
-- Applied through Supabase connector as bank_provider_webhook_fk_indexes_20260825.

-- bank_provider_transactions.(company_id, payment_instruction_id)
-- constraint=bank_provider_transactions_instruction_company_fk
CREATE INDEX IF NOT EXISTS "ix_bank_provider_transactions_instruction_company_fk"
  ON public."bank_provider_transactions" ("company_id", "payment_instruction_id");

-- bank_provider_webhook_drain_approvals.approved_by
-- constraint=bank_provider_webhook_drain_approvals_approved_by_fkey
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_drain_approvals_approved_by_fk"
  ON public."bank_provider_webhook_drain_approvals" ("approved_by");

-- bank_provider_webhook_drain_approvals.requested_by
-- constraint=bank_provider_webhook_drain_approvals_requested_by_fkey
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_drain_approvals_requested_by_fk"
  ON public."bank_provider_webhook_drain_approvals" ("requested_by");

-- bank_provider_webhook_drain_runs.requested_by
-- constraint=bank_provider_webhook_drain_runs_requested_by_fkey
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_drain_runs_requested_by_fk"
  ON public."bank_provider_webhook_drain_runs" ("requested_by");

-- bank_provider_webhook_events.(company_id, payment_instruction_id)
-- constraint=bank_provider_webhook_events_instruction_company_fk
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_events_instruction_company_fk"
  ON public."bank_provider_webhook_events" ("company_id", "payment_instruction_id");

-- bank_provider_webhook_events.(company_id, standing_order_run_id)
-- constraint=bank_provider_webhook_events_run_company_fk
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_events_run_company_fk"
  ON public."bank_provider_webhook_events" ("company_id", "standing_order_run_id");

-- bank_provider_webhook_processing.(company_id, event_id)
-- constraint=bank_provider_webhook_processing_company_event_fk
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_processing_company_event_fk"
  ON public."bank_provider_webhook_processing" ("company_id", "event_id");

-- bank_provider_webhook_remediation.(company_id, event_id)
-- constraint=bank_webhook_remediation_company_fk
CREATE INDEX IF NOT EXISTS "ix_bank_provider_webhook_remediation_company_event_fk"
  ON public."bank_provider_webhook_remediation" ("company_id", "event_id");
