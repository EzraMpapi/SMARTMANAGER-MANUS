-- Critical foreign-key covering indexes identified by the Supabase performance advisor.
--
-- This migration is generated from a read-only catalog query and is intentionally
-- reviewable before application. It is limited to bank_, fin_, mfi_, pos_,
-- workforce_, inventory_, sales_, company_memberships, profiles, and workspaces.
-- It does not alter tables, constraints, RLS, policies, or data.
--
-- IMPORTANT: review workload and lock impact before applying to production. Plain
-- CREATE INDEX is used for migration portability; use an approved maintenance
-- window or split into separately reviewed CONCURRENTLY operations if required.

BEGIN;

-- bank_account_beneficiaries.bank_account_beneficiaries_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_58e7c2bc86a7aa4af039 ON public.bank_account_beneficiaries (company_id);

-- bank_account_beneficiaries.bank_account_beneficiaries_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_89c9b9b603a8eb51f743 ON public.bank_account_beneficiaries (customer_id);

-- bank_account_types.bank_account_types_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_ab5ee779d391000e06ef ON public.bank_account_types (company_id);

-- bank_accounts.bank_accounts_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_31dc16a861b7619205c3 ON public.bank_accounts (company_id);

-- bank_agents.bank_agents_branch_id_fkey (branch_id)
CREATE INDEX IF NOT EXISTS smart_fk_4414e196ac903238e078 ON public.bank_agents (branch_id);

-- bank_agents.bank_agents_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_f7cbe55028fa8c9aa0df ON public.bank_agents (company_id);

-- bank_aml_alerts.bank_aml_alerts_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_0d13f71789c24223b421 ON public.bank_aml_alerts (company_id);

-- bank_aml_alerts.bank_aml_alerts_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_81059a026884f6a70575 ON public.bank_aml_alerts (customer_id);

-- bank_aml_alerts.bank_aml_alerts_transaction_id_fkey (transaction_id)
CREATE INDEX IF NOT EXISTS smart_fk_d7e41e49527ad1d4a873 ON public.bank_aml_alerts (transaction_id);

-- bank_audit_events.bank_audit_events_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_f9e50a28c4619cb5881f ON public.bank_audit_events (company_id);

-- bank_beneficial_owners.bank_beneficial_owners_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_7edcd4293ce79045aa7f ON public.bank_beneficial_owners (company_id);

-- bank_beneficial_owners.bank_beneficial_owners_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_631dbdb1b5cc0e248f9c ON public.bank_beneficial_owners (customer_id);

-- bank_branches.bank_branches_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_e75710d59d429a476662 ON public.bank_branches (company_id);

-- bank_branches.bank_branches_institution_id_fkey (institution_id)
CREATE INDEX IF NOT EXISTS smart_fk_c266682d1ecc8fad8fd7 ON public.bank_branches (institution_id);

-- bank_cash_movements.bank_cash_movements_branch_id_fkey (branch_id)
CREATE INDEX IF NOT EXISTS smart_fk_686f839503ac5706e708 ON public.bank_cash_movements (branch_id);

-- bank_cash_movements.bank_cash_movements_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_93ef34e268f9177f110d ON public.bank_cash_movements (company_id);

-- bank_cash_movements.bank_cash_movements_teller_id_fkey (teller_id)
CREATE INDEX IF NOT EXISTS smart_fk_d6f047d7d3695cc4aac4 ON public.bank_cash_movements (teller_id);

-- bank_cash_movements.bank_cash_movements_transaction_id_fkey (transaction_id)
CREATE INDEX IF NOT EXISTS smart_fk_1c4a8f32bc7e3d6da3d0 ON public.bank_cash_movements (transaction_id);

-- bank_collateral.bank_collateral_application_id_fkey (application_id)
CREATE INDEX IF NOT EXISTS smart_fk_d0f26c4b9de8e815e3a3 ON public.bank_collateral (application_id);

-- bank_collateral.bank_collateral_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_65abe2763e104b8bccbd ON public.bank_collateral (company_id);

-- bank_customer_documents.bank_customer_documents_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_60cc9e288c482669b3f6 ON public.bank_customer_documents (company_id);

-- bank_customers.bank_customers_branch_id_fkey (branch_id)
CREATE INDEX IF NOT EXISTS smart_fk_f5ff77ec87a701a4d04d ON public.bank_customers (branch_id);

-- bank_customers.bank_customers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_a7b18f5a7d053dd9888b ON public.bank_customers (company_id);

-- bank_fixed_deposits.bank_fixed_deposits_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_477f8ea3ee5993cba115 ON public.bank_fixed_deposits (company_id);

-- bank_group_members.bank_group_members_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_5f112c4ad428a073f22a ON public.bank_group_members (company_id);

-- bank_group_members.bank_group_members_group_id_fkey (group_id)
CREATE INDEX IF NOT EXISTS smart_fk_75a1699925e1aae19ec1 ON public.bank_group_members (group_id);

-- bank_groups.bank_groups_branch_id_fkey (branch_id)
CREATE INDEX IF NOT EXISTS smart_fk_604ffb0d54767779e993 ON public.bank_groups (branch_id);

-- bank_groups.bank_groups_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_0b47db2f0f8a1277d571 ON public.bank_groups (company_id);

-- bank_guarantors.bank_guarantors_application_id_fkey (application_id)
CREATE INDEX IF NOT EXISTS smart_fk_47bdcdde26268f1fafd8 ON public.bank_guarantors (application_id);

-- bank_guarantors.bank_guarantors_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_6c6852572ed62453f068 ON public.bank_guarantors (company_id);

-- bank_guarantors.bank_guarantors_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_1903b63a2837b78e3c5a ON public.bank_guarantors (customer_id);

-- bank_idempotency_keys.bank_idempotency_keys_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_9a9b9df1a8b4c740c96d ON public.bank_idempotency_keys (company_id);

-- bank_institutions.bank_institutions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_808e22991f46dc89f777 ON public.bank_institutions (company_id);

-- bank_journal_batches.bank_journal_batches_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_74be893a1d23cf3bd922 ON public.bank_journal_batches (company_id);

-- bank_journal_lines.bank_journal_lines_account_id_fkey (account_id)
CREATE INDEX IF NOT EXISTS smart_fk_5f6088d93d82c00a06eb ON public.bank_journal_lines (account_id);

-- bank_journal_lines.bank_journal_lines_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_fd975d5672690b492b61 ON public.bank_journal_lines (company_id);

-- bank_loan_applications.bank_loan_applications_branch_id_fkey (branch_id)
CREATE INDEX IF NOT EXISTS smart_fk_3263a86a318b6cdd63c6 ON public.bank_loan_applications (branch_id);

-- bank_loan_applications.bank_loan_applications_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_65ed68a9a49b3cd966a9 ON public.bank_loan_applications (company_id);

-- bank_loan_applications.bank_loan_applications_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_47c5c0d36443ae2198da ON public.bank_loan_applications (customer_id);

-- bank_loan_applications.bank_loan_applications_product_id_fkey (product_id)
CREATE INDEX IF NOT EXISTS smart_fk_4359af0db25ae3f05f5d ON public.bank_loan_applications (product_id);

