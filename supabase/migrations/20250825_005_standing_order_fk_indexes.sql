-- Targeted performance follow-up for the Standing Order schema.
-- Adds only indexes for foreign keys introduced by the workflow migration.

BEGIN;

CREATE INDEX IF NOT EXISTS bank_standing_orders_customer_id_idx
  ON public.bank_standing_orders(customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_standing_order_runs_standing_order_id_idx
  ON public.bank_standing_order_runs(standing_order_id);

CREATE INDEX IF NOT EXISTS bank_standing_order_runs_transaction_id_idx
  ON public.bank_standing_order_runs(transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_standing_order_runs_payment_instruction_id_idx
  ON public.bank_standing_order_runs(payment_instruction_id)
  WHERE payment_instruction_id IS NOT NULL;

COMMIT;
