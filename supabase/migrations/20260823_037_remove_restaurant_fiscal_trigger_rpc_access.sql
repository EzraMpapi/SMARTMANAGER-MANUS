-- The fiscal enqueue function is invoked by its table trigger; no database role requires direct RPC execution.
BEGIN;
REVOKE ALL ON FUNCTION public.restaurant_enqueue_fiscal_receipt() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
