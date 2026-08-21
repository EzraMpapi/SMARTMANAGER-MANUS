-- Smart Manager Employee Portal core
-- Additive, tenant-scoped HR portal data model, security helpers, and audited workflows.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Typed extensions for existing generic HR tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.hr_employees
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS position_id uuid,
  ADD COLUMN IF NOT EXISTS manager_employee_id uuid,
  ADD COLUMN IF NOT EXISTS employee_number text,
  ADD COLUMN IF NOT EXISTS employment_start_date date,
  ADD COLUMN IF NOT EXISTS employment_end_date date,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam';

ALTER TABLE public.hr_attendance
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS attendance_date date,
  ADD COLUMN IF NOT EXISTS shift_id uuid,
  ADD COLUMN IF NOT EXISTS clock_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS clock_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS worked_minutes integer,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'portal';

ALTER TABLE public.hr_leave_requests
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS leave_policy_id uuid,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS requested_days numeric(10,2),
  ADD COLUMN IF NOT EXISTS decision_by uuid,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_note text;

ALTER TABLE public.hr_benefits
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS benefit_plan_id uuid,
  ADD COLUMN IF NOT EXISTS effective_from date,
  ADD COLUMN IF NOT EXISTS effective_to date;

ALTER TABLE public.hr_duties
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS assignee_profile_id uuid,
  ADD COLUMN IF NOT EXISTS duty_date date,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

ALTER TABLE public.hr_performance_reviews
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS reviewer_employee_id uuid,
  ADD COLUMN IF NOT EXISTS review_period_start date,
  ADD COLUMN IF NOT EXISTS review_period_end date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.hr_payroll_runs
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS finance_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_company_profile_unique
  ON public.hr_employees(company_id, profile_id)
  WHERE profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_company_employee_number_unique
  ON public.hr_employees(company_id, employee_number)
  WHERE employee_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_employees_company_manager_idx
  ON public.hr_employees(company_id, manager_employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS hr_attendance_employee_day_unique
  ON public.hr_attendance(company_id, employee_id, attendance_date)
  WHERE employee_id IS NOT NULL AND attendance_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_leave_requests_employee_status_idx
  ON public.hr_leave_requests(company_id, employee_id, status);

-- ---------------------------------------------------------------------------
-- 2. New Employee Portal domain tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  title text NOT NULL,
  code text,
  grade text,
  status text NOT NULL DEFAULT 'Active',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, title)
);

CREATE TABLE IF NOT EXISTS public.hr_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  unpaid_break_minutes integer NOT NULL DEFAULT 0 CHECK (unpaid_break_minutes >= 0),
  timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  status text NOT NULL DEFAULT 'Active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS public.hr_shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.hr_shifts(id) ON DELETE CASCADE,
  assignment_date date NOT NULL,
  status text NOT NULL DEFAULT 'Scheduled',
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id, assignment_date)
);

CREATE TABLE IF NOT EXISTS public.hr_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  name text NOT NULL,
  holiday_type text NOT NULL DEFAULT 'Public',
  paid boolean NOT NULL DEFAULT true,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, holiday_date, name)
);

CREATE TABLE IF NOT EXISTS public.hr_leave_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  leave_type text NOT NULL,
  annual_entitlement numeric(10,2) NOT NULL DEFAULT 0 CHECK (annual_entitlement >= 0),
  carry_forward_limit numeric(10,2) NOT NULL DEFAULT 0 CHECK (carry_forward_limit >= 0),
  requires_approval boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'Active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, leave_type)
);

CREATE TABLE IF NOT EXISTS public.hr_leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  leave_policy_id uuid NOT NULL REFERENCES public.hr_leave_policies(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  opening_balance numeric(10,2) NOT NULL DEFAULT 0,
  accrued_days numeric(10,2) NOT NULL DEFAULT 0,
  used_days numeric(10,2) NOT NULL DEFAULT 0,
  adjustment_days numeric(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id, leave_policy_id, period_year)
);

CREATE TABLE IF NOT EXISTS public.hr_timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_minutes integer NOT NULL DEFAULT 0 CHECK (total_minutes >= 0),
  status text NOT NULL DEFAULT 'Draft',
  submitted_at timestamptz,
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE(company_id, employee_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS public.hr_timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  timesheet_id uuid NOT NULL REFERENCES public.hr_timesheets(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes >= 0),
  project_reference text,
  work_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_statutory_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  rule_code text NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  applies_to text NOT NULL DEFAULT 'employee',
  calculation_type text NOT NULL DEFAULT 'percentage',
  rate numeric(18,6) NOT NULL DEFAULT 0,
  fixed_amount numeric(18,2) NOT NULL DEFAULT 0,
  threshold_amount numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'Draft',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  UNIQUE(company_id, rule_code, effective_from)
);

CREATE TABLE IF NOT EXISTS public.hr_payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_run_id uuid NOT NULL REFERENCES public.hr_payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  gross_pay numeric(18,2) NOT NULL DEFAULT 0,
  taxable_pay numeric(18,2) NOT NULL DEFAULT 0,
  deductions numeric(18,2) NOT NULL DEFAULT 0,
  net_pay numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'Draft',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payroll_run_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.hr_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_item_id uuid NOT NULL REFERENCES public.hr_payroll_items(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  pay_period text NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
  issued_at timestamptz,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payroll_item_id)
);

CREATE TABLE IF NOT EXISTS public.hr_benefit_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text,
  benefit_type text NOT NULL,
  employee_contribution numeric(18,2) NOT NULL DEFAULT 0,
  employer_contribution numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'Active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS public.hr_benefit_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  benefit_plan_id uuid NOT NULL REFERENCES public.hr_benefit_plans(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Active',
  effective_from date NOT NULL DEFAULT current_date,
  effective_to date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id, benefit_plan_id, effective_from)
);

CREATE TABLE IF NOT EXISTS public.hr_expense_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  expense_date date NOT NULL,
  category text NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TZS',
  merchant text,
  description text,
  status text NOT NULL DEFAULT 'Submitted',
  finance_expense_id uuid REFERENCES public.finance_expenses(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  metric_name text,
  target_value numeric(18,4),
  current_value numeric(18,4) NOT NULL DEFAULT 0,
  unit text,
  status text NOT NULL DEFAULT 'Active',
  due_date date,
  owner_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_goal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.hr_goals(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  current_value numeric(18,4) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  provider text,
  duration_minutes integer NOT NULL DEFAULT 0,
  mandatory boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active',
  content_url text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, title)
);

