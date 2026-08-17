-- Additive repair for the Sales document contract.
-- This migration intentionally preserves existing tables, data, RLS state, and policies.

BEGIN;

ALTER TABLE public.sales_quotations
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS customer text,
  ADD COLUMN IF NOT EXISTS issue_date timestamptz,
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE public.sales_quotation_items
  ADD COLUMN IF NOT EXISTS quotation_id uuid,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS item_sku text,
  ADD COLUMN IF NOT EXISTS qty numeric,
  ADD COLUMN IF NOT EXISTS rate numeric,
  ADD COLUMN IF NOT EXISTS sort_order integer;

ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS customer text,
  ADD COLUMN IF NOT EXISTS order_date timestamptz,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS quotation_id uuid;

ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS item_sku text,
  ADD COLUMN IF NOT EXISTS qty numeric,
  ADD COLUMN IF NOT EXISTS rate numeric,
  ADD COLUMN IF NOT EXISTS sort_order integer;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS customer text,
  ADD COLUMN IF NOT EXISTS issue_date timestamptz,
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

ALTER TABLE public.sales_invoice_items
  ADD COLUMN IF NOT EXISTS invoice_id uuid,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS item_sku text,
  ADD COLUMN IF NOT EXISTS qty numeric,
  ADD COLUMN IF NOT EXISTS rate numeric,
  ADD COLUMN IF NOT EXISTS sort_order integer;

ALTER TABLE public.sales_payments
  ADD COLUMN IF NOT EXISTS invoice_id uuid,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS reference text;

ALTER TABLE public.sales_subscriptions
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS customer text,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS cycle text,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz;

ALTER TABLE public.sales_order_returns
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS reason text;

ALTER TABLE public.sales_order_return_items
  ADD COLUMN IF NOT EXISTS return_id uuid,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS item_sku text,
  ADD COLUMN IF NOT EXISTS qty numeric,
  ADD COLUMN IF NOT EXISTS rate numeric;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_quotations_id_company_key') THEN
    ALTER TABLE public.sales_quotations ADD CONSTRAINT sales_quotations_id_company_key UNIQUE (id, company_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_id_company_key') THEN
    ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_id_company_key UNIQUE (id, company_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoices_id_company_key') THEN
    ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_id_company_key UNIQUE (id, company_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_returns_id_company_key') THEN
    ALTER TABLE public.sales_order_returns ADD CONSTRAINT sales_order_returns_id_company_key UNIQUE (id, company_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_quotation_items_header_fkey') THEN
    ALTER TABLE public.sales_quotation_items ADD CONSTRAINT sales_quotation_items_header_fkey FOREIGN KEY (quotation_id, company_id) REFERENCES public.sales_quotations (id, company_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_items_header_fkey') THEN
    ALTER TABLE public.sales_order_items ADD CONSTRAINT sales_order_items_header_fkey FOREIGN KEY (order_id, company_id) REFERENCES public.sales_orders (id, company_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_items_header_fkey') THEN
    ALTER TABLE public.sales_invoice_items ADD CONSTRAINT sales_invoice_items_header_fkey FOREIGN KEY (invoice_id, company_id) REFERENCES public.sales_invoices (id, company_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_payments_invoice_fkey') THEN
    ALTER TABLE public.sales_payments ADD CONSTRAINT sales_payments_invoice_fkey FOREIGN KEY (invoice_id, company_id) REFERENCES public.sales_invoices (id, company_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoices_order_fkey') THEN
    ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_order_fkey FOREIGN KEY (order_id, company_id) REFERENCES public.sales_orders (id, company_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_returns_header_fkey') THEN
    ALTER TABLE public.sales_order_returns ADD CONSTRAINT sales_order_returns_header_fkey FOREIGN KEY (order_id, company_id) REFERENCES public.sales_orders (id, company_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_return_items_header_fkey') THEN
    ALTER TABLE public.sales_order_return_items ADD CONSTRAINT sales_order_return_items_header_fkey FOREIGN KEY (return_id, company_id) REFERENCES public.sales_order_returns (id, company_id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
