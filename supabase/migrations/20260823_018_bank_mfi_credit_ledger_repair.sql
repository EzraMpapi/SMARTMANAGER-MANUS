-- Bank & MFI credit and ledger repair
-- Adds account-linked loan disbursement/repayment journals and explicit scoring.

BEGIN;

ALTER TABLE public.bank_loan_applications
  ADD COLUMN IF NOT EXISTS disbursement_account_id uuid;

CREATE OR REPLACE FUNCTION public.bank_score_loan_application(p_application_id uuid, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_app public.bank_loan_applications%ROWTYPE; v_income numeric(20,2); v_debt numeric(20,2); v_history numeric(8,2); v_savings numeric(20,2); v_score integer := 50; v_dsr numeric(12,6);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Credit Manager','Branch Manager','Bank Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to score loan applications.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_app FROM public.bank_loan_applications WHERE id=p_application_id AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan application is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  v_income := nullif(coalesce(p_payload->>'monthlyIncome', v_app.score_inputs->>'monthlyIncome'),'')::numeric;
  v_debt := nullif(coalesce(p_payload->>'monthlyDebt', v_app.score_inputs->>'monthlyDebt'),'')::numeric;
  v_history := nullif(coalesce(p_payload->>'repaymentHistoryScore', v_app.score_inputs->>'repaymentHistoryScore'),'')::numeric;
  v_savings := nullif(coalesce(p_payload->>'savingsBalance', v_app.score_inputs->>'savingsBalance'),'')::numeric;
  IF v_income IS NULL OR v_income <= 0 OR v_debt IS NULL OR v_debt < 0 OR v_history IS NULL OR v_history < 0 OR v_history > 100 OR v_savings IS NULL OR v_savings < 0 THEN
    RAISE EXCEPTION 'Confirmed monthly income, monthly debt, repayment history score, and savings balance are required before scoring.' USING ERRCODE = '42201';
  END IF;
  v_dsr := v_debt / v_income;
  IF v_history >= 80 THEN v_score := v_score + 20; ELSIF v_history >= 60 THEN v_score := v_score + 10; ELSE v_score := v_score - 10; END IF;
  IF v_dsr <= 0.35 THEN v_score := v_score + 20; ELSIF v_dsr <= 0.5 THEN v_score := v_score + 5; ELSE v_score := v_score - 20; END IF;
  IF v_savings >= v_app.amount * 0.10 THEN v_score := v_score + 10; END IF;
  v_score := greatest(0, least(100, v_score));
  UPDATE public.bank_loan_applications SET credit_score=v_score, score_inputs=coalesce(v_app.score_inputs,'{}'::jsonb)||jsonb_build_object('monthlyIncome',v_income,'monthlyDebt',v_debt,'repaymentHistoryScore',v_history,'savingsBalance',v_savings,'debtServiceRatio',v_dsr), status=CASE WHEN status='SUBMITTED' THEN 'UNDER_REVIEW' ELSE status END, updated_at=now() WHERE id=p_application_id;
  PERFORM public.bank_audit('LOAN_APPLICATION_SCORED','loan_application',p_application_id,'SUCCESS',jsonb_build_object('score',v_score,'debtServiceRatio',v_dsr));
  RETURN jsonb_build_object('applicationId',p_application_id,'creditScore',v_score,'debtServiceRatio',v_dsr,'status','UNDER_REVIEW');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_disburse_loan(p_application_id uuid, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_app public.bank_loan_applications%ROWTYPE; v_dest public.bank_accounts%ROWTYPE; v_loan uuid; v_number text; v_rate numeric(12,6); v_i integer; v_balance numeric(20,2); v_interest numeric(20,2); v_principal_due numeric(20,2); v_installment numeric(20,2); v_due date; v_tx uuid; v_batch uuid; v_key text := coalesce(nullif(p_payload->>'idempotencyKey',''),'LOAN-DISBURSE-'||p_application_id::text);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Manager','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to disburse loans.' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.bank_transactions WHERE company_id=public.current_company_id() AND idempotency_key=v_key) THEN RETURN (SELECT jsonb_build_object('transactionId',id,'status',status,'replayed',true) FROM public.bank_transactions WHERE company_id=public.current_company_id() AND idempotency_key=v_key LIMIT 1); END IF;
  SELECT * INTO v_app FROM public.bank_loan_applications WHERE id=p_application_id AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND OR v_app.status <> 'APPROVED' THEN RAISE EXCEPTION 'Only approved loan applications may be disbursed.' USING ERRCODE = '40901'; END IF;
  IF v_app.submitted_by = auth.uid() THEN RAISE EXCEPTION 'Maker-checker separation requires a different disbursing officer.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_dest FROM public.bank_accounts WHERE id=nullif(p_payload->>'destinationAccountId','')::uuid AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND OR v_dest.status <> 'ACTIVE' THEN RAISE EXCEPTION 'A live destination account is required for loan disbursement.' USING ERRCODE = '42501'; END IF;
  SELECT annual_interest_rate INTO v_rate FROM public.bank_loan_products WHERE id=v_app.product_id AND company_id=public.current_company_id();
  v_number := 'LN-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_loans(company_id,loan_number,application_id,customer_id,product_id,principal,outstanding_principal,annual_interest_rate,term_months,interest_method,status,disbursed_at,maturity_date)
  VALUES (public.current_company_id(),v_number,p_application_id,v_app.customer_id,v_app.product_id,v_app.amount,v_app.amount,v_rate,v_app.term_months,'REDUCING_BALANCE','ACTIVE',now(),(current_date + (v_app.term_months || ' months')::interval)::date) RETURNING id INTO v_loan;
  v_balance := v_app.amount;
  v_installment := round((v_app.amount * (1 + (v_rate/100/12) * v_app.term_months) / v_app.term_months),2);
  FOR v_i IN 1..v_app.term_months LOOP
    v_interest := round(v_balance * (v_rate/100/12),2);
    v_principal_due := CASE WHEN v_i = v_app.term_months THEN v_balance ELSE least(v_balance,greatest(v_installment-v_interest,0)) END;
    v_due := (current_date + (v_i || ' months')::interval)::date;
    INSERT INTO public.bank_loan_schedules(company_id,loan_id,installment_number,due_date,principal_due,interest_due) VALUES (public.current_company_id(),v_loan,v_i,v_due,v_principal_due,v_interest);
    v_balance := greatest(0,v_balance-v_principal_due);
  END LOOP;
  UPDATE public.bank_accounts SET ledger_balance=ledger_balance+v_app.amount, available_balance=available_balance+v_app.amount, version=version+1, updated_at=now() WHERE id=v_dest.id;
  INSERT INTO public.bank_transactions(company_id,transaction_number,transaction_type,channel,destination_account_id,customer_id,amount,currency,status,idempotency_key,narration,initiated_by,posted_at)
  VALUES (public.current_company_id(),'TX-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),'LOAN_DISBURSEMENT',upper(coalesce(p_payload->>'channel','INTERNAL_TRANSFER')),v_dest.id,v_app.customer_id,v_app.amount,coalesce(p_payload->>'currency','TZS'),'POSTED',v_key,'Loan disbursement '||v_number,auth.uid(),now()) RETURNING id INTO v_tx;
  INSERT INTO public.bank_journal_batches(company_id,batch_number,currency,total_debit,total_credit,source_type,source_id,idempotency_key) VALUES (public.current_company_id(),'JB-'||v_tx,coalesce(p_payload->>'currency','TZS'),v_app.amount,v_app.amount,'LOAN_DISBURSEMENT',v_tx,v_key) RETURNING id INTO v_batch;
  INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit) VALUES (public.current_company_id(),v_batch,NULL,'LOAN_RECEIVABLE','Loan disbursement',v_app.amount,0),(public.current_company_id(),v_batch,v_dest.id,'CUSTOMER-DEPOSIT','Loan disbursement',0,v_app.amount);
  UPDATE public.bank_transactions SET journal_batch_id=v_batch WHERE id=v_tx;
  UPDATE public.bank_loan_applications SET status='DISBURSED', disbursement_account_id=v_dest.id, updated_at=now() WHERE id=p_application_id;
  PERFORM public.bank_audit('LOAN_DISBURSED','loan',v_loan,'SUCCESS',jsonb_build_object('loanNumber',v_number,'destinationAccountId',v_dest.id,'transactionId',v_tx));
  RETURN jsonb_build_object('loanId',v_loan,'loanNumber',v_number,'transactionId',v_tx,'status','ACTIVE','replayed',false);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_record_repayment(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_loan public.bank_loans%ROWTYPE; v_account public.bank_accounts%ROWTYPE; v_repay uuid; v_tx uuid; v_batch uuid; v_number text; v_total numeric(20,2) := (p_payload->>'amount')::numeric; v_remaining numeric(20,2); v_principal numeric(20,2); v_interest numeric(20,2); v_fee numeric(20,2); v_penalty numeric(20,2); v_key text := p_payload->>'idempotencyKey';
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Teller','Branch Manager','Bank Manager','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to record loan repayments.' USING ERRCODE = '42501'; END IF;
  IF v_total IS NULL OR v_total <= 0 OR v_key IS NULL OR length(v_key) < 12 THEN RAISE EXCEPTION 'A positive repayment amount and idempotency key are required.' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.bank_loan_repayments WHERE company_id=public.current_company_id() AND idempotency_key=v_key) THEN RETURN (SELECT jsonb_build_object('repaymentId',id,'repaymentNumber',repayment_number,'status',status,'replayed',true) FROM public.bank_loan_repayments WHERE company_id=public.current_company_id() AND idempotency_key=v_key LIMIT 1); END IF;
  SELECT * INTO v_loan FROM public.bank_loans WHERE id=(p_payload->>'loanId')::uuid AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND OR v_loan.status NOT IN ('ACTIVE','ARREARS','RESTRUCTURED') THEN RAISE EXCEPTION 'Loan is not open for repayment.' USING ERRCODE = '40901'; END IF;
  IF p_payload->>'accountId' IS NOT NULL AND p_payload->>'accountId' <> '' THEN
    SELECT * INTO v_account FROM public.bank_accounts WHERE id=(p_payload->>'accountId')::uuid AND company_id=public.current_company_id() FOR UPDATE;
    IF NOT FOUND OR v_account.status <> 'ACTIVE' THEN RAISE EXCEPTION 'Repayment account is not active in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
    IF v_account.available_balance < v_total THEN RAISE EXCEPTION 'Insufficient available balance for repayment.' USING ERRCODE = '22003'; END IF;
  END IF;
  v_remaining := v_total;
  v_penalty := least(v_remaining,v_loan.outstanding_penalties); v_remaining := v_remaining-v_penalty;
  v_fee := least(v_remaining,v_loan.outstanding_fees); v_remaining := v_remaining-v_fee;
  v_interest := least(v_remaining,v_loan.outstanding_interest); v_remaining := v_remaining-v_interest;
  v_principal := least(v_remaining,v_loan.outstanding_principal);
  IF v_remaining > v_principal THEN RAISE EXCEPTION 'Repayment exceeds the confirmed outstanding loan components.' USING ERRCODE = '22003'; END IF;
  v_number := 'RP-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_loan_repayments(company_id,repayment_number,loan_id,account_id,amount,principal_amount,interest_amount,fee_amount,penalty_amount,channel,status,idempotency_key,posted_by) VALUES (public.current_company_id(),v_number,v_loan.id,v_account.id,v_total,v_principal,v_interest,v_fee,v_penalty,upper(coalesce(p_payload->>'channel','CASH')),'POSTED',v_key,auth.uid()) RETURNING id INTO v_repay;
  IF v_account.id IS NOT NULL THEN UPDATE public.bank_accounts SET ledger_balance=ledger_balance-v_total, available_balance=available_balance-v_total, version=version+1, updated_at=now() WHERE id=v_account.id; END IF;
  UPDATE public.bank_loans SET outstanding_principal=greatest(0,outstanding_principal-v_principal), outstanding_interest=greatest(0,outstanding_interest-v_interest), outstanding_fees=greatest(0,outstanding_fees-v_fee), outstanding_penalties=greatest(0,outstanding_penalties-v_penalty), status=CASE WHEN outstanding_principal-v_principal <= 0.01 AND outstanding_interest-v_interest <= 0.01 THEN 'CLOSED' ELSE status END, updated_at=now() WHERE id=v_loan.id;
  INSERT INTO public.bank_transactions(company_id,transaction_number,transaction_type,channel,source_account_id,customer_id,amount,currency,status,idempotency_key,narration,initiated_by,posted_at)
  VALUES (public.current_company_id(),'TX-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),'LOAN_REPAYMENT',upper(coalesce(p_payload->>'channel','CASH')),v_account.id,v_loan.customer_id,v_total,coalesce(p_payload->>'currency','TZS'),'POSTED',v_key,'Loan repayment '||v_number,auth.uid(),now()) RETURNING id INTO v_tx;
  INSERT INTO public.bank_journal_batches(company_id,batch_number,currency,total_debit,total_credit,source_type,source_id,idempotency_key) VALUES (public.current_company_id(),'JB-'||v_tx,coalesce(p_payload->>'currency','TZS'),v_total,v_total,'LOAN_REPAYMENT',v_tx,v_key) RETURNING id INTO v_batch;
  INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit) VALUES (public.current_company_id(),v_batch,v_account.id,'CASH_OR_CLEARING','Loan repayment',v_total,0);
  IF v_principal > 0 THEN INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit) VALUES (public.current_company_id(),v_batch,NULL,'LOAN_RECEIVABLE','Principal repayment',0,v_principal); END IF;
  IF v_interest > 0 THEN INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit) VALUES (public.current_company_id(),v_batch,NULL,'INTEREST_INCOME','Interest repayment',0,v_interest); END IF;
  IF v_fee + v_penalty > 0 THEN INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit) VALUES (public.current_company_id(),v_batch,NULL,'FEE_INCOME','Fee and penalty repayment',0,v_fee+v_penalty); END IF;
  UPDATE public.bank_transactions SET journal_batch_id=v_batch WHERE id=v_tx;
  UPDATE public.bank_loan_repayments SET transaction_id=v_tx WHERE id=v_repay;
  PERFORM public.bank_audit('LOAN_REPAYMENT_POSTED','loan_repayment',v_repay,'SUCCESS',jsonb_build_object('loanId',v_loan.id,'amount',v_total,'transactionId',v_tx));
  RETURN jsonb_build_object('repaymentId',v_repay,'repaymentNumber',v_number,'transactionId',v_tx,'status','POSTED','replayed',false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bank_score_loan_application(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_score_loan_application(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_disburse_loan(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_record_repayment(jsonb) TO authenticated;

COMMIT;
