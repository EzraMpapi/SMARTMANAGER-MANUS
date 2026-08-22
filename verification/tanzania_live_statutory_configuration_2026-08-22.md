# Tanzania Live Statutory Configuration

> **Tax compliance notice.** I’m an AI, not a tax professional — verify anything consequential with a CPA or tax professional before filing, remitting, or relying on a payroll run.

**Configured on:** 22 August 2026  
**Tenant profile used:** Tanzania, TZS, `Africa/Dar_es_Salaam`; private **Auto / Parts** category; currently zero active employee records.

## Active effective-dated rules

| Rule code | Applies to | Rate | Effective from | Configuration purpose |
| --- | ---: | ---: | --- | --- |
| `TZ_PAYE` | Employee | Progressive bracket function | 22 Aug 2026 | Tanzania Mainland monthly PAYE, using the verified TRA bracket engine. |
| `NSSF_EMPLOYEE` | Employee | 10.0% | 22 Aug 2026 | Employee pension contribution, deducted before PAYE. |
| `NSSF_EMPLOYER` | Employer | 10.0% | 22 Aug 2026 | Employer-side share of the configured 20% joint NSSF contribution. |
| `WCF_EMPLOYER` | Employer | 0.5% | 22 Aug 2026 | Working employer WCF tariff for the private Auto / Parts context. |
| `SDL_EMPLOYER` | Employer | 3.5% | 22 Aug 2026 | Employer SDL, automatically gated to ten or more active employees and marked non-exempt. |

All rows were inserted through the authenticated `statutory_rule.save` workflow, which creates audit entries. Supporting source links and configuration notes are stored in the rules’ `data` field.

## Live verification

The tenant’s payroll readiness function returned `ready: true` with all five active rule codes. No payroll records were created as part of this validation.

| Scenario | Gross pay | Employee pension | PAYE | Net pay | Employer pension | WCF | SDL | Employer cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Current tenant context: 0 active employees | TZS 1,000,000 | TZS 100,000 | TZS 103,000 | TZS 797,000 | TZS 100,000 | TZS 5,000 | TZS 0 | TZS 1,105,000 |
| Ten-employee liability scenario | TZS 1,000,000 | TZS 100,000 | TZS 103,000 | TZS 797,000 | TZS 100,000 | TZS 5,000 | TZS 35,000 | TZS 1,140,000 |

## Required control before the first remittance

The `WCF_EMPLOYER` row has been created at **0.5%** as a working private-sector tariff and is marked `reviewRequired: true`. Before the first actual remittance, a payroll owner must confirm the employer’s current WCF tariff notice and amend the effective-dated rule if it differs. The payroll owner must also confirm that NSSF, rather than PSSSF or another applicable scheme, is the correct pension fund for every enrolled employee.

SDL is active but will calculate as zero until the tenant has at least ten active employee records. The payroll owner must review exemption status if the employer becomes subject to a statutory exemption.

## References

[1]: https://www.tra.go.tz/page/income-tax-for-individuals "Tanzania Revenue Authority — Income Tax for Individuals"
[2]: https://www.tra.go.tz/calculators/paye "Tanzania Revenue Authority — PAYE Calculator"
[3]: https://www.nssf.go.tz/pages/rate-of-contributions "National Social Security Fund — Rate of Contributions"
[4]: https://www.tra.go.tz/page/skills-development-levy-sdl "Tanzania Revenue Authority — Skills Development Levy"
[5]: https://portal.wcf.go.tz/ "Workers Compensation Fund Tanzania — Portal"
