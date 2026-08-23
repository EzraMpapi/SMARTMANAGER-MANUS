-- SMART MANAGER protected workforce role assignment and approval procedures.
-- Depends on 20260824_050_fin_foundation.sql and
-- 20260824_057_workforce_authorization.sql.
-- Direct table writes remain blocked; these SECURITY DEFINER routines are the
-- only authenticated write boundary for role assignments in this slice.
BEGIN;

ALTER TABLE public.workforce_member_roles
  DROP CONSTRAINT IF EXISTS workforce_member_roles_status_check;
ALTER TABLE public.workforce_member_roles
  ADD CONSTRAINT workforce_member_roles_status_check
  CHECK (status IN ('Pending', 'Active', 'Suspended', 'Rejected', 'Revoked', 'Expired'));

CREATE OR REPLACE FUNCTION public.workforce_audit(
  p_action text,
  p_subject text,
  p_detail jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor text;
BEGIN
  SELECT coalesce(p.full_name, p.email, 'Authenticated user')
    INTO v_actor
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.company_id = public.current_company_id();

  INSERT INTO public.audit_log(company_id, action, module, actor, subject, details, detail)
  VALUES (
    public.current_company_id(),
    p_action,
    'Team & Workforce',
    coalesce(v_actor, 'Authenticated user'),
    p_subject,
    coalesce(p_detail::text, '{}'),
    coalesce(p_detail, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.workforce_require_assignment_authority()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_company_id() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT (public.workforce_is_privileged() OR public.workforce_has_permission('workforce.role.assign')) THEN
    RAISE EXCEPTION 'The authenticated workspace account cannot assign workforce roles.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.workforce_require_assignment_approval_authority()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_company_id() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT (public.workforce_is_privileged() OR public.workforce_has_permission('workforce.role.approve')) THEN
    RAISE EXCEPTION 'The authenticated workspace account cannot approve workforce role assignments.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.workforce_request_role_assignment(
  p_target_profile_id uuid,
  p_role_id uuid,
  p_idempotency_key text,
  p_request_hash text,
  p_effective_from timestamptz,
  p_effective_to timestamptz,
  p_employee_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_actor_id uuid := auth.uid();
  v_assignment public.workforce_member_roles%ROWTYPE;
  v_role public.workforce_roles%ROWTYPE;
  v_idempotency public.fin_idempotency_keys%ROWTYPE;
  v_approval public.fin_approval_requests%ROWTYPE;
  v_key text := nullif(btrim(p_idempotency_key), '');
  v_hash text := nullif(btrim(p_request_hash), '');
  v_response jsonb;
BEGIN
  PERFORM public.workforce_require_assignment_authority();

  IF p_target_profile_id IS NULL OR p_role_id IS NULL OR p_effective_from IS NULL
     OR v_key IS NULL OR length(v_key) > 160
     OR v_hash IS NULL OR length(v_hash) > 128 THEN
    RAISE EXCEPTION 'A workforce role assignment requires a target, role, effective date, idempotency key, and request hash.' USING ERRCODE = '22023';
  END IF;
  IF p_effective_to IS NOT NULL AND p_effective_to <= p_effective_from THEN
    RAISE EXCEPTION 'The role assignment end date must be after its start date.' USING ERRCODE = '22023';
  END IF;
  IF p_target_profile_id = v_actor_id THEN
    RAISE EXCEPTION 'A workspace account cannot assign a role to itself.' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':workforce-role-assignment:' || v_key, 0));

  SELECT * INTO v_idempotency
  FROM public.fin_idempotency_keys
  WHERE company_id = v_company_id AND scope = 'workforce.role.assignment' AND idempotency_key = v_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_idempotency.request_hash <> v_hash THEN
      RAISE EXCEPTION 'The idempotency key was already used with a different role-assignment request.' USING ERRCODE = '40001';
    END IF;
    IF v_idempotency.response IS NOT NULL THEN
      RETURN v_idempotency.response;
    END IF;
  ELSE
    SET LOCAL app.internal_write = 'on';
    INSERT INTO public.fin_idempotency_keys(company_id, scope, idempotency_key, request_hash, status, created_by)
    VALUES (v_company_id, 'workforce.role.assignment', v_key, v_hash, 'Started', v_actor_id);
  END IF;

  SELECT * INTO v_role
  FROM public.workforce_roles
  WHERE company_id = v_company_id AND id = p_role_id
  FOR SHARE;
  IF NOT FOUND OR v_role.status <> 'Active' OR NOT v_role.is_assignable THEN
    RAISE EXCEPTION 'The selected workforce role is not assignable in this workspace.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_target_profile_id AND p.company_id = v_company_id AND coalesce(p.is_active, true)
  ) THEN
    RAISE EXCEPTION 'The target profile is not an active member of this workspace.' USING ERRCODE = '23503';
  END IF;
  IF p_employee_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.hr_employees e
    WHERE e.id = p_employee_id AND e.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'The target employee does not belong to this workspace.' USING ERRCODE = '23503';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workforce_member_roles mr
    WHERE mr.company_id = v_company_id
      AND mr.profile_id = p_target_profile_id
      AND mr.role_id = p_role_id
      AND mr.status IN ('Pending', 'Active')
      AND mr.effective_from < coalesce(p_effective_to, 'infinity'::timestamptz)
      AND coalesce(mr.effective_to, 'infinity'::timestamptz) > p_effective_from
  ) THEN
    RAISE EXCEPTION 'An overlapping pending or active assignment for this role already exists.' USING ERRCODE = '23505';
  END IF;

  SET LOCAL app.internal_write = 'on';
  INSERT INTO public.workforce_member_roles(
    company_id, profile_id, employee_id, role_id, status,
    effective_from, effective_to, assigned_by, metadata
  )
  VALUES (
    v_company_id, p_target_profile_id, p_employee_id, p_role_id, 'Pending',
    p_effective_from, p_effective_to, v_actor_id,
    jsonb_build_object('reason', left(coalesce(p_reason, ''), 1000), 'requestHash', v_hash)
  )
  RETURNING * INTO v_assignment;

  INSERT INTO public.fin_approval_requests(
    company_id, entity_type, entity_id, action, requested_by, status,
    required_approvals, maker_checker_key, created_by, metadata
  )
  VALUES (
    v_company_id, 'workforce_member_role', v_assignment.id, 'assign_role', v_actor_id, 'Pending',
    1, v_key, v_actor_id,
    jsonb_build_object('roleId', v_role.id, 'roleCode', v_role.code, 'targetProfileId', p_target_profile_id, 'effectiveFrom', p_effective_from, 'effectiveTo', p_effective_to, 'reason', left(coalesce(p_reason, ''), 1000))
  )
  RETURNING * INTO v_approval;

  UPDATE public.workforce_member_roles
  SET approval_request_id = v_approval.id
  WHERE id = v_assignment.id AND company_id = v_company_id;

  v_response := jsonb_build_object(
    'ok', true,
    'status', 'Pending',
    'assignmentId', v_assignment.id,
    'approvalRequestId', v_approval.id,
    'roleId', v_role.id,
    'roleCode', v_role.code,
    'targetProfileId', p_target_profile_id
  );

  UPDATE public.fin_idempotency_keys
  SET status = 'Succeeded', response = v_response, updated_by = v_actor_id
  WHERE company_id = v_company_id AND scope = 'workforce.role.assignment' AND idempotency_key = v_key;

  PERFORM public.workforce_audit('WORKFORCE_ROLE_ASSIGNMENT_REQUESTED', v_assignment.id::text, v_response || jsonb_build_object('requestHash', v_hash));
  RETURN v_response;
