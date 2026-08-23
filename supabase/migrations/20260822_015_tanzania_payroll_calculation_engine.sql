-- Tanzania payroll calculation remediation.
-- PAYE brackets follow TRA's published mainland monthly table in force at this implementation date.
-- Rates for NSSF/PSSSF, WCF and SDL remain company-owned effective-dated configuration,
-- so an authorised payroll administrator can reflect a statutory change without source edits.

BEGIN;

ALTER TABLE public.hr_payroll_items
  ADD COLUMN IF NOT EXISTS employer_contributions numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_cost numeric(18,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.tz_paye_monthly(p_taxable_pay numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT round(
    CASE
      WHEN greatest(coalesce(p_taxable_pay, 0), 0) <= 270000 THEN 0
      WHEN greatest(coalesce(p_taxable_pay, 0), 0) <= 520000 THEN (greatest(p_taxable_pay, 0) - 270000) * 0.08
      WHEN greatest(coalesce(p_taxable_pay, 0), 0) <= 760000 THEN 20000 + (greatest(p_taxable_pay, 0) - 520000) * 0.20
      WHEN greatest(coalesce(p_taxable_pay, 0), 0) <= 1000000 THEN 68000 + (greatest(p_taxable_pay, 0) - 760000) * 0.25
      ELSE 128000 + (greatest(p_taxable_pay, 0) - 1000000) * 0.30
    END
  , 2);
$$;

CREATE OR REPLACE FUNCTION public.tanzania_payroll_preview(
  p_gross_pay numeric,
  p_employee_pension_rate numeric DEFAULT 0,
  p_employer_pension_rate numeric DEFAULT 0,
  p_wcf_rate numeric DEFAULT 0,
  p_sdl_rate numeric DEFAULT 0,
  p_employee_count integer DEFAULT 0,
  p_sdl_minimum_headcount integer DEFAULT 10,
  p_sdl_exempt boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_gross numeric(18,2) := round(greatest(coalesce(p_gross_pay, 0), 0), 2);
  v_employee_pension numeric(18,2);
  v_taxable numeric(18,2);
  v_paye numeric(18,2);
  v_employee_deductions numeric(18,2);
  v_employer_pension numeric(18,2);
  v_wcf numeric(18,2);
  v_sdl numeric(18,2);
  v_employer_contributions numeric(18,2);
BEGIN
  IF coalesce(p_employee_pension_rate, 0) < 0 OR coalesce(p_employer_pension_rate, 0) < 0 OR coalesce(p_wcf_rate, 0) < 0 OR coalesce(p_sdl_rate, 0) < 0 THEN
    RAISE EXCEPTION 'Statutory rates cannot be negative.' USING ERRCODE = '22023';
  END IF;
  v_employee_pension := round(v_gross * coalesce(p_employee_pension_rate, 0), 2);
  v_taxable := greatest(v_gross - v_employee_pension, 0);
  v_paye := public.tz_paye_monthly(v_taxable);
  v_employee_deductions := round(v_employee_pension + v_paye, 2);
  v_employer_pension := round(v_gross * coalesce(p_employer_pension_rate, 0), 2);
  v_wcf := round(v_gross * coalesce(p_wcf_rate, 0), 2);
  v_sdl := CASE WHEN coalesce(p_sdl_exempt, false) OR coalesce(p_employee_count, 0) < coalesce(p_sdl_minimum_headcount, 10) THEN 0 ELSE round(v_gross * coalesce(p_sdl_rate, 0), 2) END;
  v_employer_contributions := round(v_employer_pension + v_wcf + v_sdl, 2);
  RETURN jsonb_build_object(
    'grossPay', v_gross,
    'employeePension', v_employee_pension,
    'taxablePay', v_taxable,
    'paye', v_paye,
    'employeeDeductions', v_employee_deductions,
    'netPay', greatest(round(v_gross - v_employee_deductions, 2), 0),
    'employerPension', v_employer_pension,
    'wcf', v_wcf,
    'sdl', v_sdl,
    'employerContributions', v_employer_contributions,
    'employerCost', round(v_gross + v_employer_contributions, 2)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_calculate_tanzania_payroll(
  p_company_id uuid,
  p_gross_pay numeric,
  p_period_start date,
  p_period_end date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_pension_rate numeric := 0;
  v_employer_pension_rate numeric := 0;
  v_wcf_rate numeric := 0;
  v_sdl_rate numeric := 0;
  v_sdl_minimum_headcount integer := 10;
  v_sdl_exempt boolean := false;
  v_employee_count integer := 0;
  v_has_paye boolean := false;
  v_preview jsonb;
BEGIN
  IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_end < p_period_start THEN
    RAISE EXCEPTION 'A valid payroll period is required.' USING ERRCODE = '22007';
  END IF;
  SELECT count(*) INTO v_employee_count FROM public.hr_employees WHERE company_id = p_company_id AND coalesce(status, 'Active') = 'Active';
  SELECT coalesce(max(rate) FILTER (WHERE rule_code IN ('NSSF_EMPLOYEE','PSSSF_EMPLOYEE')), 0),
         coalesce(max(rate) FILTER (WHERE rule_code IN ('NSSF_EMPLOYER','PSSSF_EMPLOYER')), 0),
         coalesce(max(rate) FILTER (WHERE rule_code = 'WCF_EMPLOYER'), 0),
         coalesce(max(rate) FILTER (WHERE rule_code = 'SDL_EMPLOYER'), 0),
         coalesce(max((data->>'minimumHeadcount')::integer) FILTER (WHERE rule_code = 'SDL_EMPLOYER'), 10),
         coalesce(bool_or(coalesce((data->>'exempt')::boolean, false)) FILTER (WHERE rule_code = 'SDL_EMPLOYER'), false),
         bool_or(rule_code = 'TZ_PAYE')
    INTO v_employee_pension_rate, v_employer_pension_rate, v_wcf_rate, v_sdl_rate, v_sdl_minimum_headcount, v_sdl_exempt, v_has_paye
  FROM public.hr_statutory_rules
  WHERE company_id = p_company_id AND status = 'Active' AND effective_from <= p_period_end AND (effective_to IS NULL OR effective_to >= p_period_start);
  v_preview := public.tanzania_payroll_preview(p_gross_pay, v_employee_pension_rate, v_employer_pension_rate, v_wcf_rate, v_sdl_rate, v_employee_count, v_sdl_minimum_headcount, v_sdl_exempt);
  IF coalesce(v_has_paye, false) = false THEN
    v_preview := jsonb_set(v_preview, '{paye}', '0'::jsonb, true);
    v_preview := jsonb_set(v_preview, '{employeeDeductions}', to_jsonb(round(coalesce((v_preview->>'employeePension')::numeric,0),2)), true);
    v_preview := jsonb_set(v_preview, '{netPay}', to_jsonb(greatest(round(coalesce((v_preview->>'grossPay')::numeric,0) - coalesce((v_preview->>'employeePension')::numeric,0),2),0)), true);
  END IF;
  RETURN v_preview || jsonb_build_object('configuredPaye', v_has_paye, 'activeEmployeeCount', v_employee_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_payroll_configuration_status(p_company_id uuid, p_on_date date DEFAULT current_date)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'ready', bool_or(rule_code = 'TZ_PAYE') AND bool_or(rule_code IN ('NSSF_EMPLOYEE','PSSSF_EMPLOYEE')),
    'activeRuleCodes', coalesce(jsonb_agg(rule_code ORDER BY rule_code), '[]'::jsonb),
    'missingRuleCodes', to_jsonb(array_remove(ARRAY[
      CASE WHEN bool_or(rule_code = 'TZ_PAYE') THEN NULL ELSE 'TZ_PAYE' END,
      CASE WHEN bool_or(rule_code IN ('NSSF_EMPLOYEE','PSSSF_EMPLOYEE')) THEN NULL ELSE 'NSSF_EMPLOYEE or PSSSF_EMPLOYEE' END,
      CASE WHEN bool_or(rule_code IN ('NSSF_EMPLOYER','PSSSF_EMPLOYER')) THEN NULL ELSE 'NSSF_EMPLOYER or PSSSF_EMPLOYER' END,
      CASE WHEN bool_or(rule_code = 'WCF_EMPLOYER') THEN NULL ELSE 'WCF_EMPLOYER (confirm current tariff)' END,
      CASE WHEN bool_or(rule_code = 'SDL_EMPLOYER') THEN NULL ELSE 'SDL_EMPLOYER (if employer is liable)' END
    ], NULL))
  )
  FROM public.hr_statutory_rules
  WHERE company_id = p_company_id AND status = 'Active' AND effective_from <= p_on_date AND (effective_to IS NULL OR effective_to >= p_on_date);
$$;

CREATE OR REPLACE FUNCTION public.hr_apply_tanzania_payroll_item_calculation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start date;
  v_period_end date;
  v_calculation jsonb;
BEGIN
  SELECT period_start, period_end INTO v_period_start, v_period_end
  FROM public.hr_payroll_runs
  WHERE id = NEW.payroll_run_id AND company_id = NEW.company_id;
  IF v_period_start IS NULL OR v_period_end IS NULL THEN
    RAISE EXCEPTION 'Payroll run period could not be resolved for item calculation.' USING ERRCODE = 'P0002';
  END IF;
  v_calculation := public.hr_calculate_tanzania_payroll(NEW.company_id, NEW.gross_pay, v_period_start, v_period_end);
  NEW.taxable_pay := coalesce((v_calculation->>'taxablePay')::numeric, 0);
  NEW.deductions := coalesce((v_calculation->>'employeeDeductions')::numeric, 0);
  NEW.net_pay := coalesce((v_calculation->>'netPay')::numeric, 0);
  NEW.employer_contributions := coalesce((v_calculation->>'employerContributions')::numeric, 0);
  NEW.employer_cost := coalesce((v_calculation->>'employerCost')::numeric, NEW.gross_pay);
  NEW.data := coalesce(NEW.data, '{}'::jsonb) || jsonb_build_object('statutoryBreakdown', v_calculation);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hr_apply_tanzania_payroll_item_calculation ON public.hr_payroll_items;
CREATE TRIGGER hr_apply_tanzania_payroll_item_calculation
  BEFORE INSERT OR UPDATE OF gross_pay, payroll_run_id ON public.hr_payroll_items
  FOR EACH ROW EXECUTE FUNCTION public.hr_apply_tanzania_payroll_item_calculation();

-- Restrict the new calculation helpers to the payroll procedure and authenticated callers.
REVOKE EXECUTE ON FUNCTION public.tz_paye_monthly(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.tanzania_payroll_preview(numeric,numeric,numeric,numeric,numeric,integer,integer,boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hr_calculate_tanzania_payroll(uuid,numeric,date,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hr_payroll_configuration_status(uuid,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hr_apply_tanzania_payroll_item_calculation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tz_paye_monthly(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tanzania_payroll_preview(numeric,numeric,numeric,numeric,numeric,integer,integer,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_payroll_configuration_status(uuid,date) TO authenticated;

COMMIT;
