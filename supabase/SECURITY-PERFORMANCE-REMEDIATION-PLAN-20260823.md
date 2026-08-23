# Supabase Security and Performance Remediation Plan

**Project:** SMARTMANAGER-MANUS  
**Database:** connected Supabase production project  
**Prepared:** 23 August 2026  
**Author:** Manus AI

## Executive conclusion

The production database has a strong structural and RLS baseline, but it is not ready to be described as fully compliant. The live audit found **513 public tables with RLS enabled, primary keys present, 714 public RLS policies, no unrestricted `USING (true)` or `WITH CHECK (true)` policy, and no cross-tenant rows during the authenticated company-scope sweep**. Storage policies and schema grants are also constrained. The remaining work is a controlled remediation program, not a mass-change exercise.

The requested SECURITY DEFINER review was originally based on a preserved snapshot of **178 public SECURITY DEFINER routines: 17 canonical and 161 noncanonical**. A fresh direct catalog recount performed during this review now returns **182 routines: 17 canonical and 165 noncanonical**. This four-routine drift must be resolved against migration history before any hardening batch is approved. No DDL was executed in this review.

The Performance Advisor returned **632 unindexed foreign-key findings**. All 632 findings reconciled to live public constraints and had no valid non-partial index whose leading columns covered the FK columns. However, **607 of the findings are on zero-row tables and only 25 are on non-empty tables**. The correct response is a workload-led index queue, not 632 automatic indexes.

## Evidence and method

The analysis used the preserved Supabase advisor payloads, fresh read-only PostgreSQL catalog queries, repository migrations, and repository-wide routine-name reference scanning. Routine bodies were inspected for trigger signatures, `auth` dependencies, tenant-scope signals, writes, dynamic SQL, and direct repository references. Foreign-key findings were joined to `pg_constraint`, `pg_attribute`, `pg_index`, `pg_stat_user_tables`, and index definitions. The result files are retained as supporting evidence:

| Evidence | Purpose |
|---|---|
| `/tmp/security_definer_body_inventory.json` | Live body-level inventory of the current noncanonical routine set |
| `/tmp/security_definer_body_inventory.csv` | Review-friendly routine classification export |
| `/tmp/security_definer_callsite_summary.json` | Repository call-site coverage |
| `/tmp/unindexed_fks_normalized.json` | Normalized 632-finding FK dataset |
| `/tmp/unindexed_fks_normalized.csv` | Review-friendly FK export |
| `/tmp/unindexed_fks_summary.json` | Exact FK counts and priority bands |
| `/tmp/fresh_security_advisor_summary.json` | Preserved Security Advisor summary: 114 warnings |
| `/tmp/fresh_performance_advisor_summary.json` | Preserved Performance Advisor summary: 855 lints |

Supabase advises that SECURITY DEFINER functions must use a pinned search path, and its stricter RLS guidance recommends an empty search path with fully qualified object names where practical [1] [2]. The application-specific plan below deliberately distinguishes triggers, authenticated RPC endpoints, tenant helpers, and public guest-booking contracts rather than blindly applying one path to every routine. Supabase also describes unindexed FK findings as performance recommendations rather than proof that every candidate must be indexed [3].

## SECURITY DEFINER findings

### Current inventory

| Classification | Count | Interpretation |
|---|---:|---|
| Total public SECURITY DEFINER routines in fresh recount | 182 | Current live catalog count |
| Canonical `search_path=pg_catalog, public, auth` | 17 | Already aligned with the selected project pattern |
| Noncanonical configured paths in preserved audit snapshot | 161 | User-requested review set |
| Noncanonical paths in fresh recount | 165 | Four-routine drift versus the preserved snapshot; reconcile before DDL |
| `search_path=public, auth` in fresh recount | 107 | Common authenticated module-RPC pattern; body and ACL review required |
| `search_path=public` in fresh recount | 36 | Higher review priority because `auth` is not available through the pinned path |
| `search_path=public, pg_temp` in fresh recount | 21 | Often intentional for trigger/row functions; preserve unless qualification review proves otherwise |
| `search_path=pg_catalog` in fresh recount | 1 | Narrow dependency surface; verify whether public/auth references are fully qualified |
| Anonymous EXECUTE | 6 | Intentional SafariTiketi booking/hold contract; freeze until product approval |
| Authenticated EXECUTE across the full live inventory | 107 | Review by callable endpoint and helper contract; do not revoke in bulk |
| Authenticated routines in the current noncanonical body set | 94 | Noncanonical authenticated subset |
| Direct repository routine references | 155 of 165 | Strong evidence of application contracts; use signature-specific regression tests |
| Non-directly referenced in repository | 10 of 165 | Candidate internal/helper review queue, not automatic revoke candidates |
| Trigger signatures in current noncanonical body set | 18 | Prioritize qualification and trigger safety, not cosmetic standardization |
| Bodies with dynamic SQL | 2 | Highest body-level injection and qualification review priority |
| Bodies with `auth` references | 85 | Require explicit `auth` dependency validation before removing `auth` from the path |
| Bodies with tenant-scope signals | 132 | Validate company/profile/role checks and cross-tenant denial behavior |
| Bodies containing write statements | 87 | Treat as state-changing endpoint or internal mutation; require transaction and authorization tests |

