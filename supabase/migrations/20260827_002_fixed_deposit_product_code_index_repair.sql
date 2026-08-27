-- Backfill the fixed-deposit product uniqueness index expected by the
-- schema-health baseline. Preflight confirmed there are no duplicate
-- (company_id, code) pairs in production before this migration was applied.

CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposit_products_company_code_idx
  ON public.bank_fixed_deposit_products(company_id, code);
