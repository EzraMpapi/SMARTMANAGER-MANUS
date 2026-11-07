-- Security hardening for Supabase advisor findings.
-- Preserve existing trigger behavior and protected Money Agent RPC access.
BEGIN;

-- These trigger functions do not need auth or other non-public objects. Pinning
-- public first and keeping pg_temp available prevents search_path hijacking.
ALTER FUNCTION public.community_groups_touch_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.money_agent_block_direct_mutation()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.property_touch()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.property_immutable_guard()
  SET search_path = public, pg_temp;

-- PIN hashes are sensitive credentials. The table is intentionally accessed by
-- protected SECURITY DEFINER Money Agent workflows, not through PostgREST.
ALTER TABLE public.money_agent_pin_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS money_agent_pin_credentials_no_direct_access
  ON public.money_agent_pin_credentials;
CREATE POLICY money_agent_pin_credentials_no_direct_access
  ON public.money_agent_pin_credentials
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMIT;
