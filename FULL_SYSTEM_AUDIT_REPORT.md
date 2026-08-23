# SMARTMANAGER-MANUS Repository-Wide Production-Readiness Audit

**Author:** Manus AI
**Audit date:** 23 August 2026
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Working checkout:** `/home/ubuntu/SMARTMANAGER-MANUS-audit`

## Executive conclusion

The repository now has a substantially stronger system foundation and a verified set of security, persistence-boundary, UI-truthfulness, and runtime-compatibility corrections. The companion [`FULL_SYSTEM_IMPLEMENTATION_MATRIX.md`](./FULL_SYSTEM_IMPLEMENTATION_MATRIX.md) is the authoritative live tracker for module-level status. A `PASSED` entry means that the source contract and automated verification for that scope pass; it does **not** mean that a live Supabase migration, external provider credential, or production deployment has been activated.

The project is **not yet production-complete**. The remaining blockers are controlled operational steps rather than claims that can be safely fabricated in this environment: live Supabase migration application for the Property Management and Money Agent schemas, approved provider/account authorization for external payment and subscription flows, a database-atomic/idempotent legacy invoice-payment RPC, and authenticated end-to-end CRUD walkthroughs across the large legacy module surface.

## Audit sequence and evidence model

The review followed the requested order: **SYSTEM → AUTHENTICATION → SETTINGS → MODULES → FEATURES → DATABASE → APIs → UI ACTIONS → INTEGRATIONS → TESTING → DEPLOYMENT**. Evidence was taken from current source, migrations, server operations, contract tests, browser tests, build output, and dependency-resolution output. No live database write, migration application, provider transfer, payment collection, or external completion was performed.

| Area | Verified repository result | Current limitation |
|---|---|---|
| System and deployment contract | Vite, Express, tRPC, Supabase environment boundaries, Vercel configuration, package policy, and blocking dependency audit are present and buildable | Live deployment verification remains pending; the local build intentionally skips server-only schema verification when deployment credentials are absent |
| Authentication and tenancy | Shared bearer-header extraction, protected tRPC context, verified-profile feature boundaries, role checks, and existing RLS-oriented contracts are covered | Live tenant-by-tenant Supabase verification was not performed |
| Settings and organization | Company profile, branding, module settings, branches, departments, and secret-redaction paths remain server-backed and contract-tested | Provider-specific delivery settings depend on deployment configuration |
| Modules and features | Core and specialist modules have source-level contracts, with Property Management and Money Agent included | Broad authenticated CRUD walkthroughs against real tenant data remain incomplete |
| Database and persistence | New migrations and guarded operations are source-ready; legacy browser-only HR/company-profile paths were removed or replaced | New migrations were not applied to live Supabase; the legacy invoice payment path still needs an atomic database RPC and durable idempotency constraint |
| APIs and UI actions | Critical route, auth-header, backup, payment-reference, integration-setting, and Express runtime paths were tested | External provider APIs and live callbacks remain intentionally uninvoked |
| Integrations and automation | Scheduled handlers, webhook contracts, notification persistence, storage proxy, and provider boundaries are covered | Credentials, provider authorization, and production callback delivery were not verified |

## Verified changes in this audit

### Dependency and CI hardening

The unused vulnerable `xlsx` client dependency was removed. The dashboard export now produces an escaped, multi-section CSV without introducing a replacement spreadsheet vulnerability. Direct dependency floors and active workspace overrides were reviewed, the package-manager policy was pinned to pnpm 10.34.2, and the CI dependency audit is now blocking at high severity instead of being suppressed with `|| true`.

The final local production dependency audit returned **no known vulnerabilities**. The clean frozen-install check also passed. The repository still reports a non-blocking peer warning for `@builder.io/vite-plugin-jsx-loc` expecting Vite 4/5 while the project uses Vite 7; this is recorded as maintenance debt rather than hidden.

### Express 5 runtime correction

Express was upgraded to the 5.x runtime and matching `@types/express` definitions. During validation, a real runtime defect was found: the global `path-to-regexp` override had forced Express 5's router onto an incompatible legacy API, and unnamed wildcard routes were not valid under Express 5. The incompatible override was removed; the Vite SPA fallthrough now uses function middleware; and the storage proxy uses a named wildcard with array-valued path reconstruction. The complete API app was also constructed successfully in a local runtime smoke check.

This follows Express's documented Express 5 routing rules, where wildcard parameters must be named and are captured as path-segment arrays [1].

