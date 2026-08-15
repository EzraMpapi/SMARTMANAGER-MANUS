-- Server-authorized workspace membership administration.
-- These SECURITY DEFINER RPCs resolve both the actor and target inside the
-- database; clients never select a tenant or authorize a role themselves.

CREATE OR REPLACE FUNCTION public.list_workspace_members()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_actor_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT p.company_id INTO v_company_id FROM public.profiles p WHERE p.id = v_user_id;
  SELECT cm.role INTO v_actor_role
  FROM public.company_memberships cm
  WHERE cm.user_id = v_user_id AND cm.company_id = v_company_id;

  IF v_company_id IS NULL OR v_actor_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'workspace owner or administrator membership required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cm.user_id, p.full_name, p.email, cm.role, cm.created_at
  FROM public.company_memberships cm
  JOIN public.profiles p ON p.id = cm.user_id
  WHERE cm.company_id = v_company_id
  ORDER BY CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, lower(COALESCE(p.full_name, p.email, ''));
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_workspace_member_role(
  p_member_user_id uuid,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_actor_role text;
  v_target_role text;
  v_role text := lower(trim(COALESCE(p_role, '')));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_member_user_id IS NULL OR p_member_user_id = v_user_id THEN
    RAISE EXCEPTION 'you cannot change your own workspace role' USING ERRCODE = '42501';
  END IF;
  IF v_role NOT IN ('admin', 'manager', 'staff', 'viewer') THEN
    RAISE EXCEPTION 'unsupported workspace role' USING ERRCODE = '22023';
  END IF;

  SELECT p.company_id INTO v_company_id FROM public.profiles p WHERE p.id = v_user_id;
  SELECT cm.role INTO v_actor_role
  FROM public.company_memberships cm
  WHERE cm.user_id = v_user_id AND cm.company_id = v_company_id;
  SELECT cm.role INTO v_target_role
  FROM public.company_memberships cm
  WHERE cm.user_id = p_member_user_id AND cm.company_id = v_company_id;

  IF v_company_id IS NULL OR v_actor_role NOT IN ('owner', 'admin') OR v_target_role IS NULL THEN
    RAISE EXCEPTION 'workspace owner or administrator membership required' USING ERRCODE = '42501';
  END IF;
  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'the workspace owner role cannot be changed here' USING ERRCODE = '42501';
  END IF;

  UPDATE public.company_memberships
  SET role = v_role
  WHERE user_id = p_member_user_id AND company_id = v_company_id;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  UPDATE public.profiles
  SET role = v_role, updated_at = now()
  WHERE id = p_member_user_id AND company_id = v_company_id;

  RETURN jsonb_build_object('user_id', p_member_user_id, 'role', v_role);
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_workspace_member(p_member_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_actor_role text;
  v_target_role text;
  v_next_company_id uuid;
  v_next_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_member_user_id IS NULL OR p_member_user_id = v_user_id THEN
    RAISE EXCEPTION 'you cannot remove yourself from this workspace' USING ERRCODE = '42501';
  END IF;

  SELECT p.company_id INTO v_company_id FROM public.profiles p WHERE p.id = v_user_id;
  SELECT cm.role INTO v_actor_role
  FROM public.company_memberships cm
  WHERE cm.user_id = v_user_id AND cm.company_id = v_company_id;
  SELECT cm.role INTO v_target_role
  FROM public.company_memberships cm
  WHERE cm.user_id = p_member_user_id AND cm.company_id = v_company_id;

  IF v_company_id IS NULL OR v_actor_role NOT IN ('owner', 'admin') OR v_target_role IS NULL THEN
    RAISE EXCEPTION 'workspace owner or administrator membership required' USING ERRCODE = '42501';
  END IF;
  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'the workspace owner cannot be removed here' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.company_memberships
  WHERE user_id = p_member_user_id AND company_id = v_company_id;

  SELECT cm.company_id, cm.role INTO v_next_company_id, v_next_role
  FROM public.company_memberships cm
  WHERE cm.user_id = p_member_user_id
  ORDER BY cm.created_at
  LIMIT 1;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);
  UPDATE public.profiles
  SET company_id = v_next_company_id,
      role = COALESCE(v_next_role, 'staff'),
      updated_at = now()
  WHERE id = p_member_user_id AND company_id = v_company_id;

  RETURN jsonb_build_object('user_id', p_member_user_id, 'removed', true, 'next_company_id', v_next_company_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.list_workspace_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_workspace_member_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_workspace_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_workspace_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_workspace_member_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_workspace_member(uuid) TO authenticated;
