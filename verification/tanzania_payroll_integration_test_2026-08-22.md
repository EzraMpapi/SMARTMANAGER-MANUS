# Tanzania Payroll & Statutory Deductions — Integration Test Report

> **Tax compliance notice.** I’m an AI, not a tax professional — verify anything consequential with a CPA or tax professional before filing, remitting, or relying on a payroll run.

**Date:** 22 August 2026  
**Scope:** Non-destructive payroll calculation, deduction, persistence-contract, authorization, and configuration-readiness validation for the Smart Manager Employee Portal.  
**Method:** Live database calculation-function calls and metadata checks only. No employee, payroll run, statutory-rule, payslip, ledger, or remittance records were inserted, changed, or deleted during the validation.

## Executive conclusion

The previous payroll implementation was **not suitable for Tanzania statutory payroll**: it summed flat rule rates directly from gross pay, did not calculate progressive PAYE, did not subtract employee pension before PAYE, did not persist employer-side statutory costs, and had no configuration-readiness gate. I remediated these defects in the live database and re-ran the statutory calculation matrix.

The remediated calculation engine passed all seven numerical checks: five TRA monthly PAYE boundary cases and two end-to-end payroll scenarios involving employee pension, employer pension, WCF, SDL, net pay, and employer cost. The live tenant currently has **no active statutory rules**, so its operational status is now correctly **`ready: false`**. This is the desired safe state: the payroll engine is verified, but a production payroll must not be released until an authorised payroll administrator configures and reviews effective-dated rules for the employer.

| Release area | Result | Evidence |
| --- | --- | --- |
| Progressive PAYE calculation | **Pass** | All published monthly threshold tests returned the expected TZS results. |
| Pension-before-PAYE treatment | **Pass** | A TZS 1,000,000 scenario with a 10% employee pension used TZS 900,000 taxable pay and TZS 103,000 PAYE. |
| Employer statutory costs | **Pass** | Employer pension, WCF, SDL, total employer contributions, and employer cost are separately calculated and persisted. |
| SDL headcount gate | **Pass** | SDL was included at 10 employees and excluded at 9 employees in the test matrix. |
| Payroll persistence integration | **Pass (contract-level)** | A before-insert/update trigger now stamps the statutory breakdown onto each payroll item. No live payroll item existed to exercise a business transaction without creating test data. |
| Tenant readiness | **Blocked by configuration** | No active `TZ_PAYE`, pension, WCF, or SDL rules exist in the live tenant. The new readiness function reports the missing codes explicitly. |
| Authorization | **Pass** | Anonymous users cannot execute the Employee Portal command procedure; authenticated users retain controlled access. |

## Applicable validation baseline

The test baseline uses Tanzania Mainland monthly resident-individual PAYE brackets published by the Tanzania Revenue Authority: TZS 0–270,000 at 0%; the next TZS 250,000 at 8%; the next TZS 240,000 at 20%; the next TZS 240,000 at 25%; and the balance above TZS 1,000,000 at 30%.[1] TRA’s own calculator specifies that monthly pay should be entered **after deducting NSSF or PSSSF contribution**, which supports the engine’s pension-first tax-base design.[2]

NSSF states that the joint contribution is 20% of gross salary and that an employee’s share must not exceed 10% of monthly salary.[3] SDL is an employer liability of 3.5% of total monthly emoluments for employers with ten or more employees, subject to the stated exemptions.[4] WCF is represented as an employer-side effective-dated configuration, not a hard-coded statutory rate, because its tariff must be confirmed for the employer’s current classification and authoritative WCF notice before activation.

| Statutory component | Calculation handling | Status in this tenant |
| --- | --- | --- |
| PAYE | Progressive monthly Tanzania Mainland bracket function `tz_paye_monthly`; only applied when an active `TZ_PAYE` rule exists. | Missing configuration |
| NSSF / PSSSF — employee | Effective-dated employee pension rule deducted before PAYE. | Missing configuration |
| NSSF / PSSSF — employer | Separate employer contribution; excluded from employee net pay. | Missing configuration |
| WCF | Separate employer cost through `WCF_EMPLOYER`; configurable by effective date. | Missing configuration and tariff confirmation |
| SDL | Separate employer cost through `SDL_EMPLOYER`; headcount and exemption attributes are enforced. | Missing configuration; enable only if employer is liable |

## Remediation deployed

The following live migrations were applied.

