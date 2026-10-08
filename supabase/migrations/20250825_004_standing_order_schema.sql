-- Smart Manager Standing Order workflow schema
-- Additive migration. Existing standing-order rows were reconciled before applying.
-- Business RPCs and scheduler implementation must use this schema; no direct balance edits.

BEGIN;

ALTER TABLE public.bank_standing_orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.bank_customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'INTERNAL_TRANSFER',
  ADD COLUMN IF NOT EXISTS narration text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  ADD COLUMN IF NOT EXISTS schedule_day integer,
  ADD COLUMN IF NOT EXISTS run_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS failure_policy text NOT NULL DEFAULT 'PAUSE_AFTER_MAX_RETRIES',
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS updated_by uuid DEFAULT auth.uid();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_amount_positive') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_currency_format') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_currency_format CHECK (currency ~ '^[A-Z]{3}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_channel_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_channel_valid CHECK (channel IN ('INTERNAL_TRANSFER', 'MOBILE_MONEY'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_frequency_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_frequency_valid CHECK (upper(frequency) IN ('DAILY', 'WEEKLY', 'MONTHLY'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_date_range_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_date_range_valid CHECK (end_date IS NULL OR end_date >= next_run_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_schedule_day_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_schedule_day_valid CHECK (schedule_day IS NULL OR schedule_day BETWEEN 1 AND 31);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_retry_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_retry_valid CHECK (max_retries BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_failure_policy_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_failure_policy_valid CHECK (failure_policy IN ('RETRY_THEN_PAUSE', 'PAUSE_AFTER_MAX_RETRIES', 'SKIP_AND_CONTINUE', 'FAIL_CLOSED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_version_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_version_valid CHECK (version >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_standing_orders_destination_valid') THEN
    ALTER TABLE public.bank_standing_orders ADD CONSTRAINT bank_standing_orders_destination_valid CHECK (
      (channel = 'INTERNAL_TRANSFER' AND destination_account_id IS NOT NULL AND destination_msisdn IS NULL)
      OR (channel = 'MOBILE_MONEY' AND destination_msisdn IS NOT NULL AND destination_account_id IS NULL)
    );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS bank_standing_orders_company_idempotency_unique
  ON public.bank_standing_orders(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_standing_orders_company_due_idx
  ON public.bank_standing_orders(company_id, status, next_run_date, id);
CREATE INDEX IF NOT EXISTS bank_standing_orders_source_account_idx
  ON public.bank_standing_orders(company_id, source_account_id, status);
CREATE INDEX IF NOT EXISTS bank_standing_orders_destination_account_idx
  ON public.bank_standing_orders(company_id, destination_account_id, status)
  WHERE destination_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_standing_orders_customer_idx
  ON public.bank_standing_orders(company_id, customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.bank_standing_order_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  standing_order_id uuid NOT NULL REFERENCES public.bank_standing_orders(id) ON DELETE RESTRICT,
  scheduled_for date NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  attempt_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'PROCESSING',
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TZS',
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  payment_instruction_id uuid REFERENCES public.bank_payment_instructions(id) ON DELETE SET NULL,
  provider text,
  provider_reference text,
  error_code text,
  error_message text,
  idempotency_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_standing_order_runs_status_valid CHECK (status IN ('PROCESSING', 'POSTED', 'SUBMITTED', 'PENDING_PROVIDER', 'FAILED', 'SKIPPED', 'CANCELLED')),
  CONSTRAINT bank_standing_order_runs_attempt_valid CHECK (attempt_number BETWEEN 1 AND 10),
  CONSTRAINT bank_standing_order_runs_currency_valid CHECK (currency ~ '^[A-Z]{3}$'),
  UNIQUE(company_id, standing_order_id, scheduled_for, attempt_number),
  UNIQUE(company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS bank_standing_order_runs_order_time_idx
  ON public.bank_standing_order_runs(company_id, standing_order_id, scheduled_for DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_standing_order_runs_status_idx
  ON public.bank_standing_order_runs(company_id, status, scheduled_for);

CREATE TABLE IF NOT EXISTS public.bank_standing_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  standing_order_id uuid NOT NULL REFERENCES public.bank_standing_orders(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  previous_status text,
  next_status text,
  actor_id uuid DEFAULT auth.uid(),
  request_id text,
  idempotency_key text,
  reason text,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_standing_order_events_type_valid CHECK (event_type IN ('CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ACTIVATED', 'PAUSED', 'RESUMED', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'RUN_POSTED', 'RUN_FAILED', 'RUN_SKIPPED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_standing_order_events_idempotency_unique
  ON public.bank_standing_order_events(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_standing_order_events_order_time_idx
  ON public.bank_standing_order_events(company_id, standing_order_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.bank_standing_order_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'Standing Order event history is append-only.' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS bank_standing_order_events_immutable ON public.bank_standing_order_events;
CREATE TRIGGER bank_standing_order_events_immutable
  BEFORE UPDATE OR DELETE ON public.bank_standing_order_events
  FOR EACH ROW EXECUTE FUNCTION public.bank_standing_order_events_immutable();

ALTER TABLE public.bank_standing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_standing_order_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_standing_order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bank_standing_orders_tenant ON public.bank_standing_orders;
DROP POLICY IF EXISTS bank_standing_order_runs_tenant_select ON public.bank_standing_order_runs;
DROP POLICY IF EXISTS bank_standing_order_events_tenant_select ON public.bank_standing_order_events;

CREATE POLICY bank_standing_order_runs_tenant_select
  ON public.bank_standing_order_runs FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY bank_standing_order_events_tenant_select
  ON public.bank_standing_order_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

REVOKE ALL ON TABLE public.bank_standing_order_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.bank_standing_order_runs TO authenticated;
REVOKE ALL ON TABLE public.bank_standing_order_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.bank_standing_order_events TO authenticated;
REVOKE EXECUTE ON FUNCTION public.bank_standing_order_events_immutable() FROM PUBLIC, anon, authenticated;

COMMIT;
