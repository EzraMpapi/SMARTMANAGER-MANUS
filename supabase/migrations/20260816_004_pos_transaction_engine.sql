BEGIN;

CREATE TABLE IF NOT EXISTS public.pos_transaction_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  transaction_id uuid NOT NULL REFERENCES public.pos_transactions(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_transaction_commits_company_idempotency_key UNIQUE (company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS pos_transaction_commits_company_created_idx
  ON public.pos_transaction_commits (company_id, created_at DESC);

ALTER TABLE public.pos_transaction_commits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_transaction_commits_company_select ON public.pos_transaction_commits;
CREATE POLICY pos_transaction_commits_company_select
  ON public.pos_transaction_commits
  FOR SELECT
  TO authenticated
  USING (company_id = (SELECT public.current_company_id()));

CREATE OR REPLACE FUNCTION public.complete_pos_sale(
  p_idempotency_key text,
  p_doc_number text,
  p_items jsonb,
  p_payments jsonb,
  p_subtotal numeric,
  p_tax numeric,
  p_total numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
  v_transaction_id uuid;
  v_existing_doc text;
  v_cashier text;
  v_item jsonb;
  v_payment jsonb;
  v_sku text;
  v_item_name text;
  v_qty numeric;
  v_price numeric;
  v_stock numeric;
  v_inventory_id uuid;
  v_payment_method text;
  v_payment_amount numeric;
  v_applied_amount numeric;
  v_remaining numeric;
  v_change numeric;
  v_computed_subtotal numeric := 0;
  v_computed_paid numeric := 0;
  v_has_cash boolean := false;
BEGIN
  IF v_user_id IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required to complete a POS sale.' USING ERRCODE = '42501';
  END IF;

  IF nullif(trim(p_idempotency_key), '') IS NULL OR length(trim(p_idempotency_key)) > 160 THEN
    RAISE EXCEPTION 'A valid POS idempotency key is required.' USING ERRCODE = '22023';
  END IF;
  IF nullif(trim(p_doc_number), '') IS NULL OR length(trim(p_doc_number)) > 120 THEN
    RAISE EXCEPTION 'A valid POS receipt number is required.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A POS sale requires at least one item.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_payments) <> 'array' OR jsonb_array_length(p_payments) = 0 THEN
    RAISE EXCEPTION 'A POS sale requires at least one payment allocation.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_company_id::text || ':' || trim(p_idempotency_key)));
  SELECT c.transaction_id, t.data ->> 'doc_number'
    INTO v_transaction_id, v_existing_doc
    FROM public.pos_transaction_commits c
    JOIN public.pos_transactions t ON t.id = c.transaction_id
   WHERE c.company_id = v_company_id
     AND c.idempotency_key = trim(p_idempotency_key)
   LIMIT 1;
  IF v_transaction_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'transaction_id', v_transaction_id,
      'doc_number', coalesce(v_existing_doc, p_doc_number),
      'idempotent_replay', true
    );
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_sku := nullif(trim(v_item ->> 'sku'), '');
    v_item_name := nullif(trim(v_item ->> 'name'), '');
    v_qty := coalesce(nullif(v_item ->> 'qty', '')::numeric, 0);
    v_price := coalesce(nullif(v_item ->> 'price', '')::numeric, -1);
    IF v_sku IS NULL OR v_item_name IS NULL OR v_qty <= 0 OR v_price < 0 THEN
      RAISE EXCEPTION 'Each POS item requires a SKU, name, positive quantity, and non-negative unit price.' USING ERRCODE = '22023';
    END IF;
    v_computed_subtotal := v_computed_subtotal + (v_qty * v_price);
  END LOOP;

  IF p_subtotal IS NULL OR p_tax IS NULL OR p_total IS NULL OR p_tax < 0 OR p_total < 0 THEN
    RAISE EXCEPTION 'POS totals must be non-negative amounts.' USING ERRCODE = '22023';
  END IF;
  IF abs(p_subtotal - v_computed_subtotal) > 0.01 OR abs(p_total - (p_subtotal + p_tax)) > 0.01 THEN
    RAISE EXCEPTION 'POS totals do not match the submitted item and tax calculation.' USING ERRCODE = '22023';
  END IF;

  FOR v_payment IN SELECT value FROM jsonb_array_elements(p_payments) LOOP
    v_payment_method := nullif(trim(v_payment ->> 'method'), '');
    v_payment_amount := coalesce(nullif(v_payment ->> 'amount', '')::numeric, 0);
    IF v_payment_method NOT IN ('Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Customer Credit') OR v_payment_amount <= 0 THEN
      RAISE EXCEPTION 'Each POS payment requires a supported method and an amount above zero.' USING ERRCODE = '22023';
    END IF;
    v_computed_paid := v_computed_paid + v_payment_amount;
    v_has_cash := v_has_cash OR v_payment_method = 'Cash';
  END LOOP;
  IF v_computed_paid < p_total THEN
    RAISE EXCEPTION 'Payment allocations do not cover the POS total.' USING ERRCODE = '22023';
  END IF;
  IF v_computed_paid > p_total AND NOT v_has_cash THEN
    RAISE EXCEPTION 'Only cash tender may exceed the POS total because change must be returned.' USING ERRCODE = '22023';
  END IF;

  SELECT full_name INTO v_cashier FROM public.profiles WHERE id = v_user_id;
  v_cashier := coalesce(nullif(trim(v_cashier), ''), 'Cashier');

  INSERT INTO public.pos_transactions (company_id, name, status, amount, notes, data)
  VALUES (
    v_company_id,
    p_doc_number,
    'Completed',
    p_total,
    NULL,
    jsonb_build_object(
      'doc_number', p_doc_number,
      'idempotency_key', trim(p_idempotency_key),
      'cashier_id', v_user_id,
      'cashier', v_cashier,
      'subtotal', p_subtotal,
      'tax', p_tax,
      'total', p_total,
      'payment_status', 'Paid'
    )
  ) RETURNING id INTO v_transaction_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_sku := trim(v_item ->> 'sku');
    v_item_name := trim(v_item ->> 'name');
    v_qty := (v_item ->> 'qty')::numeric;
    v_price := (v_item ->> 'price')::numeric;

    SELECT id, coalesce(nullif(data ->> 'qty_on_hand', '')::numeric, nullif(data ->> 'quantity', '')::numeric, 0)
      INTO v_inventory_id, v_stock
      FROM public.inventory_items
     WHERE company_id = v_company_id
       AND data ->> 'sku' = v_sku
     FOR UPDATE;
    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Product SKU % is not available for this workspace.', v_sku USING ERRCODE = 'P0001';
    END IF;
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for SKU %.', v_sku USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory_items
       SET data = jsonb_set(data, '{qty_on_hand}', to_jsonb(v_stock - v_qty), true),
           updated_at = now()
     WHERE id = v_inventory_id;

    INSERT INTO public.pos_transaction_items (company_id, name, status, amount, notes, data)
    VALUES (
      v_company_id, v_item_name, 'Completed', v_qty * v_price, NULL,
      jsonb_build_object('transaction_id', v_transaction_id, 'item_name', v_item_name, 'item_sku', v_sku, 'qty', v_qty, 'price', v_price)
    );
    INSERT INTO public.inventory_stock_movements (company_id, name, status, amount, notes, data)
    VALUES (
      v_company_id, v_item_name, 'Out', v_qty, NULL,
      jsonb_build_object('item_id', v_inventory_id, 'item_sku', v_sku, 'movement', 'Out', 'qty', v_qty, 'reference', p_doc_number, 'transaction_id', v_transaction_id)
    );
  END LOOP;

  v_remaining := p_total;
  v_change := greatest(0, v_computed_paid - p_total);
  FOR v_payment IN SELECT value FROM jsonb_array_elements(p_payments) LOOP
    v_payment_method := trim(v_payment ->> 'method');
    v_payment_amount := (v_payment ->> 'amount')::numeric;
    v_applied_amount := least(v_payment_amount, v_remaining);
    v_remaining := greatest(0, v_remaining - v_applied_amount);
    INSERT INTO public.sales_payments (company_id, name, status, amount, notes, data)
    VALUES (
      v_company_id, 'POS payment · ' || p_doc_number, 'Completed', v_applied_amount, NULL,
      jsonb_build_object(
        'pos_transaction_id', v_transaction_id,
        'transaction_ref', p_doc_number,
        'method', v_payment_method,
        'tendered_amount', v_payment_amount,
        'applied_amount', v_applied_amount,
        'change_amount', CASE WHEN v_payment_method = 'Cash' THEN v_change ELSE 0 END
      )
    );
  END LOOP;

  INSERT INTO public.audit_log (company_id, action, module, actor, details, subject, detail)
  VALUES (
    v_company_id, 'POS sale completed', 'Point of Sale', v_cashier,
    format('Receipt %s completed for %.2f.', p_doc_number, p_total), p_doc_number,
    jsonb_build_object('transaction_id', v_transaction_id, 'idempotency_key', trim(p_idempotency_key), 'subtotal', p_subtotal, 'tax', p_tax, 'total', p_total)
  );

  INSERT INTO public.pos_transaction_commits (company_id, transaction_id, idempotency_key, created_by)
  VALUES (v_company_id, v_transaction_id, trim(p_idempotency_key), v_user_id);

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'doc_number', p_doc_number,
    'idempotent_replay', false,
    'subtotal', p_subtotal,
    'tax', p_tax,
    'total', p_total,
    'paid', v_computed_paid,
    'change', v_change
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric) TO authenticated;

COMMIT;
