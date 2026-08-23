-- REVIEW-ONLY EXTERNAL PLAN: not a Supabase transaction migration and not applied automatically.
-- Snapshot: 2026-08-23T18:23:11.061Z
-- Selected bounded review set: 6 P0/P1 indexes; P2 backlog is intentionally excluded from executable SQL.
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

-- P1_ADVISOR_TRANSACTION hospitality_audit_log.company_id | rows=3 | advisor=true
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_audit_log_company_id_fk" ON "public"."hospitality_audit_log" ("company_id");
