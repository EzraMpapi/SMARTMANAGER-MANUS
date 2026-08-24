-- SMART MANAGER additive subscription + user-management compatibility migration
--
-- Purpose:
--   Provide a safe, source-versioned schema contract for the existing Smart
--   Manager architecture. The script creates only missing membership and
--   subscription-support objects, adds missing final-model columns, and
--   hardens tenant boundaries with RLS and indexes.
--
-- Important boundaries:
--   * public.companies, public.profiles, auth.users, and the existing
--     current_company_id() identity boundary are prerequisites and are not
--     recreated here.
--   * Subscription entitlements remain in billing_plans.module_entitlements
--     and billing_access_snapshot(); no parallel subscription_entitlements
--     table is introduced.
--   * Existing business data is not deleted, truncated, or rewritten.
--   * Official plan seeding is deliberately not included. Use the approved
--     catalog migration 20260823_062_subscription_free_plan_model.sql for
--     FREE_15 and the six paid packages.
--   * Review the preflight output before applying in a new environment.
--
-- Apply through the repository's controlled Supabase migration workflow.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The Smart Manager billing model is tenant-scoped. Fail clearly rather than
-- silently creating an incompatible standalone identity universe.
DO $$
BEGIN
  IF to_regclass('public.companies') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.companies; apply the Smart Manager foundation migration first.';
  END IF;
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.profiles; apply the Smart Manager identity migration first.';
  END IF;
  IF to_regprocedure('public.current_company_id()') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.current_company_id(); apply the Smart Manager tenant-boundary migration first.';
  END IF;
  IF to_regprocedure('public.billing_is_manager()') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.billing_is_manager(); apply the Smart Manager billing foundation migration first.';
  END IF;
  IF to_regprocedure('public.billing_touch_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.billing_touch_updated_at(); apply the Smart Manager billing foundation migration first.';
  END IF;
  IF to_regprocedure('public.billing_access_snapshot()') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.billing_access_snapshot(); apply the Smart Manager subscription access migration first.';
  END IF;
  IF to_regprocedure('public.billing_start_free_plan(text)') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.billing_start_free_plan(text); apply the final Free-15 model migration first.';
  END IF;
  IF to_regprocedure('public.billing_create_payment_intent(uuid,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.billing_create_payment_intent(...); apply the final payment migration first.';
  END IF;
  IF to_regprocedure('public.billing_apply_provider_status(uuid,text,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'Missing prerequisite public.billing_apply_provider_status(...); apply the final provider-settlement migration first.';
  END IF;
END;
$$;

-- -------------------------------------------------------------------------
-- 1. Existing identity profile compatibility
-- -------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Member',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS currency_display text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS profile_timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_storage_key text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS profiles_company_active_idx
  ON public.profiles(company_id, is_active);

-- -------------------------------------------------------------------------
-- 2. User-to-company membership boundary
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Member',
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Invited', 'Active', 'Suspended', 'Revoked')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_memberships_company_user_unique UNIQUE (company_id, user_id)
);

ALTER TABLE public.company_memberships
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Member',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.company_memberships'::regclass
      AND c.contype = 'u'
      AND c.conkey = ARRAY[
        (SELECT a.attnum FROM pg_attribute a WHERE a.attrelid = c.conrelid AND a.attname = 'company_id' AND NOT a.attisdropped),
        (SELECT a.attnum FROM pg_attribute a WHERE a.attrelid = c.conrelid AND a.attname = 'user_id' AND NOT a.attisdropped)
      ]::smallint[]
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS company_memberships_company_user_idx
      ON public.company_memberships(company_id, user_id);
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS company_memberships_company_status_idx
  ON public.company_memberships(company_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS company_memberships_user_status_idx
  ON public.company_memberships(user_id, status, updated_at DESC);

-- -------------------------------------------------------------------------
-- 3. Subscription tables
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Active', 'Archived')),
  currency text NOT NULL DEFAULT 'TZS',
  monthly_price numeric(18,2),
  annual_price numeric(18,2),
  annual_savings_label text,
  included_users integer,
  included_branches integer,
  included_storage_mb bigint,
  included_transactions integer,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  module_entitlements jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  recommended boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  plan_category text NOT NULL DEFAULT 'Business',
  badge text,
  visual_theme text NOT NULL DEFAULT 'standard',
  paid_months integer NOT NULL DEFAULT 0,
  bonus_months integer NOT NULL DEFAULT 0,
  total_months integer NOT NULL DEFAULT 0,
  duration_days integer,
  CONSTRAINT billing_plans_price_check CHECK (
    (monthly_price IS NULL OR monthly_price >= 0)
    AND (annual_price IS NULL OR annual_price >= 0)
  ),
  CONSTRAINT billing_plans_scope_code_unique UNIQUE NULLS NOT DISTINCT (company_id, code)
);

ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS plan_category text NOT NULL DEFAULT 'Business',
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS visual_theme text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS paid_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_days integer;

CREATE TABLE IF NOT EXISTS public.billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  legal_name text,
  contact_name text,
  email text,
  phone text,
  tax_identifier text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_profiles_company_unique UNIQUE (company_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE RESTRICT,
  offer_code text,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Grace', 'Expired', 'RequiresPlan', 'Cancelled', 'Superseded')),
  billing_cycle text NOT NULL DEFAULT 'Monthly'
    CHECK (billing_cycle = 'Monthly'),
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TZS',
  started_at timestamptz,
  renewed_at timestamptz,
  expires_at timestamptz,
  grace_expires_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  source_payment_id uuid,
  paid_months integer NOT NULL DEFAULT 0,
  bonus_months integer NOT NULL DEFAULT 0,
  total_months integer NOT NULL DEFAULT 0,
  duration_days integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS offer_code text,
  ADD COLUMN IF NOT EXISTS paid_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_days integer;

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'HarakaPay',
  internal_reference text NOT NULL,
  idempotency_key text NOT NULL,
  provider_order_id text,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  fee numeric(18,2),
  net_amount numeric(18,2),
  currency text NOT NULL DEFAULT 'TZS',
  phone text NOT NULL,
  description text,
  billing_cycle text NOT NULL DEFAULT 'Monthly'
    CHECK (billing_cycle = 'Monthly'),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Completed', 'Failed', 'Cancelled', 'VerificationRequired')),
  initiated_by uuid,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_payments_reference_unique UNIQUE (internal_reference),
  CONSTRAINT subscription_payments_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT subscription_payments_provider_order_unique UNIQUE (provider, provider_order_id)
);

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES public.subscription_payments(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'Issued'
    CHECK (status IN ('Draft', 'Issued', 'Paid', 'Void')),
  currency text NOT NULL DEFAULT 'TZS',
  subtotal numeric(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz,
  document_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_invoices_company_number_unique UNIQUE (company_id, invoice_number),
  CONSTRAINT subscription_invoices_payment_unique UNIQUE (payment_id)
);

CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  usage_key text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  usage_value numeric(20,2) NOT NULL DEFAULT 0 CHECK (usage_value >= 0),
  limit_value numeric(20,2),
  source text NOT NULL DEFAULT 'System',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_usage_period_valid CHECK (period_end >= period_start),
  CONSTRAINT subscription_usage_company_key_unique UNIQUE (company_id, usage_key, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.subscription_payments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  previous_status text,
  new_status text,
  actor_profile_id uuid,
  actor_type text NOT NULL DEFAULT 'system',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_plan_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_by uuid,
  source text NOT NULL DEFAULT 'database',
  previous_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  notification_type text NOT NULL DEFAULT 'InApp',
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_notifications_company_key_unique UNIQUE (company_id, notification_key)
);

-- Final-model columns for environments where the support tables predate the
-- Free-15/paid-bonus release.
ALTER TABLE public.billing_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.subscription_invoices
  ADD COLUMN IF NOT EXISTS document_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Existing-object compatibility preflight. `IF NOT EXISTS` does not validate
-- an object that already exists, so fail clearly if a required canonical column
-- has an incompatible type rather than continuing against an alternate schema.
DO $$
DECLARE
  v_expected record;
  v_missing text[] := ARRAY[]::text[];
BEGIN
  FOR v_expected IN
    SELECT * FROM (VALUES
      ('companies', 'id', 'uuid'),
      ('profiles', 'id', 'uuid'),
      ('profiles', 'company_id', 'uuid'),
      ('profiles', 'role', 'text'),
      ('company_memberships', 'id', 'uuid'),
      ('company_memberships', 'company_id', 'uuid'),
      ('company_memberships', 'user_id', 'uuid'),
      ('billing_plans', 'id', 'uuid'),
      ('billing_plans', 'company_id', 'uuid'),
      ('billing_plans', 'code', 'text'),
      ('billing_plans', 'module_entitlements', 'jsonb'),
      ('billing_profiles', 'company_id', 'uuid'),
      ('tenant_subscriptions', 'company_id', 'uuid'),
      ('tenant_subscriptions', 'plan_id', 'uuid'),
      ('tenant_subscriptions', 'status', 'text'),
      ('tenant_subscriptions', 'billing_cycle', 'text'),
      ('tenant_subscriptions', 'amount', 'numeric'),
      ('tenant_subscriptions', 'source_payment_id', 'uuid'),
      ('subscription_payments', 'company_id', 'uuid'),
      ('subscription_payments', 'plan_id', 'uuid'),
      ('subscription_payments', 'idempotency_key', 'text'),
      ('subscription_payments', 'status', 'text'),
      ('subscription_payments', 'billing_cycle', 'text'),
      ('subscription_invoices', 'company_id', 'uuid'),
      ('subscription_usage', 'company_id', 'uuid'),
      ('subscription_events', 'company_id', 'uuid'),
      ('subscription_notifications', 'company_id', 'uuid')
    ) AS required(table_name, column_name, udt_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = v_expected.table_name
        AND c.column_name = v_expected.column_name
        AND c.udt_name = v_expected.udt_name
    ) THEN
      v_missing := array_append(v_missing, format('public.%s.%s (expected %s)', v_expected.table_name, v_expected.column_name, v_expected.udt_name));
    END IF;
  END LOOP;
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'Incompatible Smart Manager schema; manual review required: %', array_to_string(v_missing, ', ');
  END IF;
END;
$$;

-- Existing-object contract preflight. This compatibility layer never drops a
-- constraint or silently converts legacy rows. Apply the canonical final
-- subscription migration first if the existing database still contains
-- Annual/Trial state or an unfinished package contract.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tenant_subscriptions
    WHERE billing_cycle IS DISTINCT FROM 'Monthly'
       OR status NOT IN ('Pending', 'Active', 'Grace', 'Expired', 'RequiresPlan', 'Cancelled', 'Superseded')
  ) THEN
    RAISE EXCEPTION 'Existing subscription rows do not satisfy the final Monthly-only status contract; apply the canonical subscription model migration first.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.subscription_payments
    WHERE billing_cycle IS DISTINCT FROM 'Monthly'
  ) THEN
    RAISE EXCEPTION 'Existing payment rows do not satisfy the final Monthly-only contract; apply the canonical subscription model migration first.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.billing_plans
    WHERE company_id IS NULL
      AND status = 'Active'
      AND ((code = 'FREE_15' AND (monthly_price IS DISTINCT FROM 0 OR paid_months IS DISTINCT FROM 0 OR bonus_months IS DISTINCT FROM 0 OR total_months IS DISTINCT FROM 0 OR duration_days IS DISTINCT FROM 15))
       OR (code <> 'FREE_15' AND (monthly_price IS NULL OR monthly_price <= 0 OR paid_months IS DISTINCT FROM 1 OR bonus_months IS DISTINCT FROM 1 OR total_months IS DISTINCT FROM 2 OR duration_days IS NOT NULL)))
  ) THEN
    RAISE EXCEPTION 'Existing billing plan rows do not satisfy the final Free-15/paid-bonus contract; apply the canonical subscription model migration first.';
  END IF;
