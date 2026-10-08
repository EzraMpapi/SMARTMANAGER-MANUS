-- SMART MANAGER additive shared journal core for POS and VICOBA/SACCOS.
-- Requires 20260824_050_fin_foundation.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.fin_journal_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  batch_number text NOT NULL,
  source_module text NOT NULL
    CHECK (source_module IN ('POS', 'VICOBA', 'SACCOS', 'BANK_MFI', 'MONEY_AGENT', 'SALES', 'INVENTORY', 'PROCUREMENT', 'PROPERTY', 'HOSPITALITY', 'FLEET', 'MANUAL')),
  source_type text NOT NULL,
  source_id uuid,
  business_date date NOT NULL,
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Pending Approval', 'Posted', 'Reversed', 'Rejected')),
  debit_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (debit_total >= 0),
  credit_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (credit_total >= 0),
  posted_at timestamptz,
  posted_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reversal_of_batch_id uuid,
  narration text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_journal_batches_company_batch_unique UNIQUE (company_id, batch_number),
  CONSTRAINT fin_journal_batches_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_journal_batches_posted_balanced CHECK (
    status <> 'Posted' OR debit_total = credit_total
  ),
  CONSTRAINT fin_journal_batches_posted_metadata_complete CHECK (
    status <> 'Posted' OR (posted_at IS NOT NULL AND posted_by IS NOT NULL)
  )
);

-- Period membership is date-range logic rather than an equality foreign key;
-- the posting routine in 062 locks and validates the applicable open period.

ALTER TABLE public.fin_journal_batches
  DROP CONSTRAINT IF EXISTS fin_journal_batches_reversal_company_fkey;
ALTER TABLE public.fin_journal_batches
  ADD CONSTRAINT fin_journal_batches_reversal_company_fkey
  FOREIGN KEY (company_id, reversal_of_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.fin_journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  journal_batch_id uuid NOT NULL,
  line_no integer NOT NULL CHECK (line_no > 0),
  business_date date NOT NULL,
  account_id uuid NOT NULL,
  debit numeric(20,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(20,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  branch_id uuid,
  member_id uuid,
  customer_id uuid,
  description text,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_journal_lines_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_journal_lines_batch_line_unique UNIQUE (company_id, journal_batch_id, line_no),
  CONSTRAINT fin_journal_lines_exactly_one_side CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

ALTER TABLE public.fin_journal_lines
  DROP CONSTRAINT IF EXISTS fin_journal_lines_batch_company_fkey;
ALTER TABLE public.fin_journal_lines
  ADD CONSTRAINT fin_journal_lines_batch_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.fin_journal_lines
  DROP CONSTRAINT IF EXISTS fin_journal_lines_account_company_fkey;
ALTER TABLE public.fin_journal_lines
  ADD CONSTRAINT fin_journal_lines_account_company_fkey
  FOREIGN KEY (company_id, account_id)
  REFERENCES public.fin_accounts (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.fin_posting_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  journal_batch_id uuid NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  link_role text NOT NULL
    CHECK (link_role IN ('Primary', 'Inventory', 'Tender', 'Receivable', 'Payable', 'Member Account', 'Loan', 'Cash', 'Provider', 'Reversal')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_posting_links_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_posting_links_source_role_unique UNIQUE (company_id, source_table, source_id, link_role)
);

ALTER TABLE public.fin_posting_links
  DROP CONSTRAINT IF EXISTS fin_posting_links_batch_company_fkey;
ALTER TABLE public.fin_posting_links
  ADD CONSTRAINT fin_posting_links_batch_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS fin_journal_batches_company_date_status_idx
  ON public.fin_journal_batches (company_id, business_date, status);
CREATE INDEX IF NOT EXISTS fin_journal_batches_source_idx
  ON public.fin_journal_batches (company_id, source_module, source_type, source_id);
CREATE INDEX IF NOT EXISTS fin_journal_lines_account_date_idx
  ON public.fin_journal_lines (company_id, account_id, business_date);
CREATE INDEX IF NOT EXISTS fin_journal_lines_member_date_idx
  ON public.fin_journal_lines (company_id, member_id, business_date);
CREATE INDEX IF NOT EXISTS fin_journal_lines_branch_date_idx
  ON public.fin_journal_lines (company_id, branch_id, business_date);
CREATE INDEX IF NOT EXISTS fin_posting_links_batch_idx
  ON public.fin_posting_links (company_id, journal_batch_id);
CREATE INDEX IF NOT EXISTS fin_posting_links_source_idx
  ON public.fin_posting_links (company_id, source_table, source_id);

CREATE OR REPLACE FUNCTION public.fin_journal_copy_date()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch public.fin_journal_batches%ROWTYPE;
BEGIN
  SELECT * INTO v_batch
  FROM public.fin_journal_batches
  WHERE company_id = NEW.company_id AND id = NEW.journal_batch_id
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The journal batch is not available for this workspace.' USING ERRCODE = '42501';
  END IF;
  IF NEW.business_date <> v_batch.business_date THEN
    RAISE EXCEPTION 'Journal line business date must equal its batch business date.' USING ERRCODE = '22023';
  END IF;
  IF NEW.currency <> v_batch.currency THEN
    RAISE EXCEPTION 'Journal line currency must equal its batch currency.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fin_journal_lines_copy_date ON public.fin_journal_lines;
CREATE TRIGGER fin_journal_lines_copy_date
BEFORE INSERT OR UPDATE ON public.fin_journal_lines
FOR EACH ROW EXECUTE FUNCTION public.fin_journal_copy_date();

CREATE OR REPLACE FUNCTION public.fin_block_direct_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('finance.internal_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Financial history is immutable and can only change through a protected workflow.' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS fin_journal_batches_immutable_guard ON public.fin_journal_batches;
CREATE TRIGGER fin_journal_batches_immutable_guard
BEFORE UPDATE OR DELETE ON public.fin_journal_batches
FOR EACH ROW WHEN (OLD.status IN ('Posted', 'Reversed'))
EXECUTE FUNCTION public.fin_block_direct_mutation();

DROP TRIGGER IF EXISTS fin_journal_lines_immutable_guard ON public.fin_journal_lines;
CREATE TRIGGER fin_journal_lines_immutable_guard
BEFORE UPDATE OR DELETE ON public.fin_journal_lines
FOR EACH ROW EXECUTE FUNCTION public.fin_block_direct_mutation();

DROP TRIGGER IF EXISTS fin_posting_links_immutable_guard ON public.fin_posting_links;
CREATE TRIGGER fin_posting_links_immutable_guard
BEFORE UPDATE OR DELETE ON public.fin_posting_links
FOR EACH ROW EXECUTE FUNCTION public.fin_block_direct_mutation();

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['fin_journal_batches', 'fin_journal_lines', 'fin_posting_links'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
      t || '_tenant_select', t
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.fin_journal_copy_date() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fin_block_direct_mutation() FROM PUBLIC;

COMMIT;
