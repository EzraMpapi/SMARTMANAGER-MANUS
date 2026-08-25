# Build, Responsive Coverage, and RLS Audit

## Production build

The Supabase schema verifier completed successfully before Vite started. It checked 201 referenced tables against 534 deployed tables and reported no missing tables, tenant-table issues, or critical-table issues. A manual Vite-only production build was run with `NODE_OPTIONS=--max-old-space-size=4096`; the process was terminated by SIGTERM before artifact verification. A prior full build retry with a 2GB heap and reduced file-operation parallelism transformed 2,699 modules before exit 143 during chunk rendering. Complete production artifact generation therefore remains unverified in this sandbox.

## Regression coverage

The focused responsive and executive overview contracts passed with 13 tests. The non-credential regression suite passed 969 tests with 14 skipped across 233 test files. The relevant assertions cover 7D/30D/3M/6M/1Y performance windows, explicit confirmed-data source labels, permission-aware quick actions, protected-dashboard scoping, 44px touch targets, safe-area navigation, responsive table wrappers, responsive dialog geometry, and mobile overflow containment.

The repository’s existing authenticated CDP mobile harness supports a reproducible phone viewport through `E2E_VIEWPORT_WIDTH` and `E2E_VIEWPORT_HEIGHT`, but it could not run a live legacy-module session because no matching authenticated browser target was available. No claim is made for physical-device behavior from this run.

## Supabase RLS and tenant isolation

A bounded live catalog query found that the inspected public tables have RLS enabled. Six RLS-enabled tables have zero attached policies: `bank_provider_webhook_account_controls`, `bank_provider_webhook_drain_approvals`, `bank_provider_webhook_drain_runs`, `bank_provider_webhook_remediation`, `platform_admin_actions`, and `subscription_trial_expiry_notices`. With RLS enabled and no policies, these tables are deny-by-default for ordinary roles; their backend-only purpose should remain documented and should not be opened speculatively.

Representative tenant-policy definitions were inspected. `companies` selects and updates only when `id = current_company_id()`. `profiles` allows self access or same-company reads, while updates require `id = auth.uid()`. `workspaces` applies `ALL` only when `company_id = current_company_id()` for the authenticated role. These predicates are aligned with company-scoped isolation and self-service identity protection.

The read-only repository Supabase security contracts passed: 15 tests passed and 2 were skipped across five Supabase-focused test files covering authentication/RLS, schema contracts, auth client behavior, helper grants, and security hardening. The local service-credential probe remains HTTP 401, so a live authenticated cross-tenant CRUD test could not be completed from the local environment. No schema, RLS policy, privilege, or production-data changes were made.

## Remaining blockers

Complete artifact verification requires a larger-memory build worker or CI runner. Live legacy-module mobile validation requires a matching authenticated browser target or connected physical device. A valid Supabase service-role credential is required for the local authenticated connection probe and live cross-tenant CRUD verification.
