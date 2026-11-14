-- Team invitations must use the production Supabase data plane.
-- The former server implementation depended on the optional MySQL DATABASE_URL;
-- when that variable was absent, every invite mutation returned
-- "Team invitations are temporarily unavailable.".
--
-- Safety boundaries:
--   * This migration creates only the missing invitation table and its indexes.
--   * Existing companies, profiles, memberships, RLS, and business data are not
--     modified or deleted.
--   * Client roles receive no direct table privileges. The server validates the
--     bearer session and tenant profile before using the server-side key.
--   * The service role grant is intentionally server-only and must never be sent
--     to the browser.

BEGIN;

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired', 'delivery_failed')),
  invited_by_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  invited_by_role text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  delivery_message_id text,
  delivery_error text,
  email_sent_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_invitations_invitation_id_unique UNIQUE (invitation_id),
  CONSTRAINT team_invitations_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT team_invitations_email_check CHECK (length(trim(email)) BETWEEN 3 AND 320),
  CONSTRAINT team_invitations_full_name_check CHECK (length(trim(full_name)) BETWEEN 2 AND 120),
  CONSTRAINT team_invitations_role_check CHECK (length(trim(role)) BETWEEN 2 AND 80)
);

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS invitation_id text,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invited_by_profile_id uuid,
  ADD COLUMN IF NOT EXISTS invited_by_role text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by_profile_id uuid,
  ADD COLUMN IF NOT EXISTS delivery_message_id text,
  ADD COLUMN IF NOT EXISTS delivery_error text,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS team_invitations_company_status_idx
  ON public.team_invitations(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS team_invitations_company_email_idx
  ON public.team_invitations(company_id, email, status);
CREATE INDEX IF NOT EXISTS team_invitations_expires_at_idx
  ON public.team_invitations(expires_at)
  WHERE status = 'pending';

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.team_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.team_invitations TO service_role;

DROP POLICY IF EXISTS team_invitations_service_role_access ON public.team_invitations;
CREATE POLICY team_invitations_service_role_access
  ON public.team_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
