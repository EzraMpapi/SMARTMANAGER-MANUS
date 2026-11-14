-- Bank & MFI disbursement destination binding

BEGIN;

CREATE OR REPLACE FUNCTION public.bank_submit_loan_application(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text; v_customer uuid := (p_payload->>'customerId')::uuid; v_product public.bank_loan_products%ROWTYPE; v_amount numeric(20,2) := (p_payload->>'amount')::numeric; v_term integer := (p_payload->>'termMonths')::integer; v_destination public.bank_accounts%ROWTYPE; v_destination_id uuid := nullif(p_payload->>'disbursementAccountId','')::uuid;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Branch Manager','Bank Manager','Customer Service','Admin']) THEN RAISE EXCEPTION 'You are not authorized to submit loan applications.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_customers WHERE id=v_customer AND company_id=public.current_company_id() AND kyc_status IN ('VERIFIED','ENHANCED_REVIEW')) THEN RAISE EXCEPTION 'Verified customer KYC is required for loan application.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_product FROM public.bank_loan_products WHERE id=(p_payload->>'productId')::uuid AND company_id=public.current_company_id() AND status='ACTIVE';
  IF NOT FOUND OR v_amount < v_product.minimum_amount OR v_amount > v_product.maximum_amount OR v_term < v_product.minimum_term_months OR v_term > v_product.maximum_term_months THEN RAISE EXCEPTION 'Loan amount or term violates the selected product rules.' USING ERRCODE = '22023'; END IF;
  IF v_destination_id IS NOT NULL THEN
    SELECT * INTO v_destination FROM public.bank_accounts WHERE id=v_destination_id AND company_id=public.current_company_id() AND customer_id=v_customer FOR SHARE;
    IF NOT FOUND OR v_destination.status <> 'ACTIVE' THEN RAISE EXCEPTION 'Disbursement account must be an active account owned by the applicant.' USING ERRCODE = '42501'; END IF;
  END IF;
  v_number := 'APP-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_loan_applications(company_id,application_number,customer_id,product_id,amount,term_months,purpose,status,score_inputs,branch_id,disbursement_account_id,data)
  VALUES (public.current_company_id(),v_number,v_customer,v_product.id,v_amount,v_term,coalesce(p_payload->>'purpose',''),'SUBMITTED',coalesce(p_payload->'scoreInputs','{}'::jsonb),nullif(p_payload->>'branchId','')::uuid,v_destination_id,coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('LOAN_APPLICATION_SUBMITTED','loan_application',v_id,'SUCCESS',jsonb_build_object('amount',v_amount,'termMonths',v_term,'disbursementAccountId',v_destination_id));
  RETURN jsonb_build_object('applicationId',v_id,'applicationNumber',v_number,'status','SUBMITTED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.bank_submit_loan_application(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.bank_submit_loan_application(jsonb) FROM anon, PUBLIC;

COMMIT;
