-- Align the profiles role constraint with the existing Global Admin guard and
-- provide a narrow, auditable path for the first Platform Administrator.
-- This migration does not create accounts, store credentials, change company
-- membership, or alter any tenant-scoped business data.

BEGIN;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  ADD CONSTRAINT profiles_role_check CHECK (
    role = ANY (ARRAY[
      'owner'::text,
      'admin'::text,
      'manager'::text,
      'staff'::text,
      'viewer'::text,
      'Employee'::text,
      'External Client'::text,
      'Supplier'::text,
      'platform administrator'::text
    ])
  );

CREATE OR REPLACE FUNCTION public.provision_initial_platform_administrator(
  p_profile_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
  IF p_profile_id IS NULL OR v_reason = '' OR char_length(v_reason) > 1000 THEN
    RAISE EXCEPTION 'An eligible profile and concise provisioning reason are required.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(coalesce(role, '')) = 'platform administrator'
  ) THEN
    RAISE EXCEPTION 'A Platform Administrator is already provisioned; use an approved platform administration workflow.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_profile_id
    AND is_active = true
    AND lower(coalesce(role, '')) IN ('owner', 'admin')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The requested active owner or administrator profile was not found.' USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true);

  UPDATE public.profiles
  SET role = 'platform administrator',
      updated_at = now()
  WHERE id = v_profile.id
  RETURNING * INTO v_profile;

  INSERT INTO public.platform_admin_actions(
    actor_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    reason,
    confirmation_text,
    details
  ) VALUES (
    v_profile.id,
    'platform administrator',
    'PLATFORM_ADMIN_PROVISIONED',
    'profile',
    v_profile.id::text,
    v_reason,
    'CONFIRM:PLATFORM_ADMIN_PROVISIONED:' || v_profile.id::text,
    jsonb_build_object('source', 'service_role_initial_provisioning', 'previousRole', 'owner')
  );

  RETURN jsonb_build_object('profileId', v_profile.id, 'role', v_profile.role);
END;
$$;

REVOKE ALL ON FUNCTION public.provision_initial_platform_administrator(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_initial_platform_administrator(uuid, text) TO service_role;

COMMIT;
