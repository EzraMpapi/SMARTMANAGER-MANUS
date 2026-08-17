# Human Resources Workspace — Confirmed People-Operations Persistence Upgrade

## Scope and Priority

Human Resources was selected after Procurement because employee status, team roster data, leave approvals, payroll context, and access decisions are operationally sensitive. The review focused on preventing the configured workspace from presenting an employee or leave decision as saved when the tenant-scoped server write had failed.

## Verified Defects and Repair

| Workflow | Previous behavior | Repair |
| --- | --- | --- |
| Create employee | A local employee appeared and the form closed before the server insert returned. | The roster now receives only the canonical returned employee row. A failed form remains open with its entered values available for retry. |
| Employee status change | Status changed locally before the server update. | The displayed status changes only after a confirmed returned employee row; a failure preserves the current state. |
| Remove employee | The employee disappeared locally before server deletion was confirmed. | The roster and detail panel remain until the delete returns successfully; a failed deletion preserves context. |
| Leave approval/rejection | Leave status changed locally before the server response. | The leave table changes only after confirmed status update; failures leave the request unchanged. |
| In-flight controls | Employee form and detail actions could be repeated while saving. | Employee creation, status change, and removal now have in-flight safeguards that retain retry context. |
| On-leave metric context | The current employee-status count was labeled `This period`. | The KPI now accurately describes the value as `Current status`. |

## Validation

Focused Human Resources persistence contracts passed with **1 file / 2 tests**, covering confirmed mutation ordering, failure preservation, and duplicate-submit prevention. Static TypeScript validation also passed. The complete suite passed with **94 files / 306 tests**, alongside 5 intentionally gated files and 8 skips. The bounded-heap production build passed with 2,653 modules transformed. Authenticated non-destructive browser acceptance remains in the final validation phase.

No employee, leave request, attendance row, candidate, performance review, training assignment, benefit enrollment, payroll record, RLS policy, credential, provider configuration, or Resend setting changed during this repair.