CREATE TABLE IF NOT EXISTS public.hr_training_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.hr_training_courses(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL DEFAULT auth.uid(),
  due_date date,
  status text NOT NULL DEFAULT 'Assigned',
  completed_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.hr_employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  title text NOT NULL,
  document_type text NOT NULL,
  file_url text,
  status text NOT NULL DEFAULT 'Active',
  expires_at date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience_type text NOT NULL DEFAULT 'All Employees',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Published',
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.hr_announcements(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL DEFAULT auth.uid(),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(announcement_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.hr_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Submitted',
  assigned_to uuid,
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  notification_type text NOT NULL DEFAULT 'Info',
  link_module text,
  link_record_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  source_table text NOT NULL,
  source_record_id uuid NOT NULL,
  requester_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  subject_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Pending',
  current_step integer NOT NULL DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_table, source_record_id)
);

CREATE TABLE IF NOT EXISTS public.hr_approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  approval_request_id uuid NOT NULL REFERENCES public.hr_approval_requests(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  approver_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approver_role text,
  status text NOT NULL DEFAULT 'Pending',
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(approval_request_id, step_number)
);

CREATE TABLE IF NOT EXISTS public.hr_onboarding_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Not Started',
  start_date date NOT NULL DEFAULT current_date,
  due_date date,
  owner_profile_id uuid NOT NULL DEFAULT auth.uid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.hr_onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  onboarding_case_id uuid NOT NULL REFERENCES public.hr_onboarding_cases(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  owner_profile_id uuid,
  due_date date,
  status text NOT NULL DEFAULT 'Open',
  completed_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_offboarding_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Planned',
  last_working_date date,
  reason text,
  owner_profile_id uuid NOT NULL DEFAULT auth.uid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id)
);

