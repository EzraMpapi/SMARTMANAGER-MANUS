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

## Onboarding and bundle follow-up

Authenticated users with a valid profile but no database-resolved company now receive explicit company-setup recovery guidance. The message explains that the account is verified, that it must create a company or use a trusted join code, and that tenant access is assigned only by the protected setup RPC.

The preferences drawer, workspace presence badge, PDF export library, and XLSX import/export library now load on demand. The production dashboard entry chunk decreased from 5,279.45 kB to 4,423.33 kB before gzip, while PDF and spreadsheet code are emitted as separate chunks only requested by their related user actions. The core dashboard is still a single large module, so Vite's advisory chunk-size warning remains; deeper component extraction would be a separate, higher-risk refactor.

## Finance, CRM, and onboarding follow-up

The Finance executive dashboard and CRM/Sales executive dashboard are now supplied by the lazy-loaded `FinanceCrmExecutiveViews.jsx` module from both the home role lens and Analytics tabs. Their live rows and existing financial helpers remain explicit inputs; no database calls, tenant resolution, RLS rule, or authorization decision moved into the new module. The new chunk is 17.29 kB before gzip, while the main dashboard entry decreased further to 4,412.78 kB before gzip.

Authenticated users with no company association now also see an accessible, state-aware four-step company setup checklist. It distinguishes verified identity, creation versus trusted join-code path, required organization input, and the final protected setup action. Controlled live verification reconfirmed tenant onboarding, `current_company_id()` resolution, persistence, cross-tenant denial, and cleanup of all QA users and companies.

## Inventory, Procurement, and checklist-completion follow-up

The Inventory and Procurement operational executive surface now shares the same deferred executive-view module as Finance and CRM. It is lazy-rendered from both role-lens and Analytics entry points, receives existing live inventory and work-order rows as props, and keeps navigation callbacks in the parent. The initial dashboard entry is now 4,401.27 kB before gzip; all executive view panels together are deferred into a 30.92 kB chunk.

After a protected `create_company_and_owner` or `join_company_with_code` RPC succeeds, the dashboard now writes a user-local, UI-only onboarding completion marker. It records no company identifier and is never used for authorization; every login still derives tenant scope from `auth.uid()` and the database profile. This marker is intentionally not written when the protected setup call fails.

## HR, Sales, and completed-guidance preference follow-up

The HR operational executive panel now joins the already deferred Sales dashboard in the shared lazy executive-view module. Both home role lenses and Analytics use their lazy boundaries; the dashboard entry is now 4,394.56 kB before gzip, and deferred executive views total 41.04 kB. Data reads, write paths, and tenant decisions remain in existing parent components.

Settings now includes a per-user, browser-local control to hide or restore completed onboarding guidance. The preference is deliberately UI-only, stores no tenant ID, and never influences company lookup, role access, or RLS. Controlled verification again confirmed authenticated onboarding, persistence, cross-tenant denial, and removal of all QA records.

## Procurement workspace and deferred-module readiness follow-up

The Procurement detail workspace now loads from a separate 4.80 kB lazy chunk while retaining the existing parent-owned Supabase hooks, mutation functions, authorization inputs, and child panels. The main dashboard bundle remains 4,394.46 kB before gzip. This split changes only when the workspace code is downloaded, not which records can be read or written.

Settings now provides a compact deferred-module readiness panel. It lists local module readiness for Finance, Sales, Inventory, HR, Procurement, Preferences, and Presence after each workspace is opened. The registry is in-memory and browser-local; it sends no telemetry or tenant data. Controlled verification again confirmed onboarding, persistence, cross-tenant denial, and QA cleanup.
