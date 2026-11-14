-- SMART MANAGER additive normalized POS sales and returns slice.
-- Requires 20260824_050_fin_foundation.sql,
-- 20260824_051_fin_journal_core.sql,
-- 20260824_053_pos_register_control.sql, and
-- 20260824_054_pos_register_control_hardening.sql.
-- This migration creates normalized source records only; existing POS RPCs
-- and legacy generic envelopes remain unchanged.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.pos_sale_headers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  sale_number text NOT NULL,
  register_id uuid NOT NULL,
  terminal_id uuid,
  shift_id uuid NOT NULL,
  cashier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.crm_contacts(id) ON DELETE RESTRICT,
  customer_name text NOT NULL DEFAULT 'Guest',
  business_date date NOT NULL DEFAULT current_date,
  source_channel text NOT NULL DEFAULT 'Counter'
    CHECK (source_channel IN ('Counter', 'Offline Sync', 'Restaurant', 'Online', 'API')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Draft', 'Held', 'Pending', 'Completed', 'Voided', 'Partially Refunded', 'Refunded', 'Failed')),
  payment_status text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overpaid', 'Partially Refunded', 'Refunded')),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  subtotal numeric(20,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  tax_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total numeric(20,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (paid_total >= 0),
  change_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (change_total >= 0),
  refunded_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (refunded_total >= 0),
  journal_batch_id uuid,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  receipt_issued_at timestamptz,
  completed_at timestamptz,
  voided_at timestamptz,
  legacy_pos_transaction_id uuid REFERENCES public.pos_transactions(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_sale_headers_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_sale_headers_company_number_unique UNIQUE (company_id, sale_number),
  CONSTRAINT pos_sale_headers_company_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT pos_sale_headers_number_not_blank CHECK (length(btrim(sale_number)) > 0),
  CONSTRAINT pos_sale_headers_idempotency_not_blank CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT pos_sale_headers_request_hash_not_blank CHECK (length(btrim(request_hash)) > 0),
  CONSTRAINT pos_sale_headers_completion_evidence CHECK (
    status NOT IN ('Completed', 'Partially Refunded', 'Refunded')
    OR (completed_at IS NOT NULL AND receipt_issued_at IS NOT NULL)
  ),
  CONSTRAINT pos_sale_headers_refund_bound CHECK (refunded_total <= total),
  CONSTRAINT pos_sale_headers_paid_bound CHECK (paid_total >= change_total)
);

ALTER TABLE public.pos_sale_headers
  DROP CONSTRAINT IF EXISTS pos_sale_headers_register_company_fkey;
ALTER TABLE public.pos_sale_headers
  ADD CONSTRAINT pos_sale_headers_register_company_fkey
  FOREIGN KEY (company_id, register_id)
  REFERENCES public.pos_registers (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_sale_headers
  DROP CONSTRAINT IF EXISTS pos_sale_headers_terminal_company_fkey;
ALTER TABLE public.pos_sale_headers
  ADD CONSTRAINT pos_sale_headers_terminal_company_fkey
  FOREIGN KEY (company_id, terminal_id)
  REFERENCES public.pos_terminals (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_sale_headers
  DROP CONSTRAINT IF EXISTS pos_sale_headers_shift_company_fkey;
ALTER TABLE public.pos_sale_headers
  ADD CONSTRAINT pos_sale_headers_shift_company_fkey
  FOREIGN KEY (company_id, shift_id)
  REFERENCES public.pos_shift_sessions (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_sale_headers
  DROP CONSTRAINT IF EXISTS pos_sale_headers_journal_company_fkey;
ALTER TABLE public.pos_sale_headers
  ADD CONSTRAINT pos_sale_headers_journal_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_sale_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  sale_id uuid NOT NULL,
  line_no integer NOT NULL CHECK (line_no > 0),
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  item_sku text NOT NULL,
  item_name text NOT NULL,
  quantity numeric(20,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(20,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  line_subtotal numeric(20,2) NOT NULL CHECK (line_subtotal >= 0),
  line_total numeric(20,2) NOT NULL CHECK (line_total >= 0),
  cost_total numeric(20,2) CHECK (cost_total IS NULL OR cost_total >= 0),
  returned_quantity numeric(20,3) NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0 AND returned_quantity <= quantity),
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active', 'Partially Returned', 'Returned', 'Voided')),
  legacy_pos_transaction_item_id uuid REFERENCES public.pos_transaction_items(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_sale_lines_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_sale_lines_sale_line_unique UNIQUE (company_id, sale_id, line_no),
  CONSTRAINT pos_sale_lines_sku_not_blank CHECK (length(btrim(item_sku)) > 0),
  CONSTRAINT pos_sale_lines_name_not_blank CHECK (length(btrim(item_name)) > 0)
);

ALTER TABLE public.pos_sale_lines
  DROP CONSTRAINT IF EXISTS pos_sale_lines_sale_company_fkey;
ALTER TABLE public.pos_sale_lines
  ADD CONSTRAINT pos_sale_lines_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_sale_tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  sale_id uuid NOT NULL,
  tender_no integer NOT NULL CHECK (tender_no > 0),
  method text NOT NULL CHECK (method IN ('Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Customer Credit')),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  tendered_amount numeric(20,2) NOT NULL CHECK (tendered_amount > 0),
  applied_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (applied_amount >= 0),
  change_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  reference text,
  provider_code text,
  provider_reference text,
  provider_status text NOT NULL DEFAULT 'Not Required'
    CHECK (provider_status IN ('Not Required', 'Pending', 'Confirmed', 'Failed', 'Unknown', 'Reversed')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Authorized', 'Captured', 'Failed', 'Refunded', 'Voided')),
  journal_batch_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_sale_tenders_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_sale_tenders_sale_tender_unique UNIQUE (company_id, sale_id, tender_no),
  CONSTRAINT pos_sale_tenders_applied_bound CHECK (applied_amount <= tendered_amount),
  CONSTRAINT pos_sale_tenders_change_bound CHECK (change_amount <= tendered_amount),
  CONSTRAINT pos_sale_tenders_applied_and_change_bound CHECK (applied_amount + change_amount <= tendered_amount),
  CONSTRAINT pos_sale_tenders_provider_evidence CHECK (
    provider_status NOT IN ('Confirmed', 'Reversed') OR nullif(btrim(provider_reference), '') IS NOT NULL
  )
);

ALTER TABLE public.pos_sale_tenders
  DROP CONSTRAINT IF EXISTS pos_sale_tenders_sale_company_fkey;
ALTER TABLE public.pos_sale_tenders
  ADD CONSTRAINT pos_sale_tenders_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_sale_tenders
  DROP CONSTRAINT IF EXISTS pos_sale_tenders_journal_company_fkey;
ALTER TABLE public.pos_sale_tenders
  ADD CONSTRAINT pos_sale_tenders_journal_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_return_headers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  return_number text NOT NULL,
  sale_id uuid NOT NULL,
  register_id uuid NOT NULL,
  terminal_id uuid,
  shift_id uuid NOT NULL,
  cashier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  refund_method text NOT NULL DEFAULT 'Original Method'
    CHECK (refund_method IN ('Original Method', 'Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Customer Credit')),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  refund_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (refund_total > 0),
  status text NOT NULL DEFAULT 'Pending Approval'
    CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Posted', 'Rejected', 'Voided', 'Reversed')),
  approval_request_id uuid,
  journal_batch_id uuid,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  legacy_pos_return_id uuid REFERENCES public.pos_returns(id) ON DELETE SET NULL,
  posted_at timestamptz,
  posted_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_return_headers_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_return_headers_company_number_unique UNIQUE (company_id, return_number),
  CONSTRAINT pos_return_headers_company_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT pos_return_headers_number_not_blank CHECK (length(btrim(return_number)) > 0),
  CONSTRAINT pos_return_headers_reason_not_blank CHECK (length(btrim(reason)) > 0),
  CONSTRAINT pos_return_headers_request_hash_not_blank CHECK (length(btrim(request_hash)) > 0),
  CONSTRAINT pos_return_headers_posted_evidence CHECK (
    status NOT IN ('Posted', 'Reversed')
    OR (journal_batch_id IS NOT NULL AND posted_at IS NOT NULL AND posted_by IS NOT NULL)
  ),
  CONSTRAINT pos_return_headers_approval_evidence CHECK (
    status NOT IN ('Pending Approval', 'Approved', 'Posted') OR approval_request_id IS NOT NULL
  )
);

ALTER TABLE public.pos_return_headers
  DROP CONSTRAINT IF EXISTS pos_return_headers_sale_company_fkey;
ALTER TABLE public.pos_return_headers
  ADD CONSTRAINT pos_return_headers_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_return_headers
  DROP CONSTRAINT IF EXISTS pos_return_headers_register_company_fkey;
ALTER TABLE public.pos_return_headers
  ADD CONSTRAINT pos_return_headers_register_company_fkey
  FOREIGN KEY (company_id, register_id)
  REFERENCES public.pos_registers (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_return_headers
  DROP CONSTRAINT IF EXISTS pos_return_headers_terminal_company_fkey;
ALTER TABLE public.pos_return_headers
  ADD CONSTRAINT pos_return_headers_terminal_company_fkey
  FOREIGN KEY (company_id, terminal_id)
  REFERENCES public.pos_terminals (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_return_headers
  DROP CONSTRAINT IF EXISTS pos_return_headers_shift_company_fkey;
ALTER TABLE public.pos_return_headers
  ADD CONSTRAINT pos_return_headers_shift_company_fkey
  FOREIGN KEY (company_id, shift_id)
  REFERENCES public.pos_shift_sessions (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_return_headers
  DROP CONSTRAINT IF EXISTS pos_return_headers_approval_company_fkey;
ALTER TABLE public.pos_return_headers
  ADD CONSTRAINT pos_return_headers_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_return_headers
  DROP CONSTRAINT IF EXISTS pos_return_headers_journal_company_fkey;
ALTER TABLE public.pos_return_headers
  ADD CONSTRAINT pos_return_headers_journal_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_return_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  return_id uuid NOT NULL,
  sale_line_id uuid NOT NULL,
  line_no integer NOT NULL CHECK (line_no > 0),
  quantity numeric(20,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(20,2) NOT NULL CHECK (unit_price >= 0),
  tax_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  refund_amount numeric(20,2) NOT NULL CHECK (refund_amount > 0),
  restock_quantity numeric(20,3) NOT NULL DEFAULT 0 CHECK (restock_quantity >= 0 AND restock_quantity <= quantity),
  condition text NOT NULL DEFAULT 'Resalable'
    CHECK (condition IN ('Resalable', 'Damaged', 'Expired', 'Missing', 'Not Applicable')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Approved', 'Posted', 'Rejected', 'Voided')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_return_lines_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_return_lines_return_line_unique UNIQUE (company_id, return_id, line_no)
);

ALTER TABLE public.pos_return_lines
  DROP CONSTRAINT IF EXISTS pos_return_lines_return_company_fkey;
ALTER TABLE public.pos_return_lines
  ADD CONSTRAINT pos_return_lines_return_company_fkey
  FOREIGN KEY (company_id, return_id)
  REFERENCES public.pos_return_headers (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_return_lines
  DROP CONSTRAINT IF EXISTS pos_return_lines_sale_line_company_fkey;
ALTER TABLE public.pos_return_lines
  ADD CONSTRAINT pos_return_lines_sale_line_company_fkey
  FOREIGN KEY (company_id, sale_line_id)
  REFERENCES public.pos_sale_lines (company_id, id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS pos_sale_headers_legacy_transaction_idx
  ON public.pos_sale_headers (company_id, legacy_pos_transaction_id)
  WHERE legacy_pos_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pos_return_headers_legacy_return_idx
  ON public.pos_return_headers (company_id, legacy_pos_return_id)
  WHERE legacy_pos_return_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pos_sale_headers_company_status_date_idx
  ON public.pos_sale_headers (company_id, status, business_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS pos_sale_headers_shift_created_idx
  ON public.pos_sale_headers (company_id, shift_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pos_sale_headers_customer_date_idx
  ON public.pos_sale_headers (company_id, customer_id, business_date DESC);
CREATE INDEX IF NOT EXISTS pos_sale_headers_journal_idx
  ON public.pos_sale_headers (company_id, journal_batch_id, status);
CREATE INDEX IF NOT EXISTS pos_sale_lines_sale_idx
  ON public.pos_sale_lines (company_id, sale_id, line_no);
CREATE INDEX IF NOT EXISTS pos_sale_lines_inventory_idx
  ON public.pos_sale_lines (company_id, inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pos_sale_tenders_sale_status_idx
  ON public.pos_sale_tenders (company_id, sale_id, status);
CREATE INDEX IF NOT EXISTS pos_sale_tenders_provider_idx
  ON public.pos_sale_tenders (company_id, provider_code, provider_reference);
CREATE INDEX IF NOT EXISTS pos_return_headers_company_status_date_idx
  ON public.pos_return_headers (company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS pos_return_headers_sale_idx
  ON public.pos_return_headers (company_id, sale_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pos_return_lines_sale_line_idx
  ON public.pos_return_lines (company_id, sale_line_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.pos_sales_assert_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.crm_contacts c
    WHERE c.id = NEW.customer_id AND c.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS customer does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.cashier_id AND p.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS cashier does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  IF NEW.terminal_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.pos_terminals t
    WHERE t.id = NEW.terminal_id
      AND t.company_id = NEW.company_id
      AND t.register_id = NEW.register_id
  ) THEN
    RAISE EXCEPTION 'POS sale terminal must belong to the selected register.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_sale_headers_assert_scope ON public.pos_sale_headers;
CREATE TRIGGER pos_sale_headers_assert_scope
BEFORE INSERT OR UPDATE ON public.pos_sale_headers
FOR EACH ROW EXECUTE FUNCTION public.pos_sales_assert_scope();

CREATE OR REPLACE FUNCTION public.pos_sale_lines_assert_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.inventory_item_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = NEW.inventory_item_id AND i.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS sale inventory item does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_sale_lines_assert_scope ON public.pos_sale_lines;
CREATE TRIGGER pos_sale_lines_assert_scope
BEFORE INSERT OR UPDATE ON public.pos_sale_lines
FOR EACH ROW EXECUTE FUNCTION public.pos_sale_lines_assert_scope();

CREATE OR REPLACE FUNCTION public.pos_tenders_assert_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.method IN ('Mobile Money', 'Card', 'Bank Transfer')
     AND NEW.provider_status IN ('Confirmed', 'Reversed')
     AND nullif(btrim(NEW.provider_reference), '') IS NULL THEN
    RAISE EXCEPTION 'A confirmed non-cash POS tender requires a provider reference.' USING ERRCODE = '22023';
  END IF;
  IF NEW.method = 'Cash' AND NEW.provider_status <> 'Not Required' THEN
    RAISE EXCEPTION 'Cash POS tenders cannot carry a provider settlement state.' USING ERRCODE = '22023';
  END IF;
  IF NEW.method = 'Customer Credit' AND NEW.provider_status <> 'Not Required' THEN
    RAISE EXCEPTION 'Customer Credit POS tenders cannot carry a provider settlement state.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_sale_tenders_assert_state ON public.pos_sale_tenders;
CREATE TRIGGER pos_sale_tenders_assert_state
BEFORE INSERT OR UPDATE ON public.pos_sale_tenders
FOR EACH ROW EXECUTE FUNCTION public.pos_tenders_assert_state();

CREATE OR REPLACE FUNCTION public.pos_returns_assert_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.cashier_id AND p.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS return cashier does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  IF NEW.terminal_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.pos_terminals t
    WHERE t.id = NEW.terminal_id
      AND t.company_id = NEW.company_id
      AND t.register_id = NEW.register_id
  ) THEN
    RAISE EXCEPTION 'POS return terminal must belong to the selected register.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_return_headers_assert_scope ON public.pos_return_headers;
CREATE TRIGGER pos_return_headers_assert_scope
BEFORE INSERT OR UPDATE ON public.pos_return_headers
FOR EACH ROW EXECUTE FUNCTION public.pos_returns_assert_scope();

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pos_sale_headers', 'pos_sale_lines', 'pos_sale_tenders', 'pos_return_headers', 'pos_return_lines'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
      t || '_tenant_select', t
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.pos_sales_assert_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_sale_lines_assert_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_tenders_assert_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_returns_assert_scope() FROM PUBLIC;

COMMIT;
