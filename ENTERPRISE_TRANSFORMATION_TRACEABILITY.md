# Smart Manager ERP Enterprise Transformation Traceability Map

## Purpose and evidence standard

This map translates the requirements in `pasted_content_3.txt` into the current Smart Manager implementation state. A requirement is marked **Verified** only when current code and automated or authenticated browser evidence support the claim. **Gated** means that the relevant live test requires a controlled identity, verified provider configuration, or production data that is not available in this task. **Remediation queued** indicates a verified mismatch that will be addressed in this transformation cycle. **Not claimed** means the feature may be represented in the UI but has not met the requested end-to-end evidence standard.

## Cross-cutting enterprise requirements

| Requirement area | Current state | Evidence or implementation boundary | Status |
| --- | --- | --- | --- |
| Architecture discovery | React/Vite client, Express/tRPC server, Supabase tenant data, Drizzle project metadata, Heartbeat scheduling, and a lazy `/app` boundary are mapped. | `COMMERCIAL_READINESS_AUDIT.md`; current source and test inventory. | Verified |
| Server-confirmed persistence | Shared Supabase mutation wrapper emits confirmation/failure events and restores bound tables from confirmed server data after rejected writes. | `companyMutationBus`, `notify()` normalization, dashboard integration coverage. | Verified with legacy-handler debt |
| Authentication and recovery | Password, OAuth, reset, remembered/session-only persistence, proactive refresh, passkeys, and onboarding flows are implemented. | Auth, mobile-auth, passkey, and session-refresh tests. | Verified at automated/UI level; provider paths remain configuration dependent |
| Tenant authorization and RLS | `current_company_id()` design, Supabase authenticated client usage, verified profile checks for approvals, and tenant-scoped audit exports are present. | Live JWT test is safely gated; forged company audit-log checks are covered. | Verified with independent second-tenant live test gated |
| Secrets and credentials | No Supabase service key, Resend API key, JWT secret, or direct WhatsApp provider token remains in browser source. | Static re-audit and security regression coverage. | Verified |
| Error handling | Rejected local-save messaging is normalized to a truthful server-not-confirmed state; POS flows preserve correct retry/reconciliation semantics. | Integration, POS, and toast-boundary coverage. | Verified for shared paths; module-by-module live evidence remains limited |
| Offline behavior | Business writes are not represented as a durable offline queue. The dashboard pauses/rolls back rejected writes rather than reporting them saved. | Shared mutation bus and persistence guard. | Verified boundary |
| Scheduled automation | Server schedule service owns tenant authorization, persistence, Heartbeat task lifecycle, and manual run requests. | `reportSchedules.ts` service tests. | Verified service; legacy client UI requires reconciliation |
| Transactional email | Delivery is intentionally disabled and reports an honest unsent state. | `transactionalEmail.ts` and gated sender verification test. | Verified disabled state; activation blocked by missing organization-owned verified sender |

## ERP module traceability

