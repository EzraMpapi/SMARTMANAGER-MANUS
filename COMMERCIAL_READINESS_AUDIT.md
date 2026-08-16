# Smart Manager ERP Commercial-Readiness Audit

## Scope and operating rules

This document records an evidence-based audit and remediation program for the Smart Manager ERP. The review prioritizes **security, tenant isolation, data integrity, and reliable server persistence** over cosmetic refactoring. No row-level security policy will be weakened, no service credential will be exposed to the browser, and no destructive database change will be made without separately verified evidence.

## Architecture map — baseline

| Layer | Current implementation | Audit focus |
| --- | --- | --- |
| Public experience | React 19 and Vite 7 landing page at `/`; Wouter routing; centralized theme and language providers. | Responsive sign-in entry, accessibility, error recovery, and production asset loading. |
| Authenticated ERP | `/app` lazy-loads the preserved `BusinessSphereDashboard.jsx` application boundary, currently approximately 48,250 lines. | Route readiness, module loading, shared state, confirmed persistence, and module-level usability. |
| Authentication | Supabase email/password, OAuth, recovery, and native passkeys; browser session persistence supports remembered and session-only sessions. | Session handoff, expiry/refresh behavior, recovery, configuration, and unauthorised-path safety. |
| API layer | Express 4, tRPC 11, and authenticated server procedures. | Input validation, role authorization, tenant assertions, audit logging, and error truthfulness. |
| Tenant data layer | Supabase PostgreSQL with authenticated RLS pathways and `current_company_id()` resolution; server-only service role is reserved for bounded administrative actions. | Company membership, RLS isolation, forged company identifier handling, and sensitive role changes. |
| Operational storage | Supabase migrations include baseline ERP schema, guarded tenant bootstrap, preferences, POS sale/return/customer-credit/synchronization engines, and RPC privilege hardening. | Schema drift, migration integrity, POS/inventory/accounting interactions, and real persistence. |
| Application metadata | Drizzle/MySQL tables support project-owned schedules, invitations, audit records, webhook delivery history, and monitoring metadata. | Job ownership, delivery truthfulness, administration authorization, and error recovery. |
| Scheduled operations | HTTP scheduled handlers exist for dashboard reports and schema-drift monitoring. | Idempotency, authorization, task identity, delivery status, and failure handling. |
| Verification surface | 70 server-side test files discovered; 65 files / 213 tests pass at baseline, with 5 files / 8 tests intentionally gated for unavailable live credentials or controlled environments. | Replace only safely reproducible gaps with focused tests; do not mistake source-string coverage for live acceptance evidence. |

## Baseline evidence

| Check | Result | Interpretation |
| --- | --- | --- |
| TypeScript | Passed (`pnpm check`) | No current static type errors. |
| Automated regression suite | Passed: 65 files / 213 tests; 5 files / 8 intentional skips | Broad regression baseline is available, but gated tests do not constitute live-provider or independent-tenant acceptance. |
| Project structure | 104 client source files, 108 server TypeScript files, 70 discovered test files | The system includes a substantial preserved dashboard boundary and modular server services. |
| Production delivery status | Existing published checkpoint is available before this audit cycle | Any remediation will be isolated in a new checkpoint after validation. |

## Known constraints at audit start

The quarterly security-review email path remains disabled. Resend has been approved by the project owner, but the configured sender candidate is not a syntactically valid email identity and was not eligible for verification. No quarterly email has been sent and no delivery success has been reported.

The audit must distinguish verified production behavior from automated coverage. In particular, independent second-tenant acceptance and live third-party provider tests require controlled identities or verified credentials and will remain explicitly reported as gated until the required evidence is available.

## Static-risk audit — initial verified findings

