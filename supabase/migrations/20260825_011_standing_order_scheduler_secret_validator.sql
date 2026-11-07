-- Service-only Vault-backed validator for the Standing Order scheduler.
-- The Edge Function uses the dedicated automation secret as its inbound
-- credential, while the secret value remains encrypted in Supabase Vault.
BEGIN;

CREATE OR REPLACE FUNCTION public.bank_validate_scheduler_secret(p_secret text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT coalesce(
    EXISTS (
      SELECT 1
      FROM vault.decrypted_secrets
      WHERE name = 'standing_order_scheduler_automation'
        AND decrypted_secret = p_secret
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.bank_validate_scheduler_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bank_validate_scheduler_secret(text) TO service_role;

COMMENT ON FUNCTION public.bank_validate_scheduler_secret(text)
  IS 'Service-role-only validator for the dedicated Standing Order scheduler automation secret stored in Vault.';

COMMIT;
