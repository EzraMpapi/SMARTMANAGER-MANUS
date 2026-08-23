# Supabase Security Hardening Audit — 2026-08-23

**Project:** `rlhngsrihahhyxnjxrxm` (`EzraMpapi's Project`)

**Scope:** Remediate the five Supabase Security Advisor notices explicitly requested for mutable function search paths and RLS policy coverage. This document records the production change, verification evidence, and residual findings that were intentionally left outside this bounded review.

## Executive result

The five targeted notices were remediated in production by migration `security_hardening_search_paths_and_pin_rls`, recorded by Supabase at version `20260823133542`. The four trigger functions now have an explicit `search_path` of `public, pg_temp`, and `public.money_agent_pin_credentials` has an explicit deny-by-default policy for authenticated direct access. A post-migration Security Advisor refresh returned **zero** records for `function_search_path_mutable` and `rls_enabled_no_policy`.

The total advisor output decreased from **124** records in the targeted baseline to **119** records after the migration. The remaining records are unrelated to this request and are predominantly SECURITY DEFINER execute-grant notices; they require a separate access-contract review before any grants are changed.

## Findings and remediations

| Baseline notice | Affected object | Production remediation | Verification result |
|---|---|---|---|
| `function_search_path_mutable` | `public.community_groups_touch_updated_at()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `function_search_path_mutable` | `public.money_agent_block_direct_mutation()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `function_search_path_mutable` | `public.property_touch()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `function_search_path_mutable` | `public.property_immutable_guard()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `rls_enabled_no_policy` | `public.money_agent_pin_credentials` | Added `money_agent_pin_credentials_no_direct_access` for `authenticated` with `USING (false)` and `WITH CHECK (false)` | Cleared |

The function metadata query confirmed all four target functions are trigger functions with no arguments and are not `SECURITY DEFINER`. Their live `pg_proc.proconfig` values are all `search_path=public, pg_temp`. The table verification confirmed RLS remains enabled and not forced, with the explicit policy applying to `authenticated` and both policy predicates set to `false`.

## Security design decision

Money Agent PIN hashes remain behind the existing protected Money Agent workflow. The hardening migration did not add table grants, alter RPC grants, rewrite workflow functions, or create broad tenant-readable access. The explicit policy makes the intended direct-table denial visible to the advisor and to future maintainers while preserving the existing protected `SET_AGENT_PIN` workflow.

The four trigger functions only use built-in operations and trigger-row values. The pinned path therefore uses `public, pg_temp`; it does not add `auth`, which is unnecessary for these function bodies. No function privilege changes were included because the advisor also reports many unrelated SECURITY DEFINER execute grants whose correctness depends on each endpoint's public or authenticated access contract.

## Verification performed

The following checks were completed against production and the repository:

| Check | Result |
|---|---|
| Supabase `apply_migration` | Successful |
| Supabase migration ledger | `security_hardening_search_paths_and_pin_rls` / `20260823133542` present |
| Post-migration targeted advisor search | No `function_search_path_mutable` or `rls_enabled_no_policy` records |
| Live `pg_proc` configuration | Four target functions report `search_path=public, pg_temp` |
| Live RLS metadata | `money_agent_pin_credentials` has RLS enabled |
| Live policy metadata | `money_agent_pin_credentials_no_direct_access`, `ALL`, `authenticated`, `false`, `false` |
| Focused Vitest contracts | 4 files passed; 32 tests passed |

The migration and focused contract test are tracked as:

- `supabase/migrations/20260823_046_security_hardening_search_paths_and_pin_rls.sql`
- `server/supabaseSecurityHardening.test.ts`

## Residual advisor findings

The post-migration advisor output still contains **119 unrelated records**: 16 `anon_security_definer_function_executable` notices, 102 `authenticated_security_definer_function_executable` notices, and one leaked-password-protection configuration notice. These were not mass-revoked or modified because doing so without reviewing each public booking, portal, billing, banking, workforce, and module RPC could break intentional application access contracts. They remain a separate follow-up hardening backlog.

## References

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy "Supabase Database Linter — RLS Enabled No Policy"

[2]: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable "Supabase Database Linter — Function Search Path Mutable"

[3]: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable "Supabase Database Linter — Public Can Execute SECURITY DEFINER Function"

[4]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase Database Linter — Signed-In Users Can Execute SECURITY DEFINER Function"
