# Supabase Foreign-Key Index Optimization Plan

> Review-only artifact. No Supabase DDL was executed by this generator.

The latest read-only catalog snapshot contains **1097 validated foreign keys**. Of these, **640** lack a valid non-partial leading-column index and **457** have valid leading-column coverage. The audit also reports 580 company-leading, 8 tenant-leading, and 78 composite uncovered relationships.

The earlier advisor allowlist contains 622 entries and overlaps the current uncovered catalog for the advisor-confirmed rows. These are different snapshots: the current plan is driven by the newer catalog artifact, while the advisor flag is used only for prioritization.

## Priority policy

| Tier | Count | Treatment |
|---|---:|---|
| P0_POPULATED_OR_HOT | 5 | Included in the bounded, non-concurrent migration-safe SQL. Current evidence is the five populated workforce relationships (469/140 estimated rows). |
| P1_ADVISOR_TRANSACTION | 1 | Included only in the separate external CONCURRENTLY review plan. Requires approval and operational preflight. |
| P2_REVIEW_BACKLOG | 634 | Manifest-only backlog. No executable SQL is emitted for this tier. |

The generator intentionally does not emit an all-640 executable batch. It creates no drops, does not modify constraints or RLS, and treats `CREATE INDEX CONCURRENTLY` as external operational SQL rather than transaction-managed migration SQL.

## Highest-priority candidates

| Tier | Source table | Columns | Estimated rows | Advisor | Index name |
|---|---|---|---:|---|---|
| P0_POPULATED_OR_HOT | workforce_role_permissions | company_id, approval_request_id | 469 | yes | `ix_workforce_role_permissions_company_id_approval_request_id_fk` |
| P0_POPULATED_OR_HOT | workforce_role_permissions | granted_by | 469 | yes | `ix_workforce_role_permissions_granted_by_fk` |
| P0_POPULATED_OR_HOT | workforce_role_permissions | revoked_by | 469 | yes | `ix_workforce_role_permissions_revoked_by_fk` |
| P0_POPULATED_OR_HOT | workforce_permissions | created_by | 140 | yes | `ix_workforce_permissions_created_by_fk` |
| P0_POPULATED_OR_HOT | workforce_permissions | updated_by | 140 | yes | `ix_workforce_permissions_updated_by_fk` |
| P1_ADVISOR_TRANSACTION | hospitality_audit_log | company_id | 3 | yes | `ix_hospitality_audit_log_company_id_fk` |

## Review sequence

1. Re-run the read-only catalog audit immediately before approval so row estimates and existing-index coverage are current.
2. Review the generated P0 migration and the external P1 concurrent plan with the database owner, including storage and lock budget.
3. Validate representative query plans with `EXPLAIN (ANALYZE, BUFFERS)` and inspect index usage after deployment.
4. Apply only an approved batch; do not use this artifact as authorization to run DDL.
