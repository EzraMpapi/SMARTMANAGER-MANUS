-- BusinessSphere ERP complete public application-schema reconstruction.
--
-- Scope: rebuild every current public ERP table, replace obsolete sm_audit_log
-- with dashboard-compatible audit_log, and restore tenant-safe Auth/RLS/RPC
-- contracts. Supabase system schemas, auth.users, extensions, Edge Functions,
-- and Manus-managed S3 are intentionally outside this migration.

BEGIN;

-- Capture the current public ERP shape before removing application objects. The
-- temporary catalog snapshots allow every live table (apart from obsolete
-- sm_audit_log) to be recreated with its existing application column contract,
-- constraints, and indexes while intentionally deleting its application data.
CREATE TEMP TABLE _bs_columns ON COMMIT DROP AS
SELECT
  c.relname AS table_name,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS column_type,
  a.attnotnull AS is_not_null,
  pg_get_expr(ad.adbin, ad.adrelid) AS default_expression
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname <> 'sm_audit_log'
  AND a.attnum > 0
  AND NOT a.attisdropped;

CREATE TEMP TABLE _bs_constraints ON COMMIT DROP AS
SELECT
  rel.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relkind = 'r'
  AND rel.relname <> 'sm_audit_log'
  AND con.contype IN ('p', 'u', 'c', 'f');

CREATE TEMP TABLE _bs_indexes ON COMMIT DROP AS
SELECT
  rel.relname AS table_name,
  idx.relname AS index_name,
  pg_get_indexdef(i.indexrelid) AS index_definition
FROM pg_index i
JOIN pg_class rel ON rel.oid = i.indrelid
JOIN pg_class idx ON idx.oid = i.indexrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
WHERE n.nspname = 'public'
  AND rel.relkind = 'r'
  AND rel.relname <> 'sm_audit_log'
  AND con.oid IS NULL;

-- The approved scope contains every public application table. Do not use this
-- migration against a project where public contains unrelated application data.
DO $$
DECLARE row_record record;
BEGIN
  FOR row_record IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', row_record.tablename);
  END LOOP;
END;
$$;

-- Recreate every captured ERP table without copying application data.
DO $$
DECLARE row_record record;
DECLARE column_definitions text;
BEGIN
  FOR row_record IN
    SELECT DISTINCT table_name FROM _bs_columns ORDER BY table_name
  LOOP
    SELECT string_agg(
      format(
        '%I %s%s%s',
        column_name,
        column_type,
        CASE WHEN default_expression IS NOT NULL THEN ' DEFAULT ' || default_expression ELSE '' END,
        CASE WHEN is_not_null THEN ' NOT NULL' ELSE '' END
      ),
      ', ' ORDER BY ordinal_position
    )
    INTO column_definitions
    FROM _bs_columns
    WHERE table_name = row_record.table_name;

    EXECUTE format('CREATE TABLE public.%I (%s)', row_record.table_name, column_definitions);
  END LOOP;
END;
$$;

-- The former reset left sm_audit_log in place, while the application requires
-- audit_log. Keep a superset of dashboard and legacy event fields so writes are
-- durable rather than silently discarded.
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid DEFAULT public.current_company_id(),
  action text NOT NULL,
  module text,
  actor text NOT NULL DEFAULT 'Unattributed',
  details text,
  subject text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reapply structural constraints after every relation exists. Primary, unique,
-- and check constraints precede foreign keys to keep dependency order explicit.
DO $$
DECLARE row_record record;
BEGIN
  FOR row_record IN
    SELECT * FROM _bs_constraints WHERE constraint_type <> 'f' ORDER BY table_name, constraint_name
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I %s',
      row_record.table_name,
      row_record.constraint_name,
      row_record.constraint_definition
    );
  END LOOP;

  FOR row_record IN
    SELECT * FROM _bs_constraints WHERE constraint_type = 'f' ORDER BY table_name, constraint_name
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I %s',
      row_record.table_name,
      row_record.constraint_name,
      row_record.constraint_definition
    );
  END LOOP;
END;
$$;

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

DO $$
DECLARE row_record record;
BEGIN
  FOR row_record IN SELECT * FROM _bs_indexes ORDER BY table_name, index_name LOOP
    EXECUTE row_record.index_definition;
  END LOOP;
END;
$$;

CREATE INDEX audit_log_company_idx ON public.audit_log(company_id);

-- Compatibility fields supplied by the existing onboarding and preferences UI.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS business_scale text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Dar_es_Salaam',
  ADD COLUMN IF NOT EXISTS receipt_width text,
  ADD COLUMN IF NOT EXISTS receipt_footer text,
  ADD COLUMN IF NOT EXISTS receipt_show_logo boolean DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS customer_ref text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer', 'Employee', 'External Client', 'Supplier'));

