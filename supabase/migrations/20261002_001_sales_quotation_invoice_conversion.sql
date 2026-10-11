-- Preserve the source quotation when Sales converts a quotation into an invoice.
-- One quotation may produce at most one invoice per company.
BEGIN;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS quotation_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoices_quotation_fkey') THEN
    ALTER TABLE public.sales_invoices
      ADD CONSTRAINT sales_invoices_quotation_fkey
      FOREIGN KEY (quotation_id, company_id)
      REFERENCES public.sales_quotations (id, company_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS sales_invoices_company_quotation_unique
  ON public.sales_invoices (company_id, quotation_id)
  WHERE quotation_id IS NOT NULL;

COMMIT;
