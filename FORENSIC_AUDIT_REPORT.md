# Smart Manager Full-Project Forensic Audit

**Author:** Manus AI
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Branch:** `main`
**Audit basis:** the user-supplied `pasted_content.txt`, repository source, configuration, migrations, tests, and deployment validation.

> This report records only non-secret findings. No HarakaPay API key, Supabase secret, session token, wallet balance, provider order ID, or other credential is included.

## A. Discovered

The repository is a large existing ERP product rather than a single dashboard page. The initial inventory found **693 non-`.git`/`node_modules` files**, including 256 server files, 141 client files, 61 SQL files, 126 Markdown documents, and the full Vite/Express/tRPC/Supabase/Vercel deployment surface. The inventory and feature map are preserved in the working audit artifacts outside the source tree; the principal product contracts are linked in the References section below.

The product contains public authentication and onboarding, a tenant-aware authenticated dashboard, role-based navigation, settings and entitlements, subscription billing, CRM, sales, inventory, procurement, finance, reports, HR, manufacturing, supply chain, marketing, e-commerce, POS, documents, projects, support, analytics, notifications, activity, integrations, workflows, collaboration, TRA, AI, microfinance, VICOBA/community, healthcare, school, pharmacy, hotel, fleet, banking, restaurant, employee portal, and presentation-progress surfaces. Many of these are lazy-loaded or mounted from the dashboard switchboard rather than exposed as separate URL pages.

| Classification | Findings | Treatment |
|---|---|---|
| Visible and working | Authentication shell, dashboard shell, module switchboard, protected tRPC/API services, tenant-scoped persistence, billing UI, and most domain workspaces | Preserved and regression-tested |
| Hidden or conditional but implemented | Role-scoped modules, settings panels, passkey readiness, onboarding choices, portals, provider-readiness panels, and billing access | Existing permission logic preserved; casing defects were corrected |
| Disabled by design | Email delivery without an approved sender, automatic support execution, provider-dependent payment dispatch without usable credentials, and live-only features without configured services | Kept disabled with truthful user-facing states |
| Backend-only or protected | Supabase schema verification, server-side billing configuration, webhook handling, tenant profile resolution, protected exports, and server-confirmed mutations | Kept behind server/auth boundaries |
| Placeholder/demo | Explicit demo mode, preview-only Daily Briefing state, and narrowly scoped fallback `ComingSoon` component | Not promoted to production truth and not used to fabricate records |
| Orphaned or stale code | A legacy login JSX return after the active `EnterpriseLoginView` return; an unused realtime hook with an unnecessary compiler suppression | Dead login markup removed; suppression removed without deleting the hook |

The attached instructions required a discovery-first approach. Accordingly, the audit examined routing, the primary dashboard catalog and switchboard, auth/session storage, role definitions, protected persistence helpers, server route registration, billing/HarakaPay handlers, migrations and RLS-oriented contracts, conditional rendering, hidden/disabled markers, loading/error/empty states, build configuration, and CI gates before code changes were made.

## B. Restored

No legitimate module was deleted or replaced with a mock. The principal exposure repair was role normalization. Supabase profile data can contain legacy lowercase values such as `owner`, while the dashboard role catalog uses `Organization Owner`. Previously, an unmatched role could fall through to the first role in the catalog, which was `Super Administrator`. The new resolver maps known legacy aliases to their intended catalog roles and maps unknown values to the least-privileged `Employee` definition.

The repair now applies the canonical role to the dashboard home view, Settings, passkey readiness, role-change review, Daily Briefing eligibility, duty approvals, support configuration, POS reconciliation export, market-intelligence visibility, external-portal routing, and other previously raw-role UI gates. The existing server-side authorization and RLS boundaries were not weakened or bypassed. The existing `School Administrator` browser-tested role was also restored to the catalog with school-scoped module access, rather than treating it as an unknown profile or granting it a privileged fallback.

The active production login view remains `EnterpriseLoginView`. The unreachable legacy JSX after its unconditional return was removed, and the existing dashboard integration assertions were moved to the active authentication component rather than preserving dead code solely to satisfy stale tests. The previously fixed billing changes remain intact: normalized owner access and direct paid checkout with an explicit free-trial alternative.

## C. Fixed

The following implementation changes were made in this audit:

1. Added `canonicalRoleId()` and `roleDefinitionFor()` to resolve role aliases case-insensitively and to use a least-privilege fallback for unknown roles.
2. Replaced raw-role comparisons in the affected dashboard access, settings, passkey, approval, briefing, support, POS, market-intelligence, and portal branches with canonical-role checks.
3. Removed unreachable legacy login markup while preserving the active login flow, OAuth recovery, passkey entry, password recovery, onboarding, and session behavior.
4. Removed an unnecessary `@ts-ignore` from `client/src/hooks/useSupabaseRealtime.ts`; its runtime behavior was unchanged.
5. Updated source-contract tests to assert active implementation locations and added behavioral coverage for `owner`, `ADMIN`, case-insensitive manager roles, and unknown-role least privilege.
6. Removed unconditional `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` placeholders from `client/index.html`. Vite now injects the analytics script only when both optional public settings exist, preventing broken production URLs and undefined-variable build warnings while retaining analytics for configured deployments.
7. Lifted the report-schedule query out of a role-specific JSX IIFE into Dashboard’s unconditional hook section. This fixed React error 300 when the initial default role resolves to a School Administrator and preserved the schedule badge’s existing behavior.
8. Marked the off-canvas sidebar `aria-hidden` while closed, preventing hidden menu controls from entering accessibility queries or intercepting the top-bar menu button.

