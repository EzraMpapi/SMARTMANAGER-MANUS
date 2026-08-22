# Employee Portal Audit Findings

## Scope and project match

The deployed Smart Manager workspace matches the cloned `EzraMpapi/SMARTMANAGER-MANUS` source snapshot. The application is a React/Vite workspace with a single authenticated ERP surface in `client/src/BusinessSphereDashboard.jsx`, an existing Supabase-backed persistence layer, and supporting TypeScript server utilities and tests. The live database project is active and exposes tenant-scoped Human Resources, documents, notifications, approval, audit, finance, healthcare, microfinance, pharmacy, and related ERP tables.

## Existing delivery surface

The current workspace already routes `employee-portal` to an `EmployeePortal` component and has HR pages for employees, timetables, recruitment, attendance, performance, training, leave, benefits, and payroll. The existing UI retains the Smart Manager system language: white data-workspace surfaces, emerald primary actions, navy operational headers, gold executive accents, compact tab navigation, drawer-based records, and responsive tables.

| Area | Existing implementation | Audit finding |
| --- | --- | --- |
| Employee records | Creates, updates, and deletes `hr_employees` with confirmed Supabase responses in live mode. | A sound persistence pattern exists, but the employee data contract is still a generic envelope rather than a complete employee identity and lifecycle model. |
| HR manager workspace | Covers roster, timetable, recruitment, attendance, performance, training, leave, benefits, and payroll tabs. | It is useful as an administrative starting point but needs normalized lifecycle, approval, reporting, and cross-module workflow integration. |
| Employee self-service | Provides portal tabs for attendance, duties, leave, expenses, training, team, noticeboard, payslip, and profile. | The component is monolithic and several critical actions are browser-only or lack server confirmation. |
| Authentication and roles | Uses Supabase Auth, `profiles`, and `company_memberships`; client role catalog includes a dedicated `Employee` role. | The client can hide navigation but current portal identity is derived by matching display names rather than a secure user-to-employee relationship. |
| Tenant isolation | All reviewed HR tables have RLS enabled and tenant-scoped `ALL` policies using `current_company_id()`. | Tenant isolation is present, but the existing policies do not restrict an employee to their own record, nor separate manager/HR approval rights from ordinary staff. |
| Auditing | `audit_log` exists with tenant policy and an application helper. | Many portal actions rely on local messages or unconfirmed direct writes instead of a complete, trusted audit event trail. |
| Payroll and payslips | Payroll runs table exists and an in-browser payslip generator is available. | Payslip figures use hard-coded browser calculations and are not linked to a confirmed payroll run, deductions configuration, or persisted payslip document. |
| Attendance and biometrics | Attendance table exists; the portal supports clock in/out and a device-local WebAuthn attempt. | Biometric enrollment is stored in browser local storage and therefore is not a server-verified attendance proof. Attendance writes also ignore server errors in the portal path. |
| Invite/onboarding | HR can generate a code and the portal offers a join screen. | Codes and join state are read or written through local storage; this is not a secure, tenant-scoped onboarding workflow. |

## Live database findings

The live database provides generic tenant-scoped envelopes for `hr_employees`, `hr_attendance`, `hr_leave_requests`, `hr_payroll_runs`, `hr_benefits`, `hr_duties`, `hr_performance_reviews`, `hr_invite_codes`, `documents`, `notification_log`, `approval_signatures`, `departments`, and `audit_log`. Generic envelopes permit safe incremental extension but cannot on their own guarantee employee ownership, approval state transitions, payroll integrity, or document access boundaries.

The identity model provides `profiles` and `company_memberships`. `company_memberships` grants an authenticated user membership in a company with a role, and profile reads are scoped to the signed-in person or active tenant. The reviewed HR policies, however, allow every authenticated tenant member to perform all operations on all HR tables. The implementation must add narrowly scoped policies and server-side functions that use the authenticated user identity and membership role to enforce self-service, manager, HR, finance, and administrator boundaries.

## Critical remediation priorities

The implementation will replace display-name matching with a durable `profile_id`/employee association, move all sensitive state transitions to server-side SQL functions with audit writes, and configure RLS so employees can access only their entitled data while approvers can act only within permitted roles and departments. It will retain the existing tenant filter as the outer security boundary.

The new portal will use persisted requests, approval records, notifications, documents, payroll results, and audit events. It will not describe a client-local credential as a cryptographic proof. Attendance will record device and location claims only as policy-controlled metadata; a future biometric integration can be supported by a server-verified credential service rather than local storage.

Tanzania readiness will be modeled through configurable TZS payroll and statutory rule sets with effective dates, pay periods, leave policies, public holidays, and local timezone settings. No statutory deduction will be hard-coded as a legal assertion in the client. Payroll preview, approval, posting, and payslip access will be tied to stored payroll run data and governed by role-specific permissions.

## Baseline verification

The targeted existing HR persistence test suite passed: `server/hrPersistenceBoundaries.test.ts` reported two passing tests. A full suite attempt uncovered sixteen unrelated failures in service tests that require absent runtime Supabase configuration; those failures predate this Employee Portal implementation and will be rechecked in the final regression pass with the appropriate configured environment.