### Hardening categories and order

| Batch | Population | Risk rationale | Recommendation | Required validation |
|---|---:|---|---|---|
| **A — public contract freeze** | 6 | Anonymous SECURITY DEFINER booking functions can break SafariTiketi guest booking if privileges or signatures change | Do not revoke or rewrite. Review only for schema qualification, input validation, rate/abuse controls, and explicit public-contract approval | Anonymous booking/hold/cancel/release/availability tests, expiry/concurrency tests, no data leakage tests |
| **B — body-level red flags** | 2 dynamic-SQL routines plus any unqualified sensitive writes | Dynamic SQL and privileged writes amplify search-path and authorization risk | Review definitions line by line; qualify identifiers, constrain dynamic identifiers, and consider `search_path=''` only with complete qualification | Positive/negative auth tests, injection probes, transaction rollback tests, cross-tenant tests |
| **C — tenant/auth helpers** | 132 routines with tenant or auth signals, including helper families | These functions influence policy decisions and company isolation | Validate `auth.uid()`, profile/company lookup, role checks, and SECURITY DEFINER owner privileges. Migrate in small module batches only when body dependencies are proven | RLS matrix, two-company isolation, anon denial, helper result stability, advisor rerun |
| **D — authenticated state-changing RPCs** | 87 write-bearing bodies; 35 name-based P1 candidates in the preserved queue | These are business mutations and may be heavily coupled to client signatures | Prefer narrowly scoped `ALTER FUNCTION ... SET search_path` or function-definition replacement only after body qualification review. Preserve `auth` where required; do not mass-standardize | Contract tests, idempotency/concurrency checks, audit-log assertions, rollback and permission tests |
| **E — trigger and audit functions** | 18 trigger signatures; 21 `public, pg_temp` path entries | Trigger functions run inside writes and can block signup or persistence if changed incorrectly | Preserve `public, pg_temp` where intentional and qualify every referenced relation. Separate trigger hardening from RPC hardening | Insert/update/delete trigger tests, signup/profile creation tests, rollback behavior, migration replay |
| **F — internal unexposed helpers** | 10 routines not directly referenced in the repository, plus non-executable audit helpers | Lower external exposure, but still privileged code | Confirm trigger/dependency usage from catalog and migration history before changing path or dropping privileges | Dependency graph, owner/ACL review, regression suite, advisor rerun |

The previous migration `049_sensitive_rpc_execute_hardening.sql` is a bounded precedent: it hardened ten reviewed sensitive functions and intentionally did not generalize the rule. The next safe implementation unit should therefore be a **reviewed module batch**, beginning with the two dynamic-SQL routines and the most sensitive authenticated financial/workforce mutations, while explicitly excluding the six public booking routines.

### Approval gates before any routine DDL

No routine should be altered merely because its path differs from the canonical string. Before a migration is drafted, the team should approve a signature list and confirm the following: the complete `pg_get_functiondef` body is available; all relation and function dependencies are schema-qualified or safely covered; `auth` and `pg_temp` are retained only when required; owner and EXECUTE ACLs are unchanged unless separately approved; repository call sites and overloaded signatures are mapped; and positive, negative, anon, cross-tenant, and trigger regression tests exist. Every approved change must be source-versioned, applied through the Supabase migration mechanism, verified, and rerun through the Security Advisor.

## Unindexed foreign-key findings

### Live reconciliation

| Measure | Count | Meaning |
|---|---:|---|
| Performance Advisor FK findings | 632 | Current preserved advisor snapshot |
| Public FK constraints from live catalog | 1,097 | Broader FK universe; not every FK is linted |
| Findings with no leading-column coverage | 632 | No valid non-partial index starts with the FK column set |
| Partial-index-only findings | 0 | No finding was covered only by a partial prefix in this analysis |
| Non-empty child tables | 25 | Candidate queue for plan validation |
| Zero-row child tables | 607 | Backlog; indexing is not urgent solely because the constraint exists |
| Tables with at least 1,000 rows | 0 | No large populated FK child table in the current snapshot |
| P1 populated/high-use band | 11 | Highest immediate review candidates based on rows and observed scans |
| P2 populated or observed-use band | 5 | Validate query plans and call patterns before DDL |
| P3 low-row review band | 14 | Review with module owner and likely query path |
| P4 empty backlog | 602 | Defer until data or workload justifies an index |

