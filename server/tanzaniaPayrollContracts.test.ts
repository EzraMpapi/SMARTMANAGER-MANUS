import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const engine = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql"), "utf8");
const readinessFix = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_016_payroll_configuration_status_fix.sql"), "utf8");

describe("Tanzania payroll and statutory deduction contracts", () => {
  it("implements the published monthly PAYE thresholds and marginal calculations", () => {
    for (const expectedClause of [
      "<= 270000 THEN 0",
      "<= 520000 THEN (greatest(p_taxable_pay, 0) - 270000) * 0.08",
      "<= 760000 THEN 20000 + (greatest(p_taxable_pay, 0) - 520000) * 0.20",
      "<= 1000000 THEN 68000 + (greatest(p_taxable_pay, 0) - 760000) * 0.25",
      "ELSE 128000 + (greatest(p_taxable_pay, 0) - 1000000) * 0.30"
    ]) expect(engine).toContain(expectedClause);
  });

  it("calculates employee deductions before PAYE, preserves employer costs, and applies SDL only when the configured headcount condition is met", () => {
    expect(engine).toContain("v_taxable := greatest(v_gross - v_employee_pension, 0)");
    expect(engine).toContain("v_paye := public.tz_paye_monthly(v_taxable)");
    expect(engine).toContain("coalesce(p_employee_count, 0) < coalesce(p_sdl_minimum_headcount, 10)");
    expect(engine).toContain("ADD COLUMN IF NOT EXISTS employer_contributions");
    expect(engine).toContain("ADD COLUMN IF NOT EXISTS employer_cost");
    expect(engine).toContain("hr_apply_tanzania_payroll_item_calculation");
    expect(engine).toContain("'statutoryBreakdown', v_calculation");
  });

  it("requires an effective-dated PAYE and pension configuration and reports empty configuration as not ready", () => {
    expect(engine).toContain("effective_from <= p_period_end");
    expect(engine).toContain("effective_to IS NULL OR effective_to >= p_period_start");
    expect(readinessFix).toContain("'ready', coalesce(bool_or(rule_code = 'TZ_PAYE'), false)");
    expect(readinessFix).toContain("NSSF_EMPLOYEE or PSSSF_EMPLOYEE");
  });

  it("does not expose calculation helpers to anonymous callers", () => {
    for (const procedure of [
      "tz_paye_monthly(numeric)",
      "tanzania_payroll_preview(numeric,numeric,numeric,numeric,numeric,integer,integer,boolean)",
      "hr_calculate_tanzania_payroll(uuid,numeric,date,date)"
    ]) expect(engine).toContain(`REVOKE EXECUTE ON FUNCTION public.${procedure} FROM PUBLIC, anon`);
  });
});