| Module or workflow | Current evidence | Required next action | Status |
| --- | --- | --- | --- |
| Executive dashboard | KPI, chart, filter, activity, preferences, currency, timezone, and accessible loading boundaries are implemented. | Reconfirm that only confirmed live data is represented in all KPI variants. | Under audit |
| Point of Sale | Sale/return transaction engine, stock restoration, idempotency, receipt refresh, reconciliation, shift, customer-credit, and device-profile boundaries have dedicated coverage. | Retain controlled real-cashier acceptance as a gated evidence requirement. | Strong automated evidence; live staging evidence gated |
| Inventory | Tenant-scoped inventory queries, POS movement/return behavior, warehouses, reordering, and scanner support are present. | Verify transfers, counts, damaged/reserved stock, and large-table behavior against real data contracts. | Under audit |
| CRM and sales | Leads, quotations, invoices, payments, detail workspace, and server-confirmed mutation boundary exist. | Verify the complete lead-to-payment lifecycle against a safe authenticated tenant. | Under audit |
| Purchasing | UI/data concepts exist within the preserved dashboard. | Trace supplier-to-receipt-to-invoice-to-payment persistence and accounting linkage before claiming commercial readiness. | Not claimed pending audit |
| Finance and accounting | Expenses, budgets, cash/ledger views, reports, receivables/payables, and POS audit format repairs exist. | Validate journal, debit/credit, trial-balance, P&L, balance-sheet, and cash-flow calculation lineage against confirmed schema/contracts. | Not claimed pending finance integrity audit |
| HR and payroll | Employee, leave, training, attendance, and related views exist. | Validate payroll-period rules, statutory extensibility, permissions, and confirmed mutation flows. | Not claimed pending audit |
| Reporting and exports | CSV/PDF exports, scheduled report service, audit evidence export, and role-approval history export exist. | Reconcile legacy report scheduler UI with server service; validate large-data filtering and delivery states. | Remediation queued |
| Marketing and communications | Campaign flow now refuses invented engagement metrics and unsupported delivery, while WhatsApp is a user-controlled external handoff only. | Keep provider automations server-only and consent-aware if activated later. | Verified integrity boundary |
| AI assistance | Server-side assistant, scoped context, rate limiting, action approval, role-change approval, and tenant-safe profile resolution exist. | Validate live model availability only with approved provider/runtime evidence. | Automated evidence; live provider test gated |

## Tanzania-first and international configuration

| Capability | Current state | Status |
| --- | --- | --- |
| Kiswahili and English | Language context, localized authentication/module surfaces, and Tanzania-oriented messaging are present. | Verified |
| Currency and timezone | TZS/USD display preference and timezone configuration are present. | Verified at UI/helper level |
| Tax, mobile money, and local compliance | Payment and business configuration concepts exist. | Must remain configurable; no blanket country compliance claim without jurisdiction-specific validation. |
| Branch and multi-workspace readiness | Branch/warehouse/module configuration and tenant-scoped data model are present. | Independent multi-company acceptance remains gated. |

## Production gate and limitations

The current release must **not** be described as fully complete against the pasted document’s definition of done until the following evidence is obtained or the related features are restricted from commercial claims:

1. A controlled second-company authenticated test proving read/write isolation independently of Tenant A.
2. A valid, organization-controlled Resend sender identity if quarterly email delivery is to be enabled.
3. A safe authenticated acceptance run for the remaining purchasing, accounting, HR/payroll, and inventory sub-workflows that are advertised as operational.
4. Measured authenticated performance on the current large dashboard boundary, which remains approximately 6.13 MB minified (1.10 MB gzip).
5. A review of the legacy Scheduled Reports UI so it uses the authoritative server schedule service rather than local optimistic state.

The next implementation phase therefore focuses on the scheduled-report discrepancy, then uses the same evidence discipline for the remaining module contracts.

## Architecture and authorization re-audit

| Control | Re-audit result | Assessment |
| --- | --- | --- |
| tRPC boundary | Privileged services, including report scheduling, audit-log list/record/export, invitations, schema monitoring, webhook administration, and role operations are behind authenticated procedures. | No newly identified public mutation exposure in the application router. |
| Browser-to-server session forwarding | The client forwards the active Supabase access session to tRPC; server-side verified-profile resolvers use it for security-sensitive company assertions. | Required for legacy server paths that are not automatically governed by Supabase RLS. |
| Audit-log tenant isolation | `auditLogs.list` and `auditLogs.record` now call `requireVerifiedAuditCompany`; compliance export independently compares the verified profile company before returning logs or role approvals. | Verified code and regression boundary. |
| Supabase RLS evidence | Tests cover JWT/company resolution contracts, forged company controls, POS RLS migration requirements, and per-tenant policy patterns. | Independent dual-company live JWT evidence is still gated by controlled test identities. |
| Secret exposure scan | Browser source did not reveal service-role, Resend, or WhatsApp Graph credential use; unsafe HTML preview sinks and browser WhatsApp token storage were removed in the preceding remediation cycle. | Verified static baseline; future browser dependencies must be rechecked when integrations change. |
| Live integration gates | Remote dashboard persistence, Supabase configuration/credential checks, live AI provider verification, and sender-domain validation intentionally skip without their required controlled configuration. | Correctly disclosed limitation, not a passing production acceptance result. |