The module distribution is concentrated in `pos` (99), `hospitality` (69), `restaurant` (65), `property` (64), `community` (57), `fleet` (43), `money` (42), `hr` (41), `bank` (40), and `workforce` (30). The highest-priority populated queue is dominated by workforce permission tables and small but actively scanned sales tables, including `workforce_role_permissions`, `workforce_permissions`, `workforce_roles`, `sales_payments`, `sales_invoice_items`, `sales_invoices`, and `sales_quotation_items`.

The FK linter's recommendation is directionally sound for join and parent-delete workloads, but index design must follow actual access paths. A composite index on `(company_id, foreign_key)` does not cover a query filtering only by `foreign_key`; conversely, an existing composite index may be sufficient when the FK columns are its leading prefix. The live analysis found no such coverage among the 632 linted findings, but every proposed index still requires query-plan and write-overhead review.

### Staged indexing plan

| Stage | Scope | Action | Exit criteria |
|---|---|---|---|
| 0 | 602 empty findings | Record as deferred backlog with owner/module and revisit after data growth | No DDL; advisor count is tracked rather than mechanically eliminated |
| 1 | 11 P1 findings | Capture representative application queries and `EXPLAIN (ANALYZE, BUFFERS)` in staging or a safe replica; consolidate candidates by child table and query shape | Measured plan benefit, acceptable write/storage overhead, named migration candidates |
| 2 | 5 P2 findings | Review scan counters, endpoint frequency, parent-delete behavior, and RLS predicates | Approved index column order and no redundant index overlap |
| 3 | 14 P3 findings | Review with module owners; add only if a real join/filter/order path exists | Written rationale per index and regression test |
| 4 | Approved candidates only | Create indexes through a versioned migration using the production-safe rollout policy | Migration applied, index valid, advisor rerun, query plans rechecked |

For a live production table, PostgreSQL documents that ordinary `CREATE INDEX` can block writes during the build, while `CREATE INDEX CONCURRENTLY` avoids write-blocking locks at the cost of extra scans, time, and operational caveats [4]. The migration mechanism must therefore confirm whether concurrent index creation is supported outside a transaction before selecting the DDL form. No index was created or dropped in this review, and no unused-index lint was acted on.

## Current advisor posture and roadmap

The preserved fresh advisor snapshot contains **114 Security Advisor warnings**: six anonymous SECURITY DEFINER execution notices, 107 authenticated SECURITY DEFINER execution notices, and one Auth leaked-password-protection notice. It also contains **855 Performance Advisor lints**: 632 unindexed foreign keys, 152 multiple permissive policy findings, 61 unused-index findings, and 10 auth RLS init-plan findings. These are findings to remediate and verify, not evidence that RLS is disabled or that data is currently cross-tenant accessible.

| Horizon | Deliverable | Change posture |
|---|---|---|
| Immediate | Resolve 178-versus-182 routine-count drift; freeze six public booking functions; review two dynamic-SQL routines | Read-only catalog and source review first |
| Next | Approve a small SECURITY DEFINER batch with tests and migration | No privilege revocation outside named signatures |
| Next | Validate 11 P1 FK candidates using real query plans | No blanket 632-index migration |
| Following | Address multiple-permissive-policy and auth-initplan findings by policy family | Preserve fail-closed and company-scope semantics |
| Separate | Enable leaked-password protection through Supabase Auth configuration if approved | Dashboard/Auth setting, not SQL migration; do not claim enabled until verified |

## What was deliberately not changed

This review did not alter routine definitions, search paths, function owners, EXECUTE ACLs, RLS policies, table grants, indexes, data, storage policies, or Auth settings. It did not revoke authenticated access, touch the six anonymous booking routines, drop unused indexes, or create hundreds of FK indexes. Those omissions are intentional safety controls because the evidence currently supports a phased review rather than a broad production mutation.

## Decision requests

The product and platform owners should approve the following before implementation begins: the public SafariTiketi booking contract and its abuse-control boundary; the first named SECURITY DEFINER signature batch; whether the project wants the stricter empty-search-path style or the existing bounded canonical pattern for each module; the staging/replica method for query-plan capture; and the production index rollout policy, including whether `CREATE INDEX CONCURRENTLY` is supported by the migration runner.

## References

[1]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[3]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"
[4]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL CREATE INDEX"
