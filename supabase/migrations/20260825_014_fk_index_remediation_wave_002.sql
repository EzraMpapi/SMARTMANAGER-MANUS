-- FK advisor remediation wave 002.
-- Applied through Supabase connector as fk_index_remediation_wave_002_20260825.
-- Scope: 25 exact missing banking and finance FK indexes verified in the live catalog.
-- Safety: no table data, foreign keys, RLS, grants, policies, or constraint-backed indexes changed.

CREATE INDEX IF NOT EXISTS "bank_loan_applications_bank_loan_applications_product__7ee821a3" ON public."bank_loan_applications" ("product_id");
CREATE INDEX IF NOT EXISTS "bank_loan_approvals_bank_loan_approvals_company_id_fke_4bb96bbb" ON public."bank_loan_approvals" ("company_id");
CREATE INDEX IF NOT EXISTS "bank_loan_repayments_bank_loan_repayments_account_id_f_5bcff4e0" ON public."bank_loan_repayments" ("account_id");
CREATE INDEX IF NOT EXISTS "bank_loan_repayments_bank_loan_repayments_loan_id_fkey_ddec6688" ON public."bank_loan_repayments" ("loan_id");
CREATE INDEX IF NOT EXISTS "bank_loan_repayments_bank_loan_repayments_transaction__7e46883d" ON public."bank_loan_repayments" ("transaction_id");
CREATE INDEX IF NOT EXISTS "bank_notifications_bank_notifications_customer_id_fkey_5890ee57" ON public."bank_notifications" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_payment_instructions_bank_payment_instructions_de_a81ded5d" ON public."bank_payment_instructions" ("destination_account_id");
CREATE INDEX IF NOT EXISTS "bank_payment_instructions_bank_payment_instructions_so_6f732b8e" ON public."bank_payment_instructions" ("source_account_id");
CREATE INDEX IF NOT EXISTS "bank_reconciliations_bank_reconciliations_account_id_f_3c834d58" ON public."bank_reconciliations" ("account_id");
CREATE INDEX IF NOT EXISTS "bank_shares_bank_shares_company_id_fkey_fk_idx_9f4336db" ON public."bank_shares" ("company_id");
CREATE INDEX IF NOT EXISTS "bank_shares_bank_shares_customer_id_fkey_fk_idx_e9d65eb7" ON public."bank_shares" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_shares_bank_shares_group_id_fkey_fk_idx_204523ad" ON public."bank_shares" ("group_id");
CREATE INDEX IF NOT EXISTS "bank_shares_bank_shares_transaction_id_fkey_fk_idx_0ebfc7d0" ON public."bank_shares" ("transaction_id");
CREATE INDEX IF NOT EXISTS "bank_standing_order_runs_bank_standing_order_runs_paym_0eb3c0aa" ON public."bank_standing_order_runs" ("payment_instruction_id");
CREATE INDEX IF NOT EXISTS "bank_standing_order_runs_bank_standing_order_runs_tran_a3ceb942" ON public."bank_standing_order_runs" ("transaction_id");
CREATE INDEX IF NOT EXISTS "bank_standing_orders_bank_standing_orders_customer_id__ff7ff1be" ON public."bank_standing_orders" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_tellers_bank_tellers_branch_id_fkey_fk_idx_6d533a6a" ON public."bank_tellers" ("branch_id");
CREATE INDEX IF NOT EXISTS "bank_wallets_bank_wallets_customer_id_fkey_fk_idx_0e90b27f" ON public."bank_wallets" ("customer_id");
CREATE INDEX IF NOT EXISTS "fin_accounts_fin_accounts_created_by_fkey_fk_idx_cd4c97ca" ON public."fin_accounts" ("created_by");
CREATE INDEX IF NOT EXISTS "fin_accounts_fin_accounts_updated_by_fkey_fk_idx_870a1b64" ON public."fin_accounts" ("updated_by");
CREATE INDEX IF NOT EXISTS "fin_journal_lines_fin_journal_lines_created_by_fkey_fk_1ea9928d" ON public."fin_journal_lines" ("created_by");
CREATE INDEX IF NOT EXISTS "fin_journal_lines_fin_journal_lines_updated_by_fkey_fk_8c63ad88" ON public."fin_journal_lines" ("updated_by");
CREATE INDEX IF NOT EXISTS "fin_journal_batches_fin_journal_batches_created_by_fke_40fd6af0" ON public."fin_journal_batches" ("created_by");
CREATE INDEX IF NOT EXISTS "fin_journal_batches_fin_journal_batches_posted_by_fkey_938b7ee8" ON public."fin_journal_batches" ("posted_by");
CREATE INDEX IF NOT EXISTS "fin_journal_batches_fin_journal_batches_reversal_compa_260df19a" ON public."fin_journal_batches" ("company_id", "reversal_of_batch_id");