No new critical architecture, cross-tenant authorization, or browser-secret finding was identified in this re-audit. The next verified gap is the legacy Scheduled Reports user interface, which can show local schedule state even though a tenant-safe server scheduler already exists.

## Scheduled reports and delivery truthfulness remediation

The active Reports “Scheduled” tab now reads schedules only through the server-owned `reportSchedules` contract. It lists server-confirmed records for the signed-in owner and changes pause, resume, delete, and manual-dispatch state only through tRPC mutations. The prior client-local `scheduled_reports` controls no longer render in the active product workflow.

The authoritative schedule service now propagates the verified requester session to Heartbeat create, update, and delete lifecycle operations rather than an empty token. This preserves the service’s established company-access assertion and makes task ownership attributable to the request context. When transactional email is disabled, new recurring email schedules are rejected before persistence and existing scheduled jobs return an explicit `delivery-disabled` outcome without generating a report, marking it sent, or reporting a successful dispatch. The active dialog and report tab communicate this state directly; no provider email is claimed or sent.

Focused report schedule, server-session, delivery-availability, transactional-email, and dashboard integration tests pass, together with TypeScript validation.

## Core workflow integrity audit

The POS workflow retains the strongest automated evidence: sale, return, customer credit, post-confirmation state fallback, receipt refresh, and manager reconciliation tests pass. Approval and compliance workflow tests also pass. Scheduled dashboard callbacks now report disabled delivery as an explicit non-delivery skip and do not fetch tenant report data or mark the schedule sent.

Two additional verified workflow defects were repaired. Support-ticket submission previously added a configured-workspace ticket to local state, reset the form, and showed success before the database response. It now waits for a confirmed `support_tickets` insert, retains form details on failure, and surfaces an actionable retry message. VAT reporting now uses nullish fallback for the company tax configuration, preserving a valid configured `0%` rate instead of coercing it to the 18% Tanzania-oriented default. Focused workflow regression tests and TypeScript validation pass.

Purchasing, journal/accounting, and payroll lifecycle claims remain **not claimed** until controlled authenticated acceptance evidence covers their upstream/downstream integrations. This audit did not replace accounting logic or create synthetic financial records.

## Dashboard, localization, search, and role-aware usability review

The dashboard uses a role-filtered `visibleModules` set for both the sidebar and global command palette. The palette searches customer/lead, invoice, product, and expense records only when the user can access the parent module, preventing a search-result exposure path that can drift from navigation permissions. It includes keyboard arrow and Enter selection, and now implements the displayed Escape-key dismissal shortcut.

The active workspace preserves industry focus, Swahili/English controls, TZS-oriented defaults, timezone configuration, and role-aware home views. The review found no new navigation authorization gap. Search remains client-side over the already authorized module rows, so its large-data performance must be evaluated with authenticated production-sized datasets rather than inferred from demo-scale data.

## Final verified notification integrity remediation

Notification-channel configuration previously updated local state first and intentionally ignored a configured-workspace server failure. It now records the prior channel row, requests a confirmed update response, restores the prior value on failure, and displays a clear unsaved-change message. This prevents notification delivery settings from appearing active when the server rejected them. Focused regression coverage and TypeScript validation pass.

## Responsive, accessibility, and release validation

The public landing page and secure authentication entry were reviewed at desktop and 390px mobile widths. The launch, password, recovery, provider, language, and passkey actions remain visible and touch-reachable; the mobile sign-in form retains readable labels and a separate passkey action. Authenticated ERP module screenshots require a controlled logged-in workspace and are therefore reported as a gated acceptance item rather than fabricated evidence.

The complete automated suite passes **74 files / 228 tests**, with **5 intentionally gated files / 8 tests** for controlled remote persistence, provider, sender, and live Supabase configuration checks. TypeScript validation and the production build pass. The build retains the known large authenticated dashboard bundle of approximately **6.13 MB minified / 1.10 MB gzip**; the public auth route remains separately lazy-loaded at approximately **4.92 kB minified**. This is a documented performance improvement target, not a claim of large-data performance completion.
