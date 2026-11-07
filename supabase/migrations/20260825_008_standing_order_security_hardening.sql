-- Standing Order security hardening.
-- Pins all function search paths and keeps authenticated execution only on
-- intentional tenant/role-checked RPC entry points. Internal helpers and
-- immutable triggers remain unavailable to client roles.
BEGIN;

-- Pin the search path for every Standing Order function. pg_catalog is first so
-- built-in names cannot be shadowed by objects in an exposed schema.
ALTER FUNCTION public.bank_standing_order_raise(text, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_standing_order_request_fingerprint(jsonb)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_standing_order_normalize_msisdn(text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_standing_order_next_date(date, text, integer)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_standing_order_response(uuid, boolean, uuid, uuid, uuid)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_standing_order_events_immutable()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_list_standing_orders(text, text, integer, integer)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_get_standing_order(uuid)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_create_standing_order(jsonb)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_submit_standing_order(uuid, bigint, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_approve_standing_order(uuid, text, text, bigint, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_activate_standing_order(uuid, bigint, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_pause_standing_order(uuid, text, bigint, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_resume_standing_order(uuid, bigint, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_cancel_standing_order(uuid, text, bigint, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_run_standing_orders(date, uuid, integer)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_run_standing_orders()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_confirm_standing_order_provider_payment(uuid, text, text, text, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.bank_retry_standing_order_run(uuid, text)
  SET search_path = pg_catalog, public, auth;

-- The bounded read model can rely on the caller's SELECT privilege plus the
-- tenant policy, so it no longer needs SECURITY DEFINER execution.
ALTER FUNCTION public.bank_list_standing_orders(text, text, integer, integer)
  SECURITY INVOKER;

-- Internal helpers and the append-only event trigger are not client-callable.
REVOKE ALL ON FUNCTION public.bank_standing_order_raise(text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_request_fingerprint(jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_normalize_msisdn(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_next_date(date, text, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_response(uuid, boolean, uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_events_immutable()
  FROM PUBLIC, anon, authenticated;

-- Authenticated execution remains only for RPCs that establish auth.uid(),
-- current-company context, role checks, optimistic versions, and audit/event
-- writes internally. Anonymous and PUBLIC execution remains revoked.
REVOKE ALL ON FUNCTION public.bank_list_standing_orders(text, text, integer, integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_get_standing_order(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_create_standing_order(jsonb)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_submit_standing_order(uuid, bigint, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_approve_standing_order(uuid, text, text, bigint, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_activate_standing_order(uuid, bigint, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_pause_standing_order(uuid, text, bigint, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_resume_standing_order(uuid, bigint, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_cancel_standing_order(uuid, text, bigint, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date, uuid, integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_standing_orders()
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_confirm_standing_order_provider_payment(uuid, text, text, text, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_retry_standing_order_run(uuid, text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bank_list_standing_orders(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_get_standing_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_submit_standing_order(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_approve_standing_order(uuid, text, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_activate_standing_order(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_pause_standing_order(uuid, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_resume_standing_order(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_cancel_standing_order(uuid, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders(date, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_confirm_standing_order_provider_payment(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_retry_standing_order_run(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.bank_confirm_standing_order_provider_payment(uuid, text, text, text, text)
  IS 'Authenticated operator RPC retained for the current controlled reconciliation path; it is not a cryptographically verified external provider webhook.';

COMMIT;
