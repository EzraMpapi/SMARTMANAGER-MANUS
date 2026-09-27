BEGIN;
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
  v_requested_role text := NULLIF(trim(p_role), '');
  v_effective_role text;
  v_email text := NULLIF(auth.jwt() ->> 'email', '');
  v_requires_approval boolean := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT id, name INTO v_company_id, v_company_name FROM public.companies WHERE join_code = upper(trim(COALESCE(p_join_code, '')));
  IF v_company_id IS NULL THEN RAISE EXCEPTION 'invalid join code' USING ERRCODE = '22023'; END IF;
  IF v_requested_role IS NULL OR v_requested_role NOT IN (
    'Platform Administrator','Super Administrator','Organization Owner','CEO','CFO','Finance Manager','HR Manager','Sales Manager',
    'Institution Administrator','Branch Manager','Money Agent Manager','Money Agent','Supervisor','Property Administrator','Property Manager',
    'Landlord / Owner','Property Agent','Tenant','Maintenance Staff','Property Finance Officer','Procurement Officer','Warehouse Manager',
    'Project Manager','Customer Support Agent','Clinic Administrator','Doctor','Nurse','Laboratory Technician','Pharmacist','Receptionist',
    'Billing Officer','School Administrator','Employee','Auditor','Customer','External Client','Supplier'
  ) THEN v_requested_role := 'Employee'; END IF;
  v_requires_approval := v_requested_role NOT IN ('Employee','External Client','Supplier','Customer','Tenant');
  v_effective_role := CASE WHEN v_requires_approval THEN 'Employee' ELSE v_requested_role END;
  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  INSERT INTO public.profiles (id, company_id, full_name, email, role, customer_ref, is_active)
  VALUES (v_user_id, v_company_id, NULLIF(trim(p_full_name), ''), v_email, v_effective_role, NULLIF(trim(p_customer_ref), ''), true)
  ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id, role = EXCLUDED.role, full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name), email = COALESCE(EXCLUDED.email, public.profiles.email), customer_ref = EXCLUDED.customer_ref, is_active = true, updated_at = now();
  INSERT INTO public.company_memberships (user_id, company_id, role, status, joined_at)
  VALUES (v_user_id, v_company_id, v_effective_role, 'active', now())
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now();
  IF v_requires_approval THEN
    INSERT INTO public.platform_governance_requests (request_type, company_id, requested_by, target_user_id, payload)
    VALUES ('role_change', v_company_id, v_user_id, v_user_id, jsonb_build_object('kind','join_role_request','requestedRole',v_requested_role,'currentRole',v_effective_role,'reason','Elevated role requested during company join.'));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('smart_manager_workspace:' || v_company_id::text));
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE company_id = v_company_id) THEN INSERT INTO public.workspaces (company_id, name, description) VALUES (v_company_id, COALESCE(NULLIF(trim(v_company_name), ''), 'Workspace') || ' Workspace', 'Default workspace restored during secure company access.'); END IF;
  RETURN jsonb_build_object('id', v_company_id, 'name', v_company_name, 'role', v_effective_role, 'requested_role', v_requested_role, 'approval_pending', v_requires_approval);
END;
$function$;
COMMIT;
