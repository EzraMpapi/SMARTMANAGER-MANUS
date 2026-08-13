# Shared RLS Context Repair

## Confirmed failure chain

The live Supabase project contained seven existing `profiles` rows, all with `company_id = NULL`, after the approved public-schema reconstruction removed all company records. The schema's `current_company_id()` function correctly returns `profiles.company_id` for `auth.uid()`, so tenant-scoped policies intentionally reject every insert when a profile has not completed company onboarding.

The dashboard had a shared session-admission defect: `resolveAuthenticatedDashboardSession()` considered any profile row to be a usable ERP session, even when its joined `companies` record was absent. That let an authenticated, unprovisioned identity enter every module where RLS correctly denied writes. It also caused `resumeConfirmedSignup()` to mistakenly treat a bare profile as a completed onboarding result.

## Repair

The shared `hasResolvedCompany(profile)` predicate now requires a profile `company_id` and a matching database-joined company before a session can enter the ERP shell. Profiles without a resolved company are routed to the existing authenticated company-setup interface, which uses only the protected `create_company_and_owner` or `join_company_with_code` RPCs to assign tenant membership.

The PostgREST header helper now uses the stored user token only, refreshes an expiring token through the existing GoTrue refresh endpoint with a single in-flight refresh, and does not present the publishable key as a user Bearer token. Configured browser writes without a user session now fail with an explicit sign-in message rather than a misleading RLS error.

## Validation record

Focused dashboard regression tests passed: **39 passed**. A non-watch TypeScript check passed. A controlled live Supabase verification used two real confirmed Auth users and verified `auth.uid()` identity through `/auth/v1/user`, the expected bare-profile state before onboarding, tenant assignment by the protected RPCs, `current_company_id()` resolution, and database-derived `company_id` values.

The live verifier completed CREATE, READ, UPDATE, and DELETE for `pos_shifts`, `inventory_items`, `crm_contacts`, `finance_expenses`, `sales_invoices`, and `hr_employees`. It then verified `pos_shifts` persistence after a fresh password login, cross-tenant read denial, cross-tenant update denial, and tenant-scoped audit persistence. The controlled users and two QA companies were removed by the cleanup script after the checks.

The `/app` render check advances to the normal sign-in screen without a current client-side error. The terminated build was caused by development-only JSX location instrumentation being applied to the oversized dashboard source during production transformation. `vite.config.ts` now enables that plugin only for the Vite serve command. The full production build now completes successfully; its remaining dashboard chunk-size warning is advisory and does not prevent deployment.