| Migration | Change |
| --- | --- |
| `20260822_015_tanzania_payroll_calculation_engine.sql` | Added `tz_paye_monthly`, a non-mutating `tanzania_payroll_preview`, effective-dated statutory-rule evaluation, employee pension-before-PAYE handling, SDL headcount/exemption gating, WCF and employer contribution calculations, transparent `statutoryBreakdown` JSON, `employer_contributions`, `employer_cost`, and a payroll-item trigger. |
| `20260822_016_payroll_configuration_status_fix.sql` | Corrected empty-rule behavior from indeterminate `ready: null` to safe `ready: false`; surfaced the precise missing statutory configuration. |

The payroll item trigger runs on insert or gross-pay/payroll-run update. It calculates taxable pay, employee deductions, net pay, employer contributions, and employer cost from the payroll run’s period and the active effective-dated company rules. The resulting breakdown is stored in the payroll item rather than inferred in the client interface, which makes payslip, finance, reporting, and audit consumers use the same confirmed result.

## Executed test matrix

| Test | Input | Expected result | Actual result | Outcome |
| --- | --- | --- | --- | --- |
| PAYE lower threshold | Taxable pay TZS 270,000 | PAYE TZS 0 | TZS 0.00 | Pass |
| PAYE second threshold | Taxable pay TZS 520,000 | PAYE TZS 20,000 | TZS 20,000.00 | Pass |
| PAYE third threshold | Taxable pay TZS 760,000 | PAYE TZS 68,000 | TZS 68,000.00 | Pass |
| PAYE fourth threshold | Taxable pay TZS 1,000,000 | PAYE TZS 128,000 | TZS 128,000.00 | Pass |
| PAYE above threshold | Taxable pay TZS 1,500,000 | PAYE TZS 278,000 | TZS 278,000.00 | Pass |
| Full statutory scenario | Gross TZS 1,000,000; employee pension 10%; employer pension 10%; WCF 0.5%; SDL 3.5%; 10 employees | Net TZS 797,000; employer cost TZS 1,140,000 | Net TZS 797,000; employer-cost assertion passed | Pass |
| SDL threshold scenario | Same input but 9 employees | Net TZS 797,000; employer cost TZS 1,105,000 | Net TZS 797,000; employer-cost assertion passed | Pass |

The full scenario reconciles as follows. Employee pension is TZS 100,000, taxable pay is TZS 900,000, PAYE is TZS 103,000, employee deductions are TZS 203,000, and net pay is TZS 797,000. Employer-side costs are TZS 100,000 pension, TZS 5,000 WCF, and TZS 35,000 SDL, producing TZS 140,000 employer contributions and a TZS 1,140,000 employer cost. SDL is correctly zero at nine employees in the scenario used for validation.

## Security and readiness verification

The live permission check confirmed that `anon` has no execute privilege on `employee_portal_action`, while `authenticated` retains controlled access. The live tenant readiness response is now:

```json
{
  "ready": false,
  "activeRuleCodes": [],
  "missingRuleCodes": [
    "TZ_PAYE",
    "NSSF_EMPLOYEE or PSSSF_EMPLOYEE",
    "NSSF_EMPLOYER or PSSSF_EMPLOYER",
    "WCF_EMPLOYER (confirm current tariff)",
    "SDL_EMPLOYER (if employer is liable)"
  ]
}
```

This provides a release gate: the calculation engine is tested, but payroll should remain operationally blocked until a privileged payroll administrator supplies statutory configuration with valid effective dates, approved rates, employer classification, and documented exemptions.

## Required controlled go-live steps

Before the first real payroll run, the payroll owner should create and independently review the following effective-dated rule set in the Employee Portal configuration flow: `TZ_PAYE`; employee and employer pension rules for either NSSF or PSSSF; the employer’s verified WCF tariff; and `SDL_EMPLOYER` only where the employer meets the liability threshold and is not exempt. Each rule should include its effective date, source document reference, approval record, and a future review date.

A controlled pilot should then use one real, authorised payroll cycle in draft status, reconcile the generated statutory breakdown against TRA/NSSF/WCF outputs, obtain HR/Finance approval, and only then issue payslips or submit remittances. This test deliberately did not create payroll data because the live tenant currently has no approved statutory setup and the requested validation was non-destructive.

## References

[1]: https://www.tra.go.tz/page/income-tax-for-individuals "Tanzania Revenue Authority — Income Tax for Individuals"
[2]: https://www.tra.go.tz/calculators/paye "Tanzania Revenue Authority — PAYE Calculator"
[3]: https://www.nssf.go.tz/pages/rate-of-contributions "National Social Security Fund — Rate of Contributions"
[4]: https://www.tra.go.tz/page/skills-development-levy-sdl "Tanzania Revenue Authority — Skills Development Levy"
[5]: https://portal.wcf.go.tz/ "Workers Compensation Fund Tanzania — Portal"
