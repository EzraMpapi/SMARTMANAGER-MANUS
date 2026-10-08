# Supabase Security Hardening Audit — 2026-08-23

**Project:** `rlhngsrihahhyxnjxrxm` (`EzraMpapi's Project`)

**Scope:** Record the Supabase Security Advisor remediation sequence for mutable function search paths, RLS policy coverage, authenticated RLS helper execution, and sensitive RPC execution privileges. This document records production changes, verification evidence, and residual findings intentionally left outside the bounded reviews.

## Executive result

The five targeted notices were remediated in production by migration `security_hardening_search_paths_and_pin_rls`, recorded by Supabase at version `20260823133542`. The four trigger functions now have an explicit `search_path` of `public, pg_temp`, and `public.money_agent_pin_credentials` has an explicit deny-by-default policy for authenticated direct access. A post-migration Security Advisor refresh returned **zero** records for `function_search_path_mutable` and `rls_enabled_no_policy`.

The total advisor output decreased from **124** records in the targeted baseline to **119** records after the migration. The remaining records are unrelated to this request and are predominantly SECURITY DEFINER execute-grant notices; they require a separate access-contract review before any grants are changed.

A separate, reviewed remediation was subsequently applied for helper functions that are directly called by authenticated company-scoped RLS policies. Migration `rls_policy_helper_execute_grants` recorded at version `20260823135435` grants `authenticated` execution only on six policy helpers, keeps `anon` and `PUBLIC` execution revoked, and pins each function to `pg_catalog, public, auth`. This resolves policy evaluation permission failures without broadening module RPC access.

A further bounded remediation was applied by migration `sensitive_rpc_execute_hardening`, recorded at version `20260823151641`. It removes anonymous execution from profile identity and workspace membership RPCs, removes direct execution from the unreferenced Money Agent fee and commission calculation helpers, and pins all ten reviewed functions to `pg_catalog, public, auth`. Required authenticated execution remains for the eight account/workspace functions; the two calculation helpers are no longer directly callable by either `anon` or `authenticated` and remain callable only by their owning database workflows.

## Findings and remediations

| Baseline notice | Affected object | Production remediation | Verification result |
|---|---|---|---|
| `function_search_path_mutable` | `public.community_groups_touch_updated_at()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `function_search_path_mutable` | `public.money_agent_block_direct_mutation()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `function_search_path_mutable` | `public.property_touch()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `function_search_path_mutable` | `public.property_immutable_guard()` | `ALTER FUNCTION ... SET search_path = public, pg_temp` | Cleared |
| `rls_enabled_no_policy` | `public.money_agent_pin_credentials` | Added `money_agent_pin_credentials_no_direct_access` for `authenticated` with `USING (false)` and `WITH CHECK (false)` | Cleared |
| `anon_security_definer_function_executable` | Profile identity, workspace membership, and Money Agent fee/commission RPCs | Migration `sensitive_rpc_execute_hardening` revokes anonymous/public execution, removes direct execution for the two unreferenced calculation helpers, and pins ten reviewed functions | Cleared for the ten reviewed functions |

The function metadata query confirmed all four target functions are trigger functions with no arguments and are not `SECURITY DEFINER`. Their live `pg_proc.proconfig` values are all `search_path=public, pg_temp`. The table verification confirmed RLS remains enabled and not forced, with the explicit policy applying to `authenticated` and both policy predicates set to `false`.

## Security design decision

Money Agent PIN hashes remain behind the existing protected Money Agent workflow. The hardening migration did not add table grants, alter RPC grants, rewrite workflow functions, or create broad tenant-readable access. The explicit policy makes the intended direct-table denial visible to the advisor and to future maintainers while preserving the existing protected `SET_AGENT_PIN` workflow.

The four trigger functions only use built-in operations and trigger-row values. The pinned path therefore uses `public, pg_temp`; it does not add `auth`, which is unnecessary for these function bodies.

The helper-grant remediation is intentionally narrower than the remaining advisor backlog. It covers only `bank_is_privileged()`, `billing_is_manager()`, `fleet_is_manager()`, `hr_current_employee_id()`, `hr_is_privileged()`, and `hr_can_manage_employee(uuid)`, because these are directly used by authenticated RLS policy expressions. The 049 sensitive-RPC remediation separately covers only account/workspace functions and unreferenced money-agent calculation helpers after source call-site review. Neither migration grants anonymous execution, grants all SECURITY DEFINER functions, or opens the deliberately denied Property Management or Money Agent PIN tables.

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
| Helper-grant migration contract | 3 tests passed |
| Live helper ACL verification | Six helpers: authenticated `EXECUTE=true`; anon/public `EXECUTE=false`; search path pinned |
| Live sensitive-RPC ACL verification | Ten reviewed functions: profile/workspace anon/public execution removed; calculation-helper authenticated execution removed; all ten search paths pinned |
| Reversible authenticated policy probe | Billing, banking, fleet, HR, and profiles completed without helper permission errors |

The migration and focused contract test are tracked as:

- `supabase/migrations/20260823_046_security_hardening_search_paths_and_pin_rls.sql`
- `server/supabaseSecurityHardening.test.ts`
- `supabase/migrations/20260823_047_rls_policy_helper_execute_grants.sql`
- `server/supabasePolicyHelperGrants.test.ts`
- `supabase/migrations/20260823_049_sensitive_rpc_execute_hardening.sql`
- `server/sensitiveRpcExecuteHardening.test.ts`

## Residual advisor findings

The refreshed advisor output after 049 contains **114 residual records**: six intentionally public SafariTiketi booking `anon_security_definer_function_executable` notices, 107 `authenticated_security_definer_function_executable` notices, and one leaked-password-protection configuration notice. The 107 authenticated warnings were not mass-revoked because they cover billing, banking, workforce, POS, portal, and other module RPCs whose access contracts require endpoint-by-endpoint review. The six public booking RPCs were preserved because their anonymous access is part of the SafariTiketi guest-booking contract. The leaked-password-protection setting must be enabled through Supabase Auth configuration; the available database migration interface cannot change that Auth setting.

## References

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy "Supabase Database Linter — RLS Enabled No Policy"

[2]: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable "Supabase Database Linter — Function Search Path Mutable"

[3]: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable "Supabase Database Linter — Public Can Execute SECURITY DEFINER Function"

[4]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase Database Linter — Signed-In Users Can Execute SECURITY DEFINER Function"

[5]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase Auth — Password Strength and Leaked Password Protection"
