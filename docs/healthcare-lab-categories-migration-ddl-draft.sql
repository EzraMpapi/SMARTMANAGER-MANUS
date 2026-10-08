-- REVIEW-ONLY DRAFT. DO NOT APPLY UNTIL PRODUCT, AUTHORIZATION, SECURITY, AND QA SIGN-OFF.
-- Proposed migration name: 20260825_018_healthcare_lab_categories_schema
-- Ownership decision required: Healthcare Laboratory, not Pharmacy catalog.
-- Existing authorization dependency: public.workforce_has_permission(text).
-- No settlement, billing, inventory, patient, or laboratory-order mutation is performed here.

BEGIN;

CREATE TABLE public.hc_lab_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,

  code text NOT NULL,
  name text NOT NULL,
  description text,
  specimen_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_turnaround_hours integer NOT NULL DEFAULT 24,
  requires_fasting boolean NOT NULL DEFAULT false,
  requires_referral boolean NOT NULL DEFAULT false,
  base_price numeric(20, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',

  status text NOT NULL DEFAULT 'DRAFT',
  sort_order integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text,
  version bigint NOT NULL DEFAULT 0,

  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,

  CONSTRAINT hc_lab_categories_company_id_key UNIQUE (company_id, id),
  CONSTRAINT hc_lab_categories_code_format
    CHECK (code = upper(btrim(code)) AND code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  CONSTRAINT hc_lab_categories_name_length
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  CONSTRAINT hc_lab_categories_description_length
    CHECK (description IS NULL OR char_length(description) <= 4000),
  CONSTRAINT hc_lab_categories_specimen_array
    CHECK (jsonb_typeof(specimen_requirements) = 'array'),
  CONSTRAINT hc_lab_categories_turnaround_valid
    CHECK (default_turnaround_hours BETWEEN 1 AND 720),
  CONSTRAINT hc_lab_categories_base_price_valid
    CHECK (base_price >= 0 AND base_price <= 100000000000),
  CONSTRAINT hc_lab_categories_currency_valid
    CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  CONSTRAINT hc_lab_categories_status_valid
    CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  CONSTRAINT hc_lab_categories_sort_order_valid
    CHECK (sort_order BETWEEN -100000 AND 100000),
  CONSTRAINT hc_lab_categories_version_valid
    CHECK (version >= 0),
  CONSTRAINT hc_lab_categories_idempotency_length
    CHECK (idempotency_key IS NULL OR char_length(btrim(idempotency_key)) BETWEEN 1 AND 200),
  CONSTRAINT hc_lab_categories_archive_consistency
    CHECK (
      (status = 'ARCHIVED' AND archived_at IS NOT NULL)
      OR (status <> 'ARCHIVED' AND archived_at IS NULL)
    )
);

CREATE UNIQUE INDEX hc_lab_categories_company_code_key
  ON public.hc_lab_categories (company_id, code);

CREATE UNIQUE INDEX hc_lab_categories_company_idempotency_key
  ON public.hc_lab_categories (company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX hc_lab_categories_company_status_sort
  ON public.hc_lab_categories (company_id, status, sort_order, name, id);

CREATE INDEX hc_lab_categories_company_updated
  ON public.hc_lab_categories (company_id, updated_at DESC, id);

CREATE TABLE public.hc_lab_category_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id(),
  category_id uuid NOT NULL,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid DEFAULT auth.uid(),
  idempotency_key text,
  previous_status text,
  next_status text,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hc_lab_category_events_category_fk
    FOREIGN KEY (company_id, category_id)
    REFERENCES public.hc_lab_categories (company_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT hc_lab_category_events_type_valid
    CHECK (event_type IN ('CREATED', 'UPDATED', 'ACTIVATED', 'SUSPENDED', 'ARCHIVED')),
  CONSTRAINT hc_lab_category_events_reason_length
    CHECK (reason IS NULL OR char_length(reason) <= 4000),
  CONSTRAINT hc_lab_category_events_idempotency_length
    CHECK (idempotency_key IS NULL OR char_length(btrim(idempotency_key)) BETWEEN 1 AND 200)
);

CREATE UNIQUE INDEX hc_lab_category_events_company_idempotency
  ON public.hc_lab_category_events (company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX hc_lab_category_events_category_time
  ON public.hc_lab_category_events (company_id, category_id, event_at DESC, id);

CREATE INDEX hc_lab_category_events_company_time
  ON public.hc_lab_category_events (company_id, event_at DESC, id);

CREATE OR REPLACE FUNCTION public.hc_lab_categories_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER hc_lab_categories_updated_at
  BEFORE UPDATE ON public.hc_lab_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.hc_lab_categories_set_updated_at();

CREATE OR REPLACE FUNCTION public.hc_lab_category_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'Healthcare laboratory category events are immutable.'
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER hc_lab_category_events_immutable_trigger
  BEFORE UPDATE OR DELETE ON public.hc_lab_category_events
  FOR EACH ROW
  EXECUTE FUNCTION public.hc_lab_category_events_immutable();

ALTER TABLE public.hc_lab_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_lab_category_events ENABLE ROW LEVEL SECURITY;

-- The existing workforce helper resolves auth.uid(), current_company_id(),
-- active role assignments, allow/deny effects, and privileged roles.
CREATE POLICY hc_lab_categories_tenant_read
  ON public.hc_lab_categories
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.workforce_has_permission('healthcare.lab_categories.read')
  );

CREATE POLICY hc_lab_category_events_tenant_read
  ON public.hc_lab_category_events
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.workforce_has_permission('healthcare.lab_categories.read')
  );

-- Browser writes are RPC-only. Dedicated RPCs are added only after the
-- permission seed and server-side contract are approved.
REVOKE ALL ON TABLE public.hc_lab_categories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.hc_lab_category_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.hc_lab_categories TO authenticated;
GRANT SELECT ON TABLE public.hc_lab_category_events TO authenticated;

REVOKE ALL ON FUNCTION public.hc_lab_categories_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hc_lab_category_events_immutable() FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.hc_lab_categories IS
  'Tenant-scoped Healthcare Laboratory category configuration; writes are server-owned RPCs.';
COMMENT ON TABLE public.hc_lab_category_events IS
  'Append-only tenant-scoped lifecycle evidence for Healthcare Laboratory categories.';

COMMIT;

-- Follow-up migration, not included in this DDL draft:
-- 1. Seed reviewed workforce_permissions rows for:
--    healthcare.lab_categories.read/create/update/archive
-- 2. Grant only the approved RPCs to authenticated or service roles.
-- 3. Implement the RPCs with public.workforce_has_permission(...), auth.uid(),
--    public.current_company_id(), idempotency checks, optimistic version checks,
--    and atomic category/event writes.
-- 4. Add isolated tenant, role, RLS, idempotency, concurrency, and audit tests.
