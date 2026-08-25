# Workspace-Presence Recovery Migration — Future Audit Reference

**Migration file:** [`20260825_005_workspace_presence_recovery.sql`](../supabase/migrations/20260825_005_workspace_presence_recovery.sql)
**Production migration name:** `workspace_presence_recovery_20260825`
**Review status:** Applied and verified on 25 August 2026
**Decision:** Retain as the canonical corrective migration. Do not reapply manually where the Supabase migration ledger already records it.

> **Purpose.** A valid authenticated profile was considered eligible for the protected workspace only when the same company also had at least one `workspaces` row. Earlier onboarding paths created profiles and company memberships but could omit that row, resulting in `WORKSPACE_MISSING` for an otherwise valid tenant session.

## 1. Scope and Outcome

The migration repairs the missing authorization prerequisite without changing application roles, tenant memberships, Row Level Security (RLS), or data-access policies. It has two parts: a one-time additive backfill for legacy companies with no workspace and hardened future onboarding routines so the prerequisite is created at the same time as company identity.

| Review dimension | Audit conclusion | Evidence in migration |
|---|---|---|
| Legacy-data repair | Adds one neutral default workspace only where a company has none. It does not delete, update, or move existing workspace, company, profile, or membership data. | `INSERT INTO public.workspaces … SELECT … FROM public.companies` with `WHERE NOT EXISTS` (lines 207–218). |
| New company creation | Creates a default workspace inside the same transaction after the company, owner profile, and owner membership are established. | `create_company_and_owner` (lines 10–69). |
| Company join | Restores a default workspace only for the company resolved by a valid join code, guarded by a company-specific advisory transaction lock. | `join_company_with_code` (lines 71–132). |
| First-tenant bootstrap | Creates the first company, owner membership, and default workspace together, retaining the existing first-tenant advisory lock. | `ensure_current_company` (lines 134–205). |
| Function exposure | `PUBLIC` and `anon` execution are revoked; only `authenticated` retains execute permission on the three onboarding functions. | Lines 220–225. |

## 2. Security Review

The routine bodies continue to require `auth.uid()` before changing tenant identity state. Each function uses `SECURITY DEFINER` with an explicit `search_path` of `public, pg_temp`, which prevents accidental resolution through a caller-controlled schema. The migration does not disable RLS, alter RLS policies, grant table permissions, or expose service credentials. [1]

| Control | Why it matters | Audit result |
|---|---|---|
| Authentication check | Prevents anonymous callers from creating or joining a tenant. | Present in all three functions; unauthenticated calls raise `42501`. |
| Company scoping | Prevents a join path from creating a workspace for an arbitrary company. | The join routine resolves one company from the supplied normalized join code before its conditional workspace insert. |
| Concurrency control | Prevents simultaneous first joins from creating duplicate recovery workspaces for the same company. | `pg_advisory_xact_lock(hashtext('smart_manager_workspace:' || company_id))` precedes the join-path check. |
| One-time legacy backfill | Avoids overwriting existing workspaces and preserves customer-specific workspace names. | The backfill selects only companies for which no workspace exists. |
| Least-privilege function access | Narrows `SECURITY DEFINER` execution to authenticated users. | `PUBLIC` and `anon` are revoked; `authenticated` is explicitly granted. |

### Important distinction

The one-time **backfill statement** is insert-only. The three `CREATE OR REPLACE FUNCTION` statements retain their legitimate onboarding profile and membership writes; those writes execute only for the authenticated user completing the relevant company-creation, join, or first-tenant workflow. They are not part of the legacy data backfill.

## 3. Idempotency and Transactional Behavior

The migration is wrapped in `BEGIN` and `COMMIT`, so a DDL or data-repair failure rolls back the transaction rather than leaving a partially updated migration. [1]

The legacy backfill is **serially idempotent**: after a workspace is inserted for a company, a later run no longer satisfies `WHERE NOT EXISTS`. The join path is additionally protected with a company-specific advisory lock. The new-company path does not need a conditional lookup because the company is created within the same transaction.