| Severity | Finding | Evidence | Required remediation boundary |
| --- | --- | --- |
| High | A WhatsApp Business access token is read from and written to browser `localStorage`. | `BusinessSphereDashboard.jsx` exposes a client-side API settings panel that persists `wa_api_token`. | Remove browser credential persistence and direct credential use. Retain a truthful external-link workflow unless a server-side, approved WhatsApp integration is configured. |
| High | The WhatsApp preview turns untrusted message text into HTML and renders it through `dangerouslySetInnerHTML` without sanitization. | `formatPreview()` inserts `<strong>`, `<em>`, and `<br>` around raw input before both message and compose previews are rendered. | Replace raw HTML preview construction with safe React text/formatting nodes; add adversarial XSS regression coverage. |
| High | Numerous direct ERP table mutations bypass the shared confirmed-mutation helper, and several use empty `catch` blocks or claim a local save after a failed server operation. | Static scan identified 132 direct `sb(...).insert/update/delete/upsert` call sites, including unreported failures in VICOBA, community, healthcare, education, pharmacy, banking, HR, feedback, and communication flows. | Route persistent business writes through a shared confirmed-response path, starting with silent-failure and false-success flows. Preserve form input for retry and never treat local state as durable data. |
| Medium | The preserved dashboard has a demo-seed fallback whenever Supabase configuration is absent. | `useCompanyTable()` returns seed rows when `IS_CONFIGURED` is false; the demo entry is only presented in the unconfigured path. | Ensure production deployments without Supabase configuration fail closed with a clear configuration error, not seed operational data. Keep any local demonstration mode explicit and development-only. |
| Medium | The dashboard remains a very large single-file application boundary. | `BusinessSphereDashboard.jsx` is approximately 48,250 lines and contains the shared data wrapper plus extensive module implementations. | Do not perform a cosmetic rewrite. Incrementally extract verified, high-risk persistence and presentation helpers after functional remediation is covered. |

The static scan found no browser references to the Supabase service-role key, Resend API key, JWT secret, or server `process.env` values. This is a positive baseline result, not evidence that the external-integration surface is complete.

## Authentication and tenant authorization audit — verified finding

The role-change and compliance-export paths verify the Supabase access token and resolve the active profile before using its `company_id`. However, the older `auditLogs.list` and `auditLogs.record` tRPC procedures accept a browser-supplied company identifier and read or write the project-managed audit-log database directly without comparing that identifier to the profile resolved from the authenticated Supabase session. Because this database path does not inherit Supabase RLS automatically, the missing server assertion is a **high-severity cross-tenant authorization gap**. The next phase will require the verified profile company for both procedures and add a forged-company regression test.

### Remediation status

The audit-log procedures now resolve the Supabase profile from the forwarded active session before any project-managed audit read or write. A request whose `companyId` differs from the verified `profile.company_id` receives `FORBIDDEN`; the database query is not reached. Audit writes now record the verified profile identity rather than relying only on the tRPC session identity. Focused regression coverage proves that forged company identifiers are rejected for both reads and writes, and TypeScript validation passes.

## Core workflow audit — evidence matrix

| Workflow area | Evidence reviewed | Current assessment | Limitation or risk |
| --- | --- | --- | --- |
| POS, sale, return, cash reconciliation, and stock restoration | 99 focused POS and dashboard integration tests passed, including transaction engine, return engine, privilege hardening, post-confirmation fallback, reconciliation, and receipt refresh paths. | The audited POS engine has the strongest server-confirmed workflow coverage in the current system. | The controlled live dashboard persistence test remains gated because an independent authenticated staging session is not available in this cycle. |
| AI action and role approvals | 5 focused approval tests passed. Both paths resolve verified Supabase profiles; independent role approval and self-approval rejection are covered. | Server-gated approval lifecycle is present. | Downstream action handlers must not return a success message until the underlying business write is confirmed. |
| Reporting and scheduled operations | 8 report, schedule, tenant-audit, and delivery-state tests passed. | Server-backed schedule controls and truthful disabled email state are covered. | Quarterly Resend delivery remains intentionally disabled until a valid verified sender is supplied. |
| Sales, invoices, quotations, finance expenses, HR leave, documents, support, and specialist modules | Direct handler review identified preemptive local state updates followed by direct Supabase writes and catch blocks that preserve a local successful-looking item after a rejected request. | **High risk: not commercially acceptable for permanent business records.** | These flows require a shared confirmed-write migration and module-by-module regression coverage; they are not represented as server-persistent in the final readiness status. |
| Purchasing, inventory, HR, and finance at large | Dashboard integration tests exercise broad mapping and rendering contracts. | Useful regression signal exists. | No independent live end-to-end acceptance evidence is available for all advertised workflows in the current controlled environment. |

