# Employee Profile Link Migration Summary

**Project:** SMART MANAGER

**Migration:** `employee_profile_link_admin`

**Live migration version:** `20260824191405`

**Applied to:** Connected Supabase project `rlhngsrihahhyxnjxrxm`

## Purpose

The Employee Portal was correctly failing closed because the authenticated user had no active `hr_employees.profile_id` linkage in the current tenant. The migration adds an explicit administrative remediation path without changing the Employee Portal entitlement rule, creating employee rows, inferring identities, or mass-updating records.

## Database change

The migration creates or replaces the `public.hr_link_employee_profile(uuid, uuid, text)` function. The operation accepts an explicit employee ID, profile ID, and reason, then:

1. Requires an authenticated session.
2. Reuses `public.hr_require_privileged()` so only an existing HR-privileged workspace role can perform the operation.
3. Requires a non-empty linkage reason of at least five characters.
4. Derives the tenant from `public.current_company_id()` rather than accepting a caller-supplied company ID.
5. Locks and verifies the selected employee belongs to the current workspace.
6. Rejects inactive or offboarded employees.
7. Verifies that the selected profile is active, belongs to the same workspace, and has an active `company_memberships` row.
8. Rejects replacing an employee’s existing different profile link.
9. Rejects linking a profile that is already attached to another active employee in the same tenant.
10. Updates only the explicitly selected employee’s `profile_id` and `updated_at`.
11. Writes an `EMPLOYEE_PROFILE_LINKED` event through the existing `public.hr_append_audit()` helper.
12. Returns a compact confirmation payload containing the tenant, employee, profile, and status values.

## Privilege posture

The migration executes:

```sql
REVOKE ALL ON FUNCTION public.hr_link_employee_profile(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_link_employee_profile(uuid, uuid, text) TO authenticated;
```

The live metadata check confirmed:

| Check | Result |
|---|---|
| Routine | `hr_link_employee_profile(uuid,uuid,text)` |
| Security mode | `SECURITY DEFINER` |
| Anonymous execute | `false` |
| Authenticated execute | `true` |

The function uses a pinned search path of `pg_catalog, public, auth` and retains tenant and role enforcement inside the database boundary.

## Live diagnosis and verification

A bounded aggregate diagnostic found **2 active employee rows, 0 active profile links, and 2 active unlinked rows**. The relevant HR tables were already present, so no table creation was required.

The migration was applied successfully and appears in the live migration ledger as version `20260824191405`. No production profile was linked because no exact employee/profile target was supplied; matching by name or email and mutating an arbitrary production account would be unsafe.

The frontend now explains that self-service actions remain blocked until an HR Manager or Global Admin explicitly links the account to the correct employee record. It does not weaken `hr_current_employee_id()`, bypass `employee_portal_action()`, or create automatic assignments.

## Local regression coverage

The local Employee Portal contract suite verifies the original fail-closed message, the new actionable guidance, the privileged RPC requirement, tenant scoping, audit action, and authenticated-only grant posture. The complete local Vitest suite passed **222 test files, 908 tests**, with **6 files and 14 tests skipped** by their existing opt-in/environment guards.
