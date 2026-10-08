-- FK advisor remediation wave 001.
-- Applied through Supabase connector as fk_index_remediation_wave_001_20260825.
-- Scope: 25 exact single-column banking FK indexes verified missing in the live catalog.
-- Safety: no table data, foreign keys, RLS, grants, policies, or constraint-backed indexes changed.

CREATE INDEX IF NOT EXISTS "bank_customers_bank_customers_branch_id_fkey_fk_idx_d694d3e3" ON public."bank_customers" ("branch_id");
CREATE INDEX IF NOT EXISTS "bank_account_beneficiaries_bank_account_beneficiaries__a811f2c8" ON public."bank_account_beneficiaries" ("account_id");
CREATE INDEX IF NOT EXISTS "bank_account_beneficiaries_bank_account_beneficiaries__eac27028" ON public."bank_account_beneficiaries" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_agents_bank_agents_branch_id_fkey_fk_idx_8d03bd49" ON public."bank_agents" ("branch_id");
CREATE INDEX IF NOT EXISTS "bank_aml_alerts_bank_aml_alerts_customer_id_fkey_fk_id_54fc14be" ON public."bank_aml_alerts" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_aml_alerts_bank_aml_alerts_transaction_id_fkey_fk_0ede8cde" ON public."bank_aml_alerts" ("transaction_id");
CREATE INDEX IF NOT EXISTS "bank_beneficial_owners_bank_beneficial_owners_company__de2f9eff" ON public."bank_beneficial_owners" ("company_id");
CREATE INDEX IF NOT EXISTS "bank_beneficial_owners_bank_beneficial_owners_customer_9a500f36" ON public."bank_beneficial_owners" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_branches_bank_branches_institution_id_fkey_fk_idx_eeef0c85" ON public."bank_branches" ("institution_id");
CREATE INDEX IF NOT EXISTS "bank_cash_movements_bank_cash_movements_branch_id_fkey_793786ae" ON public."bank_cash_movements" ("branch_id");
CREATE INDEX IF NOT EXISTS "bank_cash_movements_bank_cash_movements_teller_id_fkey_57875cda" ON public."bank_cash_movements" ("teller_id");
CREATE INDEX IF NOT EXISTS "bank_cash_movements_bank_cash_movements_transaction_id_8dd028f7" ON public."bank_cash_movements" ("transaction_id");
CREATE INDEX IF NOT EXISTS "bank_collateral_bank_collateral_application_id_fkey_fk_c0eefda5" ON public."bank_collateral" ("application_id");
CREATE INDEX IF NOT EXISTS "bank_collateral_bank_collateral_company_id_fkey_fk_idx_424eec6f" ON public."bank_collateral" ("company_id");
CREATE INDEX IF NOT EXISTS "bank_customer_documents_bank_customer_documents_custom_ab2d70e4" ON public."bank_customer_documents" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_group_members_bank_group_members_company_id_fkey__d6b1314b" ON public."bank_group_members" ("company_id");
CREATE INDEX IF NOT EXISTS "bank_group_members_bank_group_members_customer_id_fkey_36018064" ON public."bank_group_members" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_groups_bank_groups_branch_id_fkey_fk_idx_becefb7b" ON public."bank_groups" ("branch_id");
CREATE INDEX IF NOT EXISTS "bank_guarantors_bank_guarantors_application_id_fkey_fk_64e464a9" ON public."bank_guarantors" ("application_id");
CREATE INDEX IF NOT EXISTS "bank_guarantors_bank_guarantors_company_id_fkey_fk_idx_e3149403" ON public."bank_guarantors" ("company_id");
CREATE INDEX IF NOT EXISTS "bank_guarantors_bank_guarantors_customer_id_fkey_fk_id_62d65391" ON public."bank_guarantors" ("customer_id");
CREATE INDEX IF NOT EXISTS "bank_journal_lines_bank_journal_lines_account_id_fkey__55c61c35" ON public."bank_journal_lines" ("account_id");
CREATE INDEX IF NOT EXISTS "bank_journal_lines_bank_journal_lines_batch_id_fkey_fk_e23ded91" ON public."bank_journal_lines" ("batch_id");
CREATE INDEX IF NOT EXISTS "bank_loan_applications_bank_loan_applications_branch_i_0bf1df60" ON public."bank_loan_applications" ("branch_id");
CREATE INDEX IF NOT EXISTS "bank_loan_applications_bank_loan_applications_customer_5f4b6b49" ON public."bank_loan_applications" ("customer_id");
