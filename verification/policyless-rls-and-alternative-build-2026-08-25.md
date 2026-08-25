# Policy-less RLS and Alternative Build Review

## Six RLS-enabled tables with no policies

A bounded live Supabase catalog query identified six tables with RLS enabled and zero attached policies: `bank_provider_webhook_account_controls`, `bank_provider_webhook_drain_approvals`, `bank_provider_webhook_drain_runs`, `bank_provider_webhook_remediation`, `platform_admin_actions`, and `subscription_trial_expiry_notices`.

All six are owned by `postgres`, have RLS enabled, and have `force_rls` set to false. The `anon` and `authenticated` roles have no SELECT privilege on any of them. Explicit table grants are limited to `postgres` and `service_role`; those grants include the service-side CRUD privileges needed by backend operations. With RLS enabled, no policies, and no ordinary-role table grants, the effective posture for anonymous and authenticated application clients is deny-by-default. No policy was added because opening these backend-control and administrative tables without a verified client access requirement would weaken security.

## Audit and source review

The existing build/coverage/RLS audit markdown was reviewed against the latest source diff. The responsive changes remain scoped to `.dashboard-mobile-content`; the shared filter/table primitives activate the mobile utilities centrally; and the legacy grid and drawer rules affect only protected-dashboard mobile layouts. No schema, authentication, RLS, tenant-boundary, or production-data changes were found in the reviewed diff.

## Alternative Vite chunking

A temporary Vite configuration grouped React/scheduler, UI/icon, chart/D3, data-client, and remaining core dependencies into manual vendor chunks. The build transformed 2,699 modules and reached `rendering chunks (14)` before the sandbox terminated the process with SIGTERM. No complete frontend artifact set was emitted or verified. This is consistent with the sandbox memory/resource limit, not a newly reported source or schema error.

## Status

Focused responsive contracts remain green at 13 tests. The policy and security contract suite previously passed 15 tests with 2 skipped. The alternative chunking configuration was temporary and was not added to the repository. No production data or Supabase objects were changed.