END;
$$;

-- Link the subscription payment and source-payment relationships only when
-- the named constraint is absent. Existing compatible foreign keys remain.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tenant_subscriptions'::regclass
      AND conname = 'tenant_subscriptions_source_payment_fk'
  ) THEN
    ALTER TABLE public.tenant_subscriptions
      ADD CONSTRAINT tenant_subscriptions_source_payment_fk
      FOREIGN KEY (source_payment_id)
      REFERENCES public.subscription_payments(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- -------------------------------------------------------------------------
-- 4. Indexes for tenant reads, idempotency, expiry, and audit history
-- -------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS billing_plans_catalog_idx
  ON public.billing_plans(plan_category, status, sort_order, code);
CREATE INDEX IF NOT EXISTS billing_plans_active_idx
  ON public.billing_plans(status, company_id, sort_order);
CREATE INDEX IF NOT EXISTS billing_profiles_company_idx
  ON public.billing_profiles(company_id);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_status_idx
  ON public.tenant_subscriptions(company_id, status, expires_at DESC);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_offer_status_idx
  ON public.tenant_subscriptions(company_id, offer_code, status, expires_at DESC);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_idx
  ON public.tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_source_payment_idx
  ON public.tenant_subscriptions(source_payment_id);
CREATE INDEX IF NOT EXISTS subscription_payments_company_status_idx
  ON public.subscription_payments(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_payments_subscription_idx
  ON public.subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_payments_plan_idx
  ON public.subscription_payments(plan_id);
CREATE INDEX IF NOT EXISTS subscription_payments_provider_order_idx
  ON public.subscription_payments(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS subscription_invoices_company_issued_idx
  ON public.subscription_invoices(company_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx
  ON public.subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_company_created_idx
  ON public.subscription_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_events_subscription_idx
  ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_payment_idx
  ON public.subscription_events(payment_id);
CREATE INDEX IF NOT EXISTS subscription_usage_company_key_idx
  ON public.subscription_usage(company_id, usage_key, period_start DESC);
CREATE INDEX IF NOT EXISTS subscription_notifications_company_created_idx
  ON public.subscription_notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_plan_audit_log_plan_created_idx
  ON public.billing_plan_audit_log(plan_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_payments_one_pending_per_company_idx
  ON public.subscription_payments(company_id)
  WHERE status = 'Pending';

-- -------------------------------------------------------------------------
-- 5. Updated-at trigger and least-privilege helper
-- -------------------------------------------------------------------------

-- Reuse the canonical billing timestamp helper instead of defining a second
-- security-sensitive trigger function. The compatibility trigger names are
-- unique, while the helper remains owned by the billing foundation migration.
DROP TRIGGER IF EXISTS subscription_user_memberships_updated_at ON public.company_memberships;
CREATE TRIGGER subscription_user_memberships_updated_at
BEFORE UPDATE ON public.company_memberships
FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();

DROP TRIGGER IF EXISTS subscription_user_billing_profiles_updated_at ON public.billing_profiles;
CREATE TRIGGER subscription_user_billing_profiles_updated_at
BEFORE UPDATE ON public.billing_profiles
FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();

DROP TRIGGER IF EXISTS subscription_user_tenant_subscriptions_updated_at ON public.tenant_subscriptions;
CREATE TRIGGER subscription_user_tenant_subscriptions_updated_at
BEFORE UPDATE ON public.tenant_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();

DROP TRIGGER IF EXISTS subscription_user_payments_updated_at ON public.subscription_payments;
CREATE TRIGGER subscription_user_payments_updated_at
BEFORE UPDATE ON public.subscription_payments
FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();

DROP TRIGGER IF EXISTS subscription_user_invoices_updated_at ON public.subscription_invoices;
CREATE TRIGGER subscription_user_invoices_updated_at
BEFORE UPDATE ON public.subscription_invoices
FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();

-- -------------------------------------------------------------------------
-- 6. RLS policies
-- -------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

-- Existing migrations own most billing policies. These command-aware guards
-- only fill a policy gap in a fresh/drifted environment; they never drop or
-- replace an existing policy and therefore cannot create an OR-expanded duplicate.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.profiles'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY profiles_read ON public.profiles
      FOR SELECT TO authenticated
      USING (id = auth.uid() OR company_id = public.current_company_id())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.company_memberships'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY company_memberships_read ON public.company_memberships
      FOR SELECT TO authenticated
      USING (
        company_id = public.current_company_id()
        AND (user_id = auth.uid() OR public.billing_is_manager())
      )
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.company_memberships'::regclass AND polcmd IN ('a', 'w', 'd', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY company_memberships_admin_write ON public.company_memberships
      FOR ALL TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
      WITH CHECK (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.billing_plans'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY billing_plans_read ON public.billing_plans
      FOR SELECT TO authenticated
      USING (status = 'Active' AND (company_id IS NULL OR company_id = public.current_company_id()))
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.billing_profiles'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY billing_profiles_read ON public.billing_profiles
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.tenant_subscriptions'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY tenant_subscriptions_read ON public.tenant_subscriptions
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.subscription_payments'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY subscription_payments_read ON public.subscription_payments
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.subscription_invoices'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY subscription_invoices_read ON public.subscription_invoices
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.subscription_usage'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY subscription_usage_read ON public.subscription_usage
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.subscription_events'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY subscription_events_read ON public.subscription_events
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.subscription_notifications'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY subscription_notifications_read ON public.subscription_notifications
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.billing_plan_audit_log'::regclass AND polcmd IN ('r', '*')) THEN
    EXECUTE $policy$
      CREATE POLICY billing_plan_audit_log_read ON public.billing_plan_audit_log
      FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() AND public.billing_is_manager())
    $policy$;
  END IF;
END;
$$;

-- Provider settlement, Free activation, invoices, usage writes, and audit
-- writes stay behind the existing RPC/service-role grants. Authenticated
-- clients receive only reads for subscription records, plus membership CRUD
-- where the RLS admin predicate permits it.
REVOKE INSERT, UPDATE, DELETE ON public.billing_plans FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.billing_profiles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.tenant_subscriptions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscription_payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscription_invoices FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscription_usage FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscription_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.billing_plan_audit_log FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscription_notifications FROM anon, authenticated;

-- -------------------------------------------------------------------------
-- 7. Explicit grants
-- -------------------------------------------------------------------------

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_memberships TO authenticated;
GRANT SELECT ON public.billing_plans TO authenticated;
GRANT SELECT ON public.billing_profiles TO authenticated;
GRANT SELECT ON public.tenant_subscriptions TO authenticated;
GRANT SELECT ON public.subscription_payments TO authenticated;
GRANT SELECT ON public.subscription_invoices TO authenticated;
GRANT SELECT ON public.subscription_usage TO authenticated;
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT SELECT ON public.billing_plan_audit_log TO authenticated;
GRANT SELECT ON public.subscription_notifications TO authenticated;

COMMIT;
