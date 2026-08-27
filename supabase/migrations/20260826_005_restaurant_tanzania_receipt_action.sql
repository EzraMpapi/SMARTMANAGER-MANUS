CREATE OR REPLACE FUNCTION public.restaurant_tanzania_receipt_action(p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_outlet_id uuid := NULLIF(p_payload->>'outletId','')::uuid;
  v_profile_id uuid;
  v_receipt_id uuid;
  v_existing public.restaurant_fiscal_receipts%ROWTYPE;
  v_gross numeric := ROUND(COALESCE(NULLIF(p_payload->>'grossAmount','')::numeric,0),2);
  v_vat numeric := ROUND(COALESCE(NULLIF(p_payload->>'vatAmount','')::numeric,0),2);
  v_net numeric := ROUND(COALESCE(NULLIF(p_payload->>'netAmount','')::numeric,0),2);
  v_source_type text := COALESCE(NULLIF(p_payload->>'sourceType',''),'unknown');
  v_source_id text := COALESCE(NULLIF(p_payload->>'sourceId',''),'unknown');
  v_idempotency_key text := NULLIF(p_payload->>'idempotencyKey','');
  v_currency text := COALESCE(NULLIF(p_payload->>'currency',''),'TZS');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated restaurant session is required.' USING ERRCODE='28000';
  END IF;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'A verified company context is required.' USING ERRCODE='42501';
  END IF;
  IF NOT public.restaurant_can_operate(ARRAY['Cashier','Restaurant Manager','Finance']) THEN
    RAISE EXCEPTION 'Cashier, Restaurant Manager, or Finance permission required.' USING ERRCODE='42501';
  END IF;
  IF v_outlet_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.restaurant_outlets o WHERE o.id=v_outlet_id AND o.company_id=v_company_id
  ) THEN
    RAISE EXCEPTION 'A valid company outlet is required.' USING ERRCODE='22023';
  END IF;
  IF v_gross < 0 OR v_vat < 0 OR v_net < 0 OR v_gross = 0 THEN
    RAISE EXCEPTION 'Fiscal receipt amounts must be positive and non-negative.' USING ERRCODE='22023';
  END IF;
  IF ABS((v_net + v_vat) - v_gross) > 0.02 THEN
    RAISE EXCEPTION 'Fiscal receipt amounts must balance: net plus VAT must equal gross.' USING ERRCODE='22023';
  END IF;
  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
      FROM public.restaurant_fiscal_receipts
     WHERE company_id=v_company_id AND idempotency_key=v_idempotency_key
     LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok',true,'recordId',v_existing.id,'duplicate',true,'status',v_existing.status);
    END IF;
  END IF;
  SELECT id INTO v_profile_id
    FROM public.restaurant_fiscal_profiles
   WHERE company_id=v_company_id AND outlet_id=v_outlet_id
   LIMIT 1;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'A Supabase-native Tanzania fiscal profile is required before queueing a receipt.' USING ERRCODE='P0002';
  END IF;
  INSERT INTO public.restaurant_fiscal_receipts(
    company_id,outlet_id,fiscal_profile_id,internal_reference,status,gross_amount,vat_amount,net_amount,currency,idempotency_key,provider_response,failure_reason,queued_at
  ) VALUES (
    v_company_id,v_outlet_id,v_profile_id,
    left(v_source_type||':'||v_source_id,120),
    'Queued',v_gross,v_vat,v_net,v_currency,v_idempotency_key,
    jsonb_build_object('sourceType',v_source_type,'sourceId',v_source_id,'items',COALESCE(p_payload->'items','[]'::jsonb)),
    NULL,now()
  ) RETURNING id INTO v_receipt_id;
  PERFORM public.restaurant_tanzania_audit('RECEIPT_QUEUE','fiscal_receipt',v_receipt_id,p_payload || jsonb_build_object('outletId',v_outlet_id));
  RETURN jsonb_build_object('ok',true,'recordId',v_receipt_id,'duplicate',false,'status','Queued','snapshotRequired',true);
END;
$$;

REVOKE ALL ON FUNCTION public.restaurant_tanzania_receipt_action(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restaurant_tanzania_receipt_action(jsonb) TO authenticated;
COMMENT ON FUNCTION public.restaurant_tanzania_receipt_action(jsonb) IS 'Queues a tenant-scoped Tanzania fiscal receipt for a configured Restaurant fiscal profile; it does not call an external TRA provider.';
