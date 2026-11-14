-- REVIEW-ONLY EXTERNAL PLAN: not a Supabase transaction migration and not applied automatically.
-- Snapshot: 2026-08-23T19:55:42.090Z
-- Selected bounded review set: 24 P0/P1 indexes; P2 backlog is intentionally excluded from executable SQL.
-- Run each statement separately during an approved maintenance workflow; CREATE INDEX CONCURRENTLY cannot run inside a transaction-managed migration.
-- Preflight each candidate against pg_indexes/pg_stat_user_indexes and confirm lock, storage, and query-plan impact.

-- P0_POPULATED_OR_HOT workforce_role_permissions.company_id, approval_request_id | rows=469 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_role_permissions_company_id_approval_request_id_fk" ON "public"."workforce_role_permissions" ("company_id", "approval_request_id");

-- P0_POPULATED_OR_HOT workforce_role_permissions.granted_by | rows=469 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_role_permissions_granted_by_fk" ON "public"."workforce_role_permissions" ("granted_by");

-- P0_POPULATED_OR_HOT workforce_role_permissions.revoked_by | rows=469 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_role_permissions_revoked_by_fk" ON "public"."workforce_role_permissions" ("revoked_by");

-- P0_POPULATED_OR_HOT workforce_permissions.created_by | rows=140 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_permissions_created_by_fk" ON "public"."workforce_permissions" ("created_by");

-- P0_POPULATED_OR_HOT workforce_permissions.updated_by | rows=140 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_permissions_updated_by_fk" ON "public"."workforce_permissions" ("updated_by");

-- P1_ADVISOR_TRANSACTION workforce_roles.created_by | rows=42 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_roles_created_by_fk" ON "public"."workforce_roles" ("created_by");

-- P1_ADVISOR_TRANSACTION workforce_roles.updated_by | rows=42 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_roles_updated_by_fk" ON "public"."workforce_roles" ("updated_by");

-- P1_ADVISOR_TRANSACTION workforce_permission_conflicts.company_id, permission_a_id | rows=21 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_permission_conflicts_company_id_permission_a_id_fk" ON "public"."workforce_permission_conflicts" ("company_id", "permission_a_id");

-- P1_ADVISOR_TRANSACTION workforce_permission_conflicts.company_id, permission_b_id | rows=21 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_permission_conflicts_company_id_permission_b_id_fk" ON "public"."workforce_permission_conflicts" ("company_id", "permission_b_id");

-- P1_ADVISOR_TRANSACTION workforce_permission_conflicts.created_by | rows=21 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_permission_conflicts_created_by_fk" ON "public"."workforce_permission_conflicts" ("created_by");

-- P1_ADVISOR_TRANSACTION workforce_permission_conflicts.updated_by | rows=21 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_workforce_permission_conflicts_updated_by_fk" ON "public"."workforce_permission_conflicts" ("updated_by");

-- P1_ADVISOR_TRANSACTION billing_plan_audit_log.company_id | rows=13 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_billing_plan_audit_log_company_id_fk" ON "public"."billing_plan_audit_log" ("company_id");

-- P1_ADVISOR_TRANSACTION sales_payments.invoice_id, company_id | rows=12 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_sales_payments_invoice_id_company_id_fk" ON "public"."sales_payments" ("invoice_id", "company_id");

-- P1_ADVISOR_TRANSACTION pos_transaction_commits.created_by | rows=5 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_pos_transaction_commits_created_by_fk" ON "public"."pos_transaction_commits" ("created_by");

-- P1_ADVISOR_TRANSACTION pos_transaction_commits.transaction_id | rows=5 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_pos_transaction_commits_transaction_id_fk" ON "public"."pos_transaction_commits" ("transaction_id");

-- P1_ADVISOR_TRANSACTION pos_sync_events.created_by | rows=4 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_pos_sync_events_created_by_fk" ON "public"."pos_sync_events" ("created_by");

-- P1_ADVISOR_TRANSACTION pos_sync_events.transaction_id | rows=4 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_pos_sync_events_transaction_id_fk" ON "public"."pos_sync_events" ("transaction_id");

-- P1_ADVISOR_TRANSACTION community_group_audit_log.company_id | rows=3 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_community_group_audit_log_company_id_fk" ON "public"."community_group_audit_log" ("company_id");

-- P1_ADVISOR_TRANSACTION hospitality_audit_log.company_id | rows=3 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_audit_log_company_id_fk" ON "public"."hospitality_audit_log" ("company_id");

-- P1_ADVISOR_TRANSACTION pos_return_commits.created_by | rows=2 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_pos_return_commits_created_by_fk" ON "public"."pos_return_commits" ("created_by");

-- P1_ADVISOR_TRANSACTION pos_return_commits.return_id | rows=2 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_pos_return_commits_return_id_fk" ON "public"."pos_return_commits" ("return_id");

-- P1_ADVISOR_TRANSACTION sales_invoice_items.invoice_id, company_id | rows=2 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_sales_invoice_items_invoice_id_company_id_fk" ON "public"."sales_invoice_items" ("invoice_id", "company_id");

-- P1_ADVISOR_TRANSACTION sales_invoices.order_id, company_id | rows=1 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_sales_invoices_order_id_company_id_fk" ON "public"."sales_invoices" ("order_id", "company_id");

-- P1_ADVISOR_TRANSACTION sales_quotation_items.quotation_id, company_id | rows=1 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_sales_quotation_items_quotation_id_company_id_fk" ON "public"."sales_quotation_items" ("quotation_id", "company_id");
