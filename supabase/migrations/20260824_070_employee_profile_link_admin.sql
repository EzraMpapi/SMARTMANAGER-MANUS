-- Explicit, audited employee/profile linkage remediation.
-- This migration does not create employee rows, infer identities, or mass-update data.
BEGIN;

CREATE OR REPLACE FUNCTION public.hr_link_employee_profile(
  p_employee_id uuid,
  p_profile_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_employee public.hr_employees%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated HR administrator session is required.' USING ERRCODE = '28000';
  END IF;

  PERFORM public.hr_require_privileged();

  IF nullif(btrim(coalesce(p_reason, '')), '') IS NULL OR length(btrim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'A linkage reason of at least five characters is required.' USING ERRCODE = '22023';
  END IF;

  IF v_company_id IS NULL OR p_employee_id IS NULL OR p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Company, employee, and profile identifiers are required.' USING ERRCODE = '22023';
  END IF;

  SELECT e.*
    INTO v_employee
  FROM public.hr_employees e
  WHERE e.id = p_employee_id
    AND e.company_id = v_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected employee is not in the current workspace.' USING ERRCODE = '42501';
  END IF;

  IF coalesce(v_employee.status, 'Active') IN ('Inactive', 'Offboarded') THEN
    RAISE EXCEPTION 'Only an active employee can be linked to a workspace profile.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.company_memberships m
      ON m.company_id = v_company_id
     AND m.user_id = p.id
     AND m.status = 'Active'
    WHERE p.id = p_profile_id
      AND p.company_id = v_company_id
      AND coalesce(p.is_active, true)
  ) THEN
    RAISE EXCEPTION 'The selected profile is not an active member of the current workspace.' USING ERRCODE = '42501';
  END IF;

  IF v_employee.profile_id IS NOT NULL AND v_employee.profile_id <> p_profile_id THEN
    RAISE EXCEPTION 'The selected employee is already linked to another profile.' USING ERRCODE = '40901';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.hr_employees e
    WHERE e.company_id = v_company_id
      AND e.profile_id = p_profile_id
      AND e.id <> p_employee_id
      AND coalesce(e.status, 'Active') NOT IN ('Inactive', 'Offboarded')
  ) THEN
    RAISE EXCEPTION 'The selected profile is already linked to another active employee.' USING ERRCODE = '40901';
  END IF;

  UPDATE public.hr_employees
  SET profile_id = p_profile_id,
      updated_at = now()
  WHERE id = p_employee_id
    AND company_id = v_company_id;

  PERFORM public.hr_append_audit(
    'EMPLOYEE_PROFILE_LINKED',
    p_employee_id::text,
    jsonb_build_object(
      'employeeId', p_employee_id,
      'profileId', p_profile_id,
      'reason', btrim(p_reason),
      'linkMode', 'explicit_admin_target'
    )
  );

  RETURN jsonb_build_object(
    'linked', true,
    'companyId', v_company_id,
    'employeeId', p_employee_id,
    'profileId', p_profile_id,
    'status', coalesce(v_employee.status, 'Active')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.hr_link_employee_profile(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_link_employee_profile(uuid, uuid, text) TO authenticated;

COMMIT;
