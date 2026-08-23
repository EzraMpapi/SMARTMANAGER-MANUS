-- Ensure payroll readiness is a strict boolean even when no statutory rows exist.
BEGIN;

CREATE OR REPLACE FUNCTION public.hr_payroll_configuration_status(p_company_id uuid, p_on_date date DEFAULT current_date)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'ready', coalesce(bool_or(rule_code = 'TZ_PAYE'), false) AND coalesce(bool_or(rule_code IN ('NSSF_EMPLOYEE','PSSSF_EMPLOYEE')), false),
    'activeRuleCodes', coalesce(jsonb_agg(rule_code ORDER BY rule_code), '[]'::jsonb),
    'missingRuleCodes', to_jsonb(array_remove(ARRAY[
      CASE WHEN coalesce(bool_or(rule_code = 'TZ_PAYE'), false) THEN NULL ELSE 'TZ_PAYE' END,
      CASE WHEN coalesce(bool_or(rule_code IN ('NSSF_EMPLOYEE','PSSSF_EMPLOYEE')), false) THEN NULL ELSE 'NSSF_EMPLOYEE or PSSSF_EMPLOYEE' END,
      CASE WHEN coalesce(bool_or(rule_code IN ('NSSF_EMPLOYER','PSSSF_EMPLOYER')), false) THEN NULL ELSE 'NSSF_EMPLOYER or PSSSF_EMPLOYER' END,
      CASE WHEN coalesce(bool_or(rule_code = 'WCF_EMPLOYER'), false) THEN NULL ELSE 'WCF_EMPLOYER (confirm current tariff)' END,
      CASE WHEN coalesce(bool_or(rule_code = 'SDL_EMPLOYER'), false) THEN NULL ELSE 'SDL_EMPLOYER (if employer is liable)' END
    ], NULL))
  )
  FROM public.hr_statutory_rules
  WHERE company_id = p_company_id AND status = 'Active' AND effective_from <= p_on_date AND (effective_to IS NULL OR effective_to >= p_on_date);
$$;

REVOKE EXECUTE ON FUNCTION public.hr_payroll_configuration_status(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_payroll_configuration_status(uuid,date) TO authenticated;

COMMIT;
