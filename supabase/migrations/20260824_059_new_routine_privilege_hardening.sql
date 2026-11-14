-- Narrow post-rollout hardening for routines introduced by 20260824_050 through 20260824_058.
-- This migration does not change table data or existing legacy RPC contracts.
BEGIN;

-- Pin search paths for all new helper, trigger, policy, and RPC routines.
ALTER FUNCTION public.fin_touch_updated_at() SET search_path = public, auth;
ALTER FUNCTION public.fin_has_role(text[]) SET search_path = public, auth;
ALTER FUNCTION public.fin_can_view() SET search_path = public, auth;
ALTER FUNCTION public.fin_can_manage() SET search_path = public, auth;
ALTER FUNCTION public.fin_can_approve() SET search_path = public, auth;
ALTER FUNCTION public.fin_require(text) SET search_path = public, auth;
ALTER FUNCTION public.fin_journal_copy_date() SET search_path = public, auth;
ALTER FUNCTION public.fin_block_direct_mutation() SET search_path = public, auth;

ALTER FUNCTION public.pos_register_assert_scope() SET search_path = public, auth;
ALTER FUNCTION public.pos_shift_assert_scope() SET search_path = public, auth;
ALTER FUNCTION public.pos_block_closed_shift_mutation() SET search_path = public, auth;
ALTER FUNCTION public.pos_block_cash_movement_mutation() SET search_path = public, auth;
ALTER FUNCTION public.pos_require_operate() SET search_path = public, auth;
ALTER FUNCTION public.pos_open_shift(uuid, uuid, uuid, date, numeric, text, text, text) SET search_path = public, auth;
ALTER FUNCTION public.pos_record_cash_movement(uuid, text, numeric, text, text, text, text, uuid) SET search_path = public, auth;
ALTER FUNCTION public.pos_block_sensitive_shift_update() SET search_path = public, auth;
ALTER FUNCTION public.pos_sync_device_sequence_guard() SET search_path = public, auth;
ALTER FUNCTION public.pos_accept_sync_device_sequence(uuid, bigint, text) SET search_path = public, auth;
ALTER FUNCTION public.pos_sales_assert_scope() SET search_path = public, auth;
ALTER FUNCTION public.pos_sale_lines_assert_scope() SET search_path = public, auth;
ALTER FUNCTION public.pos_tenders_assert_state() SET search_path = public, auth;
ALTER FUNCTION public.pos_returns_assert_scope() SET search_path = public, auth;
ALTER FUNCTION public.pos_pricing_scope_assert() SET search_path = public, auth;
ALTER FUNCTION public.pos_pricing_touch_updated_at() SET search_path = public, auth;

ALTER FUNCTION public.workforce_touch_updated_at() SET search_path = public, auth;
ALTER FUNCTION public.workforce_is_privileged() SET search_path = public, auth;
ALTER FUNCTION public.workforce_has_permission(text) SET search_path = public, auth;
ALTER FUNCTION public.workforce_require(text) SET search_path = public, auth;
ALTER FUNCTION public.workforce_validate_scope() SET search_path = public, auth;
ALTER FUNCTION public.workforce_audit(text, text, jsonb) SET search_path = public, auth;
ALTER FUNCTION public.workforce_require_assignment_authority() SET search_path = public, auth;
ALTER FUNCTION public.workforce_require_assignment_approval_authority() SET search_path = public, auth;
ALTER FUNCTION public.workforce_request_role_assignment(uuid, uuid, text, text, timestamptz, timestamptz, uuid, text) SET search_path = public, auth;
ALTER FUNCTION public.workforce_decide_role_assignment(uuid, text, text, text, text, bigint) SET search_path = public, auth;

-- Trigger/internal helpers must not be callable through PostgREST RPC.
REVOKE ALL ON FUNCTION public.fin_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fin_journal_copy_date() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fin_block_direct_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_register_assert_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_shift_assert_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_block_closed_shift_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_block_cash_movement_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_block_sensitive_shift_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_sync_device_sequence_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_sales_assert_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_sale_lines_assert_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_tenders_assert_state() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_returns_assert_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_pricing_scope_assert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_pricing_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_validate_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_audit(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_require_assignment_authority() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_require_assignment_approval_authority() FROM PUBLIC, anon, authenticated;

-- Permission/identity helpers are authenticated-only; write RPCs remain authenticated-only.
REVOKE ALL ON FUNCTION public.fin_has_role(text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fin_can_view() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fin_can_manage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fin_can_approve() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fin_require(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_has_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_can_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_can_manage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_can_approve() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_require(text) TO authenticated;

REVOKE ALL ON FUNCTION public.pos_require_operate() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pos_open_shift(uuid, uuid, uuid, date, numeric, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pos_record_cash_movement(uuid, text, numeric, text, text, text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pos_accept_sync_device_sequence(uuid, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_require_operate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_open_shift(uuid, uuid, uuid, date, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_record_cash_movement(uuid, text, numeric, text, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_accept_sync_device_sequence(uuid, bigint, text) TO authenticated;

REVOKE ALL ON FUNCTION public.workforce_is_privileged() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.workforce_has_permission(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.workforce_require(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workforce_is_privileged() TO authenticated;
GRANT EXECUTE ON FUNCTION public.workforce_has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workforce_require(text) TO authenticated;

REVOKE ALL ON FUNCTION public.workforce_request_role_assignment(uuid, uuid, text, text, timestamptz, timestamptz, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.workforce_decide_role_assignment(uuid, text, text, text, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workforce_request_role_assignment(uuid, uuid, text, text, timestamptz, timestamptz, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workforce_decide_role_assignment(uuid, text, text, text, text, bigint) TO authenticated;

COMMIT;
