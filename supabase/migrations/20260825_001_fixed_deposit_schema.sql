-- Fixed Deposit schema foundation.
-- Additive only: preserves the existing generic bank_fixed_deposits envelope and rows.
-- This migration does not fund, mature, renew, or otherwise move money.
BEGIN;

CREATE TABLE IF NOT EXISTS public.bank_fixed_deposit_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  minimum_principal numeric(20,2) NOT NULL DEFAULT 0
    CHECK (minimum_principal >= 0),
  maximum_principal numeric(20,2)
    CHECK (maximum_principal IS NULL OR maximum_principal >= minimum_principal),
  minimum_term_days integer NOT NULL DEFAULT 30
    CHECK (minimum_term_days > 0),
  maximum_term_days integer NOT NULL
    CHECK (maximum_term_days >= minimum_term_days),
  annual_interest_rate numeric(12,6) NOT NULL DEFAULT 0
    CHECK (annual_interest_rate >= 0),
  interest_method text NOT NULL DEFAULT 'SIMPLE_365'
    CHECK (interest_method IN ('SIMPLE_365', 'SIMPLE_360', 'COMPOUND_MONTHLY', 'COMPOUND_DAILY')),
  compounding_frequency text
    CHECK (compounding_frequency IS NULL OR compounding_frequency IN ('MONTHLY', 'DAILY', 'AT_MATURITY')),
  withholding_tax_rate numeric(7,4) NOT NULL DEFAULT 0
    CHECK (withholding_tax_rate >= 0 AND withholding_tax_rate <= 100),
  early_withdrawal_allowed boolean NOT NULL DEFAULT false,
  early_withdrawal_penalty_rate numeric(7,4) NOT NULL DEFAULT 0
    CHECK (early_withdrawal_penalty_rate >= 0 AND early_withdrawal_penalty_rate <= 100),
  default_maturity_instruction text NOT NULL DEFAULT 'PAYOUT_TO_ACCOUNT'
    CHECK (default_maturity_instruction IN ('PAYOUT_TO_ACCOUNT', 'RENEW_PRINCIPAL', 'RENEW_PRINCIPAL_AND_INTEREST')),
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'RETIRED')),
  principal_liability_gl_code text NOT NULL DEFAULT 'CUSTOMER-FIXED-DEPOSIT',
  interest_expense_gl_code text NOT NULL DEFAULT 'FIXED-DEPOSIT-INTEREST-EXPENSE',
  withholding_tax_gl_code text NOT NULL DEFAULT 'WITHHOLDING-TAX-PAYABLE',
  cash_or_clearing_gl_code text NOT NULL DEFAULT 'CASH_OR_CLEARING',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- Typed extension of the live generic compatibility table. Existing rows receive
-- only safe defaults; financial values and relationships remain NULL until a
-- verified workflow creates them.
ALTER TABLE public.bank_fixed_deposits
  ADD COLUMN IF NOT EXISTS deposit_number text,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS source_account_id uuid,
  ADD COLUMN IF NOT EXISTS payout_account_id uuid,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS principal numeric(20,2),
  ADD COLUMN IF NOT EXISTS annual_interest_rate numeric(12,6),
  ADD COLUMN IF NOT EXISTS term_days integer,
  ADD COLUMN IF NOT EXISTS day_count_basis integer NOT NULL DEFAULT 365,
  ADD COLUMN IF NOT EXISTS interest_method text NOT NULL DEFAULT 'SIMPLE_365',
  ADD COLUMN IF NOT EXISTS compounding_frequency text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS maturity_date date,
  ADD COLUMN IF NOT EXISTS maturity_instruction text NOT NULL DEFAULT 'PAYOUT_TO_ACCOUNT',
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS renewal_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accrued_interest numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_interest numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withheld_tax numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_withdrawal_penalty numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maturity_amount numeric(20,2),
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS matured_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_reason text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;

