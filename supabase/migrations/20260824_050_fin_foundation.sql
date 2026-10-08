-- SMART MANAGER additive finance foundation for POS and VICOBA/SACCOS.
-- This migration is intentionally expand-only: it creates new tables and policies,
-- does not alter or delete existing business data, and does not activate new writes.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.fin_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Soft Closed', 'Closed')),
  timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  closed_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  closed_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_periods_dates_valid CHECK (period_start <= period_end),
  CONSTRAINT fin_periods_company_dates_unique UNIQUE (company_id, period_start, period_end),
  CONSTRAINT fin_periods_company_id_unique UNIQUE (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.fin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL
    CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense', 'Contra Asset', 'Contra Liability')),
  normal_side text NOT NULL CHECK (normal_side IN ('Debit', 'Credit')),
  parent_id uuid,
  is_postable boolean NOT NULL DEFAULT true,
  is_cash boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_accounts_company_code_unique UNIQUE (company_id, account_code),
  CONSTRAINT fin_accounts_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_accounts_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id),
  CONSTRAINT fin_accounts_currency_valid CHECK (currency = 'TZS')
);

ALTER TABLE public.fin_accounts
  DROP CONSTRAINT IF EXISTS fin_accounts_parent_company_fkey;
ALTER TABLE public.fin_accounts
  ADD CONSTRAINT fin_accounts_parent_company_fkey
  FOREIGN KEY (company_id, parent_id)
  REFERENCES public.fin_accounts (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.fin_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  response jsonb,
  status text NOT NULL DEFAULT 'Started'
    CHECK (status IN ('Started', 'Succeeded', 'Failed')),
  expires_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_idempotency_company_key_unique UNIQUE (company_id, scope, idempotency_key),
  CONSTRAINT fin_idempotency_company_id_unique UNIQUE (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.fin_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  requested_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Returned', 'Cancelled')),
  required_approvals smallint NOT NULL DEFAULT 1 CHECK (required_approvals > 0),
  decided_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_at timestamptz,
  decision_note text,
  maker_checker_key text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fin_approval_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT fin_approval_entity_action_key_unique
    UNIQUE (company_id, entity_type, entity_id, action, maker_checker_key),
  CONSTRAINT fin_approval_decider_differs_from_maker
    CHECK (status NOT IN ('Approved', 'Rejected') OR decided_by IS NULL OR decided_by <> requested_by),
  CONSTRAINT fin_approval_decision_consistency
    CHECK ((status IN ('Approved', 'Rejected') AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
        OR status NOT IN ('Approved', 'Rejected'))
);

CREATE INDEX IF NOT EXISTS fin_periods_company_status_idx
  ON public.fin_periods (company_id, status, period_start DESC);
CREATE INDEX IF NOT EXISTS fin_accounts_company_type_status_idx
  ON public.fin_accounts (company_id, account_type, status);
CREATE INDEX IF NOT EXISTS fin_accounts_company_parent_idx
  ON public.fin_accounts (company_id, parent_id);
CREATE INDEX IF NOT EXISTS fin_idempotency_company_scope_created_idx
  ON public.fin_idempotency_keys (company_id, scope, created_at DESC);
CREATE INDEX IF NOT EXISTS fin_approval_company_status_created_idx
  ON public.fin_approval_requests (company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS fin_approval_entity_idx
  ON public.fin_approval_requests (company_id, entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.fin_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fin_periods_touch_updated_at ON public.fin_periods;
CREATE TRIGGER fin_periods_touch_updated_at
BEFORE UPDATE ON public.fin_periods
FOR EACH ROW EXECUTE FUNCTION public.fin_touch_updated_at();

DROP TRIGGER IF EXISTS fin_accounts_touch_updated_at ON public.fin_accounts;
CREATE TRIGGER fin_accounts_touch_updated_at
BEFORE UPDATE ON public.fin_accounts
FOR EACH ROW EXECUTE FUNCTION public.fin_touch_updated_at();

DROP TRIGGER IF EXISTS fin_idempotency_touch_updated_at ON public.fin_idempotency_keys;
CREATE TRIGGER fin_idempotency_touch_updated_at
BEFORE UPDATE ON public.fin_idempotency_keys
FOR EACH ROW EXECUTE FUNCTION public.fin_touch_updated_at();

DROP TRIGGER IF EXISTS fin_approval_touch_updated_at ON public.fin_approval_requests;
CREATE TRIGGER fin_approval_touch_updated_at
BEFORE UPDATE ON public.fin_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.fin_touch_updated_at();

CREATE OR REPLACE FUNCTION public.fin_has_role(p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND coalesce(p.is_active, true)
      AND lower(coalesce(p.role, '')) = ANY (SELECT lower(x) FROM unnest(p_roles) x)
  )
  OR EXISTS (
    SELECT 1
    FROM public.company_memberships m
    WHERE m.user_id = auth.uid()
      AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role, '')) = ANY (SELECT lower(x) FROM unnest(p_roles) x)
  );
$$;

CREATE OR REPLACE FUNCTION public.fin_can_view()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.fin_has_role(ARRAY[
    'super administrator', 'platform administrator', 'institution administrator',
    'organization owner', 'owner', 'ceo', 'cfo', 'finance manager',
    'finance officer', 'branch manager', 'auditor', 'internal auditor',
    'teller', 'cashier', 'money agent manager', 'money agent'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.fin_can_manage()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.fin_has_role(ARRAY[
    'super administrator', 'platform administrator', 'institution administrator',
    'organization owner', 'owner', 'ceo', 'cfo', 'finance manager',
    'branch manager'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.fin_can_approve()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.fin_has_role(ARRAY[
    'super administrator', 'platform administrator', 'institution administrator',
    'organization owner', 'owner', 'ceo', 'cfo', 'finance manager',
    'branch manager', 'supervisor'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.fin_require(p_capability text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_company_id() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required.' USING ERRCODE = '42501';
  END IF;
  IF p_capability = 'view' AND NOT public.fin_can_view() THEN
    RAISE EXCEPTION 'Your role cannot view financial controls.' USING ERRCODE = '42501';
  END IF;
  IF p_capability = 'manage' AND NOT public.fin_can_manage() THEN
    RAISE EXCEPTION 'Your role cannot manage financial controls.' USING ERRCODE = '42501';
  END IF;
  IF p_capability = 'approve' AND NOT public.fin_can_approve() THEN
    RAISE EXCEPTION 'Your role cannot approve financial controls.' USING ERRCODE = '42501';
  END IF;
  IF p_capability NOT IN ('view', 'manage', 'approve') THEN
    RAISE EXCEPTION 'Unsupported financial capability.' USING ERRCODE = '22023';
  END IF;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['fin_periods', 'fin_accounts', 'fin_idempotency_keys', 'fin_approval_requests'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
      t || '_tenant_select', t
    );
  END LOOP;
END;
$$;

-- No direct authenticated INSERT/UPDATE/DELETE policy is granted in this foundation
-- slice. Controlled routines will be added after the journal core exists.
REVOKE ALL ON FUNCTION public.fin_has_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fin_can_view() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fin_can_manage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fin_can_approve() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fin_require(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fin_has_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_can_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_can_manage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_can_approve() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_require(text) TO authenticated;

COMMIT;
