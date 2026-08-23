# Smart Manager Full-System Implementation Matrix

**Audit basis:** `pasted_content.txt`, current repository source, migrations, protected server operations, contract tests, browser tests, CI configuration, and dependency audit.
**Status vocabulary:** `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `TESTING`, `PASSED`.
**Important:** A `PASSED` row means the repository contains verified code and automated contracts for the listed scope. It does not mean that a live Supabase migration, external provider, or production credential has been activated.

## System-first status

| Module / area | Feature scope reviewed | UI | Database | API | Security | Persistence | Testing | Integration | Status | Errors / blockers |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| System foundation | Vite, React, Express, tRPC, Supabase, Vercel, environment boundary, build scripts, dependency audit gate | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASSED | Production dependency audit is clean at high severity; local schema-gated build requires server-side Supabase variables by design |
| Authentication | Login, signup, refresh, logout, password recovery, OAuth/passkey readiness, session persistence, shared bearer headers | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | PASSED | Real OAuth providers and email delivery still depend on Supabase/provider configuration; standard and Supabase custom bearer headers now share one server extractor |
| Tenancy and authorization | Company/profile resolution, canonical roles, module entitlements, RLS-oriented procedures | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASSED | Live tenant-by-tenant persistence requires the controlled schema environment |
| Settings | Company profile, branding, timezone/currency, receipts, idle timeout, module settings, branches, departments | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | PASSED | Provider-specific email/SMS/API-key delivery remains configuration-dependent |
| Dashboard and navigation | Module catalog, role-focused home, lazy workspaces, accessibility, responsive shell | PASS | N/A | PASS | PASS | N/A | PASS | PASS | PASSED | Main dashboard bundle emits a non-fatal size warning |

## Core enterprise modules

| Module / area | Feature scope reviewed | UI | Database | API | Security | Persistence | Testing | Integration | Status | Errors / blockers |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| CRM | Contacts, leads, interactions, customer feedback, pipeline signals | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Requires broader authenticated CRUD walkthrough for every legacy screen |
| Sales | Quotations, invoices, subscriptions, returns, payments, customer interactions | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | External billing/provider paths remain separately gated |
| Inventory | Items, batches, stock, suppliers, warehouses, transfers, movements, audit | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Full import/export and concurrency walkthrough remains to be completed |
| Procurement | Purchase orders, suppliers, approvals, work-order evidence, expenses | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Downstream procurement consumers use recorded integration evidence, not fabricated acknowledgements |
| Finance and Accounting | Accounts, ledger, income/expenses, budgets, tax/VAT, reconciliations, reports | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Production reporting depends on intended schema being applied and real data |
| POS | Cashier flow, payments, returns, receipts, pending queue, reconciliation | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASSED | Live device/provider behavior needs controlled staging credentials |
| Reports and analytics | Operational dashboards, exports, scheduled reports, trend views, compliance backup status | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Email/report delivery remains provider-configured; CSV is the dependency-safe export path; backup endpoint reports database reachability separately and no longer claims PITR/snapshots without verification |
| HR / Employee Portal | Employees, attendance, payroll, benefits, leave, performance, self-service, secure team invitations | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Payroll and employee data require full tenant data walkthrough; legacy browser-only invite code and company-profile restoration paths were removed, while secure invitations use tenant-scoped server persistence |
| Maintenance | Requests, work orders, assignments, costs, alerts, maintenance evidence | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | External contractor/employee consumers are integration boundaries |

## Specialized verticals

| Module / area | Feature scope reviewed | UI | Database | API | Security | Persistence | Testing | Integration | Status | Errors / blockers |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Healthcare | Patients, visits, appointments, prescriptions, labs, reports, reminders, self-service | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | SMS and interoperability endpoints require provider configuration |
| Pharmacy | Drugs, stock, dispensing, suppliers, pricing, transaction history | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Full live inventory/dispensing walkthrough remains data-dependent |
| Microfinance | Clients, loans, savings, repayments, collections, approvals, schedules | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Financial persistence requires migration and controlled data |
| Bank & MFI | Accounts, loans, transactions, fixed deposits, standing orders, controls | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | External banking rails are not connected without approved provider adapters |
| VICOBA / SACCOS | Groups, members, meetings, loans, contributions, community records | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Broader end-to-end group accounting walkthrough remains |
| Community Groups | Groups, contributions, relationships, reporting, mutation checks | PASS | PASS | PASS | PASS | PASS | PASS | PASS | TESTING | Recent relationship/date hardening is covered by source contracts and CI |
| School Management | Classes, students, teachers, fees, exams, transport, dashboards | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASSED | Full per-school CRUD walkthrough remains outside automated browser scope |
| Hotel and Hospitality | Rooms, reservations, bookings, occupancy, receipts, operations | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | External channel/payment connections are not configured |
| Restaurant and F&B | Menu, tables, orders, reservations, payments, receipts | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | External delivery/payment connections are not configured |
| Fleet Management | Vehicles, trips, maintenance, telematics ingress, alerts | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Telematics provider and webhook secret are optional deployment configuration |
| Property Management | Portfolio, owners, buildings, plots, units, listings, leases, billing, maintenance, documents, insurance, budgets, reconciliation | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASSED | Migration is not applied to live Supabase; external payment/map/messaging adapters pending |
| Money Agent | Agents, customers, wallets, cash workflows, ledger, approvals, reconciliation, customer portal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASSED | Migration is not applied to live Supabase; real wallet/provider movement intentionally not invoked |

## Platform, commerce, collaboration, and compliance

| Module / area | Feature scope reviewed | UI | Database | API | Security | Persistence | Testing | Integration | Status | Errors / blockers |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| E-Commerce | Products, orders, storefront-oriented flows, customer records | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | No unapproved Shopify/provider activation was invented; external commerce boundary remains configuration-dependent |
| Marketing | Campaigns, customer segments, messages, analytics | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | External campaign delivery requires configured channel credentials |
| Customer Support | Tickets, chat/inbox, call log, metrics, escalation signals | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Automated external support execution remains intentionally disabled |
| Documents | Upload metadata, storage helper, signatures, document lists, exports | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | S3/storage configuration is required for live bytes; metadata workflows remain server-bound |
| Workflow Studio | Workflow configuration, approvals, tasks, integrations | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Full user-authenticated orchestration walkthrough remains |
| Collaboration | Messages, presence, read receipts, workflow signals | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Webhook/external collaboration delivery requires approved configuration |
| Integration Hub | Connection metadata, webhooks, provider boundaries, integration evidence | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | No provider credentials or endpoint assumptions are made |
| TRA / tax | VAT, tax reports, anomaly views, compliance-oriented workflows | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Live TRA submission requires approved credentials and controlled testing |
| AI Assistant | Assistant UI, prompt/routing boundaries, approvals, reporting helpers | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | TESTING | Model/API availability is deployment configuration; no fabricated answer or action is persisted |
| Subscription Billing | Catalog, checkout, subscriptions, provider boundary, webhooks | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL | BLOCKED | Existing HarakaPay account/credential authorization remains unresolved; no payment retry was performed |

## Immediate priority backlog

| Priority | Finding | Root cause | Safe action | Status |
|---|---|---|---|---|
| P0 | Production dependency audit originally reported 1 critical and 23 high findings | Direct `xlsx` dependency and vulnerable transitive ranges | Removed unused `xlsx` client import and replaced the full export with an escaped multi-section CSV; applied reviewed pnpm overrides and re-audited | PASSED: current production audit reports 0 vulnerabilities |
| P0 | Live Property/Money Agent persistence cannot be claimed | New migrations are source-ready but not applied to live Supabase | Apply only through a controlled migration/review window with backup and schema verification | BLOCKED pending authorization |
| P0 | Real external payment and subscription flows cannot be claimed | Provider credential/account authorization is unresolved | Rotate/configure approved server-side provider credentials, then test read-only and controlled sandbox paths | BLOCKED |
| P0 | Legacy invoice payment writes are not atomic or database-idempotent | The shared client helper inserts `sales_payments` and updates `sales_invoices` in separate calls; repository evidence does not establish a unique idempotency key or atomic payment RPC | Keep the client-side duplicate-reference guard, then add and apply a reviewed tenant-scoped database RPC/unique constraint in a controlled migration before claiming concurrent-safe payment posting | BLOCKED |
| P1 | Full manual CRUD coverage for every legacy module is not represented by automated browser tests | Large legacy surface and role/data prerequisites | Expand role-by-role Playwright journeys against isolated seeded contracts, then controlled authenticated staging | IN PROGRESS |
| P1 | CI dependency audit previously used `|| true` and CI used an older pnpm than the repository policy | Workflow treated audit failures as informational and could resolve workspace settings differently from local validation | Replaced suppression with a blocking `pnpm audit --prod --audit-level high` gate and pinned both CI jobs to pnpm 10.34.2, matching `packageManager`; clean frozen install and audit pass locally | PASSED |
| P1 | Backup endpoint previously returned `pitrEnabled: true` and `dailySnapshotAvailable: true` without checking Supabase settings | Database reachability was incorrectly presented as managed-backup verification | Return explicit database reachability plus `backupConfiguration: unverified`; require Supabase dashboard evidence for PITR/snapshot claims; guard the route to administrators | PASSED |
| P1 | Authentication header parsing differed between context, approval, and session-forwarding code | Valid `x-supabase-authorization` sessions were not consistently recognized by all paths | Introduced one shared bearer extractor and covered standard, custom, array, malformed, and context-fallback cases | PASSED |
| P1 | HR employee invite and portal identity controls used browser-only localStorage and the CRM had an undefined copied invite button | Legacy UI paths wrote `hr_invite_codes`/`ep_self_*` locally, swallowed the Supabase write, and CRM referenced undefined `showInvite` state | Migrate HR invitations to the existing tenant-scoped `teamInvitations` persistence and secure email acceptance flow; remove the copied CRM control; remove browser-only company profile restoration | PASSED |
| P1 | Employee noticeboard displayed static, stale announcements and a placeholder unread badge | `ANNOUNCEMENTS_SEED` was rendered regardless of tenant data and `newAnnouncementCount` was hard-coded to zero | Read published rows from tenant-scoped `hr_announcements`; expose explicit loading, unavailable, error, and empty states; remove the fake unread badge | PASSED |
| P1 | Integration settings optimistically claimed local success when server persistence failed | Connection fields updated browser state first and swallowed `integration_connections` update errors; missing storage still left controls interactive | Use the shared mutation boundary, require server-confirmed response data, roll back failed edits, show explicit error/unavailable copy, and disable controls when storage is unavailable | PASSED |
| P0 | Express 5 upgrade left unnamed wildcard routes and an incompatible global `path-to-regexp` override | SPA/storage route registration failed at runtime with `pathRegexp.match is not a function`; unnamed `*` paths are invalid in Express 5 | Upgrade Express dependencies, remove the incompatible global path-to-regexp override, use function middleware for SPA fallthrough, use a named storage splat, and cover route registration | PASSED |
| P1 | Property Management browser setup could race the responsive menu transition after remote dashboard changes | The test attempted to close a transient menu before opening it, so the close control could disappear between visibility and click | Open the navigation only when the existing open control is visible; isolated test and the full local browser suite pass | PASSED |
| P2 | Dashboard main bundle exceeds the warning threshold | Large legacy dashboard component and many imports; rebased build is approximately 3.81 MB minified | Continue safe code-splitting/decomposition as a separate performance workstream | TESTING |

## Acceptance interpretation

The repository has strong source-level and automated coverage for the authentication shell, shared bearer-token boundary, role/tenant boundaries, settings persistence, dashboard integration, Money Agent, Property Management, backup-status truthfulness, and the existing critical module contracts. The matrix deliberately does not mark the entire ERP as production-complete merely because the application compiles. The remaining work is chiefly controlled live migration/provider activation and broader authenticated, data-backed CRUD walkthroughs for legacy modules.

The next safe engineering step is to continue module-by-module with isolated authenticated browser journeys and settings/organization verification. Live provider calls, migration application, and production deployment verification must remain separately authorized operations.

## Profile Identity Center — 2026-08-23

| Capability | Status | Evidence and boundary |
|---|---|---|
| Premium responsive account popover | Implemented | `client/src/components/ProfileIdentityCenter.jsx`, integrated into the dashboard header while preserving search, theme, notifications, navigation, and mobile behavior |
| Dedicated My Profile experience | Implemented | Shell-level `profile` route with Overview, Personal, Work, Security, Preferences, and Activity sections |
| Verified profile read and self-only update contract | Source-ready / pending controlled migration | `server/profileIdentity.ts`, `profileIdentity` tRPC procedures, and `20260823_045_profile_identity_center.sql`; protected fields cannot be changed by the user |
| Avatar upload, preview, persistence, and removal | Source-ready / pending controlled migration and storage verification | Server magic-byte validation, 2 MB limit, `storagePut`, scoped key, avatar-reference RPC, and confirmed refresh; no browser localStorage source of truth |
| Work identity and HR linkage | Implemented with truthful empty state | Reads only tenant-scoped `hr_employees` linkage; does not infer branch, manager, title, or employee number |
| Security, notifications, preferences, and activity actions | Implemented / explicit limitations | Routes to existing security/settings/notifications surfaces; only server-returned activity is shown; device/session listing and workspace switching are explicitly unavailable |
| Focused profile tests | Passed | 7 service tests plus 4 source-contract tests |
| Full validation | Passed | Frozen install, production audit, TypeScript, 779 Vitest tests with 13 skips, and 23 isolated Playwright tests |
| Live migration or deployment | Controlled / not executed | Requires authorized migration review, schema verification, tenant staging persistence test, storage confirmation, and deployment approval |

The profile implementation is not represented as live-complete until the controlled migration is applied and verified against the intended Supabase project. The source-ready contract is deliberately fail-closed before that point.
