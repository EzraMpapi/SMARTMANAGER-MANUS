-- Remove only the redundant unique indexes introduced alongside the
-- constraint-backed unique indexes in team_invitations.
-- The UNIQUE constraints remain authoritative and their backing indexes are
-- preserved. No rows, constraints, RLS policies, or grants are changed.
BEGIN;
DROP INDEX IF EXISTS public.team_invitations_invitation_id_idx;
DROP INDEX IF EXISTS public.team_invitations_token_hash_idx;
COMMIT;