CREATE INDEX IF NOT EXISTS hr_shift_assignments_employee_date_idx ON public.hr_shift_assignments(company_id, employee_id, assignment_date);
CREATE INDEX IF NOT EXISTS hr_timesheets_employee_period_idx ON public.hr_timesheets(company_id, employee_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS hr_payroll_items_employee_idx ON public.hr_payroll_items(company_id, employee_id);
CREATE INDEX IF NOT EXISTS hr_payslips_employee_idx ON public.hr_payslips(company_id, employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hr_expense_claims_employee_status_idx ON public.hr_expense_claims(company_id, employee_id, status);
CREATE INDEX IF NOT EXISTS hr_goals_employee_status_idx ON public.hr_goals(company_id, employee_id, status);
CREATE INDEX IF NOT EXISTS hr_training_assignments_employee_status_idx ON public.hr_training_assignments(company_id, employee_id, status);
CREATE INDEX IF NOT EXISTS hr_employee_documents_employee_idx ON public.hr_employee_documents(company_id, employee_id, document_type);
CREATE INDEX IF NOT EXISTS hr_notifications_profile_idx ON public.hr_notifications(company_id, profile_id, read_at);
CREATE INDEX IF NOT EXISTS hr_approval_requests_status_idx ON public.hr_approval_requests(company_id, status, request_type);

-- ---------------------------------------------------------------------------
-- 3. Authorization and audit helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hr_is_privileged()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = public.current_company_id()
      AND lower(coalesce(p.role, '')) IN (
        'super administrator', 'organization owner', 'ceo', 'cfo',
        'finance manager', 'hr manager', 'owner', 'admin', 'manager'
      )
  ) OR EXISTS (
    SELECT 1
    FROM public.company_memberships m
    WHERE m.user_id = auth.uid()
      AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role, '')) IN (
        'super administrator', 'organization owner', 'ceo', 'cfo',
        'finance manager', 'hr manager', 'owner', 'admin', 'manager'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.hr_current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT e.id
  FROM public.hr_employees e
  WHERE e.company_id = public.current_company_id()
    AND e.profile_id = auth.uid()
    AND coalesce(e.status, 'Active') NOT IN ('Inactive', 'Offboarded')
  ORDER BY e.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.hr_can_manage_employee(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.hr_is_privileged()
    OR EXISTS (
      SELECT 1
      FROM public.hr_employees target
      WHERE target.company_id = public.current_company_id()
        AND target.id = p_employee_id
        AND target.manager_employee_id = public.hr_current_employee_id()
    );
$$;

CREATE OR REPLACE FUNCTION public.hr_require_privileged()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.hr_is_privileged() THEN
    RAISE EXCEPTION 'You are not authorized to manage this Human Resources workflow.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_append_audit(p_action text, p_subject text, p_detail jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor text;
BEGIN
  SELECT coalesce(full_name, email, 'Authenticated user') INTO v_actor
  FROM public.profiles
  WHERE id = auth.uid();

  INSERT INTO public.audit_log(company_id, action, module, actor, subject, details, detail)
  VALUES (
    public.current_company_id(), p_action, 'Employee Portal', coalesce(v_actor, 'Authenticated user'),
    p_subject, coalesce(p_detail::text, '{}'), coalesce(p_detail, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_create_notification(
  p_profile_id uuid,
  p_employee_id uuid,
  p_title text,
  p_body text,
  p_type text DEFAULT 'Info',
  p_module text DEFAULT 'employee-portal',
  p_record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.hr_notifications(company_id, profile_id, employee_id, title, body, notification_type, link_module, link_record_id)
  VALUES (public.current_company_id(), p_profile_id, p_employee_id, p_title, p_body, p_type, p_module, p_record_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Secure portal read model
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.employee_portal_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employee_id uuid := public.hr_current_employee_id();
  v_profile public.profiles%ROWTYPE;
  v_employee jsonb;
  v_is_privileged boolean := public.hr_is_privileged();
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF v_employee_id IS NOT NULL THEN
    SELECT to_jsonb(e) INTO v_employee FROM public.hr_employees e WHERE e.id = v_employee_id;
  END IF;

  RETURN jsonb_build_object(
    'viewer', jsonb_build_object(
      'profileId', auth.uid(),
      'name', coalesce(v_profile.full_name, v_profile.email, 'Employee'),
      'role', coalesce(v_profile.role, 'Employee'),
      'isPrivileged', v_is_privileged,
      'employeeId', v_employee_id,
      'isManager', EXISTS (SELECT 1 FROM public.hr_employees e WHERE e.company_id = public.current_company_id() AND e.manager_employee_id = v_employee_id)
    ),
    'employee', v_employee,
    'departments', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.name) FROM public.departments d WHERE d.company_id = public.current_company_id() AND coalesce(d.status, 'Active') <> 'Inactive'), '[]'::jsonb),
    'positions', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.title) FROM public.hr_positions p WHERE p.company_id = public.current_company_id() AND p.status = 'Active'), '[]'::jsonb),
    'shifts', coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.start_time) FROM public.hr_shift_assignments a JOIN public.hr_shifts s ON s.id = a.shift_id WHERE a.company_id = public.current_company_id() AND a.employee_id = v_employee_id AND a.assignment_date >= current_date - 14), '[]'::jsonb),
    'attendance', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attendance_date DESC, a.created_at DESC) FROM public.hr_attendance a WHERE a.company_id = public.current_company_id() AND a.employee_id = v_employee_id LIMIT 60), '[]'::jsonb),
    'leavePolicies', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.name) FROM public.hr_leave_policies p WHERE p.company_id = public.current_company_id() AND p.status = 'Active'), '[]'::jsonb),
    'leaveBalances', coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM public.hr_leave_balances b WHERE b.company_id = public.current_company_id() AND b.employee_id = v_employee_id), '[]'::jsonb),
    'leaveRequests', coalesce((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC) FROM public.hr_leave_requests l WHERE l.company_id = public.current_company_id() AND l.employee_id = v_employee_id LIMIT 50), '[]'::jsonb),
    'timesheets', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.period_end DESC) FROM public.hr_timesheets t WHERE t.company_id = public.current_company_id() AND t.employee_id = v_employee_id LIMIT 30), '[]'::jsonb),
    'payslips', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM public.hr_payslips p WHERE p.company_id = public.current_company_id() AND p.employee_id = v_employee_id LIMIT 24), '[]'::jsonb),
    'benefits', coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM public.hr_benefit_enrollments b WHERE b.company_id = public.current_company_id() AND b.employee_id = v_employee_id AND b.status = 'Active'), '[]'::jsonb),
    'expenses', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM public.hr_expense_claims e WHERE e.company_id = public.current_company_id() AND e.employee_id = v_employee_id LIMIT 50), '[]'::jsonb),
    'goals', coalesce((SELECT jsonb_agg(to_jsonb(g) ORDER BY g.due_date NULLS LAST, g.created_at DESC) FROM public.hr_goals g WHERE g.company_id = public.current_company_id() AND g.employee_id = v_employee_id LIMIT 50), '[]'::jsonb),
    'training', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.due_date NULLS LAST) FROM public.hr_training_assignments t WHERE t.company_id = public.current_company_id() AND t.employee_id = v_employee_id LIMIT 50), '[]'::jsonb),
    'documents', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC) FROM public.hr_employee_documents d WHERE d.company_id = public.current_company_id() AND d.employee_id = v_employee_id LIMIT 50), '[]'::jsonb),
    'requests', coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC) FROM public.hr_service_requests r WHERE r.company_id = public.current_company_id() AND r.employee_id = v_employee_id LIMIT 50), '[]'::jsonb),
    'notifications', coalesce((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC) FROM public.hr_notifications n WHERE n.company_id = public.current_company_id() AND n.profile_id = auth.uid() LIMIT 50), '[]'::jsonb),
    'announcements', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.published_at DESC) FROM public.hr_announcements a WHERE a.company_id = public.current_company_id() AND a.status = 'Published' AND (a.expires_at IS NULL OR a.expires_at >= current_date) LIMIT 50), '[]'::jsonb),
    'approvals', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.updated_at DESC) FROM public.hr_approval_requests a WHERE a.company_id = public.current_company_id() AND a.status = 'Pending' AND (public.hr_is_privileged() OR public.hr_can_manage_employee(a.subject_employee_id)) LIMIT 100), '[]'::jsonb),
    'team', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.name) FROM public.hr_employees e WHERE e.company_id = public.current_company_id() AND (v_is_privileged OR e.manager_employee_id = v_employee_id)), '[]'::jsonb),
    'holidays', coalesce((SELECT jsonb_agg(to_jsonb(h) ORDER BY h.holiday_date) FROM public.hr_holidays h WHERE h.company_id = public.current_company_id() AND h.holiday_date >= current_date - 30 LIMIT 60), '[]'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Secure workflow command procedure
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.employee_portal_action(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employee_id uuid := public.hr_current_employee_id();
  v_target_employee_id uuid;
  v_source_id uuid;
  v_profile_id uuid := auth.uid();
  v_name text;
  v_start date;
  v_end date;
  v_days numeric(10,2);
  v_status text;
  v_now timestamptz := now();
  v_period_start date;
  v_period_end date;
  v_run_id uuid;
  v_item record;
  v_gross numeric(18,2);
  v_deductions numeric(18,2);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated portal session is required.' USING ERRCODE = '28000';
  END IF;

  IF p_action IN ('profile.update', 'attendance.clock_in', 'attendance.clock_out', 'leave.submit', 'timesheet.submit', 'expense.submit', 'goal.save', 'goal.progress', 'training.complete', 'request.submit', 'announcement.read', 'onboarding.task.complete')
    AND v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Your authenticated account is not linked to an active employee record.' USING ERRCODE = '42501';
  END IF;

  IF p_action = 'profile.update' THEN
    UPDATE public.hr_employees
    SET data = coalesce(data, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
      'phone', p_payload->>'phone', 'personalEmail', p_payload->>'personalEmail',
      'address', p_payload->>'address', 'emergencyContact', p_payload->'emergencyContact'
    )), updated_at = v_now
    WHERE id = v_employee_id;
    PERFORM public.hr_append_audit('EMPLOYEE_PROFILE_UPDATED', v_employee_id::text, p_payload);

  ELSIF p_action = 'attendance.clock_in' THEN
    SELECT name INTO v_name FROM public.hr_employees WHERE id = v_employee_id;
    INSERT INTO public.hr_attendance(company_id, name, status, data, employee_id, attendance_date, clock_in_at, source)
    VALUES (
      public.current_company_id(), v_name, 'Present',
      jsonb_build_object('employee', v_name, 'date', current_date::text, 'clockIn', to_char(v_now AT TIME ZONE 'Africa/Dar_es_Salaam', 'HH24:MI'), 'location', p_payload->'location', 'device', p_payload->>'device'),
      v_employee_id, current_date, v_now, coalesce(p_payload->>'source', 'portal')
    )
    ON CONFLICT (company_id, employee_id, attendance_date) WHERE employee_id IS NOT NULL AND attendance_date IS NOT NULL
    DO UPDATE SET clock_in_at = EXCLUDED.clock_in_at, clock_out_at = NULL, worked_minutes = NULL, status = 'Present', updated_at = v_now,
      data = public.hr_attendance.data || EXCLUDED.data;
    PERFORM public.hr_append_audit('ATTENDANCE_CLOCKED_IN', v_employee_id::text, p_payload);

  ELSIF p_action = 'attendance.clock_out' THEN
    UPDATE public.hr_attendance
    SET clock_out_at = v_now,
        worked_minutes = greatest(0, floor(extract(epoch FROM (v_now - clock_in_at)) / 60)::integer),
        data = coalesce(data, '{}'::jsonb) || jsonb_build_object('clockOut', to_char(v_now AT TIME ZONE 'Africa/Dar_es_Salaam', 'HH24:MI')),
        updated_at = v_now
    WHERE company_id = public.current_company_id() AND employee_id = v_employee_id AND attendance_date = current_date AND clock_in_at IS NOT NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'No open attendance record was found for today.' USING ERRCODE = 'P0002'; END IF;
    PERFORM public.hr_append_audit('ATTENDANCE_CLOCKED_OUT', v_employee_id::text, p_payload);

  ELSIF p_action = 'leave.submit' THEN
    v_start := (p_payload->>'startDate')::date;
    v_end := (p_payload->>'endDate')::date;
    IF v_start IS NULL OR v_end IS NULL OR v_end < v_start THEN
      RAISE EXCEPTION 'Leave start and end dates are required and must be valid.' USING ERRCODE = '22007';
    END IF;
    v_days := (v_end - v_start) + 1;
    SELECT name INTO v_name FROM public.hr_employees WHERE id = v_employee_id;
    INSERT INTO public.hr_leave_requests(company_id, name, status, notes, data, employee_id, leave_policy_id, start_date, end_date, requested_days)
    VALUES (
      public.current_company_id(), v_name, 'Pending', p_payload->>'reason',
      jsonb_build_object('employeeName', v_name, 'type', coalesce(p_payload->>'type', 'Annual Leave'), 'startDate', v_start::text, 'endDate', v_end::text, 'reason', p_payload->>'reason'),
      v_employee_id, nullif(p_payload->>'leavePolicyId', '')::uuid, v_start, v_end, v_days
    ) RETURNING id INTO v_source_id;
    INSERT INTO public.hr_approval_requests(company_id, request_type, source_table, source_record_id, requester_employee_id, subject_employee_id, data)
    VALUES (public.current_company_id(), 'Leave Request', 'hr_leave_requests', v_source_id, v_employee_id, v_employee_id, jsonb_build_object('requestedDays', v_days));
    PERFORM public.hr_append_audit('LEAVE_REQUEST_SUBMITTED', v_source_id::text, p_payload);

  ELSIF p_action = 'leave.decide' THEN
    v_source_id := (p_payload->>'requestId')::uuid;
    SELECT employee_id INTO v_target_employee_id FROM public.hr_leave_requests WHERE id = v_source_id AND company_id = public.current_company_id();
    IF v_target_employee_id IS NULL OR NOT public.hr_can_manage_employee(v_target_employee_id) THEN
      RAISE EXCEPTION 'You are not authorized to decide this leave request.' USING ERRCODE = '42501';
    END IF;
    v_status := CASE lower(coalesce(p_payload->>'decision','')) WHEN 'approve' THEN 'Approved' WHEN 'reject' THEN 'Rejected' ELSE NULL END;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Decision must be approve or reject.' USING ERRCODE = '22023'; END IF;
    UPDATE public.hr_leave_requests SET status = v_status, decision_by = v_profile_id, decided_at = v_now, decision_note = p_payload->>'note', updated_at = v_now WHERE id = v_source_id;
    UPDATE public.hr_approval_requests SET status = v_status, updated_at = v_now WHERE source_table = 'hr_leave_requests' AND source_record_id = v_source_id;
    PERFORM public.hr_create_notification((SELECT profile_id FROM public.hr_employees WHERE id = v_target_employee_id), v_target_employee_id, 'Leave request ' || lower(v_status), coalesce(p_payload->>'note', 'Your leave request has been ' || lower(v_status) || '.'), 'Approval', 'employee-portal', v_source_id);
    PERFORM public.hr_append_audit('LEAVE_REQUEST_' || upper(v_status), v_source_id::text, p_payload);

  ELSIF p_action = 'timesheet.submit' THEN
    v_period_start := (p_payload->>'periodStart')::date;
    v_period_end := (p_payload->>'periodEnd')::date;
    IF v_period_start IS NULL OR v_period_end IS NULL OR v_period_end < v_period_start THEN RAISE EXCEPTION 'A valid timesheet period is required.' USING ERRCODE = '22007'; END IF;
    INSERT INTO public.hr_timesheets(company_id, employee_id, period_start, period_end, total_minutes, status, submitted_at, data)
    VALUES (public.current_company_id(), v_employee_id, v_period_start, v_period_end, greatest(0, coalesce((p_payload->>'totalMinutes')::integer, 0)), 'Submitted', v_now, coalesce(p_payload->'data', '{}'::jsonb))
    ON CONFLICT (company_id, employee_id, period_start, period_end)
    DO UPDATE SET total_minutes = EXCLUDED.total_minutes, status = 'Submitted', submitted_at = v_now, data = EXCLUDED.data, updated_at = v_now
    RETURNING id INTO v_source_id;
    INSERT INTO public.hr_approval_requests(company_id, request_type, source_table, source_record_id, requester_employee_id, subject_employee_id)
    VALUES (public.current_company_id(), 'Timesheet', 'hr_timesheets', v_source_id, v_employee_id, v_employee_id)
    ON CONFLICT (company_id, source_table, source_record_id) DO UPDATE SET status = 'Pending', updated_at = v_now;
    PERFORM public.hr_append_audit('TIMESHEET_SUBMITTED', v_source_id::text, p_payload);

  ELSIF p_action = 'timesheet.decide' THEN
    v_source_id := (p_payload->>'timesheetId')::uuid;
    SELECT employee_id INTO v_target_employee_id FROM public.hr_timesheets WHERE id = v_source_id AND company_id = public.current_company_id();
    IF v_target_employee_id IS NULL OR NOT public.hr_can_manage_employee(v_target_employee_id) THEN RAISE EXCEPTION 'You are not authorized to decide this timesheet.' USING ERRCODE = '42501'; END IF;
    v_status := CASE lower(coalesce(p_payload->>'decision','')) WHEN 'approve' THEN 'Approved' WHEN 'reject' THEN 'Returned' ELSE NULL END;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Decision must be approve or reject.' USING ERRCODE = '22023'; END IF;
    UPDATE public.hr_timesheets SET status = v_status, decided_by = v_profile_id, decided_at = v_now, decision_note = p_payload->>'note', updated_at = v_now WHERE id = v_source_id;
    UPDATE public.hr_approval_requests SET status = v_status, updated_at = v_now WHERE source_table = 'hr_timesheets' AND source_record_id = v_source_id;
    PERFORM public.hr_append_audit('TIMESHEET_' || upper(v_status), v_source_id::text, p_payload);

  ELSIF p_action = 'expense.submit' THEN
    INSERT INTO public.hr_expense_claims(company_id, employee_id, expense_date, category, amount, currency, merchant, description, status, document_id, data)
    VALUES (public.current_company_id(), v_employee_id, coalesce((p_payload->>'expenseDate')::date, current_date), coalesce(p_payload->>'category', 'Other'), coalesce((p_payload->>'amount')::numeric, 0), coalesce(p_payload->>'currency', 'TZS'), p_payload->>'merchant', p_payload->>'description', 'Submitted', nullif(p_payload->>'documentId','')::uuid, coalesce(p_payload->'data','{}'::jsonb))
    RETURNING id INTO v_source_id;
    INSERT INTO public.hr_approval_requests(company_id, request_type, source_table, source_record_id, requester_employee_id, subject_employee_id)
    VALUES (public.current_company_id(), 'Expense Claim', 'hr_expense_claims', v_source_id, v_employee_id, v_employee_id);
    PERFORM public.hr_append_audit('EXPENSE_CLAIM_SUBMITTED', v_source_id::text, p_payload);

  ELSIF p_action = 'expense.decide' THEN
    v_source_id := (p_payload->>'claimId')::uuid;
    SELECT employee_id INTO v_target_employee_id FROM public.hr_expense_claims WHERE id = v_source_id AND company_id = public.current_company_id();
    IF v_target_employee_id IS NULL OR NOT public.hr_is_privileged() THEN RAISE EXCEPTION 'Only authorized Finance or HR roles can decide expense claims.' USING ERRCODE = '42501'; END IF;
    v_status := CASE lower(coalesce(p_payload->>'decision','')) WHEN 'approve' THEN 'Approved' WHEN 'reject' THEN 'Rejected' ELSE NULL END;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Decision must be approve or reject.' USING ERRCODE = '22023'; END IF;
    UPDATE public.hr_expense_claims SET status = v_status, decided_by = v_profile_id, decided_at = v_now, decision_note = p_payload->>'note', updated_at = v_now WHERE id = v_source_id;
    UPDATE public.hr_approval_requests SET status = v_status, updated_at = v_now WHERE source_table = 'hr_expense_claims' AND source_record_id = v_source_id;
    PERFORM public.hr_append_audit('EXPENSE_CLAIM_' || upper(v_status), v_source_id::text, p_payload);

  ELSIF p_action = 'goal.save' THEN
    v_target_employee_id := coalesce(nullif(p_payload->>'employeeId','')::uuid, v_employee_id);
    IF v_target_employee_id <> v_employee_id AND NOT public.hr_can_manage_employee(v_target_employee_id) THEN RAISE EXCEPTION 'You are not authorized to manage this employee goal.' USING ERRCODE = '42501'; END IF;
    IF nullif(p_payload->>'goalId','') IS NULL THEN
      INSERT INTO public.hr_goals(company_id, employee_id, title, description, metric_name, target_value, current_value, unit, status, due_date, owner_employee_id, data)
      VALUES (public.current_company_id(), v_target_employee_id, coalesce(p_payload->>'title', 'Untitled goal'), p_payload->>'description', p_payload->>'metricName', nullif(p_payload->>'targetValue','')::numeric, coalesce(nullif(p_payload->>'currentValue','')::numeric,0), p_payload->>'unit', coalesce(p_payload->>'status','Active'), nullif(p_payload->>'dueDate','')::date, v_target_employee_id, coalesce(p_payload->'data','{}'::jsonb))
      RETURNING id INTO v_source_id;
    ELSE
      v_source_id := (p_payload->>'goalId')::uuid;
      UPDATE public.hr_goals SET title = coalesce(p_payload->>'title', title), description = coalesce(p_payload->>'description', description), target_value = coalesce(nullif(p_payload->>'targetValue','')::numeric,target_value), current_value = coalesce(nullif(p_payload->>'currentValue','')::numeric,current_value), status = coalesce(p_payload->>'status',status), due_date = coalesce(nullif(p_payload->>'dueDate','')::date,due_date), updated_at = v_now WHERE id = v_source_id AND employee_id = v_target_employee_id;
    END IF;
    PERFORM public.hr_append_audit('GOAL_SAVED', v_source_id::text, p_payload);

  ELSIF p_action = 'goal.progress' THEN
    v_source_id := (p_payload->>'goalId')::uuid;
    SELECT employee_id INTO v_target_employee_id FROM public.hr_goals WHERE id = v_source_id AND company_id = public.current_company_id();
    IF v_target_employee_id IS NULL OR (v_target_employee_id <> v_employee_id AND NOT public.hr_can_manage_employee(v_target_employee_id)) THEN RAISE EXCEPTION 'You are not authorized to update this goal.' USING ERRCODE = '42501'; END IF;
    UPDATE public.hr_goals SET current_value = coalesce((p_payload->>'currentValue')::numeric,current_value), updated_at = v_now WHERE id = v_source_id;
    INSERT INTO public.hr_goal_updates(company_id, goal_id, employee_id, current_value, note) VALUES (public.current_company_id(), v_source_id, v_target_employee_id, coalesce((p_payload->>'currentValue')::numeric,0), p_payload->>'note');
    PERFORM public.hr_append_audit('GOAL_PROGRESS_UPDATED', v_source_id::text, p_payload);

  ELSIF p_action = 'training.complete' THEN
    v_source_id := (p_payload->>'assignmentId')::uuid;
    UPDATE public.hr_training_assignments SET status = 'Completed', completed_at = v_now, updated_at = v_now WHERE id = v_source_id AND employee_id = v_employee_id AND company_id = public.current_company_id();
    IF NOT FOUND THEN RAISE EXCEPTION 'Training assignment was not found for this employee.' USING ERRCODE = 'P0002'; END IF;
    PERFORM public.hr_append_audit('TRAINING_COMPLETED', v_source_id::text, p_payload);

  ELSIF p_action = 'request.submit' THEN
    INSERT INTO public.hr_service_requests(company_id, employee_id, request_type, subject, description, status, data)
    VALUES (public.current_company_id(), v_employee_id, coalesce(p_payload->>'requestType','General Request'), coalesce(p_payload->>'subject','Employee request'), p_payload->>'description', 'Submitted', coalesce(p_payload->'data','{}'::jsonb))
    RETURNING id INTO v_source_id;
    INSERT INTO public.hr_approval_requests(company_id, request_type, source_table, source_record_id, requester_employee_id, subject_employee_id)
    VALUES (public.current_company_id(), 'Internal Request', 'hr_service_requests', v_source_id, v_employee_id, v_employee_id);
    PERFORM public.hr_append_audit('INTERNAL_REQUEST_SUBMITTED', v_source_id::text, p_payload);

  ELSIF p_action = 'request.decide' THEN
    v_source_id := (p_payload->>'requestId')::uuid;
    SELECT employee_id INTO v_target_employee_id FROM public.hr_service_requests WHERE id = v_source_id AND company_id = public.current_company_id();
    IF v_target_employee_id IS NULL OR NOT public.hr_can_manage_employee(v_target_employee_id) THEN RAISE EXCEPTION 'You are not authorized to decide this request.' USING ERRCODE = '42501'; END IF;
    v_status := CASE lower(coalesce(p_payload->>'decision','')) WHEN 'approve' THEN 'Approved' WHEN 'reject' THEN 'Rejected' WHEN 'complete' THEN 'Completed' ELSE NULL END;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Decision must be approve, reject, or complete.' USING ERRCODE = '22023'; END IF;
    UPDATE public.hr_service_requests SET status = v_status, decided_by = v_profile_id, decided_at = v_now, decision_note = p_payload->>'note', updated_at = v_now WHERE id = v_source_id;
    UPDATE public.hr_approval_requests SET status = v_status, updated_at = v_now WHERE source_table = 'hr_service_requests' AND source_record_id = v_source_id;
    PERFORM public.hr_append_audit('INTERNAL_REQUEST_' || upper(v_status), v_source_id::text, p_payload);

  ELSIF p_action = 'announcement.read' THEN
    INSERT INTO public.hr_announcement_reads(announcement_id, profile_id) VALUES ((p_payload->>'announcementId')::uuid, v_profile_id) ON CONFLICT DO NOTHING;

  ELSIF p_action = 'onboarding.task.complete' THEN
    v_source_id := (p_payload->>'taskId')::uuid;
    UPDATE public.hr_onboarding_tasks SET status = 'Completed', completed_at = v_now, updated_at = v_now WHERE id = v_source_id AND employee_id = v_employee_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding task was not found for this employee.' USING ERRCODE = 'P0002'; END IF;
    PERFORM public.hr_append_audit('ONBOARDING_TASK_COMPLETED', v_source_id::text, p_payload);

  ELSIF p_action = 'employee.save' THEN
    PERFORM public.hr_require_privileged();
    IF nullif(p_payload->>'employeeId','') IS NULL THEN
      INSERT INTO public.hr_employees(company_id, name, status, amount, data, profile_id, department_id, position_id, manager_employee_id, employee_number, employment_start_date, employment_end_date, timezone)
      VALUES (public.current_company_id(), coalesce(p_payload->>'name','Unnamed employee'), coalesce(p_payload->>'status','Active'), coalesce(nullif(p_payload->>'salary','')::numeric,0), coalesce(p_payload->'data','{}'::jsonb), nullif(p_payload->>'profileId','')::uuid, nullif(p_payload->>'departmentId','')::uuid, nullif(p_payload->>'positionId','')::uuid, nullif(p_payload->>'managerEmployeeId','')::uuid, nullif(p_payload->>'employeeNumber',''), nullif(p_payload->>'employmentStartDate','')::date, nullif(p_payload->>'employmentEndDate','')::date, coalesce(p_payload->>'timezone','Africa/Dar_es_Salaam'))
      RETURNING id INTO v_source_id;
    ELSE
      v_source_id := (p_payload->>'employeeId')::uuid;
      UPDATE public.hr_employees SET name = coalesce(p_payload->>'name',name), status = coalesce(p_payload->>'status',status), amount = coalesce(nullif(p_payload->>'salary','')::numeric,amount), profile_id = coalesce(nullif(p_payload->>'profileId','')::uuid,profile_id), department_id = coalesce(nullif(p_payload->>'departmentId','')::uuid,department_id), position_id = coalesce(nullif(p_payload->>'positionId','')::uuid,position_id), manager_employee_id = coalesce(nullif(p_payload->>'managerEmployeeId','')::uuid,manager_employee_id), employee_number = coalesce(nullif(p_payload->>'employeeNumber',''),employee_number), employment_start_date = coalesce(nullif(p_payload->>'employmentStartDate','')::date,employment_start_date), employment_end_date = coalesce(nullif(p_payload->>'employmentEndDate','')::date,employment_end_date), data = coalesce(data,'{}'::jsonb) || coalesce(p_payload->'data','{}'::jsonb), updated_at = v_now WHERE id = v_source_id AND company_id = public.current_company_id();
    END IF;
    PERFORM public.hr_append_audit('EMPLOYEE_SAVED', v_source_id::text, p_payload);

  ELSIF p_action IN ('department.save', 'position.save', 'shift.save', 'holiday.save', 'leave_policy.save', 'statutory_rule.save', 'benefit_plan.save', 'announcement.publish', 'onboarding.start', 'offboarding.start', 'document.link', 'training.assign', 'performance.save', 'benefit.enroll', 'shift.assign', 'payroll.create', 'payslip.publish') THEN
    PERFORM public.hr_require_privileged();

    IF p_action = 'department.save' THEN
      INSERT INTO public.departments(company_id, name, status, notes, data) VALUES (public.current_company_id(), coalesce(p_payload->>'name','Department'), coalesce(p_payload->>'status','Active'), p_payload->>'notes', coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_source_id;
    ELSIF p_action = 'position.save' THEN
      INSERT INTO public.hr_positions(company_id, department_id, title, code, grade, status, description) VALUES (public.current_company_id(), nullif(p_payload->>'departmentId','')::uuid, coalesce(p_payload->>'title','Position'), p_payload->>'code', p_payload->>'grade', coalesce(p_payload->>'status','Active'), p_payload->>'description') RETURNING id INTO v_source_id;
    ELSIF p_action = 'shift.save' THEN
      INSERT INTO public.hr_shifts(company_id, name, start_time, end_time, unpaid_break_minutes, timezone, status, data) VALUES (public.current_company_id(), coalesce(p_payload->>'name','Shift'), coalesce(nullif(p_payload->>'startTime','')::time,'09:00'::time), coalesce(nullif(p_payload->>'endTime','')::time,'17:00'::time), coalesce(nullif(p_payload->>'unpaidBreakMinutes','')::integer,0), coalesce(p_payload->>'timezone','Africa/Dar_es_Salaam'), coalesce(p_payload->>'status','Active'), coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_source_id;
    ELSIF p_action = 'shift.assign' THEN
      INSERT INTO public.hr_shift_assignments(company_id, employee_id, shift_id, assignment_date, status, notes) VALUES (public.current_company_id(), (p_payload->>'employeeId')::uuid, (p_payload->>'shiftId')::uuid, (p_payload->>'assignmentDate')::date, coalesce(p_payload->>'status','Scheduled'), p_payload->>'notes') ON CONFLICT (company_id, employee_id, assignment_date) DO UPDATE SET shift_id = EXCLUDED.shift_id, status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = v_now RETURNING id INTO v_source_id;
    ELSIF p_action = 'holiday.save' THEN
      INSERT INTO public.hr_holidays(company_id, holiday_date, name, holiday_type, paid, branch_id) VALUES (public.current_company_id(), (p_payload->>'holidayDate')::date, coalesce(p_payload->>'name','Holiday'), coalesce(p_payload->>'holidayType','Public'), coalesce((p_payload->>'paid')::boolean,true), nullif(p_payload->>'branchId','')::uuid) RETURNING id INTO v_source_id;
    ELSIF p_action = 'leave_policy.save' THEN
      INSERT INTO public.hr_leave_policies(company_id, name, leave_type, annual_entitlement, carry_forward_limit, requires_approval, status, data) VALUES (public.current_company_id(), coalesce(p_payload->>'name',p_payload->>'leaveType','Leave Policy'), coalesce(p_payload->>'leaveType','Annual Leave'), coalesce(nullif(p_payload->>'annualEntitlement','')::numeric,0), coalesce(nullif(p_payload->>'carryForwardLimit','')::numeric,0), coalesce((p_payload->>'requiresApproval')::boolean,true), coalesce(p_payload->>'status','Active'), coalesce(p_payload->'data','{}'::jsonb)) ON CONFLICT (company_id, leave_type) DO UPDATE SET annual_entitlement=EXCLUDED.annual_entitlement, carry_forward_limit=EXCLUDED.carry_forward_limit, requires_approval=EXCLUDED.requires_approval, status=EXCLUDED.status, data=EXCLUDED.data, updated_at=v_now RETURNING id INTO v_source_id;
    ELSIF p_action = 'statutory_rule.save' THEN
      INSERT INTO public.hr_statutory_rules(company_id, name, rule_code, effective_from, effective_to, applies_to, calculation_type, rate, fixed_amount, threshold_amount, currency, status, data) VALUES (public.current_company_id(), coalesce(p_payload->>'name','Statutory Rule'), coalesce(p_payload->>'ruleCode','RULE-' || substr(gen_random_uuid()::text,1,8)), coalesce(nullif(p_payload->>'effectiveFrom','')::date,current_date), nullif(p_payload->>'effectiveTo','')::date, coalesce(p_payload->>'appliesTo','employee'), coalesce(p_payload->>'calculationType','percentage'), coalesce(nullif(p_payload->>'rate','')::numeric,0), coalesce(nullif(p_payload->>'fixedAmount','')::numeric,0), coalesce(nullif(p_payload->>'thresholdAmount','')::numeric,0), coalesce(p_payload->>'currency','TZS'), coalesce(p_payload->>'status','Draft'), coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_source_id;
    ELSIF p_action = 'benefit_plan.save' THEN
      INSERT INTO public.hr_benefit_plans(company_id, name, provider, benefit_type, employee_contribution, employer_contribution, currency, status, data) VALUES (public.current_company_id(), coalesce(p_payload->>'name','Benefit Plan'), p_payload->>'provider', coalesce(p_payload->>'benefitType','Other'), coalesce(nullif(p_payload->>'employeeContribution','')::numeric,0), coalesce(nullif(p_payload->>'employerContribution','')::numeric,0), coalesce(p_payload->>'currency','TZS'), coalesce(p_payload->>'status','Active'), coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_source_id;
    ELSIF p_action = 'benefit.enroll' THEN
      INSERT INTO public.hr_benefit_enrollments(company_id, employee_id, benefit_plan_id, status, effective_from, effective_to, data) VALUES (public.current_company_id(), (p_payload->>'employeeId')::uuid, (p_payload->>'benefitPlanId')::uuid, coalesce(p_payload->>'status','Active'), coalesce(nullif(p_payload->>'effectiveFrom','')::date,current_date), nullif(p_payload->>'effectiveTo','')::date, coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_source_id;
    ELSIF p_action = 'announcement.publish' THEN
      INSERT INTO public.hr_announcements(company_id, title, body, audience_type, department_id, status, published_at, expires_at) VALUES (public.current_company_id(), coalesce(p_payload->>'title','Announcement'), coalesce(p_payload->>'body',''), coalesce(p_payload->>'audienceType','All Employees'), nullif(p_payload->>'departmentId','')::uuid, 'Published', v_now, nullif(p_payload->>'expiresAt','')::date) RETURNING id INTO v_source_id;
    ELSIF p_action = 'onboarding.start' THEN
      INSERT INTO public.hr_onboarding_cases(company_id, employee_id, status, start_date, due_date, data) VALUES (public.current_company_id(), (p_payload->>'employeeId')::uuid, 'In Progress', coalesce(nullif(p_payload->>'startDate','')::date,current_date), nullif(p_payload->>'dueDate','')::date, coalesce(p_payload->'data','{}'::jsonb)) ON CONFLICT (company_id, employee_id) DO UPDATE SET status='In Progress', due_date=EXCLUDED.due_date, updated_at=v_now RETURNING id INTO v_source_id;
    ELSIF p_action = 'offboarding.start' THEN
      INSERT INTO public.hr_offboarding_cases(company_id, employee_id, status, last_working_date, reason, data) VALUES (public.current_company_id(), (p_payload->>'employeeId')::uuid, 'Planned', nullif(p_payload->>'lastWorkingDate','')::date, p_payload->>'reason', coalesce(p_payload->'data','{}'::jsonb)) ON CONFLICT (company_id, employee_id) DO UPDATE SET status='Planned', last_working_date=EXCLUDED.last_working_date, reason=EXCLUDED.reason, updated_at=v_now RETURNING id INTO v_source_id;
    ELSIF p_action = 'document.link' THEN
      INSERT INTO public.hr_employee_documents(company_id, employee_id, document_id, title, document_type, file_url, status, expires_at, data) VALUES (public.current_company_id(), (p_payload->>'employeeId')::uuid, nullif(p_payload->>'documentId','')::uuid, coalesce(p_payload->>'title','Employee Document'), coalesce(p_payload->>'documentType','Other'), p_payload->>'fileUrl', coalesce(p_payload->>'status','Active'), nullif(p_payload->>'expiresAt','')::date, coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_source_id;
    ELSIF p_action = 'training.assign' THEN
      INSERT INTO public.hr_training_assignments(company_id, employee_id, course_id, due_date, status, data) VALUES (public.current_company_id(), (p_payload->>'employeeId')::uuid, (p_payload->>'courseId')::uuid, nullif(p_payload->>'dueDate','')::date, 'Assigned', coalesce(p_payload->'data','{}'::jsonb)) ON CONFLICT (company_id, employee_id, course_id) DO UPDATE SET due_date=EXCLUDED.due_date,status='Assigned',updated_at=v_now RETURNING id INTO v_source_id;
    ELSIF p_action = 'performance.save' THEN
      INSERT INTO public.hr_performance_reviews(company_id, name, status, notes, data, employee_id, reviewer_employee_id, review_period_start, review_period_end, due_date) VALUES (public.current_company_id(), coalesce(p_payload->>'title','Performance Review'), coalesce(p_payload->>'status','Draft'), p_payload->>'notes', coalesce(p_payload->'data','{}'::jsonb), (p_payload->>'employeeId')::uuid, v_employee_id, nullif(p_payload->>'periodStart','')::date, nullif(p_payload->>'periodEnd','')::date, nullif(p_payload->>'dueDate','')::date) RETURNING id INTO v_source_id;
    ELSIF p_action = 'payroll.create' THEN
      v_period_start := (p_payload->>'periodStart')::date; v_period_end := (p_payload->>'periodEnd')::date;
      IF v_period_start IS NULL OR v_period_end IS NULL OR v_period_end < v_period_start THEN RAISE EXCEPTION 'A valid payroll period is required.' USING ERRCODE = '22007'; END IF;
      INSERT INTO public.hr_payroll_runs(company_id, name, status, period_start, period_end, currency, timezone, data) VALUES (public.current_company_id(), coalesce(p_payload->>'name','Payroll ' || to_char(v_period_start,'YYYY-MM')), 'Draft', v_period_start, v_period_end, coalesce(p_payload->>'currency','TZS'), coalesce(p_payload->>'timezone','Africa/Dar_es_Salaam'), coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_run_id;
      FOR v_item IN SELECT id, amount, name FROM public.hr_employees WHERE company_id = public.current_company_id() AND coalesce(status,'Active') = 'Active' LOOP
        v_gross := coalesce(v_item.amount,0);
        SELECT coalesce(sum(CASE WHEN calculation_type = 'percentage' THEN greatest(v_gross - threshold_amount,0) * rate WHEN calculation_type = 'fixed' THEN fixed_amount ELSE 0 END),0) INTO v_deductions FROM public.hr_statutory_rules WHERE company_id = public.current_company_id() AND status = 'Active' AND effective_from <= v_period_end AND (effective_to IS NULL OR effective_to >= v_period_start) AND applies_to = 'employee';
        INSERT INTO public.hr_payroll_items(company_id, payroll_run_id, employee_id, gross_pay, taxable_pay, deductions, net_pay, currency, status, data) VALUES (public.current_company_id(), v_run_id, v_item.id, v_gross, v_gross, v_deductions, greatest(v_gross-v_deductions,0), coalesce(p_payload->>'currency','TZS'), 'Draft', jsonb_build_object('employeeName',v_item.name));
      END LOOP;
      v_source_id := v_run_id;
    ELSIF p_action = 'payslip.publish' THEN
      v_source_id := (p_payload->>'payrollItemId')::uuid;
      SELECT employee_id INTO v_target_employee_id FROM public.hr_payroll_items WHERE id = v_source_id AND company_id = public.current_company_id();
      IF v_target_employee_id IS NULL THEN RAISE EXCEPTION 'Payroll item was not found.' USING ERRCODE = 'P0002'; END IF;
      INSERT INTO public.hr_payslips(company_id, payroll_item_id, employee_id, pay_period, status, issued_at, data) VALUES (public.current_company_id(), v_source_id, v_target_employee_id, coalesce(p_payload->>'payPeriod',to_char(current_date,'YYYY-MM')), 'Issued', v_now, coalesce(p_payload->'data','{}'::jsonb)) ON CONFLICT (payroll_item_id) DO UPDATE SET status='Issued', issued_at=v_now, data=EXCLUDED.data, updated_at=v_now RETURNING id INTO v_source_id;
      UPDATE public.hr_payroll_items SET status='Issued', updated_at=v_now WHERE id=(p_payload->>'payrollItemId')::uuid;
      PERFORM public.hr_create_notification((SELECT profile_id FROM public.hr_employees WHERE id=v_target_employee_id), v_target_employee_id, 'Your payslip is available', 'A new payslip has been issued for your review.', 'Payroll', 'employee-portal', v_source_id);
    END IF;
    PERFORM public.hr_append_audit(upper(replace(p_action,'.','_')), coalesce(v_source_id::text,'portal-configuration'), p_payload);

  ELSE
    RAISE EXCEPTION 'Unsupported Employee Portal action: %', p_action USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'action', p_action, 'recordId', v_source_id, 'snapshotRequired', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Row-level security: preserve tenant boundary and add scoped visibility
-- ---------------------------------------------------------------------------
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_employees_tenant ON public.hr_employees;
DROP POLICY IF EXISTS hr_employees_portal_select ON public.hr_employees;
DROP POLICY IF EXISTS hr_employees_portal_write ON public.hr_employees;
CREATE POLICY hr_employees_portal_select ON public.hr_employees FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND (public.hr_is_privileged() OR id = public.hr_current_employee_id() OR public.hr_can_manage_employee(id)));
CREATE POLICY hr_employees_portal_write ON public.hr_employees FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND public.hr_is_privileged())
WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged());

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['hr_attendance','hr_leave_requests','hr_benefits','hr_duties','hr_performance_reviews'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_tenant', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_portal_select', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_portal_write', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND (public.hr_is_privileged() OR employee_id = public.hr_current_employee_id() OR public.hr_can_manage_employee(employee_id)))', v_table || '_portal_select', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = public.current_company_id() AND public.hr_is_privileged()) WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged())', v_table || '_portal_write', v_table);
  END LOOP;
END $$;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['hr_shift_assignments','hr_leave_balances','hr_timesheets','hr_payroll_items','hr_payslips','hr_benefit_enrollments','hr_expense_claims','hr_goals','hr_goal_updates','hr_training_assignments','hr_employee_documents','hr_service_requests','hr_onboarding_cases','hr_onboarding_tasks','hr_offboarding_cases'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_portal_select', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_portal_write', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND (public.hr_is_privileged() OR employee_id = public.hr_current_employee_id() OR public.hr_can_manage_employee(employee_id)))', v_table || '_portal_select', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = public.current_company_id() AND public.hr_is_privileged()) WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged())', v_table || '_portal_write', v_table);
  END LOOP;
END $$;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['hr_positions','hr_shifts','hr_holidays','hr_leave_policies','hr_statutory_rules','hr_payroll_runs','hr_benefit_plans','hr_training_courses','hr_announcements'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_portal_select', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_portal_write', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', v_table || '_portal_select', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = public.current_company_id() AND public.hr_is_privileged()) WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged())', v_table || '_portal_write', v_table);
  END LOOP;
END $$;

ALTER TABLE public.hr_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_notifications_portal_select ON public.hr_notifications;
DROP POLICY IF EXISTS hr_notifications_portal_write ON public.hr_notifications;
CREATE POLICY hr_notifications_portal_select ON public.hr_notifications FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND (public.hr_is_privileged() OR profile_id = auth.uid() OR employee_id = public.hr_current_employee_id()));
CREATE POLICY hr_notifications_portal_write ON public.hr_notifications FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND public.hr_is_privileged())
WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged());

