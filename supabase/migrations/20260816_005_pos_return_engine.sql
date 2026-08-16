BEGIN;

CREATE TABLE IF NOT EXISTS public.pos_return_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  return_id uuid NOT NULL REFERENCES public.pos_returns(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_return_commits_company_idempotency_key UNIQUE (company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS pos_return_commits_company_created_idx
  ON public.pos_return_commits (company_id, created_at DESC);

ALTER TABLE public.pos_return_commits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_return_commits_company_select ON public.pos_return_commits;
CREATE POLICY pos_return_commits_company_select
  ON public.pos_return_commits
  FOR SELECT
  TO authenticated
  USING (company_id = (SELECT public.current_company_id()));

CREATE OR REPLACE FUNCTION public.complete_pos_return(
  p_idempotency_key text,
  p_transaction_id uuid,
  p_items jsonb,
  p_reason text,
  p_refund_total numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
  v_return_id uuid;
  v_existing_return_id uuid;
  v_cashier text;
  v_item jsonb;
  v_sku text;
  v_name text;
  v_qty numeric;
  v_price numeric;
  v_sold_qty numeric;
  v_returned_qty numeric;
  v_inventory_id uuid;
  v_stock numeric;
  v_line_subtotal numeric := 0;
  v_original_subtotal numeric;
  v_original_tax numeric;
  v_expected_refund numeric;
  v_doc_number text;
BEGIN
  IF v_user_id IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required to process a POS return.' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(p_idempotency_key), '') IS NULL OR length(trim(p_idempotency_key)) > 160 THEN
    RAISE EXCEPTION 'A valid return idempotency key is required.' USING ERRCODE = '22023';
  END IF;
  IF p_transaction_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A POS return requires an original sale, return items, and a reason.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_company_id::text || ':return:' || trim(p_idempotency_key)));
  SELECT return_id INTO v_existing_return_id
    FROM public.pos_return_commits
   WHERE company_id = v_company_id AND idempotency_key = trim(p_idempotency_key)
   LIMIT 1;
  IF v_existing_return_id IS NOT NULL THEN
    RETURN jsonb_build_object('return_id', v_existing_return_id, 'idempotent_replay', true);
  END IF;

  SELECT data ->> 'doc_number', coalesce(nullif(data ->> 'subtotal', '')::numeric, 0), coalesce(nullif(data ->> 'tax', '')::numeric, 0)
    INTO v_doc_number, v_original_subtotal, v_original_tax
    FROM public.pos_transactions
   WHERE id = p_transaction_id AND company_id = v_company_id AND status = 'Completed'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The original completed POS sale is not available for this workspace.' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_sku := nullif(trim(v_item ->> 'sku'), '');
    v_name := nullif(trim(v_item ->> 'name'), '');
    v_qty := coalesce(nullif(v_item ->> 'qty', '')::numeric, 0);
    v_price := coalesce(nullif(v_item ->> 'price', '')::numeric, -1);
    IF v_sku IS NULL OR v_name IS NULL OR v_qty <= 0 OR v_price < 0 THEN
      RAISE EXCEPTION 'Each return item requires a SKU, name, positive quantity, and non-negative price.' USING ERRCODE = '22023';
    END IF;

    SELECT coalesce(sum((data ->> 'qty')::numeric), 0), max((data ->> 'price')::numeric)
      INTO v_sold_qty, v_price
      FROM public.pos_transaction_items
     WHERE company_id = v_company_id
       AND data ->> 'transaction_id' = p_transaction_id::text
       AND data ->> 'item_sku' = v_sku;
    IF v_sold_qty < v_qty THEN
      RAISE EXCEPTION 'Return quantity for SKU % exceeds the original sale quantity.', v_sku USING ERRCODE = '22023';
    END IF;
    SELECT coalesce(sum((ri.data ->> 'qty')::numeric), 0)
      INTO v_returned_qty
      FROM public.pos_return_items ri
      JOIN public.pos_returns r ON r.id = (ri.data ->> 'return_id')::uuid
     WHERE r.company_id = v_company_id
       AND r.data ->> 'transaction_id' = p_transaction_id::text
       AND ri.data ->> 'item_sku' = v_sku;
    IF v_returned_qty + v_qty > v_sold_qty THEN
      RAISE EXCEPTION 'Return quantity for SKU % exceeds the unreturned balance.', v_sku USING ERRCODE = '22023';
    END IF;
    v_line_subtotal := v_line_subtotal + (v_qty * v_price);
  END LOOP;

  v_expected_refund := round(v_line_subtotal * (1 + CASE WHEN v_original_subtotal > 0 THEN v_original_tax / v_original_subtotal ELSE 0 END), 2);
  IF p_refund_total IS NULL OR abs(p_refund_total - v_expected_refund) > 0.01 THEN
    RAISE EXCEPTION 'The submitted refund total does not match the original sale tax calculation.' USING ERRCODE = '22023';
  END IF;

  SELECT full_name INTO v_cashier FROM public.profiles WHERE id = v_user_id;
  v_cashier := coalesce(nullif(trim(v_cashier), ''), 'Cashier');
  INSERT INTO public.pos_returns (company_id, name, status, amount, notes, data)
  VALUES (
    v_company_id, 'Return · ' || coalesce(v_doc_number, p_transaction_id::text), 'Completed', p_refund_total, p_reason,
    jsonb_build_object('transaction_id', p_transaction_id, 'reason', p_reason, 'refund_total', p_refund_total, 'cashier_id', v_user_id, 'cashier', v_cashier)
  ) RETURNING id INTO v_return_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_sku := trim(v_item ->> 'sku');
    v_name := trim(v_item ->> 'name');
    v_qty := (v_item ->> 'qty')::numeric;
    SELECT max((data ->> 'price')::numeric) INTO v_price FROM public.pos_transaction_items WHERE company_id = v_company_id AND data ->> 'transaction_id' = p_transaction_id::text AND data ->> 'item_sku' = v_sku;
    SELECT id, coalesce(nullif(data ->> 'qty_on_hand', '')::numeric, nullif(data ->> 'quantity', '')::numeric, 0)
      INTO v_inventory_id, v_stock
      FROM public.inventory_items
     WHERE company_id = v_company_id AND data ->> 'sku' = v_sku
     FOR UPDATE;
    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory SKU % is not available for this workspace.', v_sku USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.inventory_items SET data = jsonb_set(data, '{qty_on_hand}', to_jsonb(v_stock + v_qty), true), updated_at = now() WHERE id = v_inventory_id;
    INSERT INTO public.pos_return_items (company_id, name, status, amount, notes, data)
    VALUES (v_company_id, v_name, 'Completed', v_qty * v_price, NULL, jsonb_build_object('return_id', v_return_id, 'item_name', v_name, 'item_sku', v_sku, 'qty', v_qty, 'price', v_price));
    INSERT INTO public.inventory_stock_movements (company_id, name, status, amount, notes, data)
    VALUES (v_company_id, v_name, 'In', v_qty, NULL, jsonb_build_object('item_id', v_inventory_id, 'item_sku', v_sku, 'movement', 'In', 'qty', v_qty, 'reference', coalesce(v_doc_number, p_transaction_id::text) || ' return', 'return_id', v_return_id));
  END LOOP;

  INSERT INTO public.sales_payments (company_id, name, status, amount, notes, data)
  VALUES (v_company_id, 'POS refund · ' || coalesce(v_doc_number, p_transaction_id::text), 'Refunded', -p_refund_total, p_reason, jsonb_build_object('pos_transaction_id', p_transaction_id, 'pos_return_id', v_return_id, 'transaction_ref', v_doc_number, 'method', 'Original method', 'refund_total', p_refund_total));
  INSERT INTO public.audit_log (company_id, action, module, actor, details, subject, detail)
  VALUES (v_company_id, 'POS return completed', 'Point of Sale', v_cashier, format('Return processed for receipt %s: %.2f.', coalesce(v_doc_number, p_transaction_id::text), p_refund_total), coalesce(v_doc_number, p_transaction_id::text), jsonb_build_object('return_id', v_return_id, 'transaction_id', p_transaction_id, 'reason', p_reason, 'refund_total', p_refund_total));
  INSERT INTO public.pos_return_commits (company_id, return_id, idempotency_key, created_by)
  VALUES (v_company_id, v_return_id, trim(p_idempotency_key), v_user_id);

  RETURN jsonb_build_object('return_id', v_return_id, 'transaction_id', p_transaction_id, 'refund_total', p_refund_total, 'idempotent_replay', false);
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_pos_return(text, uuid, jsonb, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pos_return(text, uuid, jsonb, text, numeric) TO authenticated;

COMMIT;