-- Recreate tenant functions with the exact named-argument signatures that the
-- existing dashboard sends through PostgREST.
DROP FUNCTION IF EXISTS public.create_company_and_owner(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_company_and_owner(text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.join_company_with_code(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.join_company_with_code(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.supplier_update_delivery_date(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.businesssphere_merge_data() CASCADE;
DROP FUNCTION IF EXISTS public.businesssphere_protect_profile_tenant() CASCADE;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.businesssphere_merge_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.data = COALESCE(OLD.data, '{}'::jsonb) || COALESCE(NEW.data, '{}'::jsonb);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.businesssphere_protect_profile_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (OLD.company_id IS DISTINCT FROM NEW.company_id OR OLD.role IS DISTINCT FROM NEW.role)
     AND current_setting('app.businesssphere_tenant_assignment', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'company assignment and role changes require an authorized onboarding function'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_company_and_owner(
  p_name text,
  p_industry text,
  p_country text,
  p_currency text,
  p_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_join_code text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND company_id IS NOT NULL) THEN
    RAISE EXCEPTION 'user already belongs to a company' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.companies (name, category, country, currency)
  VALUES (
    COALESCE(NULLIF(trim(p_name), ''), 'My Company'),
    NULLIF(trim(p_industry), ''),
    COALESCE(NULLIF(trim(p_country), ''), 'Tanzania'),
    COALESCE(NULLIF(trim(p_currency), ''), 'TZS')
  )
  RETURNING id, join_code INTO v_company_id, v_join_code;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  UPDATE public.profiles
  SET company_id = v_company_id,
      role = 'owner',
      full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('id', v_company_id, 'join_code', v_join_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_company_with_code(
  p_join_code text,
  p_full_name text,
  p_role text,
  p_customer_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_company_id
  FROM public.companies
  WHERE join_code = upper(trim(COALESCE(p_join_code, '')));

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'invalid join code' USING ERRCODE = '22023';
  END IF;

  v_role := CASE
    WHEN p_role IN ('owner', 'admin', 'manager', 'staff', 'viewer', 'Employee', 'External Client', 'Supplier') THEN p_role
    ELSE 'staff'
  END;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  UPDATE public.profiles
  SET company_id = v_company_id,
      role = v_role,
      full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
      customer_ref = NULLIF(trim(p_customer_ref), ''),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('id', v_company_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.supplier_update_delivery_date(
  p_po_doc_number text,
  p_new_expected_date text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_order_id uuid;
BEGIN
  IF auth.uid() IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated for a company' USING ERRCODE = '42501';
  END IF;

  UPDATE public.procurement_purchase_orders
  SET data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('expected_date', p_new_expected_date),
      updated_at = now()
  WHERE company_id = v_company_id
    AND (id::text = p_po_doc_number OR data ->> 'doc_number' = p_po_doc_number)
  RETURNING id INTO v_order_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'purchase order not found for this company' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object('id', v_order_id, 'expected_date', p_new_expected_date);
END;
$$;

-- Rebuild current-user profile rows from the retained Supabase Auth identities.
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data ->> 'full_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS businesssphere_on_auth_user_created ON auth.users;
CREATE TRIGGER businesssphere_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS businesssphere_profiles_tenant_guard ON public.profiles;
CREATE TRIGGER businesssphere_profiles_tenant_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.businesssphere_protect_profile_tenant();

-- Restore updated-at and JSON data-merge triggers to every rebuilt tenant
-- table that supports those columns, including audit_log.
DO $$
DECLARE row_record record;
DECLARE trigger_name text;
BEGIN
  FOR row_record IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
    GROUP BY c.table_name
    ORDER BY c.table_name
  LOOP
    trigger_name := left('businesssphere_' || row_record.table_name || '_updated_at', 63);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trigger_name, row_record.table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', trigger_name, row_record.table_name);
  END LOOP;

  FOR row_record IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'data'
    GROUP BY c.table_name
    ORDER BY c.table_name
  LOOP
    trigger_name := left('businesssphere_' || row_record.table_name || '_merge_data', 63);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trigger_name, row_record.table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.businesssphere_merge_data()', trigger_name, row_record.table_name);
  END LOOP;
END;
$$;

-- RLS is enabled on every public ERP relation. Generic tenant policies derive
-- ownership exclusively from the JWT-linked profile, never a browser-supplied
-- company_id. Companies and profiles retain tighter identity-specific rules.
DO $$
DECLARE row_record record;
DECLARE policy_name text;
BEGIN
  FOR row_record IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', row_record.tablename);
  END LOOP;

  FOR row_record IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'company_id'
      AND table_name NOT IN ('companies', 'profiles')
    ORDER BY table_name
  LOOP
    policy_name := left(row_record.table_name || '_tenant', 63);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, row_record.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = (SELECT public.current_company_id())) WITH CHECK (company_id = (SELECT public.current_company_id()))',
      policy_name,
      row_record.table_name
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_update ON public.companies;
CREATE POLICY companies_select ON public.companies
  FOR SELECT TO authenticated
  USING (id = (SELECT public.current_company_id()));
CREATE POLICY companies_update ON public.companies
  FOR UPDATE TO authenticated
  USING (id = (SELECT public.current_company_id()))
  WITH CHECK (id = (SELECT public.current_company_id()));

DROP POLICY IF EXISTS profiles_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_self ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR company_id = (SELECT public.current_company_id()));
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

COMMIT;
