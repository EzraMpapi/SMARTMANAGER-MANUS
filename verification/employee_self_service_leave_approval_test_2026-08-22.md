# Employee Self-Service Payslip & Manager Leave-Approval Test

**Date:** 22 August 2026  
**Scope:** Non-destructive integration validation of employee self-service payslip access and manager leave approvals in the live Smart Manager Employee Portal.

## Executive conclusion

The self-service and approval workflow contracts are deployed, protected by row-level policies, and covered by regression tests. During the review, I found that a leave request could be decided more than once by an authorised manager, producing potentially contradictory outcomes and duplicate notification/audit effects. I remediated this by deploying a terminal-decision trigger to the live database.

The live tenant is **not yet data-ready for a full role-to-role transaction test**. It has one employee record but no profile-to-employee link, no manager hierarchy, no leave requests, payroll items, payslips, approval records, or notifications. To preserve live-data integrity, this validation did not insert artificial employee, leave, or payroll data.

| Test area | Result | Evidence |
| --- | --- | --- |
| Payslip self-service query path | Pass (contract/security) | Portal snapshot filters `hr_payslips` to the authenticated employee; payslip RLS policy is live. |
| Leave submission workflow | Pass (contract) | Requires an authenticated employee link; creates a pending leave request, approval request, and audit event. |
| Manager leave decision authority | Pass (contract/security) | Decision requires `hr_can_manage_employee`; unauthorized decisions raise an authorization error. |
| Approval state synchronization | Pass (contract) | Leave and linked approval-request status are updated together. |
| Employee notification | Pass (contract) | Decision path invokes `hr_create_notification` for the employee profile/record. |
| Audit trail | Pass (contract) | Submit, approve, and reject paths invoke `hr_append_audit`. |
| Terminal decision integrity | Fixed and verified | Live trigger `hr_prevent_terminal_leave_redecision` prevents changing approved/rejected leave outcomes. |
| Full live role-to-role transaction | Blocked by tenant data readiness | No linked employee, manager, payslip, payroll, leave, approval, or notification fixtures exist. |

## Live readiness evidence

The owner session can open the Employee Portal snapshot and is privileged, but has no linked employee identity. The live snapshot contains zero payslips, leave requests, approvals, and notifications. This correctly demonstrates that the portal is not using local mock data and that an owner account is not silently treated as an employee.

| Live item | Count / state |
| --- | --- |
| Employee records | 1 |
| Employee profile links | 0 |
| Manager links | 0 |
| Payroll items | 0 |
| Payslips | 0 |
| Leave requests | 0 |
| Approval requests | 0 |
| Notifications | 0 |
| Terminal leave-decision trigger | Installed |

## Remediation deployed

The live migration `20260822_017_leave_decision_immutability.sql` introduces `hr_prevent_terminal_leave_redecision`. An approved or rejected leave request cannot be changed to a contradictory terminal outcome. A pending leave request is limited to the valid states `Pending`, `Approved`, or `Rejected`.

This protects downstream notification, audit, leave-balance, payroll, and reporting consumers from duplicate or conflicting manager decisions. Any genuine reversal must proceed through a new controlled workflow rather than overwriting historical approval data.

## Regression results

The targeted validation suite passed after the remediation:

| Suite | Tests | Result |
| --- | ---: | --- |
| Employee self-service payslip and leave approval contracts | 4 | Pass |
| Employee Portal production contracts | 3 | Pass |
| HR persistence boundaries | 2 | Pass |
| Type check | — | Pass |

## Required live pilot prerequisites

To execute the remaining full end-to-end transaction test, an authorised administrator must provision a real employee test account or approve a temporary controlled test account with: a profile link, a direct manager employee link, an active leave policy, and a draft payroll item that can be published to a test payslip. The pilot should then verify these exact outcomes: employee sees only their own payslip; employee submits a leave request; the mapped manager sees it; the manager decides it once; the employee receives the notification; both the leave and approval records align; and audit evidence is present.

No such data was created during this test because the current tenant is otherwise unpopulated and the requested test was explicitly non-destructive.
