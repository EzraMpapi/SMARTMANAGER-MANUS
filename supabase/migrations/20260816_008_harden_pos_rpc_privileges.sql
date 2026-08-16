BEGIN;

-- Explicit role revocations are required because PostgreSQL's function
-- defaults can leave PUBLIC/anon execute grants in place even after later
-- function replacement. POS RPCs must never execute for an anonymous caller.
REVOKE ALL ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_pos_return(text, uuid, jsonb, text, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_pos_sync_event(text, text, uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pos_return(text, uuid, jsonb, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_pos_sync_event(text, text, uuid, text) TO authenticated;

COMMIT;
