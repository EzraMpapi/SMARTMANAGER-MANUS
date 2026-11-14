-- Profile Identity Center: additive, tenant-scoped identity fields and controlled self-service RPCs.
-- Source-ready only. Apply through a controlled Supabase migration window; this file is not
-- executed by the application or this task.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'Tanzania',
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS currency_display text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS profile_timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'dd/MM/yyyy',
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_storage_key text,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_company_active_idx
  ON public.profiles(company_id, is_active);

CREATE OR REPLACE FUNCTION public.profile_identity_payload(p_profile public.profiles)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT jsonb_build_object(
    'id', p_profile.id,
    'companyId', p_profile.company_id,
    'email', p_profile.email,
    'fullName', p_profile.full_name,
    'preferredName', p_profile.preferred_name,
    'firstName', p_profile.first_name,
    'middleName', p_profile.middle_name,
    'lastName', p_profile.last_name,
    'role', p_profile.role,
    'phone', p_profile.phone,
    'address', p_profile.address,
    'country', p_profile.country,
    'gender', p_profile.gender,
    'dateOfBirth', p_profile.date_of_birth,
    'preferredLanguage', p_profile.preferred_language,
    'currencyDisplay', p_profile.currency_display,
    'timezone', p_profile.profile_timezone,
    'dateFormat', p_profile.date_format,
    'theme', p_profile.theme_preference,
    'notificationPreferences', p_profile.notification_preferences,
    'avatarUrl', p_profile.avatar_url,
    'avatarStorageKey', p_profile.avatar_storage_key,
    'isActive', p_profile.is_active,
    'profileCompletedAt', p_profile.profile_completed_at,
    'createdAt', p_profile.created_at,
    'updatedAt', p_profile.updated_at
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_profile_identity()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  IF NOT FOUND OR v_profile.company_id IS NULL OR v_profile.role IS NULL THEN
    RAISE EXCEPTION 'verified workspace profile required' USING ERRCODE = '42501';
  END IF;

  RETURN public.profile_identity_payload(v_profile);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_current_profile_identity(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_profile public.profiles;
  v_now timestamptz := now();
  v_key text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'profile payload must be an object' USING ERRCODE = '22023';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_payload) LOOP
    IF v_key NOT IN (
      'preferredName', 'firstName', 'middleName', 'lastName', 'fullName',
      'dateOfBirth', 'gender', 'phone', 'address', 'country',
      'preferredLanguage', 'currencyDisplay', 'timezone', 'dateFormat',
      'theme', 'notificationPreferences'
    ) THEN
      RAISE EXCEPTION 'profile field is not self-service editable' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR v_profile.company_id IS NULL OR v_profile.role IS NULL THEN
    RAISE EXCEPTION 'verified workspace profile required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET preferred_name = CASE WHEN p_payload ? 'preferredName' THEN nullif(trim(p_payload->>'preferredName'), '') ELSE preferred_name END,
      first_name = CASE WHEN p_payload ? 'firstName' THEN nullif(trim(p_payload->>'firstName'), '') ELSE first_name END,
      middle_name = CASE WHEN p_payload ? 'middleName' THEN nullif(trim(p_payload->>'middleName'), '') ELSE middle_name END,
      last_name = CASE WHEN p_payload ? 'lastName' THEN nullif(trim(p_payload->>'lastName'), '') ELSE last_name END,
      full_name = CASE WHEN p_payload ? 'fullName' THEN nullif(trim(p_payload->>'fullName'), '') ELSE full_name END,
      date_of_birth = CASE WHEN p_payload ? 'dateOfBirth' AND nullif(p_payload->>'dateOfBirth', '') IS NOT NULL THEN (p_payload->>'dateOfBirth')::date WHEN p_payload ? 'dateOfBirth' THEN NULL ELSE date_of_birth END,
      gender = CASE WHEN p_payload ? 'gender' THEN nullif(trim(p_payload->>'gender'), '') ELSE gender END,
      phone = CASE WHEN p_payload ? 'phone' THEN nullif(trim(p_payload->>'phone'), '') ELSE phone END,
      address = CASE WHEN p_payload ? 'address' THEN nullif(trim(p_payload->>'address'), '') ELSE address END,
      country = CASE WHEN p_payload ? 'country' THEN coalesce(nullif(trim(p_payload->>'country'), ''), 'Tanzania') ELSE country END,
      preferred_language = CASE WHEN p_payload ? 'preferredLanguage' THEN coalesce(nullif(trim(p_payload->>'preferredLanguage'), ''), 'en') ELSE preferred_language END,
      currency_display = CASE WHEN p_payload ? 'currencyDisplay' THEN coalesce(nullif(trim(p_payload->>'currencyDisplay'), ''), 'TZS') ELSE currency_display END,
      profile_timezone = CASE WHEN p_payload ? 'timezone' THEN coalesce(nullif(trim(p_payload->>'timezone'), ''), 'Africa/Dar_es_Salaam') ELSE profile_timezone END,
      date_format = CASE WHEN p_payload ? 'dateFormat' THEN coalesce(nullif(trim(p_payload->>'dateFormat'), ''), 'dd/MM/yyyy') ELSE date_format END,
      theme_preference = CASE WHEN p_payload ? 'theme' THEN coalesce(nullif(trim(p_payload->>'theme'), ''), 'system') ELSE theme_preference END,
      notification_preferences = CASE WHEN p_payload ? 'notificationPreferences' AND jsonb_typeof(p_payload->'notificationPreferences') = 'object' THEN p_payload->'notificationPreferences' ELSE notification_preferences END,
      profile_completed_at = CASE
        WHEN coalesce(nullif(trim(p_payload->>'preferredName'), ''), nullif(trim(p_payload->>'fullName'), ''), preferred_name, full_name) IS NOT NULL
        THEN coalesce(profile_completed_at, v_now)
        ELSE profile_completed_at
      END,
      updated_at = v_now
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  RETURN public.profile_identity_payload(v_profile);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_profile_avatar(p_avatar_url text, p_avatar_storage_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_avatar_url IS NOT NULL AND length(trim(p_avatar_url)) > 2_000 THEN
    RAISE EXCEPTION 'avatar URL is too long' USING ERRCODE = '22023';
  END IF;
  IF p_avatar_storage_key IS NOT NULL AND length(trim(p_avatar_storage_key)) > 500 THEN
    RAISE EXCEPTION 'avatar storage key is too long' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR v_profile.company_id IS NULL OR v_profile.role IS NULL THEN
    RAISE EXCEPTION 'verified workspace profile required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET avatar_url = nullif(trim(p_avatar_url), ''),
      avatar_storage_key = nullif(trim(p_avatar_storage_key), ''),
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  RETURN public.profile_identity_payload(v_profile);
END;
$$;

REVOKE ALL ON FUNCTION public.profile_identity_payload(public.profiles) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_profile_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_current_profile_identity(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_current_profile_avatar(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_profile_identity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_current_profile_identity(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_profile_avatar(text, text) TO authenticated;

COMMIT;
