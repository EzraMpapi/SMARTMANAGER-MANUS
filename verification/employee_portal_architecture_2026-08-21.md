# Employee Portal Architecture and Migration Plan

## Design objective

The Employee Portal will use the existing Smart Manager tenant boundary while adding a durable association between an authenticated profile and an employee record. All sensitive writes will be performed by audited database procedures. The client will show data only after a confirmed response and will not use browser storage as an authoritative source for invitations, employment identity, approvals, payroll, or attendance.

## Canonical data model

| Domain | Canonical record | Purpose and key relationships |
| --- | --- | --- |
| Identity and organization | `hr_employees`, `departments`, `hr_positions` | `hr_employees.profile_id` links the authenticated profile to one employee within a tenant. An employee belongs to an optional department, position, manager, and branch. |
| Lifecycle | `hr_onboarding_cases`, `hr_onboarding_tasks`, `hr_offboarding_cases` | Tracks employee invitation, activation, onboarding checklist, offboarding closure, ownership, due dates, and final state. |
| Time | `hr_shifts`, `hr_shift_assignments`, `hr_holidays`, `hr_attendance`, `hr_timesheets`, `hr_timesheet_entries` | Stores schedules, local public holidays, attendance events, time entries, approval state, and payroll-ready totals. |
| Leave | `hr_leave_policies`, `hr_leave_balances`, `hr_leave_requests` | Stores entitlement configuration, employee balance by period, and approval-controlled leave requests. |
| Payroll | `hr_statutory_rules`, `hr_payroll_runs`, `hr_payroll_items`, `hr_payslips` | Creates configurable Tanzania/TZS rule sets by effective date, approved payroll runs, line-level pay calculations, and issued payslips. |
| Compensation and spend | `hr_benefit_plans`, `hr_benefit_enrollments`, `hr_expense_claims` | Connects compensation benefits and reimbursement claims to HR, Finance, and payroll workflows. |
| Performance and learning | `hr_performance_reviews`, `hr_goals`, `hr_goal_updates`, `hr_training_courses`, `hr_training_assignments` | Supports employee-owned goals, manager feedback, KPI progress, mandatory learning, training completion, and review cycles. |
| Documents and communications | `hr_employee_documents`, `hr_announcements`, `hr_announcement_reads`, `hr_service_requests`, `hr_notifications` | Stores references to uploaded documents, targeted announcements, internal requests, read receipts, and in-product notifications. |
| Governance | `hr_approval_requests`, `hr_approval_steps`, `audit_log` | Tracks multi-step decisions with an actor, owner, current state, decision notes, and immutable audit context. |

## Permission model

| Actor | Allowed self-service actions | Manager and HR authority | Restricted data |
| --- | --- | --- | --- |
| Employee | View own profile, attendance, shifts, leave balance, timesheets, payslips, benefits, goals, learning, documents, notifications, and requests. Submit permitted requests and update non-sensitive profile fields. | None unless separately assigned a management role. | Other employees’ salary, personal records, attendance, payroll, and documents. |
| Manager | Employee actions plus view direct reports, review timesheets, leave, expenses, goals, assigned training, and performance items for direct reports. | Can approve or return configured direct-report workflows, but cannot publish payroll or alter statutory rules. | Payroll data and employees outside the manager chain unless another role grants access. |
| HR Manager | Full HR operational view and lifecycle management. | Can create employees, departments, positions, policies, onboarding/offboarding, documents, approvals, and performance cycles. | Payroll posting and finance integration remain subject to finance controls. |
| Finance Manager/CFO | Own employment data plus payroll and expense finance controls. | Can approve, post, and export payroll, configure pay-related rule sets, and link expense claims to Finance. | Unrelated employee health or sensitive document data unless separately granted. |
| Organization Owner/CEO/Super Administrator | Tenant-wide access. | May approve escalations, configure security-sensitive policies, and review all audits. | None within the tenant, subject to future data-classification restrictions. |

## Enforcement model

The migration will establish a `profile_id` link on `hr_employees`, typed foreign keys and indexes for portal records, helper functions for the current employee and management scope, and secure database procedures for employee self-service and manager approvals. Direct browser writes to sensitive HR tables will be denied to ordinary staff. Row-level security will preserve the existing `current_company_id()` tenant boundary and add self, management-chain, HR, and finance predicates.

Every procedure will append a structured event to `audit_log`, create a targeted notification when a user must act, and return the persisted record that the UI will render. The portal will use the same procedure boundary for onboarding, leave, timesheets, expense claims, goal updates, approvals, attendance, payroll publishing, training updates, internal requests, documents, and announcements.

## Tanzania-ready configuration

The portal will default new payroll and policy records to `TZS` and `Africa/Dar_es_Salaam`. Statutory and payroll components will be stored as effective-dated, configurable rule records rather than hard-coded deductions. The payroll UI will show a configuration status and the configured basis for each calculation so an organization can maintain its own approved rates, funds, and thresholds.

Local dates will be stored as date values where business rules depend on calendar days, while auditable event timestamps will be stored as UTC timestamps and displayed in the configured tenant timezone. Public holidays will be configurable per company and location, allowing organizations to maintain Tanzania statutory holidays and company-specific closures without embedding a static legal calendar in the client.

## Cross-module integration contracts

| Existing module | Portal integration |
| --- | --- |
| Finance | Expense claims are converted to Finance-ready payable references only after approval. Payroll posting creates a finance linkage reference rather than an untracked browser calculation. |
| Attendance and POS | Shift and attendance data can be used by payroll. POS workforce data remains visible only through approved role boundaries. |
| Healthcare | Employee benefit and wellness document links can point to healthcare records without exposing medical data by default. |
| Microfinance and Banking | Employee loan and savings references can be represented as approved payroll deductions only through an explicit integration record. |
| Pharmacy | Assigned health benefits or reimbursements can link to approved claims without exposing pharmacy transaction details to non-authorized roles. |
| Documents and Collaboration | Employee documents use durable storage references, and announcements or approval tasks can generate internal notifications. |
| Reporting and Audit | Operational counts, approvals, payroll states, leave trends, training compliance, and full history derive from persisted portal records. |

## Implementation approach

The migration will be additive and idempotent. It will preserve current generic HR tables while adding typed columns and related normalized records. A modular `EmployeePortalWorkspace` client component will replace the monolithic browser-local portal flow. It will consume a secure portal snapshot procedure and execute named workflow actions against a server-controlled procedure boundary. This reduces surface-area risk while preserving the existing Smart Manager visual language, navigation shell, live data conventions, and tenant-aware authentication.