For future changes, do not infer a uniqueness guarantee from this migration alone. If a later product requirement permits multiple logical workspaces per company, preserve that model. If an invariant of exactly one default workspace is introduced, design it explicitly with a named constraint and a reviewed data-migration plan; do not add a unique constraint reactively during an incident.

## 4. Production Verification Record

The production connector applied the migration successfully. A post-application, read-only aggregate check produced the following results.

| Metric | Verified value | Expected value |
|---|---:|---:|
| Active profile/company pairs | 7 | Informational baseline |
| Matching active profile/membership pairs | 7 | Equal to active profile/company pairs |
| Active profile/membership pairs without a workspace | 0 | 0 |
| Companies without a workspace | 0 | 0 |
| Workspace rows | 7 | Informational baseline after recovery |

The accompanying migration and UI contract tests passed, and the later complete automated suite reported **925 passing tests** with **14 intentionally skipped**. Type checking also passed. A local production build reached Vite chunk rendering but was terminated by sandbox memory pressure; that termination is not evidence of a source or schema failure and should be rechecked in a provisioned build environment. [2]

## 5. Audit Checklist for Future Incidents

Use the following order before proposing any new DDL or rerunning this migration.

1. **Confirm the migration ledger.** Use the connected Supabase migration-list capability to confirm whether `workspace_presence_recovery_20260825` is already applied. Do not rely on local filename ordering alone.
2. **Run a read-only aggregate check.** Confirm that every active profile with a company has a matching membership and that the relevant company has at least one workspace. Do not select customer records, emails, join codes, or document content for a routine health check.
3. **Inspect the access contract.** Verify that the three functions still use `SECURITY DEFINER`, retain `SET search_path TO 'public', 'pg_temp'`, and remain executable only by `authenticated`.
4. **Validate a non-production flow.** In an isolated test database only, create a company and owner, join a second test user with a valid test join code, and verify that a workspace exists for that company. Do not seed or replay this flow in production without separate authorization.
5. **Investigate application behavior before changing data.** If the aggregate remains at zero missing workspaces, a renewed `WORKSPACE_MISSING` symptom likely indicates identity-snapshot, cached-session, or client refresh handling—not a missing workspace row.

### Safe read-only aggregate query

```sql
WITH active_profiles AS (
  SELECT p.id, p.company_id
  FROM public.profiles p
  WHERE COALESCE(p.is_active, false) IS TRUE
    AND p.company_id IS NOT NULL
), profile_memberships AS (
  SELECT ap.id, ap.company_id
  FROM active_profiles ap
  JOIN public.company_memberships m
    ON m.user_id = ap.id
   AND m.company_id = ap.company_id
), company_workspaces AS (
  SELECT DISTINCT w.company_id
  FROM public.workspaces w
)
SELECT
  (SELECT COUNT(*) FROM active_profiles) AS active_profile_company_pairs,
  (SELECT COUNT(*) FROM profile_memberships) AS active_profile_membership_pairs,
  (SELECT COUNT(*)
   FROM profile_memberships pm
   LEFT JOIN company_workspaces cw ON cw.company_id = pm.company_id
   WHERE cw.company_id IS NULL) AS active_profile_membership_pairs_without_workspace,
  (SELECT COUNT(*)
   FROM public.companies c
   LEFT JOIN company_workspaces cw ON cw.company_id = c.id
   WHERE cw.company_id IS NULL) AS companies_without_workspace;
```

## 6. Residual Risks and Follow-up

No active database correction is currently required. The relevant operational follow-up is to complete a Git-sourced Vercel deployment verification after the provider’s daily deployment capacity becomes available. Authentication and workspace verification should then be repeated with an authorized tenant account because a read-only catalog check cannot prove an individual user’s browser session state.

The existing daily schema-health workflow should continue to remain read-only. It is appropriate for detecting a future regression in the workspace prerequisite, but it must never create a workspace, modify a profile, change a membership, or rerun a migration automatically.

## References

[1]: ../supabase/migrations/20260825_005_workspace_presence_recovery.sql "Workspace-presence recovery migration"
[2]: ../server/workspacePresenceRecoveryMigration.test.ts "Workspace-presence migration contract test"
