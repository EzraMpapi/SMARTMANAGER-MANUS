# Smart Manager ERP — Post-Migration Integrity and Performance Audit

**Audit date:** 26 August 2026  
**Environment:** Live Supabase project `rlhngsrihahhyxnjxrxm`  
**Scope:** The 17 tables introduced by `supabase/20260826_add_missing_erp_tables.sql`, including structural metadata, foreign keys, indexes, RLS policies, tenant-key data quality, and representative query plans.

## Executive conclusion

The additive migration is structurally present and internally consistent for the audited scope. All 17 expected tables were found in the live catalog, every table has RLS enabled, and every table has a primary key. The 14 tenant-scoped tables have authenticated `ALL` policies using the same tenant predicate for both reads and writes: `company_id = current_company_id()`. The three platform-only/control tables—`users`, `schema_drift_monitors`, and `schema_drift_runs`—remain deny-by-default under RLS because no client-facing policies are present.

The live data-quality window returned zero rows in all 17 tables, so there were no null tenant keys, orphan records, or migration-created production records to invalidate. Representative tenant-scoped query plans used the intended company-scoped indexes. No database changes were made during this audit.

## Structural results

| Result | Finding |
|---|---|
| Table presence | 17/17 expected tables present |
| RLS | 17/17 enabled |
| Primary keys | 17/17 present |
| Foreign keys | 1 foreign key in the audited migration scope, on `schema_drift_runs` |
| Policy coverage | 14 tenant-scoped tables have authenticated tenant-isolation policies; 3 platform/control tables intentionally have no client-facing policies |
| Index metadata | All tables have indexes; counts ranged from 2 to 4 per table |
| Live row counts | 0 rows in each of the 17 audited tables |

The structural result was captured from the live catalog query in `post_migration_structure_query.json`. The policy-definition query independently confirmed the exact `USING` and `WITH CHECK` expressions for each tenant-scoped policy.

## Tenant-isolation review

The following tenant-scoped tables expose policies restricted to the authenticated role and constrained by `company_id = current_company_id()` in both directions: `audit_logs`, `bank_market_rates`, `dashboard_report_schedules`, `dse_market_tickers`, `market_provider_incidents`, `market_provider_settings`, `market_provider_uptime_logs`, `tra_gateway_alert_events`, `tra_gateway_alert_settings`, `tra_vat_anomaly_events`, `tra_vat_anomaly_settings`, `tra_z_report_archive_schedules`, `tra_z_report_archives`, and `webhook_deliveries`.

`users`, `schema_drift_monitors`, and `schema_drift_runs` have RLS enabled but no policies. This is a secure deny-by-default posture for tables intended for server-side or privileged control paths. It also explains why Supabase's security advisor reports informational `rls_enabled_no_policy` findings for these tables; the findings are not evidence of public exposure.

## Data-quality and relational checks

The bounded audit queried row counts and null tenant-key counts for every applicable table. All row counts were zero, and all applicable `null_company_id_count` values were zero. Because the tables are empty, there were no live rows capable of producing orphan relationships or inconsistent tenant ownership. The catalog result also confirmed the expected foreign-key metadata for the single relation in the migration scope.

This conclusion is limited to the current empty-table data state. Once production traffic begins populating these tables, a second audit should validate representative tenant rows and relationship integrity under real workload conditions.

## Performance probes

Two representative tenant-scoped plans were executed with bounded `LIMIT 50` reads.

| Access path | Planner result | Interpretation |
|---|---|---|
| `audit_logs` filtered by `company_id` and ordered by `created_at DESC` | Index scan using `audit_logs_company_id_idx`, followed by a small sort | Tenant filtering is index-backed; a composite `(company_id, created_at DESC)` index could remove the sort later if this becomes a high-volume path |
| `tra_z_report_archives` filtered by `company_id` and ordered by `created_at DESC` | Backward index scan using `tra_z_archive_company_created_idx` | The intended composite index supports tenant filtering and reverse chronological archive retrieval directly |

The `audit_logs` plan had a low estimated cost and one estimated row in the empty-table state. The archive plan used the composite index in backward order, which is the desired access pattern for an archive list.

## Supabase advisor context

The performance advisor contains informational unindexed-foreign-key findings across pre-existing application tables outside this 17-table migration scope. These are workload-sensitive recommendations, not migration failures, and no unrelated indexes were added during this audit. The security advisor reports expected informational no-policy findings for several deny-by-default control tables, including the newly audited drift tables and `users`, plus unrelated pre-existing functions that should be reviewed separately before exposing them to anonymous callers.

## Local release gates

The post-audit local gates completed successfully:

| Gate | Result |
|---|---|
| Vitest | 220 test files passed; 896 tests passed; 6 files and 14 tests skipped |
| TypeScript | Passed with no reported type errors |
| Schema verification | `missingTables: []`, `tenantTableIssues: []`, `criticalTableIssues: []` |
| Production build | Passed; Vite and both server bundles completed |

The build emitted a bundle-size advisory for the existing large dashboard chunk. This is a performance optimization opportunity, not a build failure or migration regression.

## Remaining external verification

Live Vercel deployment confirmation and GitHub Actions green-status confirmation remain blocked by the previously reported Hobby-plan deployment quota and Actions billing limits. The no-cost path remains to wait for the respective reset windows and re-run the live checks. No billing settings, repository visibility settings, secrets, signing keys, or production database policies were changed to bypass those blockers.

## Evidence files

- `verification/post_migration_structure_query.json`
- `verification/post_migration_policy_query.json`
- `verification/post_migration_data_quality_query.json`
- `verification/post_migration_explain_query.json`
- `verification/post_migration_explain_tra_query.json`
- Live structural result: `/home/ubuntu/.mcp/tool-results/2026-08-26_16-29-09.539356588_supabase_execute_sql_c94dc4a3.json`
- Live policy result: `/home/ubuntu/.mcp/tool-results/2026-08-26_16-30-37.065936161_supabase_execute_sql_ca9ba06e.json`
- Live audit result: `/home/ubuntu/.mcp/tool-results/2026-08-26_16-32-18.593832714_supabase_execute_sql_d01787e9.json`
- Live audit-log plan: `/home/ubuntu/.mcp/tool-results/2026-08-26_16-31-22.000576653_supabase_execute_sql_6bc4ce4c.json`
- Live TRA archive plan: `/home/ubuntu/.mcp/tool-results/2026-08-26_16-31-40.534791199_supabase_execute_sql_58287f12.json`

**Audit status:** Complete for the read-only Supabase migration scope; external deployment and CI confirmation pending quota reset.
