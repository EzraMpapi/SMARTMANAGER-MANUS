-- REVIEW-ONLY GENERATED ARTIFACT: not applied automatically.
-- Snapshot: 2026-08-23T19:55:42.090Z
-- Catalog: 1097 foreign keys; 640 uncovered; 457 covered.
-- This migration contains only the bounded P0 populated/hot subset (5 indexes), not all uncovered relationships.
-- Safety: no DROP INDEX, no foreign-key/RLS/grant changes, no CONCURRENTLY inside this transaction-managed migration.
-- Re-run the generator after a fresh catalog audit and review EXPLAIN/lock impact before applying.

BEGIN;

-- workforce_role_permissions.company_id, approval_request_id <- fin_approval_requests.company_id, id | rows=469 | advisor=true
CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_company_id_approval_request_id_fk" ON "public"."workforce_role_permissions" ("company_id", "approval_request_id");

-- workforce_role_permissions.granted_by <- profiles.id | rows=469 | advisor=true
CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_granted_by_fk" ON "public"."workforce_role_permissions" ("granted_by");

-- workforce_role_permissions.revoked_by <- profiles.id | rows=469 | advisor=true
CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_revoked_by_fk" ON "public"."workforce_role_permissions" ("revoked_by");

-- workforce_permissions.created_by <- profiles.id | rows=140 | advisor=true
CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_created_by_fk" ON "public"."workforce_permissions" ("created_by");

-- workforce_permissions.updated_by <- profiles.id | rows=140 | advisor=true
CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_updated_by_fk" ON "public"."workforce_permissions" ("updated_by");

COMMIT;
