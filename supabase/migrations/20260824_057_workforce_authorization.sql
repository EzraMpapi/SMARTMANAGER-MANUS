-- SMART MANAGER Team & Workforce authorization foundation.
-- Additive only: no existing role, profile, company_modules, or HR data is
-- rewritten. Existing string-role behavior remains the compatibility path until
-- protected assignment procedures and a staged permission evaluator are enabled.
BEGIN;

CREATE TABLE IF NOT EXISTS public.workforce_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  role_kind text NOT NULL DEFAULT 'Custom'
    CHECK (role_kind IN ('System', 'Custom')),
  description text,
  hierarchy_level integer NOT NULL DEFAULT 0 CHECK (hierarchy_level >= 0 AND hierarchy_level <= 1000),
  is_assignable boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Draft', 'Active', 'Suspended', 'Archived')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_roles_code_normalized CHECK (code = lower(btrim(code)) AND code ~ '^[a-z0-9][a-z0-9_.-]{1,119}$'),
  CONSTRAINT workforce_roles_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_roles_company_code_unique UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.workforce_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  code text NOT NULL,
  module_id text NOT NULL,
  resource text NOT NULL,
  permission_action text NOT NULL
    CHECK (permission_action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'print', 'manage', 'full_access')),
  description text,
  is_sensitive boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active', 'Inactive')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_permissions_code_normalized CHECK (code = lower(btrim(code)) AND code ~ '^[a-z0-9][a-z0-9_.-]{1,159}$'),
  CONSTRAINT workforce_permissions_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_permissions_company_code_unique UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.workforce_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  effect text NOT NULL DEFAULT 'Allow'
    CHECK (effect IN ('Allow', 'Deny')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Revoked', 'Expired')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  approval_request_id uuid,
  granted_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_role_permissions_dates_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT workforce_role_permissions_revoke_consistency CHECK ((status = 'Revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL) OR status <> 'Revoked'),
  CONSTRAINT workforce_role_permissions_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_role_permissions_unique UNIQUE (company_id, role_id, permission_id, effect, effective_from),
  FOREIGN KEY (company_id, role_id) REFERENCES public.workforce_roles(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, permission_id) REFERENCES public.workforce_permissions(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, approval_request_id) REFERENCES public.fin_approval_requests(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.workforce_member_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  employee_id uuid REFERENCES public.hr_employees(id) ON DELETE RESTRICT,
  role_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Revoked', 'Expired')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  approval_request_id uuid,
  assigned_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_member_roles_dates_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT workforce_member_roles_revoke_consistency CHECK ((status = 'Revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL) OR status <> 'Revoked'),
  CONSTRAINT workforce_member_roles_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_member_roles_unique UNIQUE (company_id, profile_id, role_id, effective_from),
  FOREIGN KEY (company_id, role_id) REFERENCES public.workforce_roles(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, approval_request_id) REFERENCES public.fin_approval_requests(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.workforce_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  target_profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_role_id uuid,
  module_id text NOT NULL,
  permission_action text NOT NULL
    CHECK (permission_action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'print', 'manage', 'full_access')),
  effect text NOT NULL DEFAULT 'Allow'
    CHECK (effect IN ('Allow', 'Deny')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Revoked', 'Expired')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  approval_request_id uuid,
  assigned_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_module_access_one_target CHECK ((target_profile_id IS NOT NULL) <> (target_role_id IS NOT NULL)),
  CONSTRAINT workforce_module_access_module_normalized CHECK (module_id = lower(btrim(module_id)) AND module_id ~ '^[a-z0-9][a-z0-9_.-]{1,119}$'),
  CONSTRAINT workforce_module_access_dates_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT workforce_module_access_revoke_consistency CHECK ((status = 'Revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL) OR status <> 'Revoked'),
  CONSTRAINT workforce_module_access_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_module_access_unique UNIQUE NULLS NOT DISTINCT (company_id, target_profile_id, target_role_id, module_id, permission_action, effect, effective_from),
  FOREIGN KEY (company_id, target_role_id) REFERENCES public.workforce_roles(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, approval_request_id) REFERENCES public.fin_approval_requests(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.workforce_data_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  target_profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_role_id uuid,
  scope_type text NOT NULL
    CHECK (scope_type IN ('Company', 'Branch', 'Department', 'Team', 'Own Record')),
  scope_id uuid,
  effect text NOT NULL DEFAULT 'Allow'
    CHECK (effect IN ('Allow', 'Deny')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Revoked', 'Expired')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  approval_request_id uuid,
  assigned_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_data_scopes_one_target CHECK ((target_profile_id IS NOT NULL) <> (target_role_id IS NOT NULL)),
  CONSTRAINT workforce_data_scopes_scope_id_valid CHECK ((scope_type IN ('Company', 'Own Record') AND scope_id IS NULL) OR (scope_type IN ('Branch', 'Department', 'Team') AND scope_id IS NOT NULL)),
  CONSTRAINT workforce_data_scopes_dates_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT workforce_data_scopes_revoke_consistency CHECK ((status = 'Revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL) OR status <> 'Revoked'),
  CONSTRAINT workforce_data_scopes_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_data_scopes_unique UNIQUE NULLS NOT DISTINCT (company_id, target_profile_id, target_role_id, scope_type, scope_id, effect, effective_from),
  FOREIGN KEY (company_id, target_role_id) REFERENCES public.workforce_roles(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, approval_request_id) REFERENCES public.fin_approval_requests(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.workforce_approval_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  target_profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_role_id uuid,
  permission_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  single_transaction_limit numeric(20,2) NOT NULL DEFAULT 0 CHECK (single_transaction_limit >= 0),
  daily_limit numeric(20,2) NOT NULL DEFAULT 0 CHECK (daily_limit >= 0),
  requires_checker boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Revoked', 'Expired')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  approval_request_id uuid,
  assigned_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_approval_limits_one_target CHECK ((target_profile_id IS NOT NULL) <> (target_role_id IS NOT NULL)),
  CONSTRAINT workforce_approval_limits_dates_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT workforce_approval_limits_revoke_consistency CHECK ((status = 'Revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL) OR status <> 'Revoked'),
  CONSTRAINT workforce_approval_limits_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_approval_limits_unique UNIQUE NULLS NOT DISTINCT (company_id, target_profile_id, target_role_id, permission_id, effective_from),
  FOREIGN KEY (company_id, target_role_id) REFERENCES public.workforce_roles(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, permission_id) REFERENCES public.workforce_permissions(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, approval_request_id) REFERENCES public.fin_approval_requests(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.workforce_permission_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  conflict_code text NOT NULL,
  permission_a_id uuid NOT NULL,
  permission_b_id uuid NOT NULL,
  severity text NOT NULL DEFAULT 'High'
    CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  resolution_policy text NOT NULL DEFAULT 'Block'
    CHECK (resolution_policy IN ('Warn', 'Block', 'Require Exception Approval')),
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Draft', 'Active', 'Inactive')),
  description text,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT workforce_permission_conflicts_code_normalized CHECK (conflict_code = lower(btrim(conflict_code)) AND conflict_code ~ '^[a-z0-9][a-z0-9_.-]{1,119}$'),
  CONSTRAINT workforce_permission_conflicts_distinct_permissions CHECK (permission_a_id <> permission_b_id),
  CONSTRAINT workforce_permission_conflicts_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT workforce_permission_conflicts_unique UNIQUE (company_id, conflict_code),
  FOREIGN KEY (company_id, permission_a_id) REFERENCES public.workforce_permissions(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, permission_b_id) REFERENCES public.workforce_permissions(company_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS workforce_roles_company_status_idx ON public.workforce_roles (company_id, status, hierarchy_level DESC);
CREATE INDEX IF NOT EXISTS workforce_permissions_company_module_idx ON public.workforce_permissions (company_id, module_id, permission_action, status);
CREATE INDEX IF NOT EXISTS workforce_role_permissions_company_role_status_idx ON public.workforce_role_permissions (company_id, role_id, status, effective_from DESC);
CREATE INDEX IF NOT EXISTS workforce_role_permissions_company_permission_idx ON public.workforce_role_permissions (company_id, permission_id, status);
CREATE INDEX IF NOT EXISTS workforce_member_roles_company_profile_status_idx ON public.workforce_member_roles (company_id, profile_id, status, effective_from DESC);
CREATE INDEX IF NOT EXISTS workforce_member_roles_company_employee_status_idx ON public.workforce_member_roles (company_id, employee_id, status);
CREATE INDEX IF NOT EXISTS workforce_module_access_company_profile_module_idx ON public.workforce_module_access (company_id, target_profile_id, module_id, permission_action, status);
CREATE INDEX IF NOT EXISTS workforce_module_access_company_role_module_idx ON public.workforce_module_access (company_id, target_role_id, module_id, permission_action, status);
CREATE INDEX IF NOT EXISTS workforce_data_scopes_company_profile_scope_idx ON public.workforce_data_scopes (company_id, target_profile_id, scope_type, status);
CREATE INDEX IF NOT EXISTS workforce_data_scopes_company_role_scope_idx ON public.workforce_data_scopes (company_id, target_role_id, scope_type, status);
CREATE INDEX IF NOT EXISTS workforce_approval_limits_company_permission_idx ON public.workforce_approval_limits (company_id, permission_id, status, effective_from DESC);
CREATE INDEX IF NOT EXISTS workforce_permission_conflicts_company_status_idx ON public.workforce_permission_conflicts (company_id, status, severity);

CREATE OR REPLACE FUNCTION public.workforce_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workforce_roles', 'workforce_permissions', 'workforce_role_permissions',
    'workforce_member_roles', 'workforce_module_access', 'workforce_data_scopes',
    'workforce_approval_limits', 'workforce_permission_conflicts'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.workforce_touch_updated_at()', t || '_touch_updated_at', t);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.workforce_is_privileged()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = public.current_company_id()
      AND coalesce(p.is_active, true)
      AND lower(coalesce(p.role, '')) IN (
        'super administrator', 'platform administrator', 'system administrator',
        'organization owner', 'owner', 'ceo', 'cfo', 'hr manager', 'admin', 'manager'
      )
  ) OR EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.user_id = auth.uid()
      AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role, '')) IN (
        'super administrator', 'platform administrator', 'system administrator',
        'organization owner', 'owner', 'ceo', 'cfo', 'hr manager', 'admin', 'manager'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.workforce_has_permission(p_permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH active_roles AS (
    SELECT mr.role_id
    FROM public.workforce_member_roles mr
    WHERE mr.company_id = public.current_company_id()
      AND mr.profile_id = auth.uid()
      AND mr.status = 'Active'
      AND mr.effective_from <= now()
      AND (mr.effective_to IS NULL OR mr.effective_to > now())
  ),
  requested AS (
    SELECT p.id, p.module_id, p.permission_action
    FROM public.workforce_permissions p
    WHERE p.company_id = public.current_company_id()
      AND p.code = lower(btrim(p_permission_code))
      AND p.status = 'Active'
    LIMIT 1
  )
  SELECT public.workforce_is_privileged()
    OR (
      (
        EXISTS (
          SELECT 1
          FROM active_roles ar
          JOIN public.workforce_role_permissions rp ON rp.company_id = public.current_company_id() AND rp.role_id = ar.role_id
          JOIN requested p ON p.id = rp.permission_id
          WHERE rp.effect = 'Allow'
            AND rp.status = 'Active'
            AND rp.effective_from <= now()
            AND (rp.effective_to IS NULL OR rp.effective_to > now())
        )
        OR EXISTS (
          SELECT 1
          FROM public.workforce_module_access ma
          JOIN requested p ON p.module_id = ma.module_id AND p.permission_action = ma.permission_action
          WHERE ma.company_id = public.current_company_id()
            AND ma.target_profile_id = auth.uid()
            AND ma.effect = 'Allow'
            AND ma.status = 'Active'
            AND ma.effective_from <= now()
            AND (ma.effective_to IS NULL OR ma.effective_to > now())
        )
        OR EXISTS (
          SELECT 1
          FROM active_roles ar
          JOIN public.workforce_module_access ma ON ma.company_id = public.current_company_id() AND ma.target_role_id = ar.role_id
          JOIN requested p ON p.module_id = ma.module_id AND p.permission_action = ma.permission_action
          WHERE ma.effect = 'Allow'
            AND ma.status = 'Active'
            AND ma.effective_from <= now()
            AND (ma.effective_to IS NULL OR ma.effective_to > now())
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM active_roles ar
        JOIN public.workforce_role_permissions rp ON rp.company_id = public.current_company_id() AND rp.role_id = ar.role_id
        JOIN requested p ON p.id = rp.permission_id
        WHERE rp.effect = 'Deny'
          AND rp.status = 'Active'
          AND rp.effective_from <= now()
          AND (rp.effective_to IS NULL OR rp.effective_to > now())
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.workforce_module_access ma
        JOIN requested p ON p.module_id = ma.module_id AND p.permission_action = ma.permission_action
        WHERE ma.company_id = public.current_company_id()
          AND (ma.target_profile_id = auth.uid() OR EXISTS (
            SELECT 1 FROM active_roles ar WHERE ar.role_id = ma.target_role_id
          ))
          AND ma.effect = 'Deny'
          AND ma.status = 'Active'
          AND ma.effective_from <= now()
          AND (ma.effective_to IS NULL OR ma.effective_to > now())
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.workforce_require(p_permission_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_company_id() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.workforce_has_permission(p_permission_code) THEN
    RAISE EXCEPTION 'The authenticated workspace account lacks the required permission.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.workforce_validate_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_internal text := current_setting('app.internal_write', true);
BEGIN
  IF v_internal IS DISTINCT FROM 'on' AND (auth.uid() IS NULL OR NEW.company_id IS DISTINCT FROM public.current_company_id()) THEN
    RAISE EXCEPTION 'Workforce authorization records must remain in the authenticated company scope.' USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME = 'workforce_role_permissions' THEN
    IF NOT EXISTS (SELECT 1 FROM public.workforce_roles r WHERE r.company_id = NEW.company_id AND r.id = NEW.role_id)
       OR NOT EXISTS (SELECT 1 FROM public.workforce_permissions p WHERE p.company_id = NEW.company_id AND p.id = NEW.permission_id) THEN
      RAISE EXCEPTION 'Role-permission references must belong to the same company.' USING ERRCODE = '23503';
    END IF;
  ELSIF TG_TABLE_NAME = 'workforce_member_roles' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.profile_id AND p.company_id = NEW.company_id) THEN
      RAISE EXCEPTION 'The assigned profile does not belong to the target company.' USING ERRCODE = '23503';
    END IF;
    IF NEW.employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.id = NEW.employee_id AND e.company_id = NEW.company_id) THEN
      RAISE EXCEPTION 'The assigned employee does not belong to the target company.' USING ERRCODE = '23503';
    END IF;
  ELSIF TG_TABLE_NAME IN ('workforce_module_access', 'workforce_data_scopes', 'workforce_approval_limits') THEN
    IF NEW.target_profile_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.target_profile_id AND p.company_id = NEW.company_id) THEN
      RAISE EXCEPTION 'The target profile does not belong to the target company.' USING ERRCODE = '23503';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workforce_role_permissions', 'workforce_member_roles',
    'workforce_module_access', 'workforce_data_scopes', 'workforce_approval_limits'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_validate_scope', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.workforce_validate_scope()', t || '_validate_scope', t);
  END LOOP;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workforce_roles', 'workforce_permissions', 'workforce_role_permissions',
    'workforce_member_roles', 'workforce_module_access', 'workforce_data_scopes',
    'workforce_approval_limits', 'workforce_permission_conflicts'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    IF t = 'workforce_permissions' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', t || '_tenant_select', t);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.workforce_is_privileged())', t || '_tenant_select', t);
    END IF;
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.workforce_is_privileged() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.workforce_has_permission(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.workforce_require(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workforce_is_privileged() TO authenticated;
GRANT EXECUTE ON FUNCTION public.workforce_has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workforce_require(text) TO authenticated;

COMMIT;
