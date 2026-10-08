-- Targeted Fixed Deposit foreign-key indexes.
-- These indexes cover the new relationships without applying the unrelated
-- repository-wide FK backlog.
BEGIN;

CREATE INDEX IF NOT EXISTS bank_fixed_deposits_product_fk_idx
  ON public.bank_fixed_deposits(product_id);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_customer_fk_idx
  ON public.bank_fixed_deposits(customer_id);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_source_account_fk_idx
  ON public.bank_fixed_deposits(source_account_id);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_payout_account_fk_idx
  ON public.bank_fixed_deposits(payout_account_id);
CREATE INDEX IF NOT EXISTS bank_fixed_deposit_events_fixed_deposit_fk_idx
  ON public.bank_fixed_deposit_events(fixed_deposit_id);
CREATE INDEX IF NOT EXISTS bank_fixed_deposit_events_journal_batch_fk_idx
  ON public.bank_fixed_deposit_events(journal_batch_id);
CREATE INDEX IF NOT EXISTS bank_fixed_deposit_events_transaction_fk_idx
  ON public.bank_fixed_deposit_events(transaction_id);

COMMIT;
