-- DRAFT ONLY: this file is a bridge contract, not a migration.
-- Apply only after the bank_private implementation has been reviewed and
-- installed through a numbered Supabase migration.

CREATE OR REPLACE FUNCTION public.bank_scheduler_tick(
  p_run_date date,
  p_order_id uuid DEFAULT NULL,
  p_max_orders integer DEFAULT 250,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.run_standing_orders(
    p_run_date,
    p_order_id,
    p_max_orders,
    p_execution_id,
    p_requested_by
  );
$$;

REVOKE ALL ON FUNCTION public.bank_scheduler_tick(date, uuid, integer, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bank_scheduler_tick(date, uuid, integer, uuid, uuid)
  TO service_role;

COMMENT ON FUNCTION public.bank_scheduler_tick(date, uuid, integer, uuid, uuid)
  IS 'Service-only bridge to the private Standing Order scheduler implementation. No browser or anonymous execution.';

-- Required private implementation contract:
--
-- bank_private.run_standing_orders(
--   p_run_date date,
--   p_order_id uuid DEFAULT NULL,
--   p_max_orders integer DEFAULT 250,
--   p_execution_id uuid
-- ) RETURNS jsonb
--
-- The private function must enforce deterministic occurrence keys, row locking,
-- retry limits, provider-pending state, tenant/order predicates, and audit
-- attribution. It must not use auth.uid() as scheduler identity or accept a
-- client-provided company_id. Use explicit public.* qualifications and a
-- pinned search_path in the implementation.
