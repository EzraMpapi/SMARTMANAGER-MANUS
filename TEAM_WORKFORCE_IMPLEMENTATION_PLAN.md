# SMART MANAGER Team & Workforce Management Center

**Prepared by:** Manus AI
**Scope:** Architecture review and safe implementation plan based on the attached Team & Workforce specification.
**Current status:** Discovery and gap analysis complete. No application source, database migration, authentication configuration, or production data was changed for this review.

## Executive architecture decision

The attached specification should not be implemented by replacing the existing Settings page, rewriting the authentication layer, or creating a second disconnected employee system. SMART MANAGER already has a persistent HR/Employee Portal foundation, a secure invitation service, verified profile resolution, role-change approval workflows, onboarding cases/tasks, employee documents, and server-backed portal actions. The correct approach is an **additive Team & Workforce Center** that first reuses these systems, then introduces typed workforce access-control tables behind protected server procedures.

The most important design decision is to preserve the separation between identity and authorization:

> Supabase Auth remains the identity provider; `profiles` and the verified workspace profile remain the tenant identity boundary; HR tables describe the employee; new workforce tables describe authorization, organization structure, onboarding, and administrative security evidence.

The current client-side role model and `company_modules` toggles should remain compatibility inputs during migration, but they must not become the long-term authorization authority. Sensitive actions must be authorized in the backend and, where applicable, in PostgreSQL RLS or protected RPCs.

## Verified capabilities already present

| Area | Existing implementation | Decision |
|---|---|---|
| Workspace identity | `profiles`, `company_memberships`, `companies`, and `resolveVerifiedProfile` establish the authenticated user and company boundary. | Reuse as the identity source. Never trust a client-supplied company ID or actor. |
| Employee record | `hr_employees` already has typed additions for `profile_id`, `department_id`, `position_id`, `manager_employee_id`, employee number, employment dates, and Tanzania timezone. | Extend additively; do not create a competing employee master. |
| Organization references | Generic `departments` exists; `hr_positions` exists with company scope. | Reuse these tables and add divisions/teams only where absent. |
| Employee portal | `employee_portal_snapshot()` and `employee_portal_action(text,jsonb)` provide protected read and command boundaries. | Preserve and extend through new versioned actions or dedicated workforce RPCs. |
| Onboarding | `hr_onboarding_cases` and `hr_onboarding_tasks` persist onboarding state. | Add typed checklist keys and progress calculation rather than a second onboarding table. |
| Documents | `hr_employee_documents` references `documents` and stores document type, URL, expiry, status, and creator. | Reuse storage and metadata; add verification fields additively. |
| HR approvals | `hr_approval_requests` and `hr_approval_steps` support employee-related approval workflows. | Reuse for employment and access requests where compatible; do not bypass maker-checker. |
| Invitations | `server/teamInvitations.ts` hashes opaque tokens, verifies the invited email, scopes the invitation to the verified company, records delivery state, and attaches the accepted identity to `profiles`. | Preserve the existing platform invitation service; expand its data contract instead of inventing browser invite codes. |
| Security | Passkey management, password provisioning, onboarding tour persistence, and role-change approval already exist in the application. | Integrate with the Center; do not store passwords or duplicate Supabase sessions. |
| Module visibility | The UI has a `MODULES` registry, `enabledModules`, and role-based visible-module filtering; `company_modules` is persisted. | Keep as compatibility behavior while database-backed permissions are introduced. |
| Audit | `audit_log` and HR audit helpers exist. | Reuse as the append-only administrative audit sink and add structured event fields only through additive changes. |

## Requirements that are currently missing or incomplete

The attachment requests a full identity, HR, organization, access-control, and security control plane. The following capabilities are not yet a complete normalized subsystem in the current project:

| Missing or incomplete capability | Required treatment |
|---|---|
| Typed personal identity profile | Additive personal/emergency/KYC fields linked to the existing `hr_employees` record. Sensitive identifiers must be encrypted or protected and must not appear in broad directory reads. |
| Employment history | Add an effective-dated employment record table rather than overwriting the current job, department, manager, or status. |
| Divisions and teams | Add company-scoped divisions, teams, team memberships, and reporting relationships with cycle prevention. |
| Database-backed roles and permissions | Add roles, permissions, role-permission assignments, member-role assignments, module actions, data scopes, and approval limits. Existing string roles remain a compatibility fallback only during rollout. |
| Module action matrix | Persist view/create/edit/delete/approve/export/print/manage/full-access actions with deny-overrides and explicit sensitive-finance permissions. |
| Segregation of duties | Add permission-conflict rules and evaluated risk findings; never rely on warning text in the UI alone. |
| Access requests | Add request, approval-step, decision, expiry, and audit records for elevated or temporary access. |
| Workforce invitation expansion | Existing invitations are secure but limited to name/email/role and are stored in the platform data layer. Add department, position, branch, employment type, expiry policy, and intended access as validated fields without exposing token hashes. |
| Security events | Add a tenant-scoped security-event projection for administrative events; session and password secrets remain owned by Supabase Auth. |
| Bulk import | Add import batch, row validation, error, preview, and commit records. Import commits must use a protected server procedure and be idempotent. |
| Collaboration center | Existing collaboration modules must be linked by permission and audience scope; do not build messaging/tasks again inside Settings. |
| Workforce analytics | Build server-side snapshot queries from authoritative tables; do not calculate security health from browser-only state. |

## Safe implementation slices

### Slice 0 — Contract freeze and feature flag

Before UI expansion, freeze the existing contracts. Add a feature flag such as `team_workforce_center_v1` at the application configuration layer, defaulted off for existing tenants. Capture the current `profiles.role`, `company_memberships.role`, `company_modules`, `hr_employees`, invitation, and portal behavior in contract tests. The old Settings experience must remain reachable until the new center passes staging acceptance.

This slice is non-destructive and has no user-visible authorization change. It establishes the rollback path: disable the feature flag and continue using the current Settings, HR, and invitation flows.

### Slice 1 — Read-only Team Overview and All Members

Build the first user-visible center as a read-only projection over existing data. It should display total employees, active employees, pending invitations, department distribution, missing profile fields, onboarding status, and recent joins. The directory should combine `hr_employees`, `profiles`, `departments`, `hr_positions`, and the current team-invitation service.

The first version should not introduce editable role matrices or account suspension controls. It should prove the navigation, responsive layout, tenant filtering, loading/error/empty states, and server-confirmed data. This is the safest first slice because it does not alter identity or authorization.

### Slice 2 — Typed workforce profile and employment history

Add the missing employee data using additive tables or columns only. The recommended model is:

- `hr_employee_personal_profiles`: one-to-one with `hr_employees`, containing preferred name, gender, date of birth, nationality, NIDA/passport references, personal contacts, residential address, and emergency contact metadata. Sensitive identifiers should be stored using a protected representation and masked in ordinary reads.
- `hr_employment_records`: effective-dated job title, position, department, division, branch, location, employment type, employment status, joined/probation/contract dates, manager/supervisor references, cost center, work schedule, and source actor.
- `hr_reporting_relationships`: effective-dated employee-to-manager relationships with a database trigger or RPC preventing self-reference and cycles.

Existing `hr_employees` fields remain the current-record compatibility projection. A controlled write routine must update the projection and history atomically.

### Slice 3 — Divisions, teams, and directory scope

Add company-scoped `hr_divisions`, `hr_teams`, and `hr_team_memberships`. A team membership must have a start date, optional end date, membership status, and role within the team. Composite tenant foreign keys must be used wherever parent tables expose `(company_id,id)` uniqueness. Scope-aware queries should support company, branch, department, team, and own-record visibility.

The organizational chart must be generated from persisted reporting relationships. The client may render the chart, but it must not infer hierarchy from a manually maintained browser array.

### Slice 4 — Database-backed roles, permissions, and module access

Add the authorization model behind protected backend procedures:

- `workforce_roles`: company-scoped custom and system roles, hierarchy level, description, approval authority, and status.
- `workforce_permissions`: immutable permission catalog using stable codes such as `pos.sale.create`, `pos.sale.approve`, `payroll.view_sensitive`, and `workforce.member.manage`.
- `workforce_role_permissions`: role-to-permission assignments.
- `workforce_member_roles`: effective-dated assignments from a profile or employee to a role.
- `workforce_module_access`: module/action overrides and full-access state.
- `workforce_data_scopes`: company, branch, department, team, or own-record scope grants.
- `workforce_approval_limits`: per-action TZS limits with effective dates and approval requirements.
- `workforce_permission_conflicts`: rules and evaluated conflicts for create/approve, payment/payroll, delete-sensitive-data, and multi-branch access risks.

The evaluator must implement deny-overrides, expired-assignment handling, tenant filtering, and maker-checker separation. The browser’s `allowedModules` list becomes presentation state only.

### Slice 5 — Invitation and onboarding expansion

Retain `server/teamInvitations.ts` as the secure token and delivery boundary. Extend the invitation payload to include intended department, position, branch, employment type, role assignment, module template, and onboarding template. Store only token hashes. The invitation acceptance flow must remain email-bound and must create or attach the authenticated profile before writing the employee record.

The existing `hr_onboarding_cases` and `hr_onboarding_tasks` should receive typed task keys for account created, email verified, profile completed, employment completed, role assigned, modules assigned, permissions configured, documents uploaded, manager/department/branch assigned, MFA configured, and first login completed. Completion percentage is a derived server value.

### Slice 6 — Security center and access requests

Add tenant-scoped security events and access-request records. Password reset, session revocation, MFA, and passkey actions must continue to use Supabase Auth or the existing secure account mechanisms. The application may store event metadata such as action type, actor, target profile, timestamp, provider result, IP hash, and user-agent classification, but never passwords, raw tokens, or unrestricted session secrets.

Administrative actions must use server-side authorization, write an audit event, and return only safe fields. Account suspension or access revocation must be designed with an emergency recovery path and must not lock out the only tenant administrator without an approved recovery procedure.

### Slice 7 — Bulk import and collaboration integration

Add import batches and row-level validation before commit. CSV/XLSX parsing should occur server-side or in a controlled upload workflow. A preview is not a write. The commit procedure must reject duplicates, enforce role-grant authority, create an idempotency record, and produce per-row audit results.

Announcements, messages, tasks, documents, calendar, workflows, and approvals remain owned by their existing modules. The Team & Workforce Center only provides the membership, audience, and permission links.

## Protected API boundary

The recommended backend surface is a dedicated `workforce` tRPC router or equivalent protected service. All procedures must call `resolveVerifiedProfile(req)` and derive the company from the verified profile. Client-provided `companyId`, actor IDs, approval state, role authority, and account status must be ignored or rejected.

| Procedure | Purpose | Required authorization |
|---|---|---|
| `workforce.snapshot` | Team dashboard, directory, departments, positions, invitations, onboarding/security summaries. | Tenant-visible fields; sensitive security metrics require workforce-management permission. |
| `workforce.member.createDraft` | Validate and save a non-active employee draft. | `workforce.member.manage`. |
| `workforce.member.createAndInvite` | Create employee projection, onboarding case, role/access request, and secure invitation. | Member manage plus authority to grant requested role/modules. |
| `workforce.member.updateEmployment` | Append effective-dated employment history and update current projection. | HR/workforce manage. |
| `workforce.member.assignRole` | Request or apply role assignment using maker-checker. | Grant authority; self-escalation forbidden. |
| `workforce.member.setModuleAccess` | Apply module/action and data-scope changes. | Grant authority for every requested permission. |
| `workforce.invitation.resend` | Rotate token hash and resend invitation. | Invitation manage. |
| `workforce.invitation.revoke` | Revoke a pending invitation. | Invitation manage. |
| `workforce.onboarding.updateTask` | Complete or reopen a typed onboarding task. | Task owner or workforce manage. |
| `workforce.access.request` | Request temporary/elevated access. | Authenticated member; decision requires independent approver. |
| `workforce.security.action` | Force password change, revoke sessions, suspend/reactivate, or MFA workflow initiation. | Explicit security permission and audit. |
| `workforce.import.preview` / `workforce.import.commit` | Validate and commit bulk import. | Workforce manage; commit is idempotent and audited. |

