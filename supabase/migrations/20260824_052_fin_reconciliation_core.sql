-- SMART MANAGER additive reconciliation foundation for POS and VICOBA/SACCOS.
-- Requires 20260824_050_fin_foundation.sql and 20260824_051_fin_journal_core.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.fin_reconciliation_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  account_scope text NOT NULL,
  external_source text NOT NULL,
  statement_date date NOT NULL,
  opening_balance numeric(20,2) NOT NULL,
  closing_balance numeric(20,2) NOT NULL,
  status text NOT NULL DEFAULT 'Imported'
    CHECK (status IN ('Imported', 'Matching', 'Exception', 'Approved', 'Closed', 'Cancelled')),
  file_reference text,
  import_hash text,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_reconciliation_batches_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_reconciliation_batches_balances_finite CHECK (
    opening_balance IS NOT NULL AND closing_balance IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.fin_reconciliation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  batch_id uuid NOT NULL,
  external_reference text NOT NULL,
  external_date timestamptz NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount <> 0),
  direction text NOT NULL CHECK (direction IN ('Credit', 'Debit')),
  provider text,
  provider_status text,
  matched_source_table text,
  matched_source_id uuid,
  match_status text NOT NULL DEFAULT 'Unmatched'
    CHECK (match_status IN ('Unmatched', 'Matched', 'Duplicate', 'Exception', 'Approved')),
  exception_reason text,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  resolved_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_reconciliation_items_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_reconciliation_items_batch_reference_unique
    UNIQUE (company_id, batch_id, external_reference),
  CONSTRAINT fin_reconciliation_items_resolution_consistency CHECK (
    (match_status IN ('Exception', 'Approved') AND exception_reason IS NOT NULL)
    OR match_status NOT IN ('Exception', 'Approved')
  ),
  CONSTRAINT fin_reconciliation_items_resolved_consistency CHECK (
    (resolved_by IS NULL AND resolved_at IS NULL)
    OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
  )
);

ALTER TABLE public.fin_reconciliation_items
  DROP CONSTRAINT IF EXISTS fin_reconciliation_items_batch_company_fkey;
ALTER TABLE public.fin_reconciliation_items
  ADD CONSTRAINT fin_reconciliation_items_batch_company_fkey
  FOREIGN KEY (company_id, batch_id)
  REFERENCES public.fin_reconciliation_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS fin_reconciliation_batches_company_import_hash_unique
  ON public.fin_reconciliation_batches (company_id, external_source, import_hash)
  WHERE import_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS fin_reconciliation_batches_company_date_status_idx
  ON public.fin_reconciliation_batches (company_id, statement_date DESC, status);
CREATE INDEX IF NOT EXISTS fin_reconciliation_items_company_status_date_idx
  ON public.fin_reconciliation_items (company_id, match_status, external_date DESC);
CREATE INDEX IF NOT EXISTS fin_reconciliation_items_provider_reference_idx
  ON public.fin_reconciliation_items (company_id, provider, external_reference);
CREATE INDEX IF NOT EXISTS fin_reconciliation_items_source_idx
  ON public.fin_reconciliation_items (company_id, matched_source_table, matched_source_id);

DROP TRIGGER IF EXISTS fin_reconciliation_batches_touch_updated_at ON public.fin_reconciliation_batches;
CREATE TRIGGER fin_reconciliation_batches_touch_updated_at
BEFORE UPDATE ON public.fin_reconciliation_batches
FOR EACH ROW EXECUTE FUNCTION public.fin_touch_updated_at();

DROP TRIGGER IF EXISTS fin_reconciliation_items_touch_updated_at ON public.fin_reconciliation_items;
CREATE TRIGGER fin_reconciliation_items_touch_updated_at
BEFORE UPDATE ON public.fin_reconciliation_items
FOR EACH ROW EXECUTE FUNCTION public.fin_touch_updated_at();

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['fin_reconciliation_batches', 'fin_reconciliation_items'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
      t || '_tenant_select', t
    );
  END LOOP;
END;
$$;

COMMIT;