ALTER TABLE public.hr_announcement_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_announcement_reads_portal_select ON public.hr_announcement_reads;
CREATE POLICY hr_announcement_reads_portal_select ON public.hr_announcement_reads FOR SELECT TO authenticated
USING (profile_id = auth.uid() OR public.hr_is_privileged());

ALTER TABLE public.hr_approval_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_approval_requests_portal_select ON public.hr_approval_requests;
DROP POLICY IF EXISTS hr_approval_requests_portal_write ON public.hr_approval_requests;
CREATE POLICY hr_approval_requests_portal_select ON public.hr_approval_requests FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND (public.hr_is_privileged() OR requester_employee_id = public.hr_current_employee_id() OR subject_employee_id = public.hr_current_employee_id() OR public.hr_can_manage_employee(subject_employee_id)));
CREATE POLICY hr_approval_requests_portal_write ON public.hr_approval_requests FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND public.hr_is_privileged())
WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged());

ALTER TABLE public.hr_approval_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_approval_steps_portal_select ON public.hr_approval_steps;
DROP POLICY IF EXISTS hr_approval_steps_portal_write ON public.hr_approval_steps;
CREATE POLICY hr_approval_steps_portal_select ON public.hr_approval_steps FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND (public.hr_is_privileged() OR approver_profile_id = auth.uid()));
CREATE POLICY hr_approval_steps_portal_write ON public.hr_approval_steps FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND public.hr_is_privileged())
WITH CHECK (company_id = public.current_company_id() AND public.hr_is_privileged());

GRANT EXECUTE ON FUNCTION public.employee_portal_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.employee_portal_action(text, jsonb) TO authenticated;

COMMIT;
