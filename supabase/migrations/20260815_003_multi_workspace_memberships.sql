-- Verified multi-workspace membership and active-workspace switching.
-- Every switch is server-authorized against membership; the browser never sets
-- profiles.company_id directly.

CREATE TABLE IF NOT EXISTS public.company_memberships (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer', 'Employee', 'External Client', 'Supplier')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_memberships_select_own ON public.company_memberships;
CREATE POLICY company_memberships_select_own
  ON public.company_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Preserve all existing profile-to-company assignments as verified memberships.
INSERT INTO public.company_memberships (user_id, company_id, role)
SELECT id, company_id, role
FROM public.profiles
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

CREATE OR REPLACE FUNCTION public.list_my_companies()
RETURNS TABLE (id uuid, name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.id, c.name, cm.role
  FROM public.company_memberships cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.user_id = auth.uid()
  ORDER BY c.name;
$function$;

CREATE OR REPLACE FUNCTION public.switch_current_company(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_company_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cm.role, c.name
  INTO v_role, v_company_name
  FROM public.company_memberships cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.user_id = v_user_id
    AND cm.company_id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'workspace membership required' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  UPDATE public.profiles
  SET company_id = p_company_id,
      role = v_role,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('id', p_company_id, 'name', v_company_name, 'role', v_role);
END;
$function$;

-- Keep the existing active company in profiles for legacy RLS while allowing
-- a user to join additional verified workspaces.
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

  v_role := CASE WHEN p_role IN ('owner', 'admin', 'manager', 'staff', 'viewer', 'Employee', 'External Client', 'Supplier') THEN p_role ELSE 'staff' END;
  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);

  INSERT INTO public.profiles (id, company_id, full_name, email, role, customer_ref, is_active)
  VALUES (v_user_id, v_company_id, NULLIF(trim(p_full_name), ''), v_email, v_role, NULLIF(trim(p_customer_ref), ''), true)
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    role = EXCLUDED.role,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    customer_ref = EXCLUDED.customer_ref,
    is_active = true,
    updated_at = now();

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (v_user_id, v_company_id, v_role)
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('id', v_company_id, 'name', v_company_name, 'role', v_role);
END;
$function$;

-- Newly created owners are also materialized as memberships.
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
  VALUES (v_company_name, NULLIF(trim(p_industry), ''), COALESCE(NULLIF(trim(p_country), ''), 'Tanzania'), COALESCE(NULLIF(trim(p_currency), ''), 'TZS'))
  RETURNING id, join_code INTO v_company_id, v_join_code;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  INSERT INTO public.profiles (id, company_id, full_name, email, role, is_active)
  VALUES (v_user_id, v_company_id, NULLIF(trim(p_full_name), ''), v_email, 'owner', true)
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    role = 'owner',
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    is_active = true,
    updated_at = now();

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (v_user_id, v_company_id, 'owner')
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('id', v_company_id, 'name', v_company_name, 'join_code', v_join_code);
END;
$function$;

REVOKE ALL ON FUNCTION public.list_my_companies() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.switch_current_company(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_current_company(uuid) TO authenticated;