EXCEPTION
  WHEN OTHERS THEN
    IF v_key IS NOT NULL AND v_company_id IS NOT NULL THEN
      UPDATE public.fin_idempotency_keys
      SET status = 'Failed', metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('errorCode', SQLSTATE, 'errorMessage', left(SQLERRM, 500)), updated_by = v_actor_id
      WHERE company_id = v_company_id AND scope = 'workforce.role.assignment' AND idempotency_key = v_key;
    END IF;
    RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.workforce_decide_role_assignment(
  p_assignment_id uuid,
  p_decision text,
  p_idempotency_key text,
  p_request_hash text,
  p_decision_note text DEFAULT NULL,
  p_expected_version bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_actor_id uuid := auth.uid();
  v_assignment public.workforce_member_roles%ROWTYPE;
  v_approval public.fin_approval_requests%ROWTYPE;
  v_idempotency public.fin_idempotency_keys%ROWTYPE;
  v_key text := nullif(btrim(p_idempotency_key), '');
  v_hash text := nullif(btrim(p_request_hash), '');
  v_status text;
  v_response jsonb;
BEGIN
  PERFORM public.workforce_require_assignment_approval_authority();

  IF p_assignment_id IS NULL OR p_decision NOT IN ('approve', 'reject')
     OR v_key IS NULL OR length(v_key) > 160
     OR v_hash IS NULL OR length(v_hash) > 128 THEN
    RAISE EXCEPTION 'A role-assignment decision requires an assignment, approve/reject decision, idempotency key, and request hash.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':workforce-role-decision:' || v_key, 0));

  SELECT * INTO v_idempotency
  FROM public.fin_idempotency_keys
  WHERE company_id = v_company_id AND scope = 'workforce.role.decision' AND idempotency_key = v_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_idempotency.request_hash <> v_hash THEN
      RAISE EXCEPTION 'The idempotency key was already used with a different role-decision request.' USING ERRCODE = '40001';
    END IF;
    IF v_idempotency.response IS NOT NULL THEN
      RETURN v_idempotency.response;
    END IF;
  ELSE
    SET LOCAL app.internal_write = 'on';
    INSERT INTO public.fin_idempotency_keys(company_id, scope, idempotency_key, request_hash, status, created_by)
    VALUES (v_company_id, 'workforce.role.decision', v_key, v_hash, 'Started', v_actor_id);
  END IF;

  SELECT * INTO v_assignment
  FROM public.workforce_member_roles
  WHERE company_id = v_company_id AND id = p_assignment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The workforce role assignment was not found in this workspace.' USING ERRCODE = 'P0002';
  END IF;
  IF p_expected_version IS NOT NULL AND v_assignment.version <> p_expected_version THEN
    RAISE EXCEPTION 'The role assignment changed before this decision was submitted. Refresh and review it again.' USING ERRCODE = '40001';
  END IF;
  IF v_assignment.assigned_by = v_actor_id THEN
    RAISE EXCEPTION 'The requester cannot approve or reject their own role assignment.' USING ERRCODE = '42501';
  END IF;
  IF v_assignment.approval_request_id IS NULL THEN
    RAISE EXCEPTION 'The role assignment has no approval request.' USING ERRCODE = '55000';
  END IF;

  SELECT * INTO v_approval
  FROM public.fin_approval_requests
  WHERE company_id = v_company_id AND id = v_assignment.approval_request_id
  FOR UPDATE;
  IF NOT FOUND OR v_approval.status <> 'Pending' THEN
    RAISE EXCEPTION 'This role assignment is no longer awaiting approval.' USING ERRCODE = '55000';
  END IF;

  v_status := CASE WHEN p_decision = 'approve' THEN 'Active' ELSE 'Rejected' END;
  SET LOCAL app.internal_write = 'on';
  UPDATE public.workforce_member_roles
  SET status = v_status,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('decisionNote', left(coalesce(p_decision_note, ''), 1000), 'decidedBy', v_actor_id, 'decidedAt', now()),
      revoked_by = CASE WHEN p_decision = 'reject' THEN NULL ELSE revoked_by END,
      revoked_at = CASE WHEN p_decision = 'reject' THEN NULL ELSE revoked_at END
  WHERE id = v_assignment.id AND company_id = v_company_id;

  UPDATE public.fin_approval_requests
  SET status = CASE WHEN p_decision = 'approve' THEN 'Approved' ELSE 'Rejected' END,
      decided_by = v_actor_id,
      decided_at = now(),
      decision_note = left(coalesce(p_decision_note, ''), 1000),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('assignmentId', v_assignment.id, 'requestHash', v_hash)
  WHERE id = v_approval.id AND company_id = v_company_id;

  v_response := jsonb_build_object(
    'ok', true,
    'status', v_status,
    'assignmentId', v_assignment.id,
    'approvalRequestId', v_approval.id,
    'decidedBy', v_actor_id
  );

  UPDATE public.fin_idempotency_keys
  SET status = 'Succeeded', response = v_response, updated_by = v_actor_id
  WHERE company_id = v_company_id AND scope = 'workforce.role.decision' AND idempotency_key = v_key;

  PERFORM public.workforce_audit(CASE WHEN p_decision = 'approve' THEN 'WORKFORCE_ROLE_ASSIGNMENT_APPROVED' ELSE 'WORKFORCE_ROLE_ASSIGNMENT_REJECTED' END, v_assignment.id::text, v_response || jsonb_build_object('decisionNote', left(coalesce(p_decision_note, ''), 1000), 'requestHash', v_hash));
  RETURN v_response;
EXCEPTION
  WHEN OTHERS THEN
    IF v_key IS NOT NULL AND v_company_id IS NOT NULL THEN
      UPDATE public.fin_idempotency_keys
      SET status = 'Failed', metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('errorCode', SQLSTATE, 'errorMessage', left(SQLERRM, 500)), updated_by = v_actor_id
      WHERE company_id = v_company_id AND scope = 'workforce.role.decision' AND idempotency_key = v_key;
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.workforce_audit(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_require_assignment_authority() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_require_assignment_approval_authority() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.workforce_request_role_assignment(uuid, uuid, text, text, timestamptz, timestamptz, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.workforce_decide_role_assignment(uuid, text, text, text, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workforce_request_role_assignment(uuid, uuid, text, text, timestamptz, timestamptz, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workforce_decide_role_assignment(uuid, text, text, text, text, bigint) TO authenticated;

COMMIT;
