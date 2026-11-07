-- Tenant identity recovery: the protected application requires each company to
-- have at least one workspace before it can authorize a valid session. Earlier
-- company creation and join routines correctly created profiles and memberships
-- but did not create that workspace row, producing WORKSPACE_MISSING for every
-- otherwise valid tenant. This migration is additive, idempotent, and does not
-- change any profile, company, membership, role, permission, RLS, or policy.

BEGIN;

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
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_join_code text;
  v_company_name text;
  v_email text := NULLIF(auth.jwt() ->> 'email', '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND company_id IS NOT NULL) THEN
    RAISE EXCEPTION 'user already belongs to a company' USING ERRCODE = '23505';
  END IF;

  v_company_name := COALESCE(NULLIF(trim(p_name), ''), 'My Company');
  INSERT INTO public.companies (name, category, country, currency)
  VALUES (
    v_company_name,
    NULLIF(trim(p_industry), ''),
    COALESCE(NULLIF(trim(p_country), ''), 'Tanzania'),
    COALESCE(NULLIF(trim(p_currency), ''), 'TZS')
  )
  RETURNING id, join_code INTO v_company_id, v_join_code;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  INSERT INTO public.profiles (id, company_id, full_name, email, role, is_active)
  VALUES (v_user_id, v_company_id, NULLIF(trim(p_full_name), ''), v_email, 'owner', true)
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      role = 'owner',
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      is_active = true,
      updated_at = now();

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (v_user_id, v_company_id, 'owner')
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

  -- The company is new and not externally discoverable during this transaction,
  -- so this default workspace cannot be associated with another tenant.
  INSERT INTO public.workspaces (company_id, name, description)
  VALUES (v_company_id, v_company_name || ' Workspace', 'Default workspace created during company setup.');

  RETURN jsonb_build_object('id', v_company_id, 'name', v_company_name, 'join_code', v_join_code);
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_company_with_code(
  p_join_code text,
  p_full_name text,
  p_role text,
  p_customer_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_company_name text;
  v_role text;
  v_email text := NULLIF(auth.jwt() ->> 'email', '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT id, name INTO v_company_id, v_company_name
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
  INSERT INTO public.profiles (id, company_id, full_name, email, role, customer_ref, is_active)
  VALUES (v_user_id, v_company_id, NULLIF(trim(p_full_name), ''), v_email, v_role, NULLIF(trim(p_customer_ref), ''), true)
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      role = EXCLUDED.role,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      customer_ref = EXCLUDED.customer_ref,
      is_active = true,
      updated_at = now();

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (v_user_id, v_company_id, v_role)
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

  -- A join code can only identify this same company. The advisory lock prevents
  -- simultaneous first joins from creating two default workspaces.
  PERFORM pg_advisory_xact_lock(hashtext('smart_manager_workspace:' || v_company_id::text));
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE company_id = v_company_id) THEN
    INSERT INTO public.workspaces (company_id, name, description)
    VALUES (v_company_id, COALESCE(NULLIF(trim(v_company_name), ''), 'Workspace') || ' Workspace', 'Default workspace restored during secure company access.');
  END IF;

  RETURN jsonb_build_object('id', v_company_id, 'name', v_company_name, 'role', v_role);
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_current_company()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_full_name text;
  v_email text;
  v_company_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT company_id, full_name, email
  INTO v_company_id, v_full_name, v_email
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile setup required' USING ERRCODE = 'P0001';
  END IF;

  IF v_company_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_company_id, 'created', false);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('businesssphere_first_tenant'));
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_company_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_company_id, 'created', false);
  END IF;

  IF EXISTS (SELECT 1 FROM public.companies) THEN
    RAISE EXCEPTION 'company setup required' USING ERRCODE = 'P0001';
  END IF;

  v_company_name := COALESCE(
    NULLIF(trim(v_full_name), ''),
    NULLIF(split_part(COALESCE(v_email, ''), '@', 1), ''),
    'My'
  ) || ' Workspace';

  INSERT INTO public.companies (name, category, country, currency)
  VALUES (v_company_name, 'Other', 'Tanzania', 'TZS')
  RETURNING id INTO v_company_id;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  UPDATE public.profiles
  SET company_id = v_company_id,
      role = 'owner',
      updated_at = now()
  WHERE id = v_user_id;

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (v_user_id, v_company_id, 'owner')
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO public.workspaces (company_id, name, description)
  VALUES (v_company_id, v_company_name, 'Default workspace created during secure tenant bootstrap.');

  RETURN jsonb_build_object('id', v_company_id, 'created', true);
END;
$function$;

-- Backfill one neutral default workspace for every legacy company that has none.
-- It never updates or deletes existing workspaces and it never copies data across
-- companies. The new creation routines prevent this authorization prerequisite
-- from being absent for future tenants.
INSERT INTO public.workspaces (company_id, name, description)
SELECT c.id,
       COALESCE(NULLIF(trim(c.name), ''), 'Workspace') || ' Workspace',
       'Default workspace restored during tenant identity recovery.'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspaces w WHERE w.company_id = c.id
);

REVOKE ALL ON FUNCTION public.create_company_and_owner(text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_company_with_code(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_current_company() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_and_owner(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_company_with_code(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_current_company() TO authenticated;

COMMIT;
