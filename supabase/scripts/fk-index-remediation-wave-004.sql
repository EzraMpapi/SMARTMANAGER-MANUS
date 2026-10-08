-- SMART MANAGER FK advisor remediation wave 004.
-- Review artifact generated from the refreshed live Supabase catalog on 2026-08-25.
-- Apply one CREATE INDEX CONCURRENTLY statement at a time outside a transaction.
-- No DDL was executed by this generator.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_data_scopes_workforce_data_scopes_target_pro_f1fb3ee2" ON public."workforce_data_scopes" ("target_profile_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_member_roles_workforce_member_roles_assigned_885d252b" ON public."workforce_member_roles" ("assigned_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_member_roles_workforce_member_roles_company__e45a9aa5" ON public."workforce_member_roles" ("company_id", "approval_request_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_member_roles_workforce_member_roles_company__1ee549ce" ON public."workforce_member_roles" ("company_id", "role_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_member_roles_workforce_member_roles_employee_b2265ab6" ON public."workforce_member_roles" ("employee_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_member_roles_workforce_member_roles_profile__c061eb7a" ON public."workforce_member_roles" ("profile_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_member_roles_workforce_member_roles_revoked__7888d08b" ON public."workforce_member_roles" ("revoked_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_module_access_workforce_module_access_assign_84260953" ON public."workforce_module_access" ("assigned_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_module_access_workforce_module_access_compan_c808aa56" ON public."workforce_module_access" ("company_id", "approval_request_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_module_access_workforce_module_access_revoke_ed8d2912" ON public."workforce_module_access" ("revoked_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_module_access_workforce_module_access_target_863da3df" ON public."workforce_module_access" ("target_profile_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_ff4b3c5b" ON public."workforce_permission_conflicts" ("company_id", "permission_a_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_09dc75b9" ON public."workforce_permission_conflicts" ("company_id", "permission_b_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_288e93fe" ON public."workforce_permission_conflicts" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_864e453e" ON public."workforce_permission_conflicts" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_roles_workforce_roles_created_by_fkey_fk_idx_e8fd23a6" ON public."workforce_roles" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "workforce_roles_workforce_roles_updated_by_fkey_fk_idx_2cf02e47" ON public."workforce_roles" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_discount_rules_pos_discount_rules_account_company__603a2e01" ON public."pos_discount_rules" ("company_id", "contra_revenue_account_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_discount_rules_pos_discount_rules_approval_company_90a64395" ON public."pos_discount_rules" ("company_id", "approval_request_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_discount_rules_pos_discount_rules_created_by_fkey__98954a99" ON public."pos_discount_rules" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_discount_rules_pos_discount_rules_inventory_item_i_b0e971f8" ON public."pos_discount_rules" ("inventory_item_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_discount_rules_pos_discount_rules_updated_by_fkey__e4c29d94" ON public."pos_discount_rules" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_loyalty_ledger_pos_loyalty_ledger_created_by_fkey__050711e2" ON public."pos_loyalty_ledger" ("created_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_loyalty_ledger_pos_loyalty_ledger_updated_by_fkey__a1c4d29e" ON public."pos_loyalty_ledger" ("updated_by");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pos_loyalty_members_pos_loyalty_members_created_by_fke_1d23d08e" ON public."pos_loyalty_members" ("created_by");
