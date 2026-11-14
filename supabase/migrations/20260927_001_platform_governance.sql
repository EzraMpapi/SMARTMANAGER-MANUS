BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_governance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('role_change','team_invitation','business_network')),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  decision_note text,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_governance_requests_queue_idx
  ON public.platform_governance_requests(status, request_type, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_governance_requests_company_idx
  ON public.platform_governance_requests(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_governance_requests_requester_idx
  ON public.platform_governance_requests(requested_by, created_at DESC);

CREATE TABLE IF NOT EXISTS public.business_network_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','suspended')),
  network_name text,
  domain text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_network_verifications_active_company_idx
  ON public.business_network_verifications(company_id)
  WHERE status IN ('pending','verified');

ALTER TABLE public.platform_governance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_network_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_governance_requests, public.business_network_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_governance_requests, public.business_network_verifications TO service_role;

DROP POLICY IF EXISTS platform_governance_service_role_access ON public.platform_governance_requests;
CREATE POLICY platform_governance_service_role_access ON public.platform_governance_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS business_network_service_role_access ON public.business_network_verifications;
CREATE POLICY business_network_service_role_access ON public.business_network_verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
