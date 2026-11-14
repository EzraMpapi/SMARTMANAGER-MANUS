-- Bank & MFI security hardening
-- Security-definer functions are exposed only to authenticated callers.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.bank_is_privileged() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_has_role(text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_audit(text,text,uuid,text,jsonb,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_assert_balanced_journal() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_account_type(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_loan_product(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_setup_institution(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_register_customer(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_update_kyc(uuid,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_open_account(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_post_transaction(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_submit_loan_application(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_decide_loan_application(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_disburse_loan(uuid,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_record_repayment(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_add_beneficiary(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_payment_instruction(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_group(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_add_group_member(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_reconciliation(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_create_aml_alert(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_resolve_aml_alert(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_write_off_loan(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_restructure_loan(uuid,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_move_cash(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_run_daily_controls() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bank_setup_institution(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_register_customer(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_update_kyc(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_open_account(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_post_transaction(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_submit_loan_application(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_decide_loan_application(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_disburse_loan(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_record_repayment(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_add_beneficiary(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_payment_instruction(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_group(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_add_group_member(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_reconciliation(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_aml_alert(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_resolve_aml_alert(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_write_off_loan(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_restructure_loan(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_move_cash(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_daily_controls() TO authenticated;

COMMIT;
