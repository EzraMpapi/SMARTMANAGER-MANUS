-- Auth identity snapshot: one server-side, fail-closed contract for browser hydration.
--
-- This migration is additive. It does not rewrite data, change existing RLS policies,
-- or alter the existing workforce_has_permission() compatibility behavior. The RPC
-- deliberately requires a verified profile, a company-membership row, and at least
-- one workspace before it reports authorized=true. Effective permissions are derived
-- only from active workforce_member_roles and active, time-valid role/module grants;
-- an active Deny always overrides an Allow for the same permission.
--
-- Apply only after the migration failure diagnostic identifies the failing historical
-- action. This file is not a repair of an unknown MIGRATIONS_FAILED action.

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_identity_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_profile_company_id uuid;
  v_profile jsonb;
  v_company jsonb;
  v_membership jsonb;
  v_workspace jsonb;
  v_roles jsonb := '[]'::jsonb;
  v_permissions jsonb := '[]'::jsonb;
  v_current_company_id uuid;
  v_workspace_id uuid;
  v_membership_role text;
  v_profile_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated session is required.' USING ERRCODE = '42501';
  END IF;

  -- A caller must have exactly the profile row used by current_company_id().
  SELECT
    p.id,
    p.company_id,
    p.role,
    jsonb_build_object(
      'id', p.id,
      'companyId', p.company_id,
      'email', p.email,
      'fullName', p.full_name,
      'preferredName', p.preferred_name,
      'firstName', p.first_name,
      'middleName', p.middle_name,
      'lastName', p.last_name,
      'role', p.role,
      'phone', p.phone,
      'country', p.country,
      'preferredLanguage', p.preferred_language,
      'currencyDisplay', p.currency_display,
      'timezone', p.profile_timezone,
      'dateFormat', p.date_format,
      'theme', p.theme_preference,
      'avatarUrl', p.avatar_url,
      'isActive', p.is_active,
      'profileCompletedAt', p.profile_completed_at
    )
  INTO v_profile_id, v_profile_company_id, v_profile_role, v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'PROFILE_MISSING',
      'profile', NULL,
      'company', NULL,
      'membership', NULL,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  IF v_profile_company_id IS NULL OR nullif(btrim(v_profile_role), '') IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'PROFILE_TENANT_INCOMPLETE',
      'profile', v_profile,
      'company', NULL,
      'membership', NULL,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  IF coalesce((v_profile->>'isActive')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'PROFILE_INACTIVE',
      'profile', v_profile,
      'company', NULL,
      'membership', NULL,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  -- current_company_id() is profile-derived in the connected schema. Comparing it
  -- here makes the intended tenant boundary explicit and fails closed if that helper
  -- changes or returns NULL in a future environment.
  v_current_company_id := public.current_company_id();
  IF v_current_company_id IS NULL OR v_current_company_id IS DISTINCT FROM v_profile_company_id THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'TENANT_CONTEXT_MISMATCH',
      'profile', v_profile,
      'company', NULL,
      'membership', NULL,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'category', c.category,
    'country', c.country,
    'currency', c.currency,
    'timezone', c.timezone,
    'logo', c.logo,
    'brandPrimaryColor', c.brand_primary_color,
    'brandAccentColor', c.brand_accent_color
  )
  INTO v_company
  FROM public.companies c
  WHERE c.id = v_profile_company_id
  LIMIT 1;

  IF v_company IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'COMPANY_MISSING',
      'profile', v_profile,
      'company', NULL,
      'membership', NULL,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  -- company_memberships has no status column in the verified schema; the row's
  -- existence is therefore the active membership contract for this slice.
  SELECT jsonb_build_object(
    'userId', m.user_id,
    'companyId', m.company_id,
    'role', m.role,
    'createdAt', m.created_at
  ), m.role
  INTO v_membership, v_membership_role
  FROM public.company_memberships m
  WHERE m.user_id = v_user_id
    AND m.company_id = v_profile_company_id
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_membership IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'MEMBERSHIP_MISSING',
      'profile', v_profile,
      'company', v_company,
      'membership', NULL,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  SELECT w.id, jsonb_build_object(
    'id', w.id,
    'companyId', w.company_id,
    'name', w.name,
    'channelRef', w.channel_ref,
    'department', w.department,
    'description', w.description,
    'members', w.members,
    'createdAt', w.created_at,
    'updatedAt', w.updated_at
  )
  INTO v_workspace_id, v_workspace
  FROM public.workspaces w
  WHERE w.company_id = v_profile_company_id
  ORDER BY w.created_at ASC, w.id ASC
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'WORKSPACE_MISSING',
      'profile', v_profile,
      'company', v_company,
      'membership', v_membership,
      'workspace', NULL,
      'roles', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  -- Only approved, active, time-valid workforce assignments are exposed. The
  -- legacy profile/membership role remains display-only here and never grants a
  -- permission; this prevents raw string roles from silently elevating the client.
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name)
      ORDER BY r.code
    ),
    '[]'::jsonb
  )
  INTO v_roles
  FROM public.workforce_member_roles mr
  JOIN public.workforce_roles r
    ON r.company_id = mr.company_id
   AND r.id = mr.role_id
  WHERE mr.company_id = v_profile_company_id
    AND mr.profile_id = v_user_id
    AND mr.status = 'Active'
    AND mr.effective_from <= now()
    AND (mr.effective_to IS NULL OR mr.effective_to > now())
    AND r.status = 'Active';

  -- Permission calculation mirrors workforce_has_permission() for active member
  -- roles, role grants, profile module access, role module access, effective dates,
  -- and Deny precedence. It intentionally excludes its legacy privileged shortcut.
  SELECT coalesce(jsonb_agg(to_jsonb(e.code) ORDER BY e.code), '[]'::jsonb)
  INTO v_permissions
  FROM (
    WITH active_roles AS (
      SELECT mr.role_id
      FROM public.workforce_member_roles mr
      JOIN public.workforce_roles r
        ON r.company_id = mr.company_id
       AND r.id = mr.role_id
       AND r.status = 'Active'
      WHERE mr.company_id = v_profile_company_id
        AND mr.profile_id = v_user_id
        AND mr.status = 'Active'
        AND mr.effective_from <= now()
        AND (mr.effective_to IS NULL OR mr.effective_to > now())
    ),
    catalog AS (
      SELECT p.id, p.code, p.module_id, p.permission_action
      FROM public.workforce_permissions p
      WHERE p.company_id = v_profile_company_id
        AND p.status = 'Active'
    ),
    effective AS (
      SELECT c.code
      FROM catalog c
      WHERE (
        EXISTS (
          SELECT 1
          FROM active_roles ar
          JOIN public.workforce_role_permissions rp
            ON rp.company_id = v_profile_company_id
           AND rp.role_id = ar.role_id
          WHERE rp.permission_id = c.id
            AND rp.effect = 'Allow'
            AND rp.status = 'Active'
            AND rp.effective_from <= now()
            AND (rp.effective_to IS NULL OR rp.effective_to > now())
        )
        OR EXISTS (
          SELECT 1
          FROM public.workforce_module_access ma
          WHERE ma.company_id = v_profile_company_id
            AND ma.target_profile_id = v_user_id
            AND ma.module_id = c.module_id
            AND ma.permission_action = c.permission_action
            AND ma.effect = 'Allow'
            AND ma.status = 'Active'
            AND ma.effective_from <= now()
            AND (ma.effective_to IS NULL OR ma.effective_to > now())
        )
        OR EXISTS (
          SELECT 1
          FROM active_roles ar
          JOIN public.workforce_module_access ma
            ON ma.company_id = v_profile_company_id
           AND ma.target_role_id = ar.role_id
          WHERE ma.module_id = c.module_id
            AND ma.permission_action = c.permission_action
            AND ma.effect = 'Allow'
            AND ma.status = 'Active'
            AND ma.effective_from <= now()
            AND (ma.effective_to IS NULL OR ma.effective_to > now())
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM active_roles ar
        JOIN public.workforce_role_permissions rp
          ON rp.company_id = v_profile_company_id
         AND rp.role_id = ar.role_id
        WHERE rp.permission_id = c.id
          AND rp.effect = 'Deny'
          AND rp.status = 'Active'
          AND rp.effective_from <= now()
          AND (rp.effective_to IS NULL OR rp.effective_to > now())
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.workforce_module_access ma
        WHERE ma.company_id = v_profile_company_id
          AND (ma.target_profile_id = v_user_id OR EXISTS (
            SELECT 1 FROM active_roles ar WHERE ar.role_id = ma.target_role_id
          ))
          AND ma.module_id = c.module_id
          AND ma.permission_action = c.permission_action
          AND ma.effect = 'Deny'
          AND ma.status = 'Active'
          AND ma.effective_from <= now()
          AND (ma.effective_to IS NULL OR ma.effective_to > now())
      )
    )
    SELECT code FROM effective
  ) e;

  RETURN jsonb_build_object(
    'authorized', true,
    'reason', NULL,
    'profile', v_profile,
    'company', v_company,
    'membership', v_membership,
    'workspace', v_workspace,
    'role', coalesce(nullif(btrim(v_membership_role), ''), nullif(btrim(v_profile_role), '')),
    'roles', v_roles,
    'permissions', v_permissions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.auth_identity_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_identity_snapshot() FROM anon;
GRANT EXECUTE ON FUNCTION public.auth_identity_snapshot() TO authenticated;

COMMENT ON FUNCTION public.auth_identity_snapshot() IS
  'Returns a minimal fail-closed identity snapshot for the authenticated user. Requires active profile, company membership, and workspace; permission output is derived from active workforce assignments with Deny precedence.';

COMMIT;

-- Rollback (manual, only if this migration is the confirmed applied change):
-- BEGIN;
-- REVOKE ALL ON FUNCTION public.auth_identity_snapshot() FROM PUBLIC, anon, authenticated;
-- DROP FUNCTION IF EXISTS public.auth_identity_snapshot();
-- COMMIT;