-- bank_loan_approvals.bank_loan_approvals_application_id_fkey (application_id)
CREATE INDEX IF NOT EXISTS smart_fk_14aff9bf90b11b90bf05 ON public.bank_loan_approvals (application_id);

-- bank_loan_approvals.bank_loan_approvals_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_aa7b9b31993250ae9416 ON public.bank_loan_approvals (company_id);

-- bank_loan_products.bank_loan_products_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_b45cb13d184535efb0af ON public.bank_loan_products (company_id);

-- bank_loan_repayments.bank_loan_repayments_account_id_fkey (account_id)
CREATE INDEX IF NOT EXISTS smart_fk_1589a403fe00750909cb ON public.bank_loan_repayments (account_id);

-- bank_loan_repayments.bank_loan_repayments_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_a877efd48d2de037dd2c ON public.bank_loan_repayments (company_id);

-- bank_loan_repayments.bank_loan_repayments_transaction_id_fkey (transaction_id)
CREATE INDEX IF NOT EXISTS smart_fk_8d8aeef6a26c794496dc ON public.bank_loan_repayments (transaction_id);

-- bank_loan_schedules.bank_loan_schedules_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_220c2d38dd1a81b89d79 ON public.bank_loan_schedules (company_id);

-- bank_loan_schedules.bank_loan_schedules_loan_id_fkey (loan_id)
CREATE INDEX IF NOT EXISTS smart_fk_1f56c21b114b3dc8a3ed ON public.bank_loan_schedules (loan_id);

-- bank_loans.bank_loans_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_27bfa87740f9b71b5d0d ON public.bank_loans (company_id);

-- bank_notifications.bank_notifications_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_00105c3484c7a924ec2a ON public.bank_notifications (company_id);

-- bank_notifications.bank_notifications_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_784c29f7a7a3dac9a4b0 ON public.bank_notifications (customer_id);

-- bank_payment_instructions.bank_payment_instructions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_3d215d06f911b1f5d81e ON public.bank_payment_instructions (company_id);

-- bank_payment_instructions.bank_payment_instructions_destination_account_id_fkey (destination_account_id)
CREATE INDEX IF NOT EXISTS smart_fk_abb17831c9de81293f90 ON public.bank_payment_instructions (destination_account_id);

-- bank_payment_instructions.bank_payment_instructions_source_account_id_fkey (source_account_id)
CREATE INDEX IF NOT EXISTS smart_fk_affdfb3b552a39b72324 ON public.bank_payment_instructions (source_account_id);

-- bank_reconciliations.bank_reconciliations_account_id_fkey (account_id)
CREATE INDEX IF NOT EXISTS smart_fk_72b46ef313206a8f40fd ON public.bank_reconciliations (account_id);

-- bank_reconciliations.bank_reconciliations_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_31f22ad62928e3584706 ON public.bank_reconciliations (company_id);

-- bank_shares.bank_shares_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_c19a69639bcc1e8b7eaf ON public.bank_shares (company_id);

-- bank_shares.bank_shares_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_c744acdffb6e2f4221bd ON public.bank_shares (customer_id);

-- bank_shares.bank_shares_group_id_fkey (group_id)
CREATE INDEX IF NOT EXISTS smart_fk_e699485e0186ceb0226e ON public.bank_shares (group_id);

-- bank_shares.bank_shares_transaction_id_fkey (transaction_id)
CREATE INDEX IF NOT EXISTS smart_fk_b527fcb3fc0c807701fb ON public.bank_shares (transaction_id);

-- bank_standing_orders.bank_standing_orders_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_d4ee152cf48b22f0b614 ON public.bank_standing_orders (company_id);

-- bank_tellers.bank_tellers_branch_id_fkey (branch_id)
CREATE INDEX IF NOT EXISTS smart_fk_f1146b1dfc8a06aed9da ON public.bank_tellers (branch_id);

-- bank_tellers.bank_tellers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_186f27570815b2c8e7d7 ON public.bank_tellers (company_id);

-- bank_transactions.bank_transactions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_527cebe311d316d78665 ON public.bank_transactions (company_id);

-- bank_wallets.bank_wallets_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_f3a0691c20ac09bd92e7 ON public.bank_wallets (company_id);

-- bank_wallets.bank_wallets_customer_id_fkey (customer_id)
CREATE INDEX IF NOT EXISTS smart_fk_7fd04d796bfe4fcace19 ON public.bank_wallets (customer_id);

-- company_memberships.company_memberships_user_id_fkey (user_id)
CREATE INDEX IF NOT EXISTS smart_fk_964c6fd213708b8c5699 ON public.company_memberships (user_id);

-- fin_accounts.fin_accounts_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_4476794b7ce0b13e3d18 ON public.fin_accounts (company_id);

-- fin_accounts.fin_accounts_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_84653ddc47aa5aab2796 ON public.fin_accounts (created_by);

-- fin_accounts.fin_accounts_parent_company_fkey (company_id, parent_id)
CREATE INDEX IF NOT EXISTS smart_fk_04c095bd87ee9aef1a4a ON public.fin_accounts (company_id, parent_id);

-- fin_accounts.fin_accounts_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_9ccb60cdb45cb2ac6f09 ON public.fin_accounts (updated_by);

-- fin_approval_requests.fin_approval_requests_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_8a08cc63fadc5007b73c ON public.fin_approval_requests (company_id);

-- fin_approval_requests.fin_approval_requests_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_4a5bb82824776a0ad48d ON public.fin_approval_requests (created_by);

-- fin_approval_requests.fin_approval_requests_decided_by_fkey (decided_by)
CREATE INDEX IF NOT EXISTS smart_fk_370e77819c503d010538 ON public.fin_approval_requests (decided_by);

-- fin_approval_requests.fin_approval_requests_requested_by_fkey (requested_by)
CREATE INDEX IF NOT EXISTS smart_fk_ed52d911c2011e17acc4 ON public.fin_approval_requests (requested_by);

-- fin_approval_requests.fin_approval_requests_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_f3649ead277c18544fef ON public.fin_approval_requests (updated_by);

-- fin_idempotency_keys.fin_idempotency_keys_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_af0c803ac3dc43af1709 ON public.fin_idempotency_keys (company_id);

-- fin_idempotency_keys.fin_idempotency_keys_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_eda630da6ea706311c92 ON public.fin_idempotency_keys (created_by);

-- fin_idempotency_keys.fin_idempotency_keys_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_1a7424edf779f8dfe8e8 ON public.fin_idempotency_keys (updated_by);

-- fin_journal_batches.fin_journal_batches_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_b99d500094bf365ccda0 ON public.fin_journal_batches (company_id);

-- fin_journal_batches.fin_journal_batches_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_c8b7d85ba90c42790fcc ON public.fin_journal_batches (created_by);

-- fin_journal_batches.fin_journal_batches_posted_by_fkey (posted_by)
CREATE INDEX IF NOT EXISTS smart_fk_e19426d7a775d143e249 ON public.fin_journal_batches (posted_by);