The static workflow review confirmed false-success language and behavior in representative lead creation, stock adjustment, invoice settlement, expense recording, leave approval, invoice/quotation creation, workflow creation, feedback, support, document, VICOBA, community, healthcare, education, pharmacy, banking, and HR action handlers. The legacy AI direct-executor branch containing several such writes is presently guarded by an explicit unconditional block; it cannot execute under the active approval-only AI contract. It remains technical debt for later removal, while active non-AI handlers remain remediation priorities rather than being hidden by a generic “offline” label.

### Completed client-security remediation

The WhatsApp Center no longer accepts, persists, or uses a browser-side provider token. It is now an explicit user-controlled `wa.me` handoff only, so a message is not represented as an API delivery. The activity log is written only after the Supabase insert returns a confirmed record; failure is disclosed as an unsaved activity record. The preview now renders WhatsApp emphasis as React nodes rather than transforming user text into HTML. Focused tests confirm that browser credential storage, direct Graph API calls, and the unsafe message-preview sinks are absent.

## Responsive and accessibility review — representative evidence

The public landing page and unauthenticated workspace entry were reviewed at 1280px and 390px viewports. The primary launch, passkey, recovery, credential, and provider actions remained visible, non-overlapping, and touch-reachable. Focused automated coverage for responsive authentication evidence, mobile matrix cases, login behavior, table controls, and keyboard-oriented module controls passed (21 tests).

The visual review identified one **medium-priority design-consistency opportunity**: the public marketing surface uses a small dark-navy/gold command-center mark, while the workspace sign-in panel uses a much larger green illustrated identity. Both preserve the official logo asset and remain usable, but a future dedicated brand-system pass should harmonize mark scale, green/gold hierarchy, and the “connected command center” visual motif across public and authentication views. This is not a functional, security, or persistence blocker.

## Performance and large-data readiness assessment

The production build succeeds. Public authentication remains separately lazy-loaded at approximately 4.92 kB minified, and smaller Sales Detail and Predictive Analytics boundaries remain isolated. The authenticated dashboard boundary is still approximately 6.13 MB minified (1.10 MB gzip), which is a material performance risk for slower networks and lower-memory devices. The audit does not perform a large speculative split of the 48k-line preserved dashboard because that could destabilize confirmed persistence and POS workflows.

The next safe performance step is to use production route telemetry and real authenticated navigation evidence to identify the highest-cost module boundaries, then extract one independently testable module at a time. The current project already avoids server ports being hard-coded, uses deferred dashboard loading at `/app`, and retains explicit query retry/error handling. Large-data pagination, all-module server filtering, and authenticated route load measurements remain future validation work rather than claims of completed scalability.

## Re-audit and regression evidence

The completed remediation set was rechecked for the removed browser WhatsApp token, direct Graph API calls, and the two unsafe WhatsApp preview sinks; none remain in application source. The verified audit-log authorization guard is present on both legacy list and record procedures.

The final automated regression run passed **67 test files and 219 tests**. Five test files containing eight tests remain intentionally gated: controlled live dashboard persistence, Resend sender verification pending a valid sender identity, live AI provider verification, and live Supabase configuration/credential checks. Production bundling and TypeScript validation pass. These gates are reported as evidence limitations, not as passing live acceptance.

### Final integrity remediation: marketing campaigns

The campaign workflow previously created random open and click rates when a user selected “Sent,” and changed campaign rows before the server acknowledged create, transition, or deletion. That behavior could present invented business performance and an unconfirmed campaign state. The workflow now prevents a campaign from being marked sent until a real delivery integration exists, keeps engagement metrics unset, and changes local campaign state only after a confirmed server response. The campaign form remains open after a server rejection so the user can correct or retry the submitted information. Focused campaign-integrity tests and TypeScript validation pass.

## Next audit cycle

The next phase performs a codebase-wide static risk scan for persistence fallbacks, silent errors, placeholder content, hardcoded tenant identifiers, insecure credential handling, unresolved markers, and duplicated or obsolete paths. Findings will be classified by severity and remediated only after reproduction or contract evidence is established.