### Authentication, authorization, and backup truthfulness

A shared bearer-token extractor now gives request context, approval verification, report scheduling, and session forwarding the same standard and custom Supabase authorization-header behavior. The administrator backup-verification route now rejects non-administrator sessions. The backup response reports only database reachability and explicitly marks managed backup/PITR configuration as unverified; it no longer claims that Supabase-managed settings were checked without evidence.

### Legacy UI persistence and truthful controls

The HR employee invitation flow was migrated from browser-only invite codes and local identity storage to the existing tenant-scoped secure team-invitation persistence path. The copied CRM invite control that referenced undefined state was removed. The legacy company-profile localStorage bootstrap was removed so authenticated workspaces do not restore business identity from browser data. The employee noticeboard now reads published tenant-scoped `hr_announcements` rows and shows explicit loading, unavailable, error, and empty states; its fake unread badge was removed.

The Integration Hub now refuses to present unavailable connection storage as editable persistence. When storage is unavailable, controls are disabled and the UI states that no local copy is treated as saved. When an update is attempted against available storage, the client uses the shared mutation boundary, requires server-confirmed response data, rolls back the optimistic field on failure, and displays an explicit error.

### Financial safeguard

The shared invoice payment helper now rejects a payment reference already present in the loaded invoice history before attempting a write. This is a useful client-side duplicate safeguard, but it is **not** a substitute for concurrency-safe database idempotency. The matrix therefore keeps the legacy invoice payment atomicity item at `BLOCKED`: the current path still performs a `sales_payments` insert and `sales_invoices` balance update as separate calls, and repository evidence does not establish a unique idempotency key or atomic RPC.

## Validation evidence

| Validation | Result |
|---|---:|
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm audit --prod --audit-level high` | Passed; 0 known vulnerabilities |
| `pnpm check` | Passed |
| Focused audit and integration contracts | Passed; 20 files and 183 tests in the final focused integration run |
| Full Vitest suite | Passed; 187 files passed, 5 skipped; 751 tests passed, 13 skipped |
| `VERCEL=1 pnpm build` | Passed; client and API bundles generated |
| Production browser suite | Passed; 19 of 19 Playwright journeys passed after making the Property Management menu setup visibility-aware |
| API-app runtime construction | Passed; Express API app constructed under the upgraded runtime |
| Main dashboard bundle size | Non-fatal warning; approximately 3.81 MB minified on the rebased build, retained as performance backlog |

The browser suite verified authentication/recovery and signup journeys, role-restricted workflows, healthcare, pharmacy, microfinance, Money Agent, Property Management, School Management, session recovery, and mobile-breakpoint behavior. These are automated browser journeys, not proof that every legacy CRUD action has been exercised against a live tenant database.

## Remaining blockers and controlled next steps

| Priority | Remaining item | Why it remains open | Required next action |
|---|---|---|---|
| P0 | Live Property Management and Money Agent persistence | Their migrations are source-ready but were intentionally not applied | Obtain controlled authorization, back up the target project, apply migrations, run schema verification, and perform tenant-scoped staging CRUD tests |
| P0 | External payment/subscription/provider completion | Provider account authorization and approved server-side credentials are unresolved | Configure approved credentials, test only controlled sandbox/read-only paths, and verify callbacks without representing pending states as success |
| P0 | Atomic and concurrent-safe legacy invoice payments | Current implementation uses two separate database writes and has no repository-proven durable idempotency key/RPC | Design, review, and apply an additive tenant-scoped migration with a unique idempotency constraint and atomic RPC; then update the client to call it |
| P1 | Full authenticated module CRUD coverage | The legacy dashboard has a very large role- and data-dependent surface | Expand isolated Playwright journeys by role and workflow, then repeat against controlled staging data |
| P2 | Main dashboard bundle size | The legacy monolithic component remains a large chunk | Decompose or safely code-split after persistence and live-environment blockers are addressed |
| P0 | Push and CI verification | The final remote synchronization attempt was rejected because the configured GitHub CLI credentials are invalid | Re-authenticate the GitHub CLI, fetch/rebase `main`, stage only reviewed changes, push normally, and monitor the resulting CI run |

No migration, payment, provider call, or deployment was performed merely to turn any of these rows green.

## References

[1]: https://expressjs.com/en/5x/guide/routing/ "Express 5 Routing Guide"

[2]: https://expressjs.com/en/guide/migrating-5/ "Express 5 Migration Guide"
