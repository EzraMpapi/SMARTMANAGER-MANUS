-- Production Supabase migration: close the authenticated-but-unassigned
-- profile gap in workspace creation and join flows. This leaves RLS and
-- existing policies untouched; both functions derive identity from auth.uid().

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

  -- This security-definer upsert is intentionally limited to auth.uid(). It
  -- guarantees that a new OAuth user receives the profile/membership row that
  -- tenant resolution depends on, while an existing unassigned profile is
  -- updated in the same transaction as its company.
  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  INSERT INTO public.profiles (id, company_id, full_name, email, role, is_active)
  VALUES (
    v_user_id,
    v_company_id,
    NULLIF(trim(p_full_name), ''),
    v_email,
    'owner',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      role = 'owner',
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      is_active = true,
      updated_at = now();

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
  v_existing_company_id uuid;
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

  SELECT company_id INTO v_existing_company_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_existing_company_id IS NOT NULL AND v_existing_company_id <> v_company_id THEN
    RAISE EXCEPTION 'user already belongs to a different company' USING ERRCODE = '23505';
  END IF;

  v_role := CASE
    WHEN p_role IN ('owner', 'admin', 'manager', 'staff', 'viewer', 'Employee', 'External Client', 'Supplier') THEN p_role
    ELSE 'staff'
  END;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  INSERT INTO public.profiles (id, company_id, full_name, email, role, customer_ref, is_active)
  VALUES (
    v_user_id,
    v_company_id,
    NULLIF(trim(p_full_name), ''),
    v_email,
    v_role,
    NULLIF(trim(p_customer_ref), ''),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      role = EXCLUDED.role,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      customer_ref = EXCLUDED.customer_ref,
      is_active = true,
      updated_at = now();

  RETURN jsonb_build_object('id', v_company_id, 'name', v_company_name);
END;
$function$;
