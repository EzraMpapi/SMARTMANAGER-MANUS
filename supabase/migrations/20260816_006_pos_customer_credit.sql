BEGIN;

CREATE OR REPLACE FUNCTION public.complete_pos_sale(
  p_idempotency_key text,
  p_doc_number text,
  p_items jsonb,
  p_payments jsonb,
  p_subtotal numeric,
  p_tax numeric,
  p_total numeric,
  p_customer_id uuid,
  p_customer_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_customer_name text;
  v_result jsonb;
  v_transaction_id uuid;
BEGIN
  IF auth.uid() IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required to complete a POS sale.' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_payments) payment
     WHERE payment ->> 'method' = 'Customer Credit'
  ) AND p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer Credit requires an existing workspace customer.' USING ERRCODE = '22023';
  END IF;
  IF p_customer_id IS NOT NULL THEN
    SELECT coalesce(nullif(name, ''), nullif(data ->> 'name', ''), nullif(data ->> 'contact_name', ''))
      INTO v_customer_name
      FROM public.crm_contacts
     WHERE id = p_customer_id AND company_id = v_company_id;
    IF v_customer_name IS NULL THEN
      RAISE EXCEPTION 'The selected customer is not available for this workspace.' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_result := public.complete_pos_sale(p_idempotency_key, p_doc_number, p_items, p_payments, p_subtotal, p_tax, p_total);
  v_transaction_id := (v_result ->> 'transaction_id')::uuid;
  UPDATE public.pos_transactions
     SET data = data || jsonb_build_object(
       'customer_id', p_customer_id,
       'customer_name', coalesce(v_customer_name, nullif(trim(p_customer_name), ''), 'Guest')
     ),
         updated_at = now()
   WHERE id = v_transaction_id AND company_id = v_company_id;
  RETURN v_result || jsonb_build_object('customer_id', p_customer_id, 'customer_name', coalesce(v_customer_name, nullif(trim(p_customer_name), ''), 'Guest'));
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric, uuid, text) TO authenticated;

COMMIT;