-- fin_journal_batches.fin_journal_batches_reversal_company_fkey (company_id, reversal_of_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_863f96891352d5f5b16b ON public.fin_journal_batches (company_id, reversal_of_batch_id);

-- fin_journal_batches.fin_journal_batches_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_667e4ff663f4764cf0c7 ON public.fin_journal_batches (updated_by);

-- fin_journal_lines.fin_journal_lines_account_company_fkey (company_id, account_id)
CREATE INDEX IF NOT EXISTS smart_fk_a8712439035da3d23dbf ON public.fin_journal_lines (company_id, account_id);

-- fin_journal_lines.fin_journal_lines_batch_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_4ef8fd8af388c2db6c07 ON public.fin_journal_lines (company_id, journal_batch_id);

-- fin_journal_lines.fin_journal_lines_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_6f18fa06cb8db148063f ON public.fin_journal_lines (company_id);

-- fin_journal_lines.fin_journal_lines_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_966bbb13da9baea964c6 ON public.fin_journal_lines (created_by);

-- fin_journal_lines.fin_journal_lines_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_6bda1d1e1442e55e821d ON public.fin_journal_lines (updated_by);

-- fin_periods.fin_periods_closed_by_fkey (closed_by)
CREATE INDEX IF NOT EXISTS smart_fk_db40d7025c1466e4223f ON public.fin_periods (closed_by);

-- fin_periods.fin_periods_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_6a0317fea21c9847a66d ON public.fin_periods (company_id);

-- fin_periods.fin_periods_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_cb92226692cebd3285b0 ON public.fin_periods (created_by);

-- fin_periods.fin_periods_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_9ba89221176c143a562d ON public.fin_periods (updated_by);

-- fin_posting_links.fin_posting_links_batch_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_2f9efb4ddd34e0cfb6c1 ON public.fin_posting_links (company_id, journal_batch_id);

-- fin_posting_links.fin_posting_links_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_a344c56758929f2832b8 ON public.fin_posting_links (company_id);

-- fin_posting_links.fin_posting_links_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_0d0997537bc8a9fb9e25 ON public.fin_posting_links (created_by);

-- fin_reconciliation_batches.fin_reconciliation_batches_approved_by_fkey (approved_by)
CREATE INDEX IF NOT EXISTS smart_fk_5cbb2a1cba43bf2c63b8 ON public.fin_reconciliation_batches (approved_by);

-- fin_reconciliation_batches.fin_reconciliation_batches_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_d76a25202697c505b82f ON public.fin_reconciliation_batches (company_id);

-- fin_reconciliation_batches.fin_reconciliation_batches_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_0f2b5619ff6c8e429562 ON public.fin_reconciliation_batches (created_by);

-- fin_reconciliation_batches.fin_reconciliation_batches_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_653d5f644380fe9e7b2b ON public.fin_reconciliation_batches (updated_by);

-- fin_reconciliation_items.fin_reconciliation_items_batch_company_fkey (company_id, batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_3a6a110dfdc7da5e96de ON public.fin_reconciliation_items (company_id, batch_id);

-- fin_reconciliation_items.fin_reconciliation_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_1c9d3341b54ee31b83c1 ON public.fin_reconciliation_items (company_id);

-- fin_reconciliation_items.fin_reconciliation_items_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_956cd2d8d8da3ed67a1b ON public.fin_reconciliation_items (created_by);

-- fin_reconciliation_items.fin_reconciliation_items_resolved_by_fkey (resolved_by)
CREATE INDEX IF NOT EXISTS smart_fk_9bc791fefe80f2074c3c ON public.fin_reconciliation_items (resolved_by);

-- fin_reconciliation_items.fin_reconciliation_items_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_d331ecaa33d93f99f750 ON public.fin_reconciliation_items (updated_by);

-- finance_assets.finance_assets_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_c8bfdb39d3632deb6bbc ON public.finance_assets (company_id);

-- finance_expenses.finance_expenses_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_547a2a5ebf85573f50e6 ON public.finance_expenses (company_id);

-- financial_benchmarks.financial_benchmarks_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_4cad47c2a6cc7d6f984e ON public.financial_benchmarks (company_id);

-- inventory_batches.inventory_batches_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_095d733be3fd457c8ce3 ON public.inventory_batches (company_id);

-- inventory_items.inventory_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_9d417de6bdab7dff6b85 ON public.inventory_items (company_id);

-- inventory_stock_movements.inventory_stock_movements_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_131a9f1d08995f750e6c ON public.inventory_stock_movements (company_id);

-- inventory_suppliers.inventory_suppliers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_bf14060102a72034a5b1 ON public.inventory_suppliers (company_id);

-- inventory_transfers.inventory_transfers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_d8f60ff42bc6ab454df8 ON public.inventory_transfers (company_id);

-- inventory_warehouses.inventory_warehouses_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_350638ef8ca28d275667 ON public.inventory_warehouses (company_id);

-- mfi_audit_logs.mfi_audit_logs_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_26ec3b97d578c174dfa3 ON public.mfi_audit_logs (company_id);

-- mfi_cash_sessions.mfi_cash_sessions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_9e9f21543fe366e785be ON public.mfi_cash_sessions (company_id);

-- mfi_cash_transactions.mfi_cash_transactions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_22bf9fa95060536afdec ON public.mfi_cash_transactions (company_id);

-- mfi_clients.mfi_clients_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_8af66ea88f4d1ac7bd17 ON public.mfi_clients (company_id);

-- mfi_collateral.mfi_collateral_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_69b7a0772c071f1c220c ON public.mfi_collateral (company_id);

-- mfi_collections.mfi_collections_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_652ca11dda9061937f61 ON public.mfi_collections (company_id);

-- mfi_credit_scorecards.mfi_credit_scorecards_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_493a263ed38e730dac7f ON public.mfi_credit_scorecards (company_id);

-- mfi_credit_scoring_settings.mfi_credit_scoring_settings_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_355cc6e273e3385ccdea ON public.mfi_credit_scoring_settings (company_id);

-- mfi_groups.mfi_groups_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_7e73600089aa7dd8263c ON public.mfi_groups (company_id);

-- mfi_guarantors.mfi_guarantors_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_e2fada6c3111846c3292 ON public.mfi_guarantors (company_id);

-- mfi_loan_applications.mfi_loan_applications_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_1a3d4b3485fcb2f6abb6 ON public.mfi_loan_applications (company_id);

-- mfi_loan_products.mfi_loan_products_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_2335c138943af7ed99b4 ON public.mfi_loan_products (company_id);

-- mfi_loans.mfi_loans_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_f6abdbd8a66e50dd668a ON public.mfi_loans (company_id);

-- mfi_notifications.mfi_notifications_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_55eb6d4d03865e762fd6 ON public.mfi_notifications (company_id);

-- mfi_par_escalation_settings.mfi_par_escalation_settings_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_525925820b1ed6127126 ON public.mfi_par_escalation_settings (company_id);

-- mfi_repayment_schedules.mfi_repayment_schedules_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_2284253bcb52ee9f60fd ON public.mfi_repayment_schedules (company_id);

-- mfi_repayments.mfi_repayments_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_7872c63149c674f69457 ON public.mfi_repayments (company_id);

-- mfi_savings.mfi_savings_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_49246788fda30615d010 ON public.mfi_savings (company_id);

-- mfi_staff_commissions.mfi_staff_commissions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_1b0978986ec68678bfa5 ON public.mfi_staff_commissions (company_id);

-- pos_cash_movements.pos_cash_movements_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_23a43fa65317a58675a6 ON public.pos_cash_movements (company_id);

-- pos_discount_rules.pos_discount_rules_account_company_fkey (company_id, contra_revenue_account_id)
CREATE INDEX IF NOT EXISTS smart_fk_5dd79645821726404eb8 ON public.pos_discount_rules (company_id, contra_revenue_account_id);

-- pos_discount_rules.pos_discount_rules_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_f247e3825d434a9c8bcd ON public.pos_discount_rules (company_id, approval_request_id);

-- pos_discount_rules.pos_discount_rules_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_52b85bd513412cb012bd ON public.pos_discount_rules (company_id);

-- pos_discount_rules.pos_discount_rules_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_3968428851324534a74d ON public.pos_discount_rules (created_by);

-- pos_discount_rules.pos_discount_rules_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_519bd8fbc4602d4847a9 ON public.pos_discount_rules (updated_by);

-- pos_loyalty_ledger.pos_loyalty_ledger_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_69587770b2ff09ae15e4 ON public.pos_loyalty_ledger (company_id);

-- pos_loyalty_ledger.pos_loyalty_ledger_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_830c7d4f6706c4141a67 ON public.pos_loyalty_ledger (created_by);

-- pos_loyalty_ledger.pos_loyalty_ledger_member_company_fkey (company_id, member_id)
CREATE INDEX IF NOT EXISTS smart_fk_28845f3fcbd41f444172 ON public.pos_loyalty_ledger (company_id, member_id);

-- pos_loyalty_ledger.pos_loyalty_ledger_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_86a908d9cf06b724596d ON public.pos_loyalty_ledger (company_id, sale_id);

-- pos_loyalty_ledger.pos_loyalty_ledger_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_d439d067cab2d5e5c5c2 ON public.pos_loyalty_ledger (updated_by);

-- pos_loyalty_members.pos_loyalty_members_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_077827eca38c279f7ab4 ON public.pos_loyalty_members (company_id);

-- pos_loyalty_members.pos_loyalty_members_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_c5a2df0324cc979c815f ON public.pos_loyalty_members (created_by);

-- pos_loyalty_members.pos_loyalty_members_program_company_fkey (company_id, program_id)
CREATE INDEX IF NOT EXISTS smart_fk_2bb6a1e92e64cb4a1d00 ON public.pos_loyalty_members (company_id, program_id);

-- pos_loyalty_members.pos_loyalty_members_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_f514b076b280dea61a65 ON public.pos_loyalty_members (updated_by);

-- pos_loyalty_programs.pos_loyalty_programs_account_company_fkey (company_id, points_liability_account_id)
CREATE INDEX IF NOT EXISTS smart_fk_28a084400e427170b221 ON public.pos_loyalty_programs (company_id, points_liability_account_id);

-- pos_loyalty_programs.pos_loyalty_programs_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_9d1fcdfe473244760dad ON public.pos_loyalty_programs (company_id, approval_request_id);

-- pos_loyalty_programs.pos_loyalty_programs_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_2ec3a5d45d421aa3981f ON public.pos_loyalty_programs (company_id);

-- pos_loyalty_programs.pos_loyalty_programs_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_5678b25c99e21c412407 ON public.pos_loyalty_programs (created_by);

-- pos_loyalty_programs.pos_loyalty_programs_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_9ae87cab4d0154e0c6f0 ON public.pos_loyalty_programs (updated_by);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_applied_by_fkey (applied_by)
CREATE INDEX IF NOT EXISTS smart_fk_a3fbcce826472ece48d8 ON public.pos_loyalty_redemptions (applied_by);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_2c85fcc696d1989406e6 ON public.pos_loyalty_redemptions (company_id, approval_request_id);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_849d9fdf516c60941899 ON public.pos_loyalty_redemptions (company_id);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_255cfe91fb7b5271189b ON public.pos_loyalty_redemptions (created_by);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_journal_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_3b1611d5052b28344d46 ON public.pos_loyalty_redemptions (company_id, journal_batch_id);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_member_company_fkey (company_id, member_id)
CREATE INDEX IF NOT EXISTS smart_fk_5552301424d2757bc9f2 ON public.pos_loyalty_redemptions (company_id, member_id);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_reward_company_fkey (company_id, reward_id)
CREATE INDEX IF NOT EXISTS smart_fk_7f99e9190c6ea40c93c6 ON public.pos_loyalty_redemptions (company_id, reward_id);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_82e2b1c567f76feb4d66 ON public.pos_loyalty_redemptions (company_id, sale_id);

-- pos_loyalty_redemptions.pos_loyalty_redemptions_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_0b4d9c893eeca3b9dbf8 ON public.pos_loyalty_redemptions (updated_by);

-- pos_loyalty_rewards.pos_loyalty_rewards_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_66e7b417a11d0bc06b04 ON public.pos_loyalty_rewards (company_id, approval_request_id);

-- pos_loyalty_rewards.pos_loyalty_rewards_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_deda58554011434e828f ON public.pos_loyalty_rewards (company_id);

-- pos_loyalty_rewards.pos_loyalty_rewards_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_f3fdd12ea92d816bb51a ON public.pos_loyalty_rewards (created_by);

-- pos_loyalty_rewards.pos_loyalty_rewards_inventory_item_id_fkey (inventory_item_id)
CREATE INDEX IF NOT EXISTS smart_fk_ba274476154d7515a64b ON public.pos_loyalty_rewards (inventory_item_id);

-- pos_loyalty_rewards.pos_loyalty_rewards_program_company_fkey (company_id, program_id)
CREATE INDEX IF NOT EXISTS smart_fk_37231dd32c90bf888271 ON public.pos_loyalty_rewards (company_id, program_id);

-- pos_loyalty_rewards.pos_loyalty_rewards_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_a5891d52c417f76aeffc ON public.pos_loyalty_rewards (updated_by);

-- pos_promotion_items.pos_promotion_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_204390eda31964bb909e ON public.pos_promotion_items (company_id);

-- pos_promotion_items.pos_promotion_items_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_cd7f9f12ba08ee7f8ab0 ON public.pos_promotion_items (created_by);

-- pos_promotion_items.pos_promotion_items_promotion_company_fkey (company_id, promotion_id)
CREATE INDEX IF NOT EXISTS smart_fk_58b90919cb2ce9671ad1 ON public.pos_promotion_items (company_id, promotion_id);

-- pos_promotion_items.pos_promotion_items_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_99a308aef811d80cd32c ON public.pos_promotion_items (updated_by);

-- pos_promotions.pos_promotions_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_8671f40b283127cfe2c1 ON public.pos_promotions (company_id, approval_request_id);

-- pos_promotions.pos_promotions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_5577b72c544c235ab8c4 ON public.pos_promotions (company_id);

-- pos_promotions.pos_promotions_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_26488151832d24d35af2 ON public.pos_promotions (created_by);

-- pos_promotions.pos_promotions_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_bb58962da6b4abc52d5d ON public.pos_promotions (updated_by);

-- pos_registers.pos_registers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_40a8322bf7e5e8275101 ON public.pos_registers (company_id);

-- pos_registers.pos_registers_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_a0ba0430d6bbf089a9ee ON public.pos_registers (created_by);

-- pos_registers.pos_registers_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_730fd566a6e4baa2e362 ON public.pos_registers (updated_by);

-- pos_registers.pos_registers_warehouse_id_fkey (warehouse_id)
CREATE INDEX IF NOT EXISTS smart_fk_ca9a44d18f36c5af0341 ON public.pos_registers (warehouse_id);

-- pos_return_commits.pos_return_commits_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_4b39c36c2e266a4cfebe ON public.pos_return_commits (company_id);

-- pos_return_commits.pos_return_commits_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_c05e2a2912365638c4cd ON public.pos_return_commits (created_by);

-- pos_return_commits.pos_return_commits_return_id_fkey (return_id)
CREATE INDEX IF NOT EXISTS smart_fk_924de086ab07bfe74863 ON public.pos_return_commits (return_id);

-- pos_return_headers.pos_return_headers_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_6ae19288e51d8bea48be ON public.pos_return_headers (company_id, approval_request_id);

-- pos_return_headers.pos_return_headers_cashier_id_fkey (cashier_id)
CREATE INDEX IF NOT EXISTS smart_fk_948851196f75a011045e ON public.pos_return_headers (cashier_id);

-- pos_return_headers.pos_return_headers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_3fa0a5c59413e5d13077 ON public.pos_return_headers (company_id);

-- pos_return_headers.pos_return_headers_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_ad9cb5391e16e121375a ON public.pos_return_headers (created_by);

-- pos_return_headers.pos_return_headers_journal_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_4d85adfef3648e7ea761 ON public.pos_return_headers (company_id, journal_batch_id);

-- pos_return_headers.pos_return_headers_posted_by_fkey (posted_by)
CREATE INDEX IF NOT EXISTS smart_fk_d8dc628d763497fb37e7 ON public.pos_return_headers (posted_by);

-- pos_return_headers.pos_return_headers_register_company_fkey (company_id, register_id)
CREATE INDEX IF NOT EXISTS smart_fk_f1f5e6fa6993cb266358 ON public.pos_return_headers (company_id, register_id);

-- pos_return_headers.pos_return_headers_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_cc7d964cac4c20a52d47 ON public.pos_return_headers (company_id, sale_id);

-- pos_return_headers.pos_return_headers_shift_company_fkey (company_id, shift_id)
CREATE INDEX IF NOT EXISTS smart_fk_97d60ce7f43ec3a8df43 ON public.pos_return_headers (company_id, shift_id);

-- pos_return_headers.pos_return_headers_terminal_company_fkey (company_id, terminal_id)
CREATE INDEX IF NOT EXISTS smart_fk_17811470bf5a9d2841f3 ON public.pos_return_headers (company_id, terminal_id);

-- pos_return_headers.pos_return_headers_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_c80d62227c29c281fc30 ON public.pos_return_headers (updated_by);

-- pos_return_items.pos_return_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_b4055945cf813ecfc2b4 ON public.pos_return_items (company_id);

-- pos_return_lines.pos_return_lines_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_7ec762f7c7c91dc7ed38 ON public.pos_return_lines (company_id);

-- pos_return_lines.pos_return_lines_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_b33941e61ab538e095d8 ON public.pos_return_lines (created_by);

-- pos_return_lines.pos_return_lines_return_company_fkey (company_id, return_id)
CREATE INDEX IF NOT EXISTS smart_fk_32314ca5ba034ab08292 ON public.pos_return_lines (company_id, return_id);

-- pos_return_lines.pos_return_lines_sale_line_company_fkey (company_id, sale_line_id)
CREATE INDEX IF NOT EXISTS smart_fk_b6decf68b688b4b02455 ON public.pos_return_lines (company_id, sale_line_id);

-- pos_return_lines.pos_return_lines_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_0f1cb67bfea36761374c ON public.pos_return_lines (updated_by);

-- pos_returns.pos_returns_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_5e3bf7125a6418389682 ON public.pos_returns (company_id);

-- pos_sale_adjustments.pos_sale_adjustments_applied_by_fkey (applied_by)
CREATE INDEX IF NOT EXISTS smart_fk_9a3c0b66639622915251 ON public.pos_sale_adjustments (applied_by);

-- pos_sale_adjustments.pos_sale_adjustments_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_e80799d81a81070fee43 ON public.pos_sale_adjustments (company_id, approval_request_id);

-- pos_sale_adjustments.pos_sale_adjustments_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_87534b2d9695d2637862 ON public.pos_sale_adjustments (company_id);

-- pos_sale_adjustments.pos_sale_adjustments_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_2c0dcb1655997aee5273 ON public.pos_sale_adjustments (created_by);

-- pos_sale_adjustments.pos_sale_adjustments_discount_company_fkey (company_id, discount_rule_id)
CREATE INDEX IF NOT EXISTS smart_fk_3c60c22b788c4da779e2 ON public.pos_sale_adjustments (company_id, discount_rule_id);

-- pos_sale_adjustments.pos_sale_adjustments_journal_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_f64202726ba0dd6a7263 ON public.pos_sale_adjustments (company_id, journal_batch_id);

-- pos_sale_adjustments.pos_sale_adjustments_line_company_fkey (company_id, sale_line_id)
CREATE INDEX IF NOT EXISTS smart_fk_252e13d2f13e8bde1fd6 ON public.pos_sale_adjustments (company_id, sale_line_id);

-- pos_sale_adjustments.pos_sale_adjustments_promotion_company_fkey (company_id, promotion_id)
CREATE INDEX IF NOT EXISTS smart_fk_f87f8ccd027052b7d3a7 ON public.pos_sale_adjustments (company_id, promotion_id);

-- pos_sale_adjustments.pos_sale_adjustments_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_4c511d1b4aa485f8671b ON public.pos_sale_adjustments (company_id, sale_id);

-- pos_sale_adjustments.pos_sale_adjustments_tax_company_fkey (company_id, tax_rule_id)
CREATE INDEX IF NOT EXISTS smart_fk_70871e5c01185fcee9c3 ON public.pos_sale_adjustments (company_id, tax_rule_id);

-- pos_sale_adjustments.pos_sale_adjustments_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_f162d5f8878f13b90c85 ON public.pos_sale_adjustments (updated_by);

-- pos_sale_headers.pos_sale_headers_cashier_id_fkey (cashier_id)
CREATE INDEX IF NOT EXISTS smart_fk_7760d77517a17ee2b317 ON public.pos_sale_headers (cashier_id);

-- pos_sale_headers.pos_sale_headers_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_5f11d064cb871f6ec585 ON public.pos_sale_headers (company_id);

-- pos_sale_headers.pos_sale_headers_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_bd653b74a7eddbb36624 ON public.pos_sale_headers (created_by);

-- pos_sale_headers.pos_sale_headers_journal_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_c49c8304f7939b5303e8 ON public.pos_sale_headers (company_id, journal_batch_id);

-- pos_sale_headers.pos_sale_headers_register_company_fkey (company_id, register_id)
CREATE INDEX IF NOT EXISTS smart_fk_98731feb2f6be7919229 ON public.pos_sale_headers (company_id, register_id);

-- pos_sale_headers.pos_sale_headers_shift_company_fkey (company_id, shift_id)
CREATE INDEX IF NOT EXISTS smart_fk_a7a5abdafffdedd6523c ON public.pos_sale_headers (company_id, shift_id);

-- pos_sale_headers.pos_sale_headers_terminal_company_fkey (company_id, terminal_id)
CREATE INDEX IF NOT EXISTS smart_fk_4fefe3896f2f03d61e95 ON public.pos_sale_headers (company_id, terminal_id);

-- pos_sale_headers.pos_sale_headers_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_467ff0ce3f53185d5de5 ON public.pos_sale_headers (updated_by);

-- pos_sale_lines.pos_sale_lines_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_9f9c182a7544b553b89f ON public.pos_sale_lines (company_id);

-- pos_sale_lines.pos_sale_lines_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_3b6e62c978f108fa6b47 ON public.pos_sale_lines (created_by);

-- pos_sale_lines.pos_sale_lines_legacy_pos_transaction_item_id_fkey (legacy_pos_transaction_item_id)
CREATE INDEX IF NOT EXISTS smart_fk_1ec7fc602c663e8f1878 ON public.pos_sale_lines (legacy_pos_transaction_item_id);

-- pos_sale_lines.pos_sale_lines_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_c78007d0bf7fa9d50ebd ON public.pos_sale_lines (company_id, sale_id);

-- pos_sale_lines.pos_sale_lines_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_e407e1f07904ef56100c ON public.pos_sale_lines (updated_by);

-- pos_sale_tax_lines.pos_sale_tax_lines_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_913d04c60f155a1af8df ON public.pos_sale_tax_lines (company_id);

-- pos_sale_tax_lines.pos_sale_tax_lines_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_bc29c2709f80d16d07ff ON public.pos_sale_tax_lines (created_by);

-- pos_sale_tax_lines.pos_sale_tax_lines_line_company_fkey (company_id, sale_line_id)
CREATE INDEX IF NOT EXISTS smart_fk_b8bea57c230880213a25 ON public.pos_sale_tax_lines (company_id, sale_line_id);

-- pos_sale_tax_lines.pos_sale_tax_lines_rule_company_fkey (company_id, tax_rule_id)
CREATE INDEX IF NOT EXISTS smart_fk_2f4c82bd5103ce5dc86f ON public.pos_sale_tax_lines (company_id, tax_rule_id);

-- pos_sale_tax_lines.pos_sale_tax_lines_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_03bcef7f4eb512005f55 ON public.pos_sale_tax_lines (company_id, sale_id);

-- pos_sale_tax_lines.pos_sale_tax_lines_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_2b30f4bb5dd3059772b1 ON public.pos_sale_tax_lines (updated_by);

-- pos_sale_tenders.pos_sale_tenders_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_d1ae4566e6245c10cb40 ON public.pos_sale_tenders (company_id);

-- pos_sale_tenders.pos_sale_tenders_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_bf9bfec823dcf8c0d366 ON public.pos_sale_tenders (created_by);

-- pos_sale_tenders.pos_sale_tenders_journal_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_f54da13c3afecdd2a6b2 ON public.pos_sale_tenders (company_id, journal_batch_id);

-- pos_sale_tenders.pos_sale_tenders_sale_company_fkey (company_id, sale_id)
CREATE INDEX IF NOT EXISTS smart_fk_a722fdeb30602b55e6b5 ON public.pos_sale_tenders (company_id, sale_id);

-- pos_sale_tenders.pos_sale_tenders_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_5732536739b7fd6826d3 ON public.pos_sale_tenders (updated_by);

-- pos_shift_cash_movements.pos_shift_cash_movements_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_f857311509beac0c789a ON public.pos_shift_cash_movements (company_id, approval_request_id);

-- pos_shift_cash_movements.pos_shift_cash_movements_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_88455d3dd33773e0abd2 ON public.pos_shift_cash_movements (company_id);

-- pos_shift_cash_movements.pos_shift_cash_movements_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_21b25fd44229ab03891d ON public.pos_shift_cash_movements (created_by);

-- pos_shift_cash_movements.pos_shift_cash_movements_journal_company_fkey (company_id, journal_batch_id)
CREATE INDEX IF NOT EXISTS smart_fk_292941cea3ad30470a6a ON public.pos_shift_cash_movements (company_id, journal_batch_id);

-- pos_shift_cash_movements.pos_shift_cash_movements_posted_by_fkey (posted_by)
CREATE INDEX IF NOT EXISTS smart_fk_f7b51f01095527cd2e2c ON public.pos_shift_cash_movements (posted_by);

-- pos_shift_cash_movements.pos_shift_cash_movements_reversal_company_fkey (company_id, reversal_of_movement_id)
CREATE INDEX IF NOT EXISTS smart_fk_bbf7d92d08bb5a632e18 ON public.pos_shift_cash_movements (company_id, reversal_of_movement_id);

-- pos_shift_cash_movements.pos_shift_cash_movements_shift_company_fkey (company_id, shift_id)
CREATE INDEX IF NOT EXISTS smart_fk_c66376b3d3bce0634b7a ON public.pos_shift_cash_movements (company_id, shift_id);

-- pos_shift_cash_movements.pos_shift_cash_movements_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_2fa61f43fc3cb45d3800 ON public.pos_shift_cash_movements (updated_by);

-- pos_shift_sessions.pos_shift_sessions_closed_by_fkey (closed_by)
CREATE INDEX IF NOT EXISTS smart_fk_b5852cec69ebd14cea09 ON public.pos_shift_sessions (closed_by);

-- pos_shift_sessions.pos_shift_sessions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_008052eb6c04bf4ae14f ON public.pos_shift_sessions (company_id);

-- pos_shift_sessions.pos_shift_sessions_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_89a369a02d8381519bd4 ON public.pos_shift_sessions (created_by);

-- pos_shift_sessions.pos_shift_sessions_legacy_pos_shift_id_fkey (legacy_pos_shift_id)
CREATE INDEX IF NOT EXISTS smart_fk_154f9e84af41da7d37e8 ON public.pos_shift_sessions (legacy_pos_shift_id);

-- pos_shift_sessions.pos_shift_sessions_register_company_fkey (company_id, register_id)
CREATE INDEX IF NOT EXISTS smart_fk_ff4996b2aa5bcb8f53d6 ON public.pos_shift_sessions (company_id, register_id);

-- pos_shift_sessions.pos_shift_sessions_terminal_company_fkey (company_id, terminal_id)
CREATE INDEX IF NOT EXISTS smart_fk_fc194135c87fd300bfde ON public.pos_shift_sessions (company_id, terminal_id);

-- pos_shift_sessions.pos_shift_sessions_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_437ed0395f70d25190c6 ON public.pos_shift_sessions (updated_by);

-- pos_shifts.pos_shifts_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_81b75100f88eda2237d8 ON public.pos_shifts (company_id);

-- pos_sync_devices.pos_sync_devices_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_e006707d1195b1923daa ON public.pos_sync_devices (company_id);

-- pos_sync_devices.pos_sync_devices_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_4a362e2632e0bfb536d8 ON public.pos_sync_devices (created_by);

-- pos_sync_devices.pos_sync_devices_terminal_company_fkey (company_id, terminal_id)
CREATE INDEX IF NOT EXISTS smart_fk_b20ec358c915239bbacc ON public.pos_sync_devices (company_id, terminal_id);

-- pos_sync_devices.pos_sync_devices_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_73ab1c7a80733badcb01 ON public.pos_sync_devices (updated_by);

-- pos_sync_events.pos_sync_events_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_40de4172739835c3bedd ON public.pos_sync_events (company_id);

-- pos_sync_events.pos_sync_events_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_689ad0542a5a49f4aeb9 ON public.pos_sync_events (created_by);

-- pos_sync_events.pos_sync_events_transaction_id_fkey (transaction_id)
CREATE INDEX IF NOT EXISTS smart_fk_f6608a5acc997faf4c54 ON public.pos_sync_events (transaction_id);

-- pos_tax_rules.pos_tax_rules_account_company_fkey (company_id, tax_account_id)
CREATE INDEX IF NOT EXISTS smart_fk_3edee59ec172e56fd32b ON public.pos_tax_rules (company_id, tax_account_id);

-- pos_tax_rules.pos_tax_rules_approval_company_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_b16eea50e90e0b9ef551 ON public.pos_tax_rules (company_id, approval_request_id);

-- pos_tax_rules.pos_tax_rules_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_fb3d383afbe9a2c4bd7e ON public.pos_tax_rules (company_id);

-- pos_tax_rules.pos_tax_rules_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_515887514ead962c46a5 ON public.pos_tax_rules (created_by);

-- pos_tax_rules.pos_tax_rules_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_85dd8753633b0abb55c3 ON public.pos_tax_rules (updated_by);

-- pos_terminals.pos_terminals_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_c8671f04149835bc84a7 ON public.pos_terminals (company_id);

-- pos_terminals.pos_terminals_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_690337da53292f7222bb ON public.pos_terminals (created_by);

-- pos_terminals.pos_terminals_register_company_fkey (company_id, register_id)
CREATE INDEX IF NOT EXISTS smart_fk_bc02bf65b8ac5a67b0ae ON public.pos_terminals (company_id, register_id);

-- pos_terminals.pos_terminals_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_c4db89e6c33838179566 ON public.pos_terminals (updated_by);

-- pos_transaction_commits.pos_transaction_commits_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_a44a17e2782ece579ecd ON public.pos_transaction_commits (company_id);

-- pos_transaction_commits.pos_transaction_commits_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_8e5e25e37e30c74d87d4 ON public.pos_transaction_commits (created_by);

-- pos_transaction_commits.pos_transaction_commits_transaction_id_fkey (transaction_id)
CREATE INDEX IF NOT EXISTS smart_fk_7a938f08458929ca977e ON public.pos_transaction_commits (transaction_id);

-- pos_transaction_items.pos_transaction_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_3373e12eb26af0c830d1 ON public.pos_transaction_items (company_id);

-- pos_transactions.pos_transactions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_842788dcf3a33559c265 ON public.pos_transactions (company_id);

-- profiles.profiles_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_5c67817e773a17b4c930 ON public.profiles (company_id);

-- profiles.profiles_id_fkey (id)
CREATE INDEX IF NOT EXISTS smart_fk_06beea0a0766f0feeebe ON public.profiles (id);

-- sales_invoice_items.sales_invoice_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_ec67aa8b5bc442358f77 ON public.sales_invoice_items (company_id);

-- sales_invoice_items.sales_invoice_items_header_fkey (invoice_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_d7471e8173788a17bf89 ON public.sales_invoice_items (invoice_id, company_id);

-- sales_invoices.sales_invoices_order_fkey (order_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_ac6ac690f80eacf3107b ON public.sales_invoices (order_id, company_id);

-- sales_order_items.sales_order_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_96061e1fd687bda71027 ON public.sales_order_items (company_id);

-- sales_order_items.sales_order_items_header_fkey (order_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_95fcede95ba1d63051d4 ON public.sales_order_items (order_id, company_id);

-- sales_order_return_items.sales_order_return_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_cb823410982ecf855990 ON public.sales_order_return_items (company_id);

-- sales_order_return_items.sales_order_return_items_header_fkey (return_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_f50f3abb7b698598fc77 ON public.sales_order_return_items (return_id, company_id);

-- sales_order_returns.sales_order_returns_header_fkey (order_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_ecd3b60d20be4c970c4d ON public.sales_order_returns (order_id, company_id);

-- sales_payments.sales_payments_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_bfec195004c108bc25ae ON public.sales_payments (company_id);

-- sales_payments.sales_payments_invoice_fkey (invoice_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_ff68a5302a997ba525f8 ON public.sales_payments (invoice_id, company_id);

-- sales_quotation_items.sales_quotation_items_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_e8c415507c681fd4b562 ON public.sales_quotation_items (company_id);

-- sales_quotation_items.sales_quotation_items_header_fkey (quotation_id, company_id)
CREATE INDEX IF NOT EXISTS smart_fk_e32a89220c77425e4eda ON public.sales_quotation_items (quotation_id, company_id);

-- sales_subscriptions.sales_subscriptions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_5c32bf4b8bec88f4a09c ON public.sales_subscriptions (company_id);

-- workforce_approval_limits.workforce_approval_limits_assigned_by_fkey (assigned_by)
CREATE INDEX IF NOT EXISTS smart_fk_9c876e4833868210245d ON public.workforce_approval_limits (assigned_by);

-- workforce_approval_limits.workforce_approval_limits_company_id_approval_request_id_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_b9415eb41bbe09d8d8b2 ON public.workforce_approval_limits (company_id, approval_request_id);

-- workforce_approval_limits.workforce_approval_limits_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_7f0aa66757183b2682e4 ON public.workforce_approval_limits (company_id);

-- workforce_approval_limits.workforce_approval_limits_company_id_permission_id_fkey (company_id, permission_id)
CREATE INDEX IF NOT EXISTS smart_fk_98845a9f393dde1e7196 ON public.workforce_approval_limits (company_id, permission_id);

-- workforce_approval_limits.workforce_approval_limits_company_id_target_role_id_fkey (company_id, target_role_id)
CREATE INDEX IF NOT EXISTS smart_fk_ea7491ab1b04746f6bf9 ON public.workforce_approval_limits (company_id, target_role_id);

-- workforce_approval_limits.workforce_approval_limits_revoked_by_fkey (revoked_by)
CREATE INDEX IF NOT EXISTS smart_fk_3825b2ec569ce5a62651 ON public.workforce_approval_limits (revoked_by);

-- workforce_data_scopes.workforce_data_scopes_assigned_by_fkey (assigned_by)
CREATE INDEX IF NOT EXISTS smart_fk_278aaad9fadec3dc6874 ON public.workforce_data_scopes (assigned_by);

-- workforce_data_scopes.workforce_data_scopes_company_id_approval_request_id_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_03bec21b9b62114f6a20 ON public.workforce_data_scopes (company_id, approval_request_id);

-- workforce_data_scopes.workforce_data_scopes_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_0f7c0949c2eeee394cbe ON public.workforce_data_scopes (company_id);

-- workforce_data_scopes.workforce_data_scopes_company_id_target_role_id_fkey (company_id, target_role_id)
CREATE INDEX IF NOT EXISTS smart_fk_852e9409cf456ffe48be ON public.workforce_data_scopes (company_id, target_role_id);

-- workforce_data_scopes.workforce_data_scopes_revoked_by_fkey (revoked_by)
CREATE INDEX IF NOT EXISTS smart_fk_a9db46643dd268c3ff30 ON public.workforce_data_scopes (revoked_by);

-- workforce_member_roles.workforce_member_roles_assigned_by_fkey (assigned_by)
CREATE INDEX IF NOT EXISTS smart_fk_014c65ea9d7a20195ff6 ON public.workforce_member_roles (assigned_by);

-- workforce_member_roles.workforce_member_roles_company_id_approval_request_id_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_302c16f3c38ccba33dbf ON public.workforce_member_roles (company_id, approval_request_id);

-- workforce_member_roles.workforce_member_roles_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_0940334f8fc0f8f5881b ON public.workforce_member_roles (company_id);

-- workforce_member_roles.workforce_member_roles_company_id_role_id_fkey (company_id, role_id)
CREATE INDEX IF NOT EXISTS smart_fk_d5c693d7dff3449668a3 ON public.workforce_member_roles (company_id, role_id);

-- workforce_member_roles.workforce_member_roles_revoked_by_fkey (revoked_by)
CREATE INDEX IF NOT EXISTS smart_fk_a3e607ff93a3c4ee494a ON public.workforce_member_roles (revoked_by);

-- workforce_module_access.workforce_module_access_assigned_by_fkey (assigned_by)
CREATE INDEX IF NOT EXISTS smart_fk_73ea922fd60d050496ed ON public.workforce_module_access (assigned_by);

-- workforce_module_access.workforce_module_access_company_id_approval_request_id_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_a9bdeef808d0bed52fe1 ON public.workforce_module_access (company_id, approval_request_id);

-- workforce_module_access.workforce_module_access_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_cc6024b9573d36ca5f49 ON public.workforce_module_access (company_id);

-- workforce_module_access.workforce_module_access_company_id_target_role_id_fkey (company_id, target_role_id)
CREATE INDEX IF NOT EXISTS smart_fk_6873bc0f4a3777c4ccaa ON public.workforce_module_access (company_id, target_role_id);

-- workforce_module_access.workforce_module_access_revoked_by_fkey (revoked_by)
CREATE INDEX IF NOT EXISTS smart_fk_99bde6e9cf29e15c3eda ON public.workforce_module_access (revoked_by);

-- workforce_permission_conflicts.workforce_permission_conflicts_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_ae75293e8a3dce7c60ed ON public.workforce_permission_conflicts (company_id);

-- workforce_permission_conflicts.workforce_permission_conflicts_company_id_permission_a_id_fkey (company_id, permission_a_id)
CREATE INDEX IF NOT EXISTS smart_fk_fd61056211d188e0ff98 ON public.workforce_permission_conflicts (company_id, permission_a_id);

-- workforce_permission_conflicts.workforce_permission_conflicts_company_id_permission_b_id_fkey (company_id, permission_b_id)
CREATE INDEX IF NOT EXISTS smart_fk_530c73fc58fa08e35f38 ON public.workforce_permission_conflicts (company_id, permission_b_id);

-- workforce_permission_conflicts.workforce_permission_conflicts_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_7357c571c18d2b8a0cad ON public.workforce_permission_conflicts (created_by);

-- workforce_permission_conflicts.workforce_permission_conflicts_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_d112bfabd5316beeb6c1 ON public.workforce_permission_conflicts (updated_by);

-- workforce_permissions.workforce_permissions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_a2f6350138fa7a9f4d91 ON public.workforce_permissions (company_id);

-- workforce_permissions.workforce_permissions_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_26f006c985cb41f7142c ON public.workforce_permissions (created_by);

-- workforce_permissions.workforce_permissions_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_c1eea58ec566446bd1b2 ON public.workforce_permissions (updated_by);

-- workforce_role_permissions.workforce_role_permissions_company_id_approval_request_id_fkey (company_id, approval_request_id)
CREATE INDEX IF NOT EXISTS smart_fk_0ba93b1901428922dd3e ON public.workforce_role_permissions (company_id, approval_request_id);

-- workforce_role_permissions.workforce_role_permissions_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_df4f609c3b3ee193d899 ON public.workforce_role_permissions (company_id);

-- workforce_role_permissions.workforce_role_permissions_company_id_permission_id_fkey (company_id, permission_id)
CREATE INDEX IF NOT EXISTS smart_fk_579d113a4031edf5ab7d ON public.workforce_role_permissions (company_id, permission_id);

-- workforce_role_permissions.workforce_role_permissions_company_id_role_id_fkey (company_id, role_id)
CREATE INDEX IF NOT EXISTS smart_fk_6c8586d6d43960a88046 ON public.workforce_role_permissions (company_id, role_id);

-- workforce_role_permissions.workforce_role_permissions_granted_by_fkey (granted_by)
CREATE INDEX IF NOT EXISTS smart_fk_2e12440d1e3d3122d8fd ON public.workforce_role_permissions (granted_by);

-- workforce_role_permissions.workforce_role_permissions_revoked_by_fkey (revoked_by)
CREATE INDEX IF NOT EXISTS smart_fk_d878507314a1f25b8fa3 ON public.workforce_role_permissions (revoked_by);

-- workforce_roles.workforce_roles_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_169b47838e6a64dec754 ON public.workforce_roles (company_id);

-- workforce_roles.workforce_roles_created_by_fkey (created_by)
CREATE INDEX IF NOT EXISTS smart_fk_22b6f6fc8f03625791f7 ON public.workforce_roles (created_by);

-- workforce_roles.workforce_roles_updated_by_fkey (updated_by)
CREATE INDEX IF NOT EXISTS smart_fk_bd0bb945eccb472f9155 ON public.workforce_roles (updated_by);

-- workspaces.workspaces_company_id_fkey (company_id)
CREATE INDEX IF NOT EXISTS smart_fk_32732458e76a18268bce ON public.workspaces (company_id);

COMMIT;

-- Generated candidate count: 327.
-- Re-run the bounded catalog query after application; the remaining candidate count
-- should decline, and any residual findings should be reviewed independently.
