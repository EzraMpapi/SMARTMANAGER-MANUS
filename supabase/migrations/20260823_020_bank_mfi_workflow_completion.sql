-- Bank & MFI workflow completion: credit security, shares, statements, and standing orders.

BEGIN;

CREATE OR REPLACE FUNCTION public.bank_add_guarantor(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_application uuid := (p_payload->>'applicationId')::uuid; v_customer uuid := (p_payload->>'customerId')::uuid; v_amount numeric(20,2) := (p_payload->>'guaranteeAmount')::numeric;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Credit Manager','Branch Manager','Bank Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to register guarantors.' USING ERRCODE = '42501'; END IF;
  IF v_amount IS NULL OR v_amount <= 0 THEN RAISE EXCEPTION 'A positive guarantee amount is required.' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_loan_applications WHERE id=v_application AND company_id=public.current_company_id()) THEN RAISE EXCEPTION 'Loan application is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_customers WHERE id=v_customer AND company_id=public.current_company_id() AND kyc_status IN ('VERIFIED','ENHANCED_REVIEW')) THEN RAISE EXCEPTION 'A verified guarantor customer is required.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_guarantors(company_id,application_id,customer_id,guarantee_amount,consent_status,data) VALUES (public.current_company_id(),v_application,v_customer,v_amount,coalesce(p_payload->>'consentStatus','PENDING'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('GUARANTOR_REGISTERED','guarantor',v_id,'SUCCESS',jsonb_build_object('applicationId',v_application,'customerId',v_customer,'guaranteeAmount',v_amount));
  RETURN jsonb_build_object('guarantorId',v_id,'status','PENDING');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_add_collateral(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_application uuid := (p_payload->>'applicationId')::uuid; v_value numeric(20,2) := coalesce((p_payload->>'estimatedValue')::numeric,0);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Credit Manager','Branch Manager','Bank Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to register collateral.' USING ERRCODE = '42501'; END IF;
  IF nullif(p_payload->>'collateralType','') IS NULL OR nullif(p_payload->>'description','') IS NULL THEN RAISE EXCEPTION 'Collateral type and description are required.' USING ERRCODE = '22023'; END IF;
  IF v_value < 0 OR NOT EXISTS (SELECT 1 FROM public.bank_loan_applications WHERE id=v_application AND company_id=public.current_company_id()) THEN RAISE EXCEPTION 'Collateral value or application is invalid.' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.bank_collateral(company_id,application_id,collateral_type,description,ownership_document,estimated_value,valuation_date,verification_status,data) VALUES (public.current_company_id(),v_application,p_payload->>'collateralType',p_payload->>'description',p_payload->>'ownershipDocument',v_value,nullif(p_payload->>'valuationDate','')::date,coalesce(p_payload->>'verificationStatus','PENDING'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('COLLATERAL_REGISTERED','collateral',v_id,'SUCCESS',jsonb_build_object('applicationId',v_application,'estimatedValue',v_value));
  RETURN jsonb_build_object('collateralId',v_id,'status','PENDING');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_record_share_purchase(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_customer uuid := (p_payload->>'customerId')::uuid; v_group uuid := nullif(p_payload->>'groupId','')::uuid; v_count integer := (p_payload->>'sharesCount')::integer; v_price numeric(20,2) := (p_payload->>'pricePerShare')::numeric; v_tx jsonb;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Teller','Branch Manager','Bank Manager','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to post share purchases.' USING ERRCODE = '42501'; END IF;
  IF v_count IS NULL OR v_count <= 0 OR v_price IS NULL OR v_price < 0 THEN RAISE EXCEPTION 'Share count and price must be valid positive values.' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_customers WHERE id=v_customer AND company_id=public.current_company_id()) THEN RAISE EXCEPTION 'Customer is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_shares(company_id,group_id,customer_id,shares_count,price_per_share,status) VALUES (public.current_company_id(),v_group,v_customer,v_count,v_price,'POSTED') RETURNING id INTO v_id;
  PERFORM public.bank_audit('SHARES_PURCHASED','share',v_id,'SUCCESS',jsonb_build_object('customerId',v_customer,'sharesCount',v_count,'pricePerShare',v_price));
  RETURN jsonb_build_object('shareId',v_id,'status','POSTED','totalAmount',v_count*v_price);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_customer_statement(p_account_id uuid, p_from date DEFAULT NULL, p_to date DEFAULT NULL)
RETURNS TABLE(transaction_id uuid, transaction_number text, transaction_type text, channel text, amount numeric, fee_amount numeric, status text, narration text, posted_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT t.id,t.transaction_number,t.transaction_type,t.channel,t.amount,t.fee_amount,t.status,t.narration,t.posted_at
  FROM public.bank_transactions t
  JOIN public.bank_accounts a ON (a.id=t.source_account_id OR a.id=t.destination_account_id)
  WHERE t.company_id=public.current_company_id() AND a.id=p_account_id AND (p_from IS NULL OR t.posted_at::date >= p_from) AND (p_to IS NULL OR t.posted_at::date <= p_to)
  ORDER BY t.posted_at ASC, t.created_at ASC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.bank_run_standing_orders()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_order record; v_processed integer := 0; v_failed integer := 0; v_next date; v_result jsonb;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to run standing orders.' USING ERRCODE = '42501'; END IF;
  FOR v_order IN SELECT * FROM public.bank_standing_orders WHERE company_id=public.current_company_id() AND status='ACTIVE' AND next_run_date <= current_date AND (end_date IS NULL OR end_date >= current_date) ORDER BY next_run_date, id FOR UPDATE LOOP
    BEGIN
      v_result := public.bank_post_transaction(jsonb_build_object('transactionType','TRANSFER','channel','STANDING_ORDER','sourceAccountId',v_order.source_account_id,'destinationAccountId',v_order.destination_account_id,'amount',v_order.amount,'narration','Standing order '||v_order.order_number,'idempotencyKey','SO:'||v_order.id::text||':'||v_order.next_run_date::text));
      v_next := CASE upper(v_order.frequency) WHEN 'DAILY' THEN v_order.next_run_date+1 WHEN 'WEEKLY' THEN v_order.next_run_date+7 WHEN 'MONTHLY' THEN (v_order.next_run_date + interval '1 month')::date ELSE v_order.next_run_date+1 END;
      UPDATE public.bank_standing_orders SET next_run_date=v_next,last_run_at=now(),last_result='POSTED',updated_at=now() WHERE id=v_order.id;
      v_processed := v_processed+1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.bank_standing_orders SET last_run_at=now(),last_result=left(SQLERRM,500),updated_at=now() WHERE id=v_order.id;
      v_failed := v_failed+1;
    END;
  END LOOP;
  PERFORM public.bank_audit('STANDING_ORDERS_RUN','standing_order',NULL,'SUCCESS',jsonb_build_object('processed',v_processed,'failed',v_failed));
  RETURN jsonb_build_object('processed',v_processed,'failed',v_failed,'runAt',now());
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_run_daily_controls()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_due integer; v_arrears integer; v_alerts integer; v_orders jsonb;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Credit Manager','Compliance Officer','MLRO','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to run daily banking controls.' USING ERRCODE = '42501'; END IF;
  UPDATE public.bank_loan_schedules s SET status='OVERDUE' WHERE s.company_id=public.current_company_id() AND s.due_date < current_date AND s.status IN ('DUE','PARTIAL'); GET DIAGNOSTICS v_due = ROW_COUNT;
  UPDATE public.bank_loans l SET days_past_due=greatest(0,current_date-coalesce((SELECT min(s.due_date) FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'),current_date)), status=CASE WHEN EXISTS (SELECT 1 FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE') THEN 'ARREARS' ELSE l.status END, par_bucket=CASE WHEN greatest(0,current_date-coalesce((SELECT min(s.due_date) FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'),current_date)) >= 90 THEN 'NPL' WHEN greatest(0,current_date-coalesce((SELECT min(s.due_date) FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'),current_date)) > 0 THEN 'PAR' ELSE 'CURRENT' END, updated_at=now() WHERE l.company_id=public.current_company_id() AND l.status IN ('ACTIVE','ARREARS','RESTRUCTURED');
  GET DIAGNOSTICS v_arrears = ROW_COUNT;
  SELECT count(*) INTO v_alerts FROM public.bank_aml_alerts WHERE company_id=public.current_company_id() AND status='OPEN';
  v_orders := public.bank_run_standing_orders();
  PERFORM public.bank_audit('DAILY_CONTROLS_RUN','daily_controls',NULL,'SUCCESS',jsonb_build_object('overdueSchedules',v_due,'loansReviewed',v_arrears,'openAmlAlerts',v_alerts,'standingOrders',v_orders));
  RETURN jsonb_build_object('overdueSchedules',v_due,'loansReviewed',v_arrears,'openAmlAlerts',v_alerts,'standingOrders',v_orders,'runAt',now());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bank_add_guarantor(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_add_collateral(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_record_share_purchase(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_customer_statement(uuid,date,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_run_standing_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bank_run_daily_controls() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_add_guarantor(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_add_collateral(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_record_share_purchase(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_customer_statement(uuid,date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_daily_controls() TO authenticated;

COMMIT;