-- Constraints use NOT VALID where legacy generic rows may not carry typed
-- relationships. New rows are checked immediately; legacy rows can be reconciled
-- and validated in a later controlled migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_principal_positive') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_principal_positive
      CHECK (principal IS NULL OR principal > 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_rate_nonnegative') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_rate_nonnegative
      CHECK (annual_interest_rate IS NULL OR annual_interest_rate >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_term_positive') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_term_positive
      CHECK (term_days IS NULL OR term_days > 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_day_count_valid') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_day_count_valid
      CHECK (day_count_basis IN (360, 365)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_interest_method_valid') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_interest_method_valid
      CHECK (interest_method IN ('SIMPLE_365', 'SIMPLE_360', 'COMPOUND_MONTHLY', 'COMPOUND_DAILY')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_instruction_valid') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_instruction_valid
      CHECK (maturity_instruction IN ('PAYOUT_TO_ACCOUNT', 'RENEW_PRINCIPAL', 'RENEW_PRINCIPAL_AND_INTEREST')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_amounts_nonnegative') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_amounts_nonnegative
      CHECK (accrued_interest >= 0 AND paid_interest >= 0 AND withheld_tax >= 0 AND early_withdrawal_penalty >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_dates_valid') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_dates_valid
      CHECK (maturity_date IS NULL OR start_date IS NULL OR maturity_date > start_date) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_renewal_nonnegative') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_renewal_nonnegative
      CHECK (renewal_count >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_version_nonnegative') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_version_nonnegative
      CHECK (version >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_product_fk') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_product_fk
      FOREIGN KEY (product_id) REFERENCES public.bank_fixed_deposit_products(id) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_customer_fk') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_customer_fk
      FOREIGN KEY (customer_id) REFERENCES public.bank_customers(id) ON DELETE RESTRICT NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_source_account_fk') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_source_account_fk
      FOREIGN KEY (source_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_fixed_deposits_payout_account_fk') THEN
    ALTER TABLE public.bank_fixed_deposits ADD CONSTRAINT bank_fixed_deposits_payout_account_fk
      FOREIGN KEY (payout_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT NOT VALID;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.bank_fixed_deposit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  fixed_deposit_id uuid NOT NULL
    REFERENCES public.bank_fixed_deposits(id) ON DELETE RESTRICT,
  event_type text NOT NULL
    CHECK (event_type IN (
      'CREATED', 'APPROVED', 'FUNDED', 'INTEREST_ACCRUED',
      'MATURED', 'PAYOUT_POSTED', 'RENEWED', 'EARLY_WITHDRAWN',
      'CANCELLED', 'TAX_WITHHELD', 'CLOSED', 'REVERSED'
    )),
  event_at timestamptz NOT NULL DEFAULT now(),
  principal_delta numeric(20,2) NOT NULL DEFAULT 0,
  interest_delta numeric(20,2) NOT NULL DEFAULT 0,
  tax_delta numeric(20,2) NOT NULL DEFAULT 0,
  penalty_delta numeric(20,2) NOT NULL DEFAULT 0,
  amount numeric(20,2),
  currency text NOT NULL DEFAULT 'TZS',
  journal_batch_id uuid REFERENCES public.bank_journal_batches(id) ON DELETE RESTRICT,
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE RESTRICT,
  actor_id uuid DEFAULT auth.uid(),
  idempotency_key text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (principal_delta >= -999999999999999999.99),
  CHECK (interest_delta >= -999999999999999999.99),
  CHECK (tax_delta >= -999999999999999999.99),
  CHECK (penalty_delta >= -999999999999999999.99)
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposit_products_company_code_idx
  ON public.bank_fixed_deposit_products(company_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposits_company_deposit_number_idx
  ON public.bank_fixed_deposits(company_id, deposit_number)
  WHERE deposit_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposits_company_idempotency_idx
  ON public.bank_fixed_deposits(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposit_events_company_idempotency_idx
  ON public.bank_fixed_deposit_events(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_fixed_deposit_products_company_status_idx
  ON public.bank_fixed_deposit_products(company_id, status, code);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_company_status_maturity_idx
  ON public.bank_fixed_deposits(company_id, status, maturity_date);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_company_customer_idx
  ON public.bank_fixed_deposits(company_id, customer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_company_source_account_idx
  ON public.bank_fixed_deposits(company_id, source_account_id, status);
CREATE INDEX IF NOT EXISTS bank_fixed_deposit_events_company_deposit_time_idx
  ON public.bank_fixed_deposit_events(company_id, fixed_deposit_id, event_at DESC);

ALTER TABLE public.bank_fixed_deposit_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_fixed_deposit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'bank_fixed_deposit_products_tenant_select') THEN
    CREATE POLICY bank_fixed_deposit_products_tenant_select
      ON public.bank_fixed_deposit_products FOR SELECT TO authenticated
      USING (company_id = public.current_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'bank_fixed_deposit_products_tenant_write') THEN
    CREATE POLICY bank_fixed_deposit_products_tenant_write
      ON public.bank_fixed_deposit_products FOR ALL TO authenticated
      USING (company_id = public.current_company_id() AND public.bank_is_privileged())
      WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'bank_fixed_deposit_events_tenant_select') THEN
    CREATE POLICY bank_fixed_deposit_events_tenant_select
      ON public.bank_fixed_deposit_events FOR SELECT TO authenticated
      USING (company_id = public.current_company_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'bank_fixed_deposit_events_tenant_insert') THEN
    CREATE POLICY bank_fixed_deposit_events_tenant_insert
      ON public.bank_fixed_deposit_events FOR INSERT TO authenticated
      WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged());
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_fixed_deposit_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'Fixed deposit lifecycle events are immutable.' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS bank_fixed_deposit_events_no_update ON public.bank_fixed_deposit_events;
CREATE TRIGGER bank_fixed_deposit_events_no_update
  BEFORE UPDATE OR DELETE ON public.bank_fixed_deposit_events
  FOR EACH ROW EXECUTE FUNCTION public.bank_fixed_deposit_events_immutable();

COMMENT ON TABLE public.bank_fixed_deposit_products IS 'Tenant-scoped fixed-deposit product rules; financial terms are copied into each deposit at creation.';
COMMENT ON TABLE public.bank_fixed_deposit_events IS 'Append-only lifecycle and accounting references for fixed deposits.';
COMMENT ON COLUMN public.bank_fixed_deposits.data IS 'Legacy compatibility envelope plus immutable productSnapshot and workflow metadata for new fixed deposits.';

COMMIT;
