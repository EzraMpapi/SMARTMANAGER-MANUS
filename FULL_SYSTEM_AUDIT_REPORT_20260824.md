# Full-System Audit Report — 24 August 2026

## Executive conclusion

The repository and live Supabase project were audited after the P0 foreign-key index deployment. The application validation gate is green for the checks that can run in this environment: TypeScript checking, the full Vitest suite, dependency audit, production build, and the configured browser end-to-end suite completed successfully. A direct `pnpm verify:supabase-schema` invocation could not run because this sandbox has no server-only Supabase credential; the Vercel-mode build explicitly skips that server-only check, while CI/managed deployment remains the credentialed schema gate. No reproducible application defect was identified by these checks, so no speculative source-code change was made.

The live database is structurally healthy on the checks performed: all 521 public tables have RLS enabled, there are no invalid indexes, and there are no unvalidated foreign-key constraints. The repository-to-production reconciliation found **zero missing repository-declared tables**. Therefore, no table DDL was executed. The supplied Global Admin Control Center attachment was reviewed as an architectural directive; its conceptual feature list was not treated as evidence that additional production tables should be invented.

## Repository and application audit

| Check | Result | Interpretation |
|---|---|---|
| Supabase schema-contract verification | Direct local command blocked by missing server-only credential; Vercel-mode build skipped it by design | CI/managed deployment remains the authoritative credentialed schema gate |
| TypeScript check (`pnpm check`) | Passed | No type errors detected |
| Full Vitest suite | **217 files passed, 6 skipped; 885 tests passed, 14 skipped (899 total)** | No failing automated tests detected |
| Production build (`VERCEL=1 pnpm run build`) | Passed | Client and API bundles generated; one non-blocking large-chunk warning remains |
| Production dependency audit | No known vulnerabilities | No high-severity production dependency finding detected |
| Tracked-secret pattern scan | No matches | No obvious hard-coded credential pattern was found by the scan |
| Browser end-to-end suite (`pnpm test:browser`) | **23 passed** in 1.7 minutes | No browser workflow regression detected in the configured suite |
| Client source files over 3 MiB | None | The direct-upload source-size guard remains satisfied |
| Build-size warning | `BusinessSphereDashboard` emitted chunk approximately 4.37 MB minified | Non-blocking performance debt, not a correctness error; further code-splitting remains a separate optimization task |

The only TODO match found in the audited application scope is a neutral placeholder comment in `server/db.ts`; it is not an executable failure or unimplemented user-facing operation. The `XXX` matches are Tanzania phone-number and webhook placeholder examples in form copy, not unresolved defects.

## Live Supabase integrity and security audit

The current bounded database integrity query returned the following production state.

| Metric | Result |
|---|---:|
| Public tables | 521 |
| RLS-disabled public tables | 0 |
| RLS-enabled tables without policies | 2 |
| Invalid indexes | 0 |
| Unvalidated foreign keys | 0 |
| Expected P0 indexes present | 5/5 |

The two policyless tables are `platform_admin_actions` and `subscription_trial_expiry_notices`. A direct access-contract query found both tables have no `anon` or `authenticated` table grants. `platform_admin_actions` is intentionally a service-role-only platform audit sink under the Global Admin migration, and `subscription_trial_expiry_notices` is likewise fail-closed for direct client access. Adding a blanket authenticated policy would weaken the current boundary; no policy was added.

The Supabase Security Advisor currently reports 125 notices: 123 WARN and 2 INFO. The WARN set includes 6 anonymous-executable `SECURITY DEFINER` functions, 116 authenticated-executable `SECURITY DEFINER` function notices, and 1 Auth leaked-password-protection notice. These are **security-advisor findings, not reproduced application errors**. The anonymous booking/seat functions appear to be an intentionally public SafariTiketi boundary in the existing system design, while the authenticated function notices require signature-by-signature least-privilege review. No blanket revoke or policy change was applied because it could break intended workflows without an approved access contract.

The current performance advisor also reports 1,012 unindexed-foreign-key notices. The explicitly authorized P0 wave remains complete, and no P1/P2 wave was applied.

## Schema reconciliation and DDL decision

The fresh connector inventories and repository declaration scan report:

| Reconciliation item | Result |
|---|---:|
| Repository SQL migration files | 84 |
| Distinct repository-declared tables | 287 |
| Live public tables | 521 |
| Missing repository-declared tables | **0** |
| Duplicate repository declarations | 9 names, recorded as migration-history duplication rather than missing schema |
| Production migration-ledger entries | 138 |
| Table DDL executed in this audit | **No** |

The migration ledger’s latest observed entry is `trial_expiry_notice_once` at version `20260824175351`. Local migration names that are absent from the live ledger were not blindly replayed because the corresponding table inventory is already complete and filenames alone do not establish safe replayability.

## Fix decision

No verified application or database correctness defect required a new fix in this audit pass. The safe engineering action was to preserve the passing application state, document the remaining advisor findings, and avoid unapproved security broadening or speculative table creation. The two policyless RLS tables remain fail-closed and service-role-only, which is safer than adding a permissive policy solely to silence an INFO notice.

## Recommended controlled follow-up

The next security wave should review the 116 authenticated `SECURITY DEFINER` notices by function signature and business workflow, validate whether each caller requires direct execution, and apply only narrow grants or invoker conversions that are covered by tests. The Auth leaked-password-protection notice requires managed Auth configuration work rather than table DDL. The remaining performance-advisor backlog should continue through the existing P1/P2 review process and must not be mass-applied without explicit approval.

## Evidence and references

[1]: ./FULL_SYSTEM_AUDIT_REPORT.md "Prior full-system audit and outstanding controlled blockers"
[2]: ./supabase/generated/fk-index-optimization/p0-followup-performance-20260824.json "Fresh P0 follow-up performance evidence"
[3]: ./supabase/generated/fk-index-optimization/p0-followup-performance-20260824.md "Fresh P0 follow-up performance report"
[4]: ./supabase/generated/fk-index-optimization/schema-reconciliation-20260823-post-p0.json "Prior repository/live schema reconciliation evidence"
[5]: ./package.json "Repository validation and build scripts"
[6]: ./supabase/migrations/20260823_061_global_admin_control_center.sql "Global Admin platform audit access boundary"
[7]: https://supabase.com/docs/guides/database/database-linter "Supabase database advisor documentation"
