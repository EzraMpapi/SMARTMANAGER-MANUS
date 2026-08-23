-- Applied to production through the Supabase connector on 2026-08-23.
-- Remote migration name: fk_index_optimization_p0_review_20260823
-- Scope: exactly the five explicitly authorized P0 foreign-key indexes.
-- Safety: no DROP INDEX, foreign-key, RLS, grant, policy, or P1/P2 changes.
BEGIN;

CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_company_id_approval_request_id_fk"
  ON public.workforce_role_permissions (company_id, approval_request_id);

CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_granted_by_fk"
  ON public.workforce_role_permissions (granted_by);

CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_revoked_by_fk"
  ON public.workforce_role_permissions (revoked_by);

CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_created_by_fk"
  ON public.workforce_permissions (created_by);

CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_updated_by_fk"
  ON public.workforce_permissions (updated_by);

COMMIT;
