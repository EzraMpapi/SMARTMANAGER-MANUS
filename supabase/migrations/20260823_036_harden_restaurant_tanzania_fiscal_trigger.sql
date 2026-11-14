-- Internal trigger helper: callable only by table trigger execution, never through public RPC.
BEGIN;
REVOKE ALL ON FUNCTION public.restaurant_enqueue_fiscal_receipt() FROM PUBLIC,anon,authenticated;
COMMIT;