Direct `INSERT`, `UPDATE`, and `DELETE` policies for sensitive authorization tables should not be granted to ordinary `authenticated` clients. Controlled RPCs or server-side service calls are the write boundary.

## RLS and authorization invariants

Every new workforce table must have `company_id` as a first-class column, a tenant-scoped read policy, and an explicit policy for any write path. Sensitive rows require an additional policy condition based on the verified viewer’s permission or relationship to the employee.

The database must enforce the following invariants:

1. A workforce record cannot reference a profile, employee, branch, department, team, role, permission, approval, or document from another company.
2. A user cannot grant a permission or role they are not authorized to grant.
3. A maker cannot approve their own role, permission, financial-limit, suspension, or access request.
4. A terminated or suspended employee cannot receive new operational access without an approved reactivation workflow.
5. Effective-dated assignments cannot overlap in a way that creates ambiguous authority.
6. Posted audit and security events are append-only; corrections are compensating events.
7. Passwords, invitation tokens, MFA secrets, and raw session tokens are never stored in frontend state, URLs, logs, or ordinary database fields.
8. All high-cardinality lookup columns and foreign keys are indexed with `company_id` first.

## UI implementation order

The UI should be delivered in this order: a new Settings sub-navigation shell, Team Overview, All Members, Pending Invitations, member profile read view, then wizard drafts, onboarding, roles, module access, data scopes, approval limits, security, and imports. Each screen must use the existing design system and existing loading/error/empty-state patterns.

The first editable screen should be the employee draft wizard, not the permission matrix. It should persist a draft employee and onboarding case without activating access. The permission matrix should be enabled only after database-backed role evaluation and conflict detection are available.

## Verification and rollout gates

| Gate | Required evidence |
|---|---|
| Discovery gate | Existing Settings, HR, invitation, profile, role, and module contracts are covered by tests. |
| Schema gate | Additive migrations apply twice safely, use tenant keys, enable RLS, and do not change existing rows. |
| Read-only gate | Team Overview and directory show only server-confirmed tenant data, with no browser seed fallback. |
| Draft gate | Employee drafts and onboarding cases persist atomically and can be abandoned without granting access. |
| Authorization gate | Role/module/data-scope changes are server-authorized, maker-checker protected, audited, and deny unauthorized grants. |
| Invitation gate | Token hashes are stored, email binding is enforced, expiry is server-side, and delivery failure is explicit. |
| Security gate | No plaintext passwords or secrets appear in logs, URLs, client state, API responses, or database fields. |
| RLS gate | Cross-company reads and writes fail for profiles, employees, departments, teams, roles, permissions, documents, invitations, and audits. |
| Recovery gate | Feature flag rollback, invitation resend/revoke recovery, admin lockout recovery, and failed-import recovery are tested. |
| Production gate | Type-check, focused tests, full build, staging concurrency/RLS tests, canary tenant approval, and live read verification pass. |

## Recommended immediate next step

The correct next implementation is **Slice 0 plus Slice 1**: preserve the existing Settings/HR/invitation behavior, introduce the Team & Workforce navigation shell behind a feature flag, and add a read-only Team Overview and All Members projection. This gives the product the requested direction without changing authentication, permissions, or employee data authority prematurely.

After that slice passes review, implement the typed workforce profile and employment-history migration. Only then should the system expose editable role, module, data-scope, approval-limit, or security actions.

## References

[1]: `client/src/BusinessSphereDashboard.jsx` — existing module registry, Settings page, HR/Employee Portal rendering, and client visibility compatibility behavior.
[2]: `supabase/migrations/20260821_013_employee_portal_core.sql` — existing typed HR extensions, employee portal tables, onboarding, documents, approvals, notifications, RLS, and secure portal RPCs.
[3]: `supabase/migrations/20260821_014_employee_portal_security_remediation.sql` — employee portal privilege and execution hardening.
[4]: `server/teamInvitations.ts` — current secure invitation token, delivery, acceptance, company scoping, and profile attachment service.
[5]: `server/routers.ts` — current tRPC composition, workspace settings, role-change approvals, and team invitation procedures.
[6]: `/home/ubuntu/upload/pasted_content.txt` — attached Team & Workforce Management requirements reviewed for this plan.
