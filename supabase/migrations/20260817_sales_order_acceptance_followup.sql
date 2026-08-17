-- Follow-up from authenticated Sales Order acceptance.
-- Retains RLS, policies, data, and the earlier document-contract repair.

ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS quotation_reference text,
  ADD COLUMN IF NOT EXISTS owner_name text;
