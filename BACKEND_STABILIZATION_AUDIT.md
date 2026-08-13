# Backend Stabilization Audit

**Status:** Verified locally and against the connected Supabase metadata on 2026-08-13.

## Resolved Defects

| Area | Root cause | Repair | Verification |
|---|---|---|---|
| Supabase write feedback | Several module handlers caught failed writes, leaving users without a reliable save-failure signal. | The shared PostgREST builder now emits a clear error notification for every failed insert, update, or delete before rethrowing. | Dashboard persistence regression coverage passed. |
| Supabase request headers | Read requests included a serialized `Prefer: undefined` header. | `Prefer: return=representation` is now attached only to mutations. | Type check and dashboard regression coverage passed. |
| Supabase-to-tRPC authorization | A valid Supabase bearer token was previously represented as a generic backend user, without tenant scope or an owner/admin role. | The request context now reads the authenticated caller's own `profiles` row under the same JWT and derives `companyId` plus an owner/admin backend role. | Focused context regression tests passed. |
| Audit-log tenant isolation | A client could supply a different `companyId` when listing or recording audit logs. | Audit procedures now derive the company exclusively from the authenticated backend context and reject mismatched client input. | Cross-company access-denial test passed. |
| Platform DB transient failure | Intermittent TiDB DNS and socket errors could surface as generic persistence failures. | Database operations now classify transient connection failures, retry once with a bounded delay, and raise an explicit `DatabaseUnavailableError` when durable storage cannot be reached. | Retry-classification and bounded-retry tests passed. |
| Backup status claims | The administrator UI reported backup/PITR as enabled without querying the Supabase database service. | The backend now reports only a real Supabase REST health result and requires backup retention/PITR confirmation in the Supabase dashboard. | Type check passed. |

## Durable Storage Verification

The platform persistence database was reachable during the final verification. The following additive tables exist in the live database: `schema_drift_monitors`, `schema_drift_runs`, and `webhook_configurations`.

The live Supabase contract verifier also confirmed that all **110** tables referenced by the dashboard are deployed, with no missing company-scoped table or reported tenant-table issue.

## Operational Limits

The application now presents transient platform-database outages as explicit persistence failures rather than silently accepting non-durable data. A live two-user JWT/RLS test remains intentionally disabled because the user requested that the Ezra/Mary credential investigation stop. This does not block the local authorization coverage or the verified Supabase schema contract.

The production build still reports a large main dashboard bundle. The planned lazy-loading work remains a separate performance improvement and does not prevent backend persistence or authorization from operating correctly.