No Supabase migration, RLS policy, payment record, webhook, scheduled route, unrelated Vercel variable, or provider mutation was introduced by this audit.

## D. Improved

The work focused on correctness and production truthfulness rather than an unnecessary visual redesign. The login and dashboard architecture remains intact, heavy workspaces remain lazy-loaded, and the existing loading, empty, error, retry, confirmation, and permission states remain the source of truth. The role fix improves discoverability for authorized users while reducing the risk that an unknown or malformed role receives a privileged client-side presentation.

The production HTML now has a clean optional-analytics boundary. With analytics variables absent, no invalid script URL is emitted. With both variables present, the existing Umami-compatible script is inserted into the document body using the configured endpoint and site identifier.

One non-blocking performance warning remains: the main `BusinessSphereDashboard` bundle is larger than the configured 2.5 MB warning threshold. The current build already code-splits several heavyweight workspaces and export libraries; additional dashboard decomposition is a separate optimization project and was not attempted as a destructive refactor during this audit.

## E. Security

Server-only secrets remain server-only. HarakaPay configuration continues to use Vercel-sensitive environment variables and is not present in client code, tests, Markdown, build artifacts, or Git history. Supabase service credentials remain outside the browser bundle. The existing authentication, tenant resolution, server-confirmed mutation, payment-state, callback, and RLS-oriented controls were preserved.

The billing flow remains safe at the external-provider boundary. The existing failed Simba SC payment request remains failed; no automatic retry, collect request, fake webhook, fabricated completion, or subscription activation was performed. Read-only HarakaPay balance checks were used for validation, and the provider credential failure was not bypassed. The credential previously shared in chat should be revoked or rotated independently of this repository push.

## F. Tested

| Validation | Result |
|---|---:|
| TypeScript check (`pnpm check`) | Passed |
| Full Vitest suite (`pnpm test`) | **172 passed, 5 skipped; 681 passed, 8 skipped** |
| Focused dashboard/auth/billing/security contracts | Passed; 91 tests in the final focused run |
| Frontend compilation | Passed; 2,665 modules transformed |
| Complete Playwright browser suite | **16 passed** |
| Server index bundle compilation | Passed |
| Server API bundle compilation | Passed |
| Vercel production build path (`VERCEL=1 pnpm build`) | Passed |
| Local schema-gated build without Supabase credentials | Intentionally blocked by the repository guard |
| Catalog/public-config/health runtime checks from the authorized Production validation | Passed in the prior runtime validation |
| HarakaPay authenticated balance runtime check | **HTTP 502**; provider credential/account authorization remains unresolved |

The Vercel build path reports a deliberate schema-verification skip when server-only Supabase credentials are not present in the local build environment. The CI workflow still requires the managed `VITE_SUPABASE_URL` and `SUPABASE_SECRET_KEY` values, so this behavior does not disable the CI schema gate.

The browser session was not used to issue any payment operation during this audit. The complete repository Playwright suite passed 16 tests, including authentication gateway, responsive workspace, role-restricted actions, portal views, and the restored School Management journeys. A full manual CRUD walkthrough across every module remains dependent on a usable authenticated browser session and the external provider credential; automated source and runtime contracts passed for the repaired areas.

## G. Remaining

The exact external blocker is HarakaPay authorization. The live application reaches the documented provider boundary but the protected balance check still returns HTTP 502 after redeployment, which means the provider credential/account is not yet accepted by the provider-facing route. An authorized production HarakaPay credential must be saved only in Vercel as `HARAKAPAY_API_KEY`, followed by a redeploy and a successful read-only balance check. Only after that check returns HTTP 200 should a fresh exact confirmation be requested for the one Simba SC Monthly TZS 4,500 USSD request to the phone ending 8007.

The local default `pnpm build` also requires `SUPABASE_URL` or `VITE_SUPABASE_URL` plus `SUPABASE_SECRET_KEY`; this is intentional because the schema guard refuses to run without the required server-side inputs. The managed Vercel build path passed with its documented guard behavior.

The Production build still emits a non-fatal large-chunk warning for the main dashboard bundle. Optional analytics are now cleanly disabled when not configured rather than leaving placeholder URLs.

## H. Final status

# NOT YET PRODUCTION READY

The repository code, tests, and Vercel build path are in a validated state, but the complete requested payment/subscription objective is not production-ready because the external HarakaPay credential has not passed the read-only balance authorization check. No payment retry was performed, and no payment or subscription outcome was fabricated. The next safe step is credential replacement and read-only verification, followed by a separate fresh user confirmation before any real USSD collection.

## References

[1]: ./README.md "Smart Manager repository scope and product documentation"
[2]: ./package.json "Project scripts, dependencies, and build commands"
[3]: ./.github/workflows/ci.yml "CI quality gates and required managed secrets"
[4]: ./vite.config.ts "Vite build, optional analytics injection, and deployment configuration"
[5]: ./client/src/BusinessSphereDashboard.jsx "Dashboard modules, roles, navigation, and active-module switchboard"
[6]: ./client/src/components/EnterpriseAuthViews.jsx "Active authentication and recovery views"
[7]: ./server/subscriptionBilling.ts "Server-side subscription and HarakaPay boundary"
[8]: ./server/verifySupabaseSchema.mjs "Supabase schema verification guard"
[9]: ./client/src/components/SubscriptionBillingWorkspace.jsx "Subscription billing UI and checkout flow"
