# Attachment 5 Forensic Audit — Phase 1 Inventory

## Scope

This record captures the initial inventory for the requirements in `/home/ubuntu/upload/pasted_content_5.txt`. The audit is being performed against `/home/ubuntu/SMARTMANAGER-MANUS-packaging` and is constrained to non-destructive changes: no production data deletion, no disabling RLS, no secret exposure, no fabricated business records, and no duplicate database objects.

## Repository baseline

The repository is on branch `main` and was clean before this task except for the intentional `todo.md` update recording this audit. The latest synchronized commit is `2f7eec6` (`test: verify Supabase credentials and mobile coverage`). The project is a React/Vite frontend with a large `BusinessSphereDashboard.jsx` ERP shell, server-side TypeScript modules and tRPC infrastructure, Supabase REST/realtime integrations, Drizzle declarations and migrations, and approximately 240 server test files.

The package scripts include development, build, formatting, test, and database push commands. The test configuration injects non-secret test defaults when credentials are absent and supports the existing server contract suite. The latest serialized full-suite result remains 970 passed and 14 skipped tests across 240 files; the skips are live-session or environment gated.

## Existing feature and security evidence

Prior verification records already cover dashboard polish and responsive foundations, 39-module reconciliation, live Supabase verification, policyless RLS tables, security-advisor remediation, schema drift guards, signup/session recovery, subscription controls, healthcare, property management, hospitality, restaurant, fleet, collaboration email, and mobile coverage. These records are treated as evidence to validate and extend, not as permission to assume untested behavior.

The mobile evidence record reports 21 focused responsive tests and 209 passed tests in a broader mobile/responsive subset. It explicitly distinguishes source-level contracts from authenticated device rendering. The security-advisor evidence explicitly avoids generic policy additions, execute-grant revocation, SECURITY DEFINER rewrites, RLS disablement, credential access, and business-row changes.

## Initial risk boundaries

The attachment requests complete live CRUD tests for every module, but no disposable test tenant, authenticated test-user session, or cleanup authority was supplied. Production writes must therefore remain blocked until a controlled test tenant/session is provided. Service-role access is not an equivalent substitute for an authenticated RLS test because it bypasses the policy boundary.

The next audit phase will derive a feature-to-service-to-table map from the actual code and existing migrations, then compare only verified requirements against the live Supabase schema through read-only inspection. Any later schema change must be idempotent, additive, tenant-aware, RLS-protected, and justified by a demonstrated code/schema mismatch.

## Next phase

Build the frontend feature, service/API, Supabase query/RPC, table, column, relationship, permission, RLS, and UI response coverage map.
