-- Additive repair for the bank_accounts audit-field contract.
-- The source migration defines created_by, but the production table predates
-- that column. This change preserves all existing rows and does not alter RLS.
BEGIN;

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

COMMIT;
