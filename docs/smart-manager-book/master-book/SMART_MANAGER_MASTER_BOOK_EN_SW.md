# SMART MANAGER ERP — MASTER SYSTEM BOOK
## Repository-Audited English and Tanzanian Swahili Edition

> **Version:** 1.0.0
> **Documentation date:** 24 August 2026
> **Documentation status:** Repository-Audited Edition
> **Author:** Manus AI
> **Product owner/creator:** Ezra Mpapi, as identified in supplied project materials
> **Location:** Dar es Salaam, Tanzania

![Official SMART MANAGER logo](/manus-storage/smart-manager-logo_b1db8065.png)

## Copyright and evidence notice
This master book documents the SMART MANAGER ERP repository at the audit date shown above. It is not a generic ERP manual and does not convert every navigation surface into a claim of production completeness. Implemented, tested, partial, configuration-dependent, external-service-dependent, blocked, and planned states are separated throughout the book.

The live Supabase inspection was read-only. It recorded schema metadata, migration history, and advisor findings without changing production data. The exact snapshots are preserved in the `evidence/` directory. Secrets, private credentials, API keys, passwords, and provider tokens are intentionally excluded or redacted.

## How to use this book
The English edition is the primary technical reference. The complete Tanzanian Swahili edition follows the English reference and preserves technical names such as `RLS`, `Supabase`, `API`, `workspace`, `subscription`, and `workflow` where those terms are standard. Each module chapter follows the requested pattern: overview, purpose, business problems, target users, navigation, features, database, permissions, workflows, screens, reports, integrations, security, mobile experience, known limitations, current status, and future improvements.

## Table of contents
The rendered PDF contains an automatic table of contents. The source structure is divided into product introduction, system overview, technical architecture, module encyclopedia, business workflows, user manual, administrator manual, developer manual, security, database, integrations, troubleshooting, operations, future roadmap, and the Swahili edition.

# PART I — PRODUCT INTRODUCTION

## I.1 Executive Purpose

The book is a repository-audited reference, not a generic ERP brochure. It distinguishes implemented source and database evidence from configuration requirements, partial contracts, external services, and planned work.

### Kiswahili: Purpose, audience, evidence boundary, and how to use this book.

Kitabu hiki kinaeleza bidhaa, uendeshaji, usanifu, usalama na mipaka ya ushahidi kwa wamiliki, watumiaji, wasimamizi, developers, support teams na auditors.

---

## I.2 Product Philosophy

The design intent is to make business work measurable, responsibilities visible, and decisions easier to explain. The evidence boundary is part of the product quality model.

### Kiswahili: The platform connects records, people, workflows, control surfaces, and decision views without claiming that every problem is automated.

Falsafa ya bidhaa ni kuunganisha rekodi, watu, mitiririko, udhibiti na maoni ya uongozi bila kudai kwamba kila tatizo litatatuliwa kiotomatiki.

---

## I.3 Business Value

Value is created when a real operational fact is captured once, validated at the server boundary, enforced in the database, and surfaced through the right role-aware view.

### Kiswahili: Smart Manager helps organizations reduce fragmented records, improve visibility, protect access, and create repeatable operational paths.

Smart Manager husaidia kupunguza rekodi zilizotawanyika, kuongeza mwonekano, kulinda ufikiaji na kujenga mitiririko inayoweza kurudiwa.

---

## I.4 Audience and Adoption

Adoption should start with a bounded workflow, a real company context, verified data, and a measured review rhythm rather than a promise to activate every module at once.

### Kiswahili: Different roles use different evidence: owners review control, operators execute workflows, accountants reconcile, administrators govern, and developers extend.

Kila jukumu hutumia ushahidi tofauti: wamiliki huangalia udhibiti, operators hutekeleza workflows, accountants hufanya reconciliation, admins hutawala na developers huendeleza.

---

## I.5 Evidence and Status Language

A status never means that a feature is universally complete for every deployment. It describes the strongest evidence found during this audit window.

### Kiswahili: Status words are delivery controls: IMPLEMENTED, TESTING, PARTIALLY IMPLEMENTED, CONFIGURATION REQUIRED, EXTERNAL SERVICE REQUIRED, and BLOCKED.

Maneno ya hali ni udhibiti wa delivery: IMEJENGWA, INAJARIBIWA, IMEJENGWA KWA SEHEMU, INAHITAJI USANIDI, INAHITAJI HUDUMA YA NJE na IMEZUIWA.

---

# PART II — SYSTEM OVERVIEW

## II.1 What is SMART MANAGER?

SMART MANAGER is an authenticated business operating platform whose verified repository surfaces connect commercial, operational, financial, people, sector, intelligence, and control workflows.

### Kiswahili

SMART MANAGER ni platform ya uendeshaji wa biashara yenye uthibitishaji inayounganisha workflows za biashara, operations, fedha, watu, sekta, intelligence na udhibiti.

---

## II.2 ERP concept

ERP is treated as a connected record and control model: a sale may relate to stock, finance, customer history, receipt, and report when the relevant contracts are enabled.

### Kiswahili

ERP inaeleweka kama mfumo wa rekodi na udhibiti uliounganishwa: mauzo yanaweza kuhusishwa na stock, fedha, historia ya mteja, receipt na ripoti pale contracts husika zimewezeshwa.

---

## II.3 System ecosystem

The ecosystem includes public entry, secure authentication, company/workspace context, role-aware modules, Supabase persistence, server APIs, scheduled handlers, storage, external providers, and audit evidence.

### Kiswahili

Ecosystem ina entry ya umma, authentication, company/workspace, modules za role, Supabase, APIs za server, scheduled handlers, storage, providers wa nje na audit.

---

## II.4 Supported business types

The verified module registry spans universal SME operations and specialist contexts such as property, healthcare, school, pharmacy, hospitality, restaurant, fleet, microfinance, banking, VICOBA, and money-agent operations.

### Kiswahili

Rejista ya modules inahusisha SME operations na sekta kama property, afya, shule, famasi, hoteli, mgahawa, fleet, microfinance, benki, VICOBA na wakala wa fedha.

---

## II.5 Lifecycle model

A safe lifecycle is discover → authenticate → establish company scope → record → validate → approve/reconcile → report → audit → improve.

### Kiswahili

Lifecycle salama ni gundua → authenticate → weka company scope → rekodi → thibitisha → approve/reconcile → ripoti → audit → boresha.

---

# PART III — TECHNICAL ARCHITECTURE

## III.1 Technology Stack

Vite, React 19, TypeScript/JavaScript, Tailwind, Express 5, tRPC 11, Supabase Auth/Postgres/REST/RLS, S3-compatible storage, and Vercel-compatible serverless runtime are present in the project. The package manifest is the source for exact dependency versions.

### Kiswahili: Technology Stack

Stack ya teknolojia ina Vite, React 19, TypeScript/JavaScript, Tailwind, Express 5, tRPC 11, Supabase Auth/Postgres/REST/RLS, storage inayolingana na S3 na runtime ya Vercel.

| Layer | Verified implementation | Evidence |
| --- | --- | --- |
| Frontend | Vite + React 19 + Tailwind + wouter | package.json; client/src/App.tsx |
| Backend | Express 5 + tRPC 11 + server handlers | server/_core/apiApp.ts; server/routers.ts |
| Data | Supabase Auth/Postgres/REST/RLS; source-versioned migrations | supabase/migrations; live evidence snapshot |
| Runtime | Vercel-compatible API import plus local Vite/Express | server/_core/index.ts; package scripts |

---

## III.2 Frontend Architecture

App.tsx owns the top-level route switch and providers. BusinessSphereDashboard.jsx is the authenticated module composition boundary with lazy workspaces, a direct Supabase REST client path, shared persistence guards, subscription access adapter, and role-aware navigation.

### Kiswahili: Frontend Architecture

App.tsx inamiliki routes na providers. BusinessSphereDashboard.jsx ndiyo mpaka mkubwa wa workspace yenye lazy modules, Supabase REST, persistence guards, subscription access na urambazaji wa role.

---

## III.3 Backend Architecture

Express API bootstrap separates API-only behavior from SPA hosting. HTTP routes cover public configuration, billing, HarakaPay, scheduled handlers, webhooks, storage proxy, OAuth, and the tRPC middleware. Feature routers and operations live in server files.

### Kiswahili: Backend Architecture

Express API hutenganisha API na SPA. Routes za HTTP zinahusu public config, billing, HarakaPay, scheduled handlers, webhooks, storage proxy, OAuth na tRPC. Operations za moduli ziko server-side.

---

## III.4 Database Architecture

The repository uses a source-versioned Supabase migration history. The live audit on 24 August 2026 returned 542 tables: 519 public and 23 auth; 535 tables reported RLS enabled and 7 did not. Table definitions, indexes, constraints, functions, grants, and policies are migration-owned.

### Kiswahili: Database Architecture

Repository ina migration history ya Supabase yenye version. Audit ya 24 Agosti 2026 ilirudisha tables 542: 519 public na 23 auth; tables 535 zilionesha RLS na 7 hazikuonesha.

| Live metric | Value | Interpretation |
| --- | --- | --- |
| Total tables | 542 | Read-only schema inventory at 24 August 2026 |
| Public tables | 519 | Application-facing public schema inventory |
| Auth tables | 23 | Supabase Auth schema inventory |
| RLS enabled | 535 | Tables reported with RLS enabled |
| RLS not enabled | 7 | Requires table-specific review; not a reason to add broad policies blindly |
| Migration records | 133 | Live migration ledger records returned by connector |

---

## III.5 Supabase Authority

Supabase is authoritative for authenticated profiles, company scope, business records, subscription plans, payment state, invoices, entitlements, and access snapshots. Browser storage can hold session tokens under the supported auth flow, but it cannot grant subscription access or represent a durable business write.

### Kiswahili: Supabase Authority

Supabase ndiyo mamlaka ya profiles, company scope, rekodi za biashara, packages, payment state, invoices, entitlements na access snapshots. Browser haiwezi kutoa ruhusa ya subscription au kudai business write imehifadhiwa.

---

## III.6 Authentication Architecture

The public gateway obtains public Supabase configuration from /api/config/public when needed, calls Supabase Auth endpoints for password and recovery operations, supports Google/Azure/Apple provider selection, handles OAuth hash callbacks, and persists access/refresh tokens through the supported session adapter.

### Kiswahili: Authentication Architecture

Gateway hupata public config kupitia /api/config/public, hutumia Supabase Auth kwa password/recovery, ina Google/Azure/Apple na hushughulikia OAuth callbacks pamoja na token persistence kupitia adapter.

---

## III.7 Authorization and RLS

Authorization is layered: session extraction, verified profile resolution, role checks, company scope, protected server procedures, database functions, grants, constraints, and RLS policies. A visible button is not proof of permission. Global administration has a separate policy boundary.

### Kiswahili: Authorization and RLS

Uidhinishaji una tabaka: kikao, verified profile, role, company scope, procedures za server, functions, grants, constraints na RLS. Button inayoonekana si ushahidi wa permission. Global admin ina mpaka tofauti.

---

## III.8 Multi-Tenant Architecture

The effective model is platform → organization/company → workspace context → authenticated profile/membership → role/module entitlement → row-scoped data. The client does not select an arbitrary company ID as authority; Supabase profile and RLS scope control what can be read or changed.

### Kiswahili: Multi-Tenant Architecture

Mfumo ni platform → organization/company → workspace → profile/membership → role/entitlement → data ya row. Client haipaswi kuchagua company ID kiholela; profile na RLS ndiyo hudhibiti data.

---

## III.9 API Architecture

Critical flows use server HTTP handlers or protected tRPC procedures. Subscription routes call user-scoped or service-scoped Supabase RPCs. Specialist operations validate Zod inputs and forward authenticated tokens. Service credentials remain server-side.

### Kiswahili: API Architecture

Flows muhimu hutumia HTTP handlers za server au protected tRPC. Billing hutumia user/service RPCs za Supabase. Operations maalumu huthibitisha Zod input na kutuma token iliyothibitishwa. Siri hubaki server-side.

---

## III.10 Storage Architecture

File metadata and references are separated from file bytes. Avatar and property-document paths are scoped by company/entity; storage proxy and download boundaries enforce controlled access. Missing storage configuration must be shown as unavailable rather than successful.

### Kiswahili: Storage Architecture

Metadata na references zimetenganishwa na bytes za file. Avatar na property documents zina keys zenye company/entity scope; storage proxy na download boundaries zinalinda access.

---

## III.11 AI Architecture

The assistant uses a built-in model boundary with a default gpt-5-mini model, bounded history/context, JSON Schema response format, safe module targets, a limited operation proposal list, and an explicit requirement for independent approval before mutation.

### Kiswahili: AI Architecture

Assistant hutumia built-in model, history/context yenye mipaka, JSON Schema, safe targets za modules na proposal chache. Mutation inahitaji approval huru ya role husika.

---

## III.12 Deployment Architecture

Local development mounts Vite and the API; production bundles client and API separately. When VERCEL=1 the runtime exposes the API app for serverless import rather than opening a local listener. Builds run Supabase schema verification when server credentials are available and skip it explicitly for credentialless Vercel builds.

### Kiswahili: Deployment Architecture

Development hutumia Vite na API; production hubundle client na API. VERCEL=1 huwezesha import ya API ya serverless badala ya listener wa local. Build huendesha schema verification pale credentials za server zipo.

---

# PART IV — COMPLETE MODULE BOOK

The following module chapters are generated from the current verified module registry, actual source boundaries, migration names, and live table prefixes. The status is evidence-based and explicitly qualified.

## IV.1 Public Brand and Marketing Entry

### Module Overview

The public landing page communicates the Smart Manager proposition, links to the application, exposes language and theme controls, and provides a passkey entry point without treating the marketing preview as operational data. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Public Brand and Marketing Entry is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `companies`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Discover product → review capabilities → choose launch or authentication → enter the secure workspace. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Marketing delivery and conversion analytics are not the same as a signed-in company workflow; external campaign channels require configuration.

### Purpose

The public landing page communicates the Smart Manager proposition, links to the application, exposes language and theme controls, and provides a passkey entry point without treating the marketing preview as operational data.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Public visitor; prospective customer. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/pages/Home.tsx`.

### Main Features and Workflow

Discover product → review capabilities → choose launch or authentication → enter the secure workspace.

### Database, Permissions, and Security

The server evidence is `server/_core/apiApp.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: companies.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Marketing delivery and conversion analytics are not the same as a signed-in company workflow; external campaign channels require configuration.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Public Brand and Marketing Entry. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Discover product → review capabilities → choose launch or authentication → enter the secure workspace.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Marketing delivery and conversion analytics are not the same as a signed-in company workflow; external campaign channels require configuration.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Public Brand and Marketing Entry reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.2 Authentication and Secure Onboarding

### Module Overview

The public gateway supports password sign-in, password recovery, email confirmation, approved OAuth providers, passkeys, session persistence, and the transition into a company-aware workspace. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Authentication and Secure Onboarding is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `companies`, `company_memberships`, `profiles`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Load public Supabase configuration → authenticate or recover → persist token/session → resolve verified profile → enter /app. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Actual OAuth delivery, email delivery, and passkey availability remain dependent on Supabase/provider configuration and browser capability.

### Purpose

The public gateway supports password sign-in, password recovery, email confirmation, approved OAuth providers, passkeys, session persistence, and the transition into a company-aware workspace.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Unauthenticated visitor; verified user; company owner. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PublicAuthGateway.jsx; client/src/App.tsx`.

### Main Features and Workflow

Load public Supabase configuration → authenticate or recover → persist token/session → resolve verified profile → enter /app.

### Database, Permissions, and Security

The server evidence is `server/_core/apiApp.ts; server/_core/oauth.ts; server/authHeaders.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: companies, company_memberships, profiles.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Actual OAuth delivery, email delivery, and passkey availability remain dependent on Supabase/provider configuration and browser capability.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Authentication and Secure Onboarding. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Load public Supabase configuration → authenticate or recover → persist token/session → resolve verified profile → enter /app.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Actual OAuth delivery, email delivery, and passkey availability remain dependent on Supabase/provider configuration and browser capability.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Authentication and Secure Onboarding reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.3 Master Application Shell and Navigation

### Module Overview

The application shell provides route handling, error boundaries, theme and language providers, dashboard preferences, lazy workspace loading, command navigation, and fail-closed subscription access checks. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Master Application Shell and Navigation is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `company_modules`, `workspaces`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Route match → auth decision → lazy workspace load → role/entitlement-aware navigation → module action. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The dashboard remains a large legacy single-file boundary and produces a non-fatal bundle-size warning; safe decomposition is a future engineering workstream.

### Purpose

The application shell provides route handling, error boundaries, theme and language providers, dashboard preferences, lazy workspace loading, command navigation, and fail-closed subscription access checks.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: All authenticated users, filtered by role and entitlement. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/App.tsx; client/src/BusinessSphereDashboard.jsx`.

### Main Features and Workflow

Route match → auth decision → lazy workspace load → role/entitlement-aware navigation → module action.

### Database, Permissions, and Security

The server evidence is `server/routers.ts; server/_core/apiApp.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: company_modules, workspaces.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The dashboard remains a large legacy single-file boundary and produces a non-fatal bundle-size warning; safe decomposition is a future engineering workstream.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Master Application Shell and Navigation. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Route match → auth decision → lazy workspace load → role/entitlement-aware navigation → module action.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The dashboard remains a large legacy single-file boundary and produces a non-fatal bundle-size warning; safe decomposition is a future engineering workstream.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Master Application Shell and Navigation reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.4 Profile Identity Center

### Module Overview

The profile center separates personal identity, work identity, security, preferences, notifications, and activity while keeping protected identity fields server-authoritative. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Profile Identity Center is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `profiles`, `user_table_preferences`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Open profile → read verified profile → update permitted self-service fields → upload or remove avatar through controlled storage → refresh confirmed state. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Device/session listing and workspace switching are explicitly unavailable unless supported by a verified backend contract.

### Purpose

The profile center separates personal identity, work identity, security, preferences, notifications, and activity while keeping protected identity fields server-authoritative.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Authenticated user; workspace administrator for linked context. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/ProfileIdentityCenter.jsx`.

### Main Features and Workflow

Open profile → read verified profile → update permitted self-service fields → upload or remove avatar through controlled storage → refresh confirmed state.

### Database, Permissions, and Security

The server evidence is `server/profileIdentity.ts; server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: profiles, user_table_preferences.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Device/session listing and workspace switching are explicitly unavailable unless supported by a verified backend contract.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Profile Identity Center. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Open profile → read verified profile → update permitted self-service fields → upload or remove avatar through controlled storage → refresh confirmed state.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Device/session listing and workspace switching are explicitly unavailable unless supported by a verified backend contract.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Profile Identity Center reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.5 Executive Dashboard

### Module Overview

The executive surface consolidates operational signals from connected modules. It is intended for review and prioritization, not as an independent source of financial truth. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Executive Dashboard is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `custom_kpis`, `financial_benchmarks`, `scheduled_reports`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Select company context → load confirmed metrics → inspect trends/exceptions → navigate to source module → approve or act through the protected boundary. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. A dashboard is only as complete as the connected records, schedules, and integrations that feed it; empty or unavailable states must remain visible.

### Purpose

The executive surface consolidates operational signals from connected modules. It is intended for review and prioritization, not as an independent source of financial truth.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: CEO; COO; CFO; organization owner; manager roles. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/ExecutiveCommandCenter.jsx; client/src/BusinessSphereDashboard.jsx`.

### Main Features and Workflow

Select company context → load confirmed metrics → inspect trends/exceptions → navigate to source module → approve or act through the protected boundary.

### Database, Permissions, and Security

The server evidence is `server/dashboardReports.ts; server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: custom_kpis, financial_benchmarks, scheduled_reports.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

A dashboard is only as complete as the connected records, schedules, and integrations that feed it; empty or unavailable states must remain visible.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Executive Dashboard. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Select company context → load confirmed metrics → inspect trends/exceptions → navigate to source module → approve or act through the protected boundary.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: A dashboard is only as complete as the connected records, schedules, and integrations that feed it; empty or unavailable states must remain visible.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Executive Dashboard reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.6 CRM and Customer Pipeline

### Module Overview

CRM organizes contacts, leads, interactions, customer feedback, and pipeline signals so commercial activity can be related to sales and support records. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of CRM and Customer Pipeline is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `crm_contacts`, `crm_interactions`, `crm_leads`, `customer_feedback`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create or import lead → qualify → record interaction → convert or follow up → connect to quotation/invoice/support. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The repository contains strong persistence and truthfulness contracts, but broader authenticated CRUD walkthroughs remain required for every legacy screen.

### Purpose

CRM organizes contacts, leads, interactions, customer feedback, and pipeline signals so commercial activity can be related to sales and support records.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Sales Manager; sales user; account owner; support user. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/CommercialCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx`.

### Main Features and Workflow

Create or import lead → qualify → record interaction → convert or follow up → connect to quotation/invoice/support.

### Database, Permissions, and Security

The server evidence is `server/routers.ts; server/salesInteractions.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: crm_contacts, crm_interactions, crm_leads, customer_feedback.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The repository contains strong persistence and truthfulness contracts, but broader authenticated CRUD walkthroughs remain required for every legacy screen.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening CRM and Customer Pipeline. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create or import lead → qualify → record interaction → convert or follow up → connect to quotation/invoice/support.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The repository contains strong persistence and truthfulness contracts, but broader authenticated CRUD walkthroughs remain required for every legacy screen.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If CRM and Customer Pipeline reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.7 Sales and Billing

### Module Overview

Sales surfaces cover quotations, invoices, subscriptions, payments, returns, and customer interactions. The customer-facing amount and status must come from confirmed server/database results. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Sales and Billing is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `ecommerce_orders`, `ecommerce_products`, `sales_invoice_items`, `sales_invoices`, `sales_order_items`, `sales_order_return_items`, `sales_order_returns`, `sales_orders`, `sales_payments`, `sales_quotation_items`, `sales_quotations`, `sales_subscriptions`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Customer → quotation/order → invoice → payment or collection → receipt/ledger/report → follow-up. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Legacy invoice payment posting still requires an atomic database RPC and durable idempotency constraint before concurrent-safe payment posting can be claimed.

### Purpose

Sales surfaces cover quotations, invoices, subscriptions, payments, returns, and customer interactions. The customer-facing amount and status must come from confirmed server/database results.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Sales Manager; finance manager; sales user; billing manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/SalesDetailWorkspace.jsx; client/src/components/CommercialCommandCenters.jsx`.

### Main Features and Workflow

Customer → quotation/order → invoice → payment or collection → receipt/ledger/report → follow-up.

### Database, Permissions, and Security

The server evidence is `server/routers.ts; server/subscriptionBilling.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: ecommerce_orders, ecommerce_products, sales_invoice_items, sales_invoices, sales_order_items, sales_order_return_items, sales_order_returns, sales_orders, sales_payments, sales_quotation_items, sales_quotations, sales_subscriptions.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Legacy invoice payment posting still requires an atomic database RPC and durable idempotency constraint before concurrent-safe payment posting can be claimed.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Sales and Billing. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Customer → quotation/order → invoice → payment or collection → receipt/ledger/report → follow-up.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Legacy invoice payment posting still requires an atomic database RPC and durable idempotency constraint before concurrent-safe payment posting can be claimed.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Sales and Billing reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.8 Point of Sale

### Module Overview

POS supports registers, terminals, shifts, sale headers and lines, tenders, returns, tax, promotions, loyalty, pending offline transport, reconciliation, and audit paths. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Point of Sale is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `pos_cash_movements`, `pos_discount_rules`, `pos_loyalty_ledger`, `pos_loyalty_members`, `pos_loyalty_programs`, `pos_loyalty_redemptions`, `pos_loyalty_rewards`, `pos_promotion_items`, `pos_promotions`, `pos_registers`, `pos_return_commits`, `pos_return_headers`, `pos_return_items`, `pos_return_lines`, `pos_returns`, `pos_sale_adjustments`, `pos_sale_headers`, `pos_sale_lines`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Open register/shift → scan or select item → validate price and stock → collect tender → confirm sale → receipt → reconcile or return. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Controlled staging credentials and real device/provider behavior remain operational acceptance requirements; client pending queues are not treated as durable server saves.

### Purpose

POS supports registers, terminals, shifts, sale headers and lines, tenders, returns, tax, promotions, loyalty, pending offline transport, reconciliation, and audit paths.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Cashier; finance manager; warehouse manager; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/OperationsCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx`.

### Main Features and Workflow

Open register/shift → scan or select item → validate price and stock → collect tender → confirm sale → receipt → reconcile or return.

### Database, Permissions, and Security

The server evidence is `server/posWorkforceRpcAdapters.ts; server/posTransactionEngine.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: pos_cash_movements, pos_discount_rules, pos_loyalty_ledger, pos_loyalty_members, pos_loyalty_programs, pos_loyalty_redemptions, pos_loyalty_rewards, pos_promotion_items, pos_promotions, pos_registers, pos_return_commits, pos_return_headers, pos_return_items, pos_return_lines, pos_returns, pos_sale_adjustments, pos_sale_headers, pos_sale_lines.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Controlled staging credentials and real device/provider behavior remain operational acceptance requirements; client pending queues are not treated as durable server saves.

### Current Implementation Status

**PASSED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Point of Sale. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Open register/shift → scan or select item → validate price and stock → collect tender → confirm sale → receipt → reconcile or return.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Controlled staging credentials and real device/provider behavior remain operational acceptance requirements; client pending queues are not treated as durable server saves.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Point of Sale reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.9 Inventory and Warehouse Management

### Module Overview

Inventory records cover items, batches, stock movement, suppliers, warehouses, transfers, audits, and the operational connection from stock to sales and procurement. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Inventory and Warehouse Management is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `inventory_batches`, `inventory_items`, `inventory_stock_movements`, `inventory_suppliers`, `inventory_transfers`, `inventory_warehouses`, `stock_audit_items`, `stock_audits`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create item → receive or adjust stock → transfer or sell → record movement → inspect balance/audit → replenish. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Full authenticated import/export and concurrency walkthroughs remain part of the broader acceptance backlog.

### Purpose

Inventory records cover items, batches, stock movement, suppliers, warehouses, transfers, audits, and the operational connection from stock to sales and procurement.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Warehouse Manager; procurement officer; sales user; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/OperationsCommandCenters.jsx`.

### Main Features and Workflow

Create item → receive or adjust stock → transfer or sell → record movement → inspect balance/audit → replenish.

### Database, Permissions, and Security

The server evidence is `server/supabasePersistence.ts; server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: inventory_batches, inventory_items, inventory_stock_movements, inventory_suppliers, inventory_transfers, inventory_warehouses, stock_audit_items, stock_audits.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Full authenticated import/export and concurrency walkthroughs remain part of the broader acceptance backlog.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Inventory and Warehouse Management. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create item → receive or adjust stock → transfer or sell → record movement → inspect balance/audit → replenish.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Full authenticated import/export and concurrency walkthroughs remain part of the broader acceptance backlog.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Inventory and Warehouse Management reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.10 Procurement and Vendor Management

### Module Overview

Procurement relates suppliers, purchase orders, contracts, receiving, stock, approvals, and payables evidence. The workflow must preserve what was requested, approved, received, and owed. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Procurement and Vendor Management is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `procurement_contracts`, `procurement_purchase_orders`, `purchase_order_items`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Supplier → request/order → approval → receipt → stock update → payable/finance evidence → report. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Downstream integrations and external supplier channels are configuration-dependent; recorded integration evidence must not be replaced with fabricated acknowledgements.

### Purpose

Procurement relates suppliers, purchase orders, contracts, receiving, stock, approvals, and payables evidence. The workflow must preserve what was requested, approved, received, and owed.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Procurement Officer; warehouse manager; finance manager; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/OperationsCommandCenters.jsx`.

### Main Features and Workflow

Supplier → request/order → approval → receipt → stock update → payable/finance evidence → report.

### Database, Permissions, and Security

The server evidence is `server/routers.ts; server/procurementPersistence.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: procurement_contracts, procurement_purchase_orders, purchase_order_items.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Downstream integrations and external supplier channels are configuration-dependent; recorded integration evidence must not be replaced with fabricated acknowledgements.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Procurement and Vendor Management. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Supplier → request/order → approval → receipt → stock update → payable/finance evidence → report.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Downstream integrations and external supplier channels are configuration-dependent; recorded integration evidence must not be replaced with fabricated acknowledgements.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Procurement and Vendor Management reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.11 Finance and Accounting

### Module Overview

Finance includes accounts, journals, income and expenses, budgets, tax/VAT, period closes, bank reconciliation, assets, and management reports. It is the control plane for monetary evidence rather than a decorative dashboard. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Finance and Accounting is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `expense_budgets`, `fin_accounts`, `fin_approval_requests`, `fin_idempotency_keys`, `fin_journal_batches`, `fin_journal_lines`, `fin_periods`, `fin_posting_links`, `fin_reconciliation_batches`, `fin_reconciliation_items`, `finance_assets`, `finance_expenses`, `journal_entries`, `period_closes`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Capture transaction → validate company scope → post or approve → reconcile → close period → report. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Production reporting depends on intended schema alignment and real company data; tax filing itself is not implied by a local summary.

### Purpose

Finance includes accounts, journals, income and expenses, budgets, tax/VAT, period closes, bank reconciliation, assets, and management reports. It is the control plane for monetary evidence rather than a decorative dashboard.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: CFO; Finance Manager; accountant; organization owner. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/FinanceCommandCenters.jsx`.

### Main Features and Workflow

Capture transaction → validate company scope → post or approve → reconcile → close period → report.

### Database, Permissions, and Security

The server evidence is `server/financeCommandCenters.ts; server/financePersistence.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: expense_budgets, fin_accounts, fin_approval_requests, fin_idempotency_keys, fin_journal_batches, fin_journal_lines, fin_periods, fin_posting_links, fin_reconciliation_batches, fin_reconciliation_items, finance_assets, finance_expenses, journal_entries, period_closes.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Production reporting depends on intended schema alignment and real company data; tax filing itself is not implied by a local summary.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Finance and Accounting. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Capture transaction → validate company scope → post or approve → reconcile → close period → report.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Production reporting depends on intended schema alignment and real company data; tax filing itself is not implied by a local summary.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Finance and Accounting reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.12 Reports and Scheduled Reporting

### Module Overview

Reporting provides trend views, exports, schedules, delivery states, and compliance-oriented summaries. A generated report is evidence of recorded data and configured delivery, not a guarantee that an external message was delivered. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Reports and Scheduled Reporting is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `scheduled_reports`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Choose report → apply company/time scope → compute from source records → export or schedule → inspect delivery history. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Email delivery remains provider-configured; CSV is the dependency-safe export path when spreadsheet dependencies are intentionally absent.

### Purpose

Reporting provides trend views, exports, schedules, delivery states, and compliance-oriented summaries. A generated report is evidence of recorded data and configured delivery, not a guarantee that an external message was delivered.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Executive roles; manager; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/FinanceCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx`.

### Main Features and Workflow

Choose report → apply company/time scope → compute from source records → export or schedule → inspect delivery history.

### Database, Permissions, and Security

The server evidence is `server/dashboardReports.ts; server/reportSchedules.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: scheduled_reports.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Email delivery remains provider-configured; CSV is the dependency-safe export path when spreadsheet dependencies are intentionally absent.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Reports and Scheduled Reporting. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Choose report → apply company/time scope → compute from source records → export or schedule → inspect delivery history.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Email delivery remains provider-configured; CSV is the dependency-safe export path when spreadsheet dependencies are intentionally absent.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Reports and Scheduled Reporting reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.13 Human Resources and Payroll

### Module Overview

HR covers employees, attendance, benefits, leave, goals, approvals, payroll, announcements, and secure invitations. Tenant-scoped persistence replaces browser-only identity and invite paths. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Human Resources and Payroll is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `hr_announcement_reads`, `hr_announcements`, `hr_approval_requests`, `hr_approval_steps`, `hr_attendance`, `hr_benefit_enrollments`, `hr_benefit_plans`, `hr_benefits`, `hr_candidates`, `hr_duties`, `hr_employee_documents`, `hr_employees`, `hr_expense_claims`, `hr_goal_updates`, `hr_goals`, `hr_holidays`, `hr_invite_codes`, `hr_leave_balances`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Invite employee → accept securely → assign role → record attendance/leave → approve → calculate payroll → report. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Payroll and employee records need a full authenticated tenant-data walkthrough; external salary/payment rails are outside the repository’s verified contract.

### Purpose

HR covers employees, attendance, benefits, leave, goals, approvals, payroll, announcements, and secure invitations. Tenant-scoped persistence replaces browser-only identity and invite paths.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: HR Manager; manager; employee; payroll approver; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PeopleCommandCenters.jsx; client/src/components/EmployeePortalWorkspace.jsx`.

### Main Features and Workflow

Invite employee → accept securely → assign role → record attendance/leave → approve → calculate payroll → report.

### Database, Permissions, and Security

The server evidence is `server/teamWorkforce.ts; server/tanzaniaPayroll.ts; server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: hr_announcement_reads, hr_announcements, hr_approval_requests, hr_approval_steps, hr_attendance, hr_benefit_enrollments, hr_benefit_plans, hr_benefits, hr_candidates, hr_duties, hr_employee_documents, hr_employees, hr_expense_claims, hr_goal_updates, hr_goals, hr_holidays, hr_invite_codes, hr_leave_balances.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Payroll and employee records need a full authenticated tenant-data walkthrough; external salary/payment rails are outside the repository’s verified contract.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Human Resources and Payroll. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Invite employee → accept securely → assign role → record attendance/leave → approve → calculate payroll → report.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Payroll and employee records need a full authenticated tenant-data walkthrough; external salary/payment rails are outside the repository’s verified contract.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Human Resources and Payroll reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.14 Manufacturing and Work Orders

### Module Overview

The repository contains manufacturing and work-order persistence boundaries and navigation signals. The master book treats operational depth as partial unless a complete deployment-backed flow is demonstrated. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Manufacturing and Work Orders is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `manufacturing_bom_components`, `manufacturing_boms`, `manufacturing_machines`, `manufacturing_maintenance`, `manufacturing_qc_inspections`, `manufacturing_work_orders`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Define work order → allocate or consume material → update status → record output → review cost and exceptions. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The visible surface is broader than the independently verified end-to-end contract for every manufacturing scenario.

### Purpose

The repository contains manufacturing and work-order persistence boundaries and navigation signals. The master book treats operational depth as partial unless a complete deployment-backed flow is demonstrated.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Production manager; warehouse manager; project manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/BusinessSphereDashboard.jsx; client/src/components/OperationsCommandCenters.jsx`.

### Main Features and Workflow

Define work order → allocate or consume material → update status → record output → review cost and exceptions.

### Database, Permissions, and Security

The server evidence is `server/manufacturingPersistence.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: manufacturing_bom_components, manufacturing_boms, manufacturing_machines, manufacturing_maintenance, manufacturing_qc_inspections, manufacturing_work_orders.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The visible surface is broader than the independently verified end-to-end contract for every manufacturing scenario.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Manufacturing and Work Orders. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Define work order → allocate or consume material → update status → record output → review cost and exceptions.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The visible surface is broader than the independently verified end-to-end contract for every manufacturing scenario.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Manufacturing and Work Orders reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.15 Supply Chain and Fleet

### Module Overview

Supply-chain and fleet surfaces connect shipments, vehicles, trips, drivers, fuel, maintenance, incidents, routes, telematics events, and alerts. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Supply Chain and Fleet is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `fleet_alerts`, `fleet_audit_events`, `fleet_driver_assignments`, `fleet_drivers`, `fleet_fuel_cards`, `fleet_fuel_transactions`, `fleet_incidents`, `fleet_maintenance_jobs`, `fleet_maintenance_plans`, `fleet_routes`, `fleet_service_records`, `fleet_spare_parts`, `fleet_telematics_events`, `fleet_trips`, `fleet_tyres`, `fleet_vehicle_categories`, `fleet_vehicle_documents`, `fleet_vehicles`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Plan route/trip → assign driver/vehicle → record movement or fuel → ingest event → inspect alert → close maintenance or incident. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Telematics and external vehicle providers require approved webhook configuration and secrets; no external movement is claimed from a local screen alone.

### Purpose

Supply-chain and fleet surfaces connect shipments, vehicles, trips, drivers, fuel, maintenance, incidents, routes, telematics events, and alerts.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Fleet manager; logistics user; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/OperationsCommandCenters.jsx; client/src/components/FleetWorkspace.jsx`.

### Main Features and Workflow

Plan route/trip → assign driver/vehicle → record movement or fuel → ingest event → inspect alert → close maintenance or incident.

### Database, Permissions, and Security

The server evidence is `server/fleetManagement.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: fleet_alerts, fleet_audit_events, fleet_driver_assignments, fleet_drivers, fleet_fuel_cards, fleet_fuel_transactions, fleet_incidents, fleet_maintenance_jobs, fleet_maintenance_plans, fleet_routes, fleet_service_records, fleet_spare_parts, fleet_telematics_events, fleet_trips, fleet_tyres, fleet_vehicle_categories, fleet_vehicle_documents, fleet_vehicles.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Telematics and external vehicle providers require approved webhook configuration and secrets; no external movement is claimed from a local screen alone.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Supply Chain and Fleet. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Plan route/trip → assign driver/vehicle → record movement or fuel → ingest event → inspect alert → close maintenance or incident.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Telematics and external vehicle providers require approved webhook configuration and secrets; no external movement is claimed from a local screen alone.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Supply Chain and Fleet reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.16 Marketing Campaigns

### Module Overview

Marketing provides campaign-oriented surfaces, customer segmentation signals, message templates, and analytics boundaries. Delivery is kept separate from the platform’s verified persistence contract. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Marketing Campaigns is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `crm_contacts`, `crm_interactions`, `crm_leads`, `emails`, `marketing_campaigns`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Define audience → draft message → validate template/link → obtain approval → dispatch through configured channel → measure response. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. External email, SMS, WhatsApp, and campaign providers remain configuration-dependent; the UI must not claim dispatch when only a draft exists.

### Purpose

Marketing provides campaign-oriented surfaces, customer segmentation signals, message templates, and analytics boundaries. Delivery is kept separate from the platform’s verified persistence contract.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: CMO; marketing manager; sales manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/CommercialCommandCenters.jsx`.

### Main Features and Workflow

Define audience → draft message → validate template/link → obtain approval → dispatch through configured channel → measure response.

### Database, Permissions, and Security

The server evidence is `server/routers.ts; server/emailTemplateWorkflow.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: crm_contacts, crm_interactions, crm_leads, emails, marketing_campaigns.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

External email, SMS, WhatsApp, and campaign providers remain configuration-dependent; the UI must not claim dispatch when only a draft exists.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Marketing Campaigns. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Define audience → draft message → validate template/link → obtain approval → dispatch through configured channel → measure response.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: External email, SMS, WhatsApp, and campaign providers remain configuration-dependent; the UI must not claim dispatch when only a draft exists.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Marketing Campaigns reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.17 E-Commerce Storefront

### Module Overview

The repository names e-commerce products and orders and includes storefront-oriented surfaces. The evidence boundary does not invent a live Shopify or third-party commerce activation. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of E-Commerce Storefront is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `ecommerce_orders`, `ecommerce_products`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Publish catalog → receive order → validate customer/order → connect fulfilment and finance → report. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. External commerce provider credentials and production storefront activation are not verified by this book.

### Purpose

The repository names e-commerce products and orders and includes storefront-oriented surfaces. The evidence boundary does not invent a live Shopify or third-party commerce activation.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Store manager; sales manager; customer. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/CommercialCommandCenters.jsx`.

### Main Features and Workflow

Publish catalog → receive order → validate customer/order → connect fulfilment and finance → report.

### Database, Permissions, and Security

The server evidence is `server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: ecommerce_orders, ecommerce_products.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

External commerce provider credentials and production storefront activation are not verified by this book.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening E-Commerce Storefront. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Publish catalog → receive order → validate customer/order → connect fulfilment and finance → report.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: External commerce provider credentials and production storefront activation are not verified by this book.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If E-Commerce Storefront reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.18 Documents and Secure Files

### Module Overview

Document records, storage references, signatures, exports, and download boundaries keep file bytes separate from transactional metadata and preserve tenant scope. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Documents and Secure Files is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `approval_signatures`, `digital_signatures`, `documents`, `signatures`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create metadata → upload through storage boundary → verify reference → share or sign under role control → download/export evidence. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. S3/storage configuration is required for live file bytes; metadata persistence alone is not evidence that a file was uploaded successfully.

### Purpose

Document records, storage references, signatures, exports, and download boundaries keep file bytes separate from transactional metadata and preserve tenant scope.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: All authenticated users within permitted company scope; approver. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PeopleCommandCenters.jsx; client/src/components/ProfileIdentityCenter.jsx`.

### Main Features and Workflow

Create metadata → upload through storage boundary → verify reference → share or sign under role control → download/export evidence.

### Database, Permissions, and Security

The server evidence is `server/storage.ts; server/documentDownloadBoundaries.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: approval_signatures, digital_signatures, documents, signatures.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

S3/storage configuration is required for live file bytes; metadata persistence alone is not evidence that a file was uploaded successfully.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Documents and Secure Files. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create metadata → upload through storage boundary → verify reference → share or sign under role control → download/export evidence.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: S3/storage configuration is required for live file bytes; metadata persistence alone is not evidence that a file was uploaded successfully.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Documents and Secure Files reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.19 Projects and Task Management

### Module Overview

Projects provide tasks, milestones, expenses, and progress-oriented persistence boundaries so work can be coordinated with financial and operational context. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Projects and Task Management is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `project_expenses`, `project_milestones`, `project_tasks`, `projects`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create project → add milestone/task → assign owner → update progress → record expense → review completion. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The repository contains the persistence boundary, but complete project operations still depend on authenticated data and role-specific acceptance.

### Purpose

Projects provide tasks, milestones, expenses, and progress-oriented persistence boundaries so work can be coordinated with financial and operational context.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Project Manager; team member; executive. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PeopleCommandCenters.jsx`.

### Main Features and Workflow

Create project → add milestone/task → assign owner → update progress → record expense → review completion.

### Database, Permissions, and Security

The server evidence is `server/routers.ts; server/projectsPersistence.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: project_expenses, project_milestones, project_tasks, projects.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The repository contains the persistence boundary, but complete project operations still depend on authenticated data and role-specific acceptance.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Projects and Task Management. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create project → add milestone/task → assign owner → update progress → record expense → review completion.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The repository contains the persistence boundary, but complete project operations still depend on authenticated data and role-specific acceptance.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Projects and Task Management reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.20 Customer Support and Helpdesk

### Module Overview

Support includes tickets, timelines, internal notes, inbox/chat evidence, calls, SLA policies, workflow rules, search, and support metrics. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Customer Support and Helpdesk is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `support_agents`, `support_call_log`, `support_chat_conversations`, `support_chat_messages`, `support_message_templates`, `support_sla_policies`, `support_team_members`, `support_teams`, `support_ticket_activity`, `support_ticket_messages`, `support_ticket_notes`, `support_tickets`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Receive issue → create ticket → classify/SLA → assign → communicate → resolve → audit and measure. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Automated external support execution is intentionally not claimed without configured channels; internal ticket persistence remains the source of record.

### Purpose

Support includes tickets, timelines, internal notes, inbox/chat evidence, calls, SLA policies, workflow rules, search, and support metrics.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Support agent; manager; customer; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/IntelligenceCommandCenters.jsx; client/src/components/PeopleCommandCenters.jsx`.

### Main Features and Workflow

Receive issue → create ticket → classify/SLA → assign → communicate → resolve → audit and measure.

### Database, Permissions, and Security

The server evidence is `server/supportOperations.ts; server/supportMetrics.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: support_agents, support_call_log, support_chat_conversations, support_chat_messages, support_message_templates, support_sla_policies, support_team_members, support_teams, support_ticket_activity, support_ticket_messages, support_ticket_notes, support_tickets.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Automated external support execution is intentionally not claimed without configured channels; internal ticket persistence remains the source of record.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Customer Support and Helpdesk. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Receive issue → create ticket → classify/SLA → assign → communicate → resolve → audit and measure.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Automated external support execution is intentionally not claimed without configured channels; internal ticket persistence remains the source of record.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Customer Support and Helpdesk reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.21 Enterprise Analytics and BI

### Module Overview

Analytics combines KPI, benchmark, market, trend, and command-center views. It is a decision-support layer over recorded operations, not a replacement for source ledgers. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Enterprise Analytics and BI is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `competitors`, `custom_kpis`, `financial_benchmarks`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Select scope → read source metrics → compare or trend → investigate source record → document action. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Analytical quality depends on complete, correctly scoped input data and configured market services.

### Purpose

Analytics combines KPI, benchmark, market, trend, and command-center views. It is a decision-support layer over recorded operations, not a replacement for source ledgers.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Executive; analyst; manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/IntelligenceCommandCenters.jsx; client/src/components/PredictiveAnalyticsWorkspace.jsx`.

### Main Features and Workflow

Select scope → read source metrics → compare or trend → investigate source record → document action.

### Database, Permissions, and Security

The server evidence is `server/dashboardReports.ts; server/marketIntelligence.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: competitors, custom_kpis, financial_benchmarks.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Analytical quality depends on complete, correctly scoped input data and configured market services.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Enterprise Analytics and BI. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Select scope → read source metrics → compare or trend → investigate source record → document action.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Analytical quality depends on complete, correctly scoped input data and configured market services.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Enterprise Analytics and BI reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.22 Notifications and Alerting

### Module Overview

Notifications capture reminders, delivery history, unread/read state, scheduled signals, and module-specific alerts while distinguishing a persisted notification from successful external delivery. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Notifications and Alerting is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `emails`, `notification_channels`, `notification_log`, `notification_rules`, `sms_group_members`, `sms_groups`, `sms_templates`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Detect event → create notification record → deliver through configured channel → mark read or retry → audit result. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. SMS, email, push, and WhatsApp delivery depend on external provider configuration and should show explicit unavailable states.

### Purpose

Notifications capture reminders, delivery history, unread/read state, scheduled signals, and module-specific alerts while distinguishing a persisted notification from successful external delivery.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Authenticated users; managers; administrators. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/BusinessSphereDashboard.jsx; module workspaces`.

### Main Features and Workflow

Detect event → create notification record → deliver through configured channel → mark read or retry → audit result.

### Database, Permissions, and Security

The server evidence is `server/notificationHistory.ts; server/transactionalEmail.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: emails, notification_channels, notification_log, notification_rules, sms_group_members, sms_groups, sms_templates.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

SMS, email, push, and WhatsApp delivery depend on external provider configuration and should show explicit unavailable states.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Notifications and Alerting. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Detect event → create notification record → deliver through configured channel → mark read or retry → audit result.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: SMS, email, push, and WhatsApp delivery depend on external provider configuration and should show explicit unavailable states.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Notifications and Alerting reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.23 Activity Stream and Audit Evidence

### Module Overview

Audit evidence records who performed an action, where applicable, in which company scope, and with what result. Sensitive global administration records have a separate control boundary. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Activity Stream and Audit Evidence is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `audit_log`, `audit_log_entries`, `bank_audit_events`, `billing_plan_audit_log`, `community_group_audit_log`, `hospitality_audit_log`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Authenticated action → protected mutation → audit record → scoped search/export → review or incident follow-up. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. An audit record increases traceability but does not correct an unsafe write; mutation confirmation and database constraints remain primary controls.

### Purpose

Audit evidence records who performed an action, where applicable, in which company scope, and with what result. Sensitive global administration records have a separate control boundary.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Auditor; administrator; company manager with scope. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/ComplianceAuditLogView.tsx; dashboard views`.

### Main Features and Workflow

Authenticated action → protected mutation → audit record → scoped search/export → review or incident follow-up.

### Database, Permissions, and Security

The server evidence is `server/auditLogs.ts; server/tenantAuditViewer.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: audit_log, audit_log_entries, bank_audit_events, billing_plan_audit_log, community_group_audit_log, hospitality_audit_log.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

An audit record increases traceability but does not correct an unsafe write; mutation confirmation and database constraints remain primary controls.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Activity Stream and Audit Evidence. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Authenticated action → protected mutation → audit record → scoped search/export → review or incident follow-up.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: An audit record increases traceability but does not correct an unsafe write; mutation confirmation and database constraints remain primary controls.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Activity Stream and Audit Evidence reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.24 Integration Hub

### Module Overview

The hub represents integration metadata, webhook configuration, provider readiness, delivery history, and safe test boundaries. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Integration Hub is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `integration_connections`, `notification_channels`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Define connection → validate configuration → test safely → enable dispatch → monitor delivery → retry or disable. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. No provider credential, endpoint, or delivery success is assumed when configuration is missing; controls must remain disabled or clearly unavailable.

### Purpose

The hub represents integration metadata, webhook configuration, provider readiness, delivery history, and safe test boundaries.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Administrator; integration manager; finance manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/FinanceCommandCenters.jsx; client/src/components/PeopleCommandCenters.jsx`.

### Main Features and Workflow

Define connection → validate configuration → test safely → enable dispatch → monitor delivery → retry or disable.

### Database, Permissions, and Security

The server evidence is `server/webhooks.ts; server/transactionalEmail.ts; server/integration connections`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: integration_connections, notification_channels.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

No provider credential, endpoint, or delivery success is assumed when configuration is missing; controls must remain disabled or clearly unavailable.

### Current Implementation Status

**CONFIGURATION REQUIRED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Integration Hub. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Define connection → validate configuration → test safely → enable dispatch → monitor delivery → retry or disable.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: No provider credential, endpoint, or delivery success is assumed when configuration is missing; controls must remain disabled or clearly unavailable.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Integration Hub reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.25 Workflow Studio and Marketplace

### Module Overview

Workflow Studio represents reusable templates, steps, approvals, tasks, notifications, and audit actions. Official templates state what they do and what they do not do. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Workflow Studio and Marketplace is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `workflow_marketplace_templates`, `workflows`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Choose template → inspect steps → configure target → approve or run → record task/result → review audit. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. A workflow step that drafts an email or notification is not proof of external dispatch; complete orchestration requires channel configuration.

### Purpose

Workflow Studio represents reusable templates, steps, approvals, tasks, notifications, and audit actions. Official templates state what they do and what they do not do.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Workflow administrator; approver; manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PeopleCommandCenters.jsx; dashboard registry`.

### Main Features and Workflow

Choose template → inspect steps → configure target → approve or run → record task/result → review audit.

### Database, Permissions, and Security

The server evidence is `server/workflows.ts; server/aiApprovals.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: workflow_marketplace_templates, workflows.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

A workflow step that drafts an email or notification is not proof of external dispatch; complete orchestration requires channel configuration.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Workflow Studio and Marketplace. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Choose template → inspect steps → configure target → approve or run → record task/result → review audit.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: A workflow step that drafts an email or notification is not proof of external dispatch; complete orchestration requires channel configuration.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Workflow Studio and Marketplace reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.26 Collaboration Hub

### Module Overview

Collaboration connects messages, channels, presence, calendar, read receipts, and workflow signals where configured. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Collaboration Hub is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `calendar_events`, `collab_channels`, `collab_messages`, `emails`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create channel/event → post message → notify participants → track read/presence → retain evidence. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. External collaboration delivery and realtime behavior depend on configuration and provider availability; local state is not a durable message authority.

### Purpose

Collaboration connects messages, channels, presence, calendar, read receipts, and workflow signals where configured.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Team member; manager; executive. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PeopleCommandCenters.jsx`.

### Main Features and Workflow

Create channel/event → post message → notify participants → track read/presence → retain evidence.

### Database, Permissions, and Security

The server evidence is `server/collaborationEmailLinkCheck.ts; server/collaborationPersistence.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: calendar_events, collab_channels, collab_messages, emails.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

External collaboration delivery and realtime behavior depend on configuration and provider availability; local state is not a durable message authority.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Collaboration Hub. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create channel/event → post message → notify participants → track read/presence → retain evidence.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: External collaboration delivery and realtime behavior depend on configuration and provider availability; local state is not a durable message authority.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Collaboration Hub reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.27 TRA, VFD, and Tanzania Fiscalization

### Module Overview

The repository contains fiscal profiles, receipts, retry queues, Z-report archives, tax configuration, VAT anomaly analysis, and idempotent submission boundaries. It distinguishes configuration and provider readiness from an actual TRA submission. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of TRA, VFD, and Tanzania Fiscalization is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes shared company-scoped persistence tables. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Configure TIN/VRN and branch → validate readiness → submit idempotent transaction → receive provider result → store receipt/retry/audit evidence. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Production fiscalization requires approved provider credentials, device/branch configuration, and provider availability; a local receipt screen is not a TRA acceptance claim.

### Purpose

The repository contains fiscal profiles, receipts, retry queues, Z-report archives, tax configuration, VAT anomaly analysis, and idempotent submission boundaries. It distinguishes configuration and provider readiness from an actual TRA submission.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: CFO; Finance Manager; administrator; fiscal operator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/TraPortalModule.jsx`.

### Main Features and Workflow

Configure TIN/VRN and branch → validate readiness → submit idempotent transaction → receive provider result → store receipt/retry/audit evidence.

### Database, Permissions, and Security

The server evidence is `server/traFiscalRouter.ts; server/traFiscal.ts; server/traZReportArchive.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: shared company-scoped tables.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Production fiscalization requires approved provider credentials, device/branch configuration, and provider availability; a local receipt screen is not a TRA acceptance claim.

### Current Implementation Status

**CONFIGURATION REQUIRED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening TRA, VFD, and Tanzania Fiscalization. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Configure TIN/VRN and branch → validate readiness → submit idempotent transaction → receive provider result → store receipt/retry/audit evidence.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Production fiscalization requires approved provider credentials, device/branch configuration, and provider availability; a local receipt screen is not a TRA acceptance claim.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If TRA, VFD, and Tanzania Fiscalization reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.28 AI Assistant and Smart Intelligence

### Module Overview

The AI assistant uses a built-in model boundary, limits history and context, treats user/business JSON as untrusted data, returns structured responses, restricts navigation targets, and produces proposals rather than silently mutating business records. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of AI Assistant and Smart Intelligence is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `custom_kpis`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Verified user → scoped context → structured assistant response → optional navigation/proposal → independent role approval → confirmed business action. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. AI model availability and response quality depend on configured service access and supplied evidence; the assistant must not claim a mutation it did not execute.

### Purpose

The AI assistant uses a built-in model boundary, limits history and context, treats user/business JSON as untrusted data, returns structured responses, restricts navigation targets, and produces proposals rather than silently mutating business records.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Authenticated user; approver for proposed actions. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/AIChatBox.tsx; client/src/components/IntelligenceCommandCenters.jsx`.

### Main Features and Workflow

Verified user → scoped context → structured assistant response → optional navigation/proposal → independent role approval → confirmed business action.

### Database, Permissions, and Security

The server evidence is `server/smartAssistant.ts; server/aiApprovals.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: custom_kpis.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

AI model availability and response quality depend on configured service access and supplied evidence; the assistant must not claim a mutation it did not execute.

### Current Implementation Status

**EXTERNAL SERVICE REQUIRED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening AI Assistant and Smart Intelligence. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Verified user → scoped context → structured assistant response → optional navigation/proposal → independent role approval → confirmed business action.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: AI model availability and response quality depend on configured service access and supplied evidence; the assistant must not claim a mutation it did not execute.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If AI Assistant and Smart Intelligence reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.29 WhatsApp Web Integration

### Module Overview

WhatsApp surfaces support account/contact/message/conversation metadata and provider readiness boundaries. Credentials and provider access must remain server-side. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of WhatsApp Web Integration is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `whatsapp_account_links`, `whatsapp_accounts`, `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_message_events`, `whatsapp_messages`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Configure provider → link account/contact → draft message → validate content → dispatch through provider → record status. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Provider configuration and message delivery are not assumed; credential persistence in browser storage is a security risk and must remain removed or blocked.

### Purpose

WhatsApp surfaces support account/contact/message/conversation metadata and provider readiness boundaries. Credentials and provider access must remain server-side.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Marketing manager; support agent; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/BusinessSphereDashboard.jsx; messaging surfaces`.

### Main Features and Workflow

Configure provider → link account/contact → draft message → validate content → dispatch through provider → record status.

### Database, Permissions, and Security

The server evidence is `server/whatsappProvider.ts; server/whatsAppSecurity.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: whatsapp_account_links, whatsapp_accounts, whatsapp_contacts, whatsapp_conversations, whatsapp_message_events, whatsapp_messages.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Provider configuration and message delivery are not assumed; credential persistence in browser storage is a security risk and must remain removed or blocked.

### Current Implementation Status

**CONFIGURATION REQUIRED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening WhatsApp Web Integration. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Configure provider → link account/contact → draft message → validate content → dispatch through provider → record status.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Provider configuration and message delivery are not assumed; credential persistence in browser storage is a security risk and must remain removed or blocked.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If WhatsApp Web Integration reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.30 Microfinance

### Module Overview

Microfinance covers borrowers, groups, products, applications, approvals, disbursement, repayments, savings, cash sessions, collections, scoring, and escalation. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Microfinance is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `mfi_audit_logs`, `mfi_cash_sessions`, `mfi_cash_transactions`, `mfi_clients`, `mfi_collateral`, `mfi_collections`, `mfi_credit_scorecards`, `mfi_credit_scoring_settings`, `mfi_groups`, `mfi_guarantors`, `mfi_loan_applications`, `mfi_loan_products`, `mfi_loans`, `mfi_notifications`, `mfi_par_escalation_settings`, `mfi_repayment_schedules`, `mfi_repayments`, `mfi_savings`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Register borrower/group → choose product → submit application → approve → disburse → collect repayment/savings → monitor PAR/escalation. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Financial persistence and controlled data must be exercised against a real tenant schema; seeded UI examples are not production records.

### Purpose

Microfinance covers borrowers, groups, products, applications, approvals, disbursement, repayments, savings, cash sessions, collections, scoring, and escalation.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: MFI manager; loan officer; cashier; approver; auditor. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/MicrofinanceWorkspace.jsx; client/src/components/MicrofinanceGovernanceDialogs.jsx`.

### Main Features and Workflow

Register borrower/group → choose product → submit application → approve → disburse → collect repayment/savings → monitor PAR/escalation.

### Database, Permissions, and Security

The server evidence is `server/microfinanceOperations.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: mfi_audit_logs, mfi_cash_sessions, mfi_cash_transactions, mfi_clients, mfi_collateral, mfi_collections, mfi_credit_scorecards, mfi_credit_scoring_settings, mfi_groups, mfi_guarantors, mfi_loan_applications, mfi_loan_products, mfi_loans, mfi_notifications, mfi_par_escalation_settings, mfi_repayment_schedules, mfi_repayments, mfi_savings.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Financial persistence and controlled data must be exercised against a real tenant schema; seeded UI examples are not production records.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Microfinance. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Register borrower/group → choose product → submit application → approve → disburse → collect repayment/savings → monitor PAR/escalation.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Financial persistence and controlled data must be exercised against a real tenant schema; seeded UI examples are not production records.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Microfinance reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.31 Money Agent

### Module Overview

Money Agent covers agents, customers, wallets, cash actions, fees, commissions, ledger snapshots, approvals, reconciliation, and customer-facing summaries. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Money Agent is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `money_agent_agents`, `money_agent_alerts`, `money_agent_approvals`, `money_agent_audit_events`, `money_agent_branches`, `money_agent_commission_rules`, `money_agent_customers`, `money_agent_daily_summaries`, `money_agent_fee_rules`, `money_agent_ledger_entries`, `money_agent_limits`, `money_agent_notifications`, `money_agent_pin_credentials`, `money_agent_receipts`, `money_agent_reconciliations`, `money_agent_risk_events`, `money_agent_services`, `money_agent_settlements`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Register agent/customer → open cash/wallet context → initiate action → validate balance/role → record ledger → reconcile and audit. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The live schema includes the migration history and tables, but real wallet/provider movement still requires controlled credentials and operational acceptance.

### Purpose

Money Agent covers agents, customers, wallets, cash actions, fees, commissions, ledger snapshots, approvals, reconciliation, and customer-facing summaries.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Money agent; supervisor; cashier; auditor. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/MoneyAgentWorkspace.jsx; client/src/components/SectorCommandCenters.jsx`.

### Main Features and Workflow

Register agent/customer → open cash/wallet context → initiate action → validate balance/role → record ledger → reconcile and audit.

### Database, Permissions, and Security

The server evidence is `server/moneyAgentOperations.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: money_agent_agents, money_agent_alerts, money_agent_approvals, money_agent_audit_events, money_agent_branches, money_agent_commission_rules, money_agent_customers, money_agent_daily_summaries, money_agent_fee_rules, money_agent_ledger_entries, money_agent_limits, money_agent_notifications, money_agent_pin_credentials, money_agent_receipts, money_agent_reconciliations, money_agent_risk_events, money_agent_services, money_agent_settlements.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The live schema includes the migration history and tables, but real wallet/provider movement still requires controlled credentials and operational acceptance.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Money Agent. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Register agent/customer → open cash/wallet context → initiate action → validate balance/role → record ledger → reconcile and audit.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The live schema includes the migration history and tables, but real wallet/provider movement still requires controlled credentials and operational acceptance.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Money Agent reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.32 VICOBA, SACCOS, and Community Groups

### Module Overview

Community-group features cover groups, members, contributions, savings, loans, meetings, attendance, budgets, projects, welfare, votes, messages, notifications, approvals, and audit. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of VICOBA, SACCOS, and Community Groups is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `community_contributions`, `community_group_announcements`, `community_group_approvals`, `community_group_assets`, `community_group_attendance`, `community_group_audit_log`, `community_group_budgets`, `community_group_committee_members`, `community_group_committees`, `community_group_contributions`, `community_group_documents`, `community_group_events`, `community_group_expenses`, `community_group_fundraising`, `community_group_income`, `community_group_loan_guarantors`, `community_group_loan_penalties`, `community_group_loan_repayments`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create group → add member → record contribution/meeting → approve loan or welfare action → update ledger/report. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Relationship guards and approvals are present, but broader group-accounting walkthroughs should still be completed with controlled tenant data.

### Purpose

Community-group features cover groups, members, contributions, savings, loans, meetings, attendance, budgets, projects, welfare, votes, messages, notifications, approvals, and audit.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Group chairperson; treasurer; secretary; member; auditor. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/SectorCommandCenters.jsx; community group surfaces`.

### Main Features and Workflow

Create group → add member → record contribution/meeting → approve loan or welfare action → update ledger/report.

### Database, Permissions, and Security

The server evidence is `server/communityGroups.ts; server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: community_contributions, community_group_announcements, community_group_approvals, community_group_assets, community_group_attendance, community_group_audit_log, community_group_budgets, community_group_committee_members, community_group_committees, community_group_contributions, community_group_documents, community_group_events, community_group_expenses, community_group_fundraising, community_group_income, community_group_loan_guarantors, community_group_loan_penalties, community_group_loan_repayments.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Relationship guards and approvals are present, but broader group-accounting walkthroughs should still be completed with controlled tenant data.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening VICOBA, SACCOS, and Community Groups. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create group → add member → record contribution/meeting → approve loan or welfare action → update ledger/report.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Relationship guards and approvals are present, but broader group-accounting walkthroughs should still be completed with controlled tenant data.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If VICOBA, SACCOS, and Community Groups reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.33 Healthcare and Clinic

### Module Overview

Healthcare covers patients, appointments, visits, vitals, prescriptions, lab/radiology, claims, reports, reminders, patient SMS consent, portal references, and interoperability exports. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Healthcare and Clinic is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `hc_appointments`, `hc_doctors`, `hc_insurance_claims`, `hc_invoices`, `hc_lab_orders`, `hc_notifications`, `hc_patients`, `hc_portal_reference_approvals`, `hc_portal_reference_imports`, `hc_portal_reference_summary_settings`, `hc_prescriptions`, `hc_radiology`, `hc_reminder_deliveries`, `hc_reminder_settings`, `hc_reports`, `hc_visits`, `hc_vitals`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Register patient → book appointment → record visit/vitals → prescribe/order → issue report or claim → notify with consent → audit. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. SMS and interoperability depend on provider configuration; clinical data requires strict least-privilege review and must not be exposed through generic tenant screens.

### Purpose

Healthcare covers patients, appointments, visits, vitals, prescriptions, lab/radiology, claims, reports, reminders, patient SMS consent, portal references, and interoperability exports.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Clinician; nurse; receptionist; finance user; patient portal user. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/HealthcareClinicWorkspace.jsx`.

### Main Features and Workflow

Register patient → book appointment → record visit/vitals → prescribe/order → issue report or claim → notify with consent → audit.

### Database, Permissions, and Security

The server evidence is `server/healthcareOperations.ts; server/healthcareInteroperability.ts; server/healthcareReminders.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: hc_appointments, hc_doctors, hc_insurance_claims, hc_invoices, hc_lab_orders, hc_notifications, hc_patients, hc_portal_reference_approvals, hc_portal_reference_imports, hc_portal_reference_summary_settings, hc_prescriptions, hc_radiology, hc_reminder_deliveries, hc_reminder_settings, hc_reports, hc_visits, hc_vitals.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

SMS and interoperability depend on provider configuration; clinical data requires strict least-privilege review and must not be exposed through generic tenant screens.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Healthcare and Clinic. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Register patient → book appointment → record visit/vitals → prescribe/order → issue report or claim → notify with consent → audit.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: SMS and interoperability depend on provider configuration; clinical data requires strict least-privilege review and must not be exposed through generic tenant screens.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Healthcare and Clinic reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.34 School Management

### Module Overview

School Management includes academic years, terms, departments, subjects, classes, streams, teachers, admissions, attendance, assessments, report cards, assignments, fees, scholarships, transport, library, discipline, announcements, and portal links. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of School Management is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `sch_academic_years`, `sch_admissions`, `sch_announcements`, `sch_approval_requests`, `sch_assessment_scores`, `sch_assessments`, `sch_assignment_submissions`, `sch_assignments`, `sch_attendance_records`, `sch_attendance_sessions`, `sch_audit_logs`, `sch_books`, `sch_classes`, `sch_departments`, `sch_disciplinary_records`, `sch_documents`, `sch_enrollments`, `sch_exams`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Set academic structure → admit learner → assign teacher/class → record attendance/assessment → publish report → invoice/receive fees → communicate. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Automated browser coverage is strong for the surface, while full per-school CRUD remains a data-backed acceptance task.

### Purpose

School Management includes academic years, terms, departments, subjects, classes, streams, teachers, admissions, attendance, assessments, report cards, assignments, fees, scholarships, transport, library, discipline, announcements, and portal links.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: School administrator; teacher; student/guardian portal user; finance user. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/SchoolWorkspace.jsx`.

### Main Features and Workflow

Set academic structure → admit learner → assign teacher/class → record attendance/assessment → publish report → invoice/receive fees → communicate.

### Database, Permissions, and Security

The server evidence is `server/schoolOperations.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: sch_academic_years, sch_admissions, sch_announcements, sch_approval_requests, sch_assessment_scores, sch_assessments, sch_assignment_submissions, sch_assignments, sch_attendance_records, sch_attendance_sessions, sch_audit_logs, sch_books, sch_classes, sch_departments, sch_disciplinary_records, sch_documents, sch_enrollments, sch_exams.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Automated browser coverage is strong for the surface, while full per-school CRUD remains a data-backed acceptance task.

### Current Implementation Status

**PASSED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening School Management. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Set academic structure → admit learner → assign teacher/class → record attendance/assessment → publish report → invoice/receive fees → communicate.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Automated browser coverage is strong for the surface, while full per-school CRUD remains a data-backed acceptance task.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If School Management reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.35 Pharmacy Management

### Module Overview

Pharmacy covers drug categories, brands, medicines, suppliers, purchase orders, stock receipt/adjustment/transfer, dispensing, sales, payments, claims, returns, reports, notifications, and audit. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Pharmacy Management is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `phm_audit_logs`, `phm_batches`, `phm_brands`, `phm_categories`, `phm_controlled_medicine_register`, `phm_dispense`, `phm_dispense_items`, `phm_drugs`, `phm_insurance_claims`, `phm_notifications`, `phm_payments`, `phm_purchase_order_items`, `phm_purchase_orders`, `phm_return_items`, `phm_returns`, `phm_sale_items`, `phm_sales`, `phm_stock`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Create medicine → receive stock → adjust/transfer → dispense or sell → collect payment → return/claim → reconcile. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Live dispensing and inventory walkthroughs remain dependent on controlled pharmacy records and appropriate clinical/financial permissions.

### Purpose

Pharmacy covers drug categories, brands, medicines, suppliers, purchase orders, stock receipt/adjustment/transfer, dispensing, sales, payments, claims, returns, reports, notifications, and audit.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Pharmacist; storekeeper; cashier; clinician; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PharmacyWorkspace.jsx`.

### Main Features and Workflow

Create medicine → receive stock → adjust/transfer → dispense or sell → collect payment → return/claim → reconcile.

### Database, Permissions, and Security

The server evidence is `server/pharmacyOperations.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: phm_audit_logs, phm_batches, phm_brands, phm_categories, phm_controlled_medicine_register, phm_dispense, phm_dispense_items, phm_drugs, phm_insurance_claims, phm_notifications, phm_payments, phm_purchase_order_items, phm_purchase_orders, phm_return_items, phm_returns, phm_sale_items, phm_sales, phm_stock.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Live dispensing and inventory walkthroughs remain dependent on controlled pharmacy records and appropriate clinical/financial permissions.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Pharmacy Management. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Create medicine → receive stock → adjust/transfer → dispense or sell → collect payment → return/claim → reconcile.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Live dispensing and inventory walkthroughs remain dependent on controlled pharmacy records and appropriate clinical/financial permissions.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Pharmacy Management reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.36 Hotel and Hospitality

### Module Overview

Hospitality covers properties, room types, rooms, rate plans, reservations, guests, guest KYC, folios, payments, housekeeping, laundry, minibar, events, complaints, amenities, notifications, and reconciliation. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Hotel and Hospitality is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `hospitality_amenities`, `hospitality_audit_log`, `hospitality_complaints`, `hospitality_event_venues`, `hospitality_events`, `hospitality_finance_reconciliations`, `hospitality_folio_lines`, `hospitality_folios`, `hospitality_guest_kyc`, `hospitality_guest_requests`, `hospitality_guests`, `hospitality_housekeeping_tasks`, `hospitality_laundry_orders`, `hospitality_loyalty_accounts`, `hospitality_maintenance_requests`, `hospitality_menu_items`, `hospitality_menus`, `hospitality_minibar_postings`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Configure property/rooms → create reservation → check in → post folio/service → receive payment → housekeeping/check out → reconcile. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. External booking-channel and payment connections remain provider-dependent; local reservation state is not proof of channel synchronization.

### Purpose

Hospitality covers properties, room types, rooms, rate plans, reservations, guests, guest KYC, folios, payments, housekeeping, laundry, minibar, events, complaints, amenities, notifications, and reconciliation.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Hotel manager; front desk; housekeeping; finance; guest. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/HospitalityWorkspace.jsx; client/src/components/VerticalCommandCenters.jsx`.

### Main Features and Workflow

Configure property/rooms → create reservation → check in → post folio/service → receive payment → housekeeping/check out → reconcile.

### Database, Permissions, and Security

The server evidence is `server/hospitalityOperations.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: hospitality_amenities, hospitality_audit_log, hospitality_complaints, hospitality_event_venues, hospitality_events, hospitality_finance_reconciliations, hospitality_folio_lines, hospitality_folios, hospitality_guest_kyc, hospitality_guest_requests, hospitality_guests, hospitality_housekeeping_tasks, hospitality_laundry_orders, hospitality_loyalty_accounts, hospitality_maintenance_requests, hospitality_menu_items, hospitality_menus, hospitality_minibar_postings.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

External booking-channel and payment connections remain provider-dependent; local reservation state is not proof of channel synchronization.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Hotel and Hospitality. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Configure property/rooms → create reservation → check in → post folio/service → receive payment → housekeeping/check out → reconcile.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: External booking-channel and payment connections remain provider-dependent; local reservation state is not proof of channel synchronization.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Hotel and Hospitality reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.37 Restaurant and Food & Beverage

### Module Overview

Restaurant operations cover tax/fiscal profiles, menus, menu items, tables, orders, reservations, waiters, payments, receipts, refunds, and Tanzania fiscal configuration. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Restaurant and Food & Beverage is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `restaurant_alerts`, `restaurant_audit_events`, `restaurant_bill_splits`, `restaurant_combo_items`, `restaurant_customers`, `restaurant_dining_areas`, `restaurant_fiscal_profiles`, `restaurant_fiscal_receipts`, `restaurant_kitchen_tickets`, `restaurant_menu_categories`, `restaurant_menu_items`, `restaurant_mobile_money_intents`, `restaurant_mobile_money_profiles`, `restaurant_modifier_groups`, `restaurant_modifier_options`, `restaurant_order_lines`, `restaurant_orders`, `restaurant_outlets`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Configure menu/table → open order → add items → prepare/serve → collect payment → issue receipt/fiscal evidence → reconcile. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Delivery and external payment channels require configuration; fiscal status is a readiness state until a provider confirms submission.

### Purpose

Restaurant operations cover tax/fiscal profiles, menus, menu items, tables, orders, reservations, waiters, payments, receipts, refunds, and Tanzania fiscal configuration.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Restaurant manager; waiter; cashier; kitchen; finance. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/RestaurantWorkspace.jsx; client/src/components/RestaurantTanzaniaFiscalPanel.jsx`.

### Main Features and Workflow

Configure menu/table → open order → add items → prepare/serve → collect payment → issue receipt/fiscal evidence → reconcile.

### Database, Permissions, and Security

The server evidence is `server/restaurantManagement.ts; server/traFiscal.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: restaurant_alerts, restaurant_audit_events, restaurant_bill_splits, restaurant_combo_items, restaurant_customers, restaurant_dining_areas, restaurant_fiscal_profiles, restaurant_fiscal_receipts, restaurant_kitchen_tickets, restaurant_menu_categories, restaurant_menu_items, restaurant_mobile_money_intents, restaurant_mobile_money_profiles, restaurant_modifier_groups, restaurant_modifier_options, restaurant_order_lines, restaurant_orders, restaurant_outlets.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Delivery and external payment channels require configuration; fiscal status is a readiness state until a provider confirms submission.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Restaurant and Food & Beverage. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Configure menu/table → open order → add items → prepare/serve → collect payment → issue receipt/fiscal evidence → reconcile.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Delivery and external payment channels require configuration; fiscal status is a readiness state until a provider confirms submission.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Restaurant and Food & Beverage reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.38 Banking and MFI

### Module Overview

Bank/MFI covers institutions, branches, customers, KYC documents, beneficial owners, accounts, beneficiaries, tellers, cash movements, wallets, loans, schedules, repayments, AML alerts, reconciliation, and audit events. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Banking and MFI is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `bank_account_beneficiaries`, `bank_account_types`, `bank_accounts`, `bank_agents`, `bank_aml_alerts`, `bank_audit_events`, `bank_beneficial_owners`, `bank_branches`, `bank_cash_movements`, `bank_collateral`, `bank_customer_documents`, `bank_customers`, `bank_fixed_deposits`, `bank_group_members`, `bank_groups`, `bank_guarantors`, `bank_idempotency_keys`, `bank_institutions`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Set institution → register customer/KYC → open account → post transaction → originate/approve loan → schedule/collect → reconcile/resolve AML. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. External banking rails are not connected without approved adapters; SECURITY DEFINER routines require endpoint-by-endpoint privilege review.

### Purpose

Bank/MFI covers institutions, branches, customers, KYC documents, beneficial owners, accounts, beneficiaries, tellers, cash movements, wallets, loans, schedules, repayments, AML alerts, reconciliation, and audit events.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Bank administrator; teller; loan officer; compliance officer; auditor. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/BankMfiWorkspace.jsx; client/src/components/SectorCommandCenters.jsx`.

### Main Features and Workflow

Set institution → register customer/KYC → open account → post transaction → originate/approve loan → schedule/collect → reconcile/resolve AML.

### Database, Permissions, and Security

The server evidence is `server/bankMfiOperations.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: bank_account_beneficiaries, bank_account_types, bank_accounts, bank_agents, bank_aml_alerts, bank_audit_events, bank_beneficial_owners, bank_branches, bank_cash_movements, bank_collateral, bank_customer_documents, bank_customers, bank_fixed_deposits, bank_group_members, bank_groups, bank_guarantors, bank_idempotency_keys, bank_institutions.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

External banking rails are not connected without approved adapters; SECURITY DEFINER routines require endpoint-by-endpoint privilege review.

### Current Implementation Status

**TESTING** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Banking and MFI. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Set institution → register customer/KYC → open account → post transaction → originate/approve loan → schedule/collect → reconcile/resolve AML.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: External banking rails are not connected without approved adapters; SECURITY DEFINER routines require endpoint-by-endpoint privilege review.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Banking and MFI reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.39 Employee Portal

### Module Overview

The portal provides self-service views for profile/work context, attendance, leave, announcements, benefits, documents, and approved workforce actions while retaining company scope. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Employee Portal is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `hr_announcement_reads`, `hr_announcements`, `hr_approval_requests`, `hr_approval_steps`, `hr_attendance`, `hr_benefit_enrollments`, `hr_benefit_plans`, `hr_benefits`, `hr_candidates`, `hr_duties`, `hr_employee_documents`, `hr_employees`, `hr_expense_claims`, `hr_goal_updates`, `hr_goals`, `hr_holidays`, `hr_invite_codes`, `hr_leave_balances`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Accept secure invitation → verify profile → view or request employee action → manager/HR decision → record outcome. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. An employee view does not imply access to payroll or HR administration; role boundaries must be enforced by server and RLS.

### Purpose

The portal provides self-service views for profile/work context, attendance, leave, announcements, benefits, documents, and approved workforce actions while retaining company scope.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Employee; manager; HR administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/EmployeePortalWorkspace.jsx`.

### Main Features and Workflow

Accept secure invitation → verify profile → view or request employee action → manager/HR decision → record outcome.

### Database, Permissions, and Security

The server evidence is `server/teamWorkforce.ts; server/employeePortal.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: hr_announcement_reads, hr_announcements, hr_approval_requests, hr_approval_steps, hr_attendance, hr_benefit_enrollments, hr_benefit_plans, hr_benefits, hr_candidates, hr_duties, hr_employee_documents, hr_employees, hr_expense_claims, hr_goal_updates, hr_goals, hr_holidays, hr_invite_codes, hr_leave_balances.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

An employee view does not imply access to payroll or HR administration; role boundaries must be enforced by server and RLS.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Employee Portal. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Accept secure invitation → verify profile → view or request employee action → manager/HR decision → record outcome.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: An employee view does not imply access to payroll or HR administration; role boundaries must be enforced by server and RLS.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Employee Portal reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.40 Property Management

### Module Overview

Property Management covers portfolios, owners, buildings, plots, units, listings, agents, tenants, KYC documents, applications, leases, inspections, handover, rent schedules, tax/fee rules, service charges, utilities, invoices, payments, receipts, contractors, maintenance, work orders, expenses, budgets, insurance, notices, approvals, documents, ledgers, reconciliation, notifications, integrations, and audit. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Property Management is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `property_agents`, `property_applications`, `property_approvals`, `property_audit_log`, `property_budgets`, `property_buildings`, `property_contractors`, `property_documents`, `property_expenses`, `property_handover_records`, `property_inspection_items`, `property_inspections`, `property_insurances`, `property_integration_events`, `property_invoice_lines`, `property_invoices`, `property_leases`, `property_ledger_entries`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Portfolio → building/unit → owner/tenant/application → lease → inspection/handover → rent/utility invoice → payment/receipt → maintenance/expense → reconciliation. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The live audit shows the property migration and tables present; external payment, map, messaging, and contractor channels still require configuration and controlled acceptance.

### Purpose

Property Management covers portfolios, owners, buildings, plots, units, listings, agents, tenants, KYC documents, applications, leases, inspections, handover, rent schedules, tax/fee rules, service charges, utilities, invoices, payments, receipts, contractors, maintenance, work orders, expenses, budgets, insurance, notices, approvals, documents, ledgers, reconciliation, notifications, integrations, and audit.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Property manager; landlord/owner; agent; tenant; finance manager; maintenance user. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PropertyManagementWorkspace.jsx`.

### Main Features and Workflow

Portfolio → building/unit → owner/tenant/application → lease → inspection/handover → rent/utility invoice → payment/receipt → maintenance/expense → reconciliation.

### Database, Permissions, and Security

The server evidence is `server/propertyManagementOperations.ts; server/propertyManagement.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: property_agents, property_applications, property_approvals, property_audit_log, property_budgets, property_buildings, property_contractors, property_documents, property_expenses, property_handover_records, property_inspection_items, property_inspections, property_insurances, property_integration_events, property_invoice_lines, property_invoices, property_leases, property_ledger_entries.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The live audit shows the property migration and tables present; external payment, map, messaging, and contractor channels still require configuration and controlled acceptance.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Property Management. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Portfolio → building/unit → owner/tenant/application → lease → inspection/handover → rent/utility invoice → payment/receipt → maintenance/expense → reconciliation.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The live audit shows the property migration and tables present; external payment, map, messaging, and contractor channels still require configuration and controlled acceptance.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Property Management reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.41 Subscription and Billing

### Module Overview

The live commercial contract contains FREE_15 at TZS 0 for 15 days and six paid monthly packages. Paid activation is released only after verified provider status; the server and database own amount, entitlement, idempotency, and access state. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Subscription and Billing is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `billing_plan_audit_log`, `billing_plans`, `billing_profiles`, `subscription_events`, `subscription_invoices`, `subscription_notifications`, `subscription_payments`, `subscription_usage`, `tenant_subscriptions`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Read catalog → start Free or create paid intent → send/verify provider request → reconcile payment → activate subscription/invoice → refresh access snapshot. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. HarakaPay account authorization and provider credentials remain deployment prerequisites; failed or cancelled requests must not be shown as active entitlement.

### Purpose

The live commercial contract contains FREE_15 at TZS 0 for 15 days and six paid monthly packages. Paid activation is released only after verified provider status; the server and database own amount, entitlement, idempotency, and access state.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Billing manager; owner; CEO; CFO; finance manager; administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/SubscriptionBillingWorkspace.jsx; client/src/lib/subscriptionAccess.js`.

### Main Features and Workflow

Read catalog → start Free or create paid intent → send/verify provider request → reconcile payment → activate subscription/invoice → refresh access snapshot.

### Database, Permissions, and Security

The server evidence is `server/subscriptionBilling.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: billing_plan_audit_log, billing_plans, billing_profiles, subscription_events, subscription_invoices, subscription_notifications, subscription_payments, subscription_usage, tenant_subscriptions.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

HarakaPay account authorization and provider credentials remain deployment prerequisites; failed or cancelled requests must not be shown as active entitlement.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Subscription and Billing. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Read catalog → start Free or create paid intent → send/verify provider request → reconcile payment → activate subscription/invoice → refresh access snapshot.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: HarakaPay account authorization and provider credentials remain deployment prerequisites; failed or cancelled requests must not be shown as active entitlement.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Subscription and Billing reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.42 Global Admin Control Center

### Module Overview

Global administration is a separate control plane for platform-wide company, user, subscription, security, integration, health, and audit actions. It is not a broad tenant policy. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Global Admin Control Center is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `billing_plan_audit_log`, `companies`, `platform_admin_actions`, `profiles`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Verify platform-admin authority → inspect scoped snapshot → perform explicit action → record platform audit → review outcome. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. The platform_admin_actions table is intentionally protected from a broad authenticated policy; access uses the protected platform-admin RPC boundary.

### Purpose

Global administration is a separate control plane for platform-wide company, user, subscription, security, integration, health, and audit actions. It is not a broad tenant policy.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Super Administrator; platform administrator. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/GlobalAdminControlCenter.tsx`.

### Main Features and Workflow

Verify platform-admin authority → inspect scoped snapshot → perform explicit action → record platform audit → review outcome.

### Database, Permissions, and Security

The server evidence is `server/globalAdmin.ts; server/routers.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: billing_plan_audit_log, companies, platform_admin_actions, profiles.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

The platform_admin_actions table is intentionally protected from a broad authenticated policy; access uses the protected platform-admin RPC boundary.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Global Admin Control Center. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Verify platform-admin authority → inspect scoped snapshot → perform explicit action → record platform audit → review outcome.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: The platform_admin_actions table is intentionally protected from a broad authenticated policy; access uses the protected platform-admin RPC boundary.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Global Admin Control Center reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.43 Enterprise Settings and Security Control Center

### Module Overview

Settings cover company profile, branding, language, timezone/currency, receipts, idle timeout, modules, branches, departments, preferences, passkeys, and approval-aware role changes. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Enterprise Settings and Security Control Center is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `branches`, `company_modules`, `company_profile_settings`, `departments`, `user_table_preferences`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Open settings → read confirmed configuration → edit permitted field → server validates and persists → refresh UI → audit sensitive change. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Provider-specific email, SMS, API-key, and storage configuration remains environment-dependent; secret values must be redacted.

### Purpose

Settings cover company profile, branding, language, timezone/currency, receipts, idle timeout, modules, branches, departments, preferences, passkeys, and approval-aware role changes.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Organization owner; administrator; manager; user with permitted settings. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/DashboardPreferencesDrawer.jsx; client/src/components/ProfileIdentityCenter.jsx`.

### Main Features and Workflow

Open settings → read confirmed configuration → edit permitted field → server validates and persists → refresh UI → audit sensitive change.

### Database, Permissions, and Security

The server evidence is `server/workspaceSettings.ts; server/workspaceBranding.ts; server/roleChangeApprovals.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: branches, company_modules, company_profile_settings, departments, user_table_preferences.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Provider-specific email, SMS, API-key, and storage configuration remains environment-dependent; secret values must be redacted.

### Current Implementation Status

**IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Enterprise Settings and Security Control Center. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Open settings → read confirmed configuration → edit permitted field → server validates and persists → refresh UI → audit sensitive change.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Provider-specific email, SMS, API-key, and storage configuration remains environment-dependent; secret values must be redacted.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Enterprise Settings and Security Control Center reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

## IV.44 Predictive Analytics

### Module Overview

Predictive surfaces present trends, forecasts, benchmarks, and next-best-action ideas when sufficient data and configured intelligence services exist. This chapter is written from the repository UI, server boundary, migration history, and the read-only live Supabase inventory. The strongest evidence is named; anything that depends on configuration, connected data, or an external provider remains qualified.
The purpose of Predictive Analytics is to make a repeatable business operation visible and controlled. The primary business problem is not the absence of a screen; it is the risk that the same fact is entered in several places, that a role sees too much, or that a failed write is presented as success. The module therefore belongs to a path from input to validation, persistence, evidence, and management review.
The representative persistence surface observed for this module includes `competitors`, `custom_kpis`, `financial_benchmarks`. These names are evidence from the current live inventory or the repository contract; they are not an assertion that every table is used by every deployment or that every listed record contains production data.
The verified workflow is: Select evidence set → compute signal → present confidence/limitation → inspect source metrics → decide manually. Operators should complete the step in sequence, confirm the returned state, and use the module’s error or empty state rather than substituting a local guess. Predictions are decision support, not guarantees. Sparse or stale data, configuration, and model availability constrain their reliability.

### Purpose

Predictive surfaces present trends, forecasts, benchmarks, and next-best-action ideas when sufficient data and configured intelligence services exist.

### Business Problems Solved

The module addresses fragmented records, unclear ownership, weak review paths, or slow movement between an operational event and a management decision. It does so only to the extent shown by the source and database evidence above.

### Target Users and Navigation

Primary roles: Executive; analyst; manager. Navigation is exposed through the authenticated dashboard registry or the dedicated workspace named in the UI evidence: `client/src/components/PredictiveAnalyticsWorkspace.jsx`.

### Main Features and Workflow

Select evidence set → compute signal → present confidence/limitation → inspect source metrics → decide manually.

### Database, Permissions, and Security

The server evidence is `server/marketIntelligence.ts; server/smartAssistant.ts`. Access is expected to follow verified profile resolution, company scope, role checks, database constraints, and RLS/policies. Representative live table prefixes are: competitors, custom_kpis, financial_benchmarks.

### Screens, Reports, and Integrations

Screens are evidence of an interaction surface. Reports are evidence of a computed view over source records. Integrations are separate dependencies; a button or draft state is not proof of a provider-side action.

### Mobile Experience

Responsive behavior is part of the tested surface where browser evidence exists. Operators should use the narrow layout for review and safe entry, while high-risk approvals, financial posting, and configuration remain subject to the same server/database controls.

### Known Limitations

Predictions are decision support, not guarantees. Sparse or stale data, configuration, and model availability constrain their reliability.

### Current Implementation Status

**PARTIALLY IMPLEMENTED** — This status is a documentation control, not a sales promise. It should be revalidated after migration, provider, role, or deployment changes.

### Future Improvements

Complete the next safe evidence step: controlled authenticated CRUD, module-specific regression journeys, provider readiness verification, or safe decomposition of the legacy dashboard, depending on the limitation above.

### Operator Runbook

**1. Confirm context:** Confirm the authenticated profile, company/workspace context, and role before opening Predictive Analytics. Do not copy a company identifier from an untrusted screen or URL.
**2. Prepare the record:** Collect the minimum required business facts, use the supported date/amount formats, and confirm that any referenced customer, item, unit, employee, or account belongs to the same company scope.
**3. Enter and validate:** Enter the record through the supported screen. Let the server-side schema and business rules reject invalid or incomplete input; do not bypass validation with browser storage or direct hidden requests.
**4. Confirm the result:** Wait for the server/database response. Treat a returned identifier, status, or confirmed row as the completion signal. If the response is unavailable, keep the action pending or failed.
**5. Review downstream evidence:** Check the related record, report, audit entry, notification, or reconciliation state where applicable. The expected business path is Select evidence set → compute signal → present confidence/limitation → inspect source metrics → decide manually.
**6. Escalate exceptions:** Record the exact error, time, company, role, and safe reproduction steps. Escalate configuration or provider issues separately from application defects. Known boundary: Predictions are decision support, not guarantees. Sparse or stale data, configuration, and model availability constrain their reliability.

### Evidence Control Table

| Control stage | Expected evidence | Review question |
| --- | --- | --- |
| Identity | Verified user and company context | Profile/company resolution |
| Input | Required fields, valid references, date/amount rules | Server validation response |
| Persistence | Returned row, ID, status, or RPC result | Database/server confirmation |
| Control | Approval, reconciliation, audit, or notification state | Role-aware follow-up |
| Integration | Provider readiness and delivery outcome | Separate external evidence |

### Exception and Recovery Notes

If Predictive Analytics reports an unavailable, failed, pending, or rejected state, preserve the state and input, capture the exact response, verify company and role scope, and retry only through the supported server/database path. Do not turn an optimistic local state into a claim of completion.

---

# PART V — BUSINESS WORKFLOWS

## V.1 Authentication and onboarding

Public entry → Supabase configuration → password/OAuth/passkey → session persistence → verified profile → company context → protected workspace.

### Kiswahili

Ukurasa wa umma → configuration ya Supabase → nenosiri/OAuth/passkey → kikao → wasifu uliothibitishwa → kampuni → workspace salama.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.2 Sales to receipt

Customer → quotation/order → invoice → confirmed payment → receipt/ledger → management report and audit.

### Kiswahili

Mteja → quotation/order → ankara → malipo yaliyothibitishwa → receipt/ledger → ripoti na audit.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.3 Procurement to stock

Supplier → request/order → approval → receipt → stock movement → payable/finance evidence.

### Kiswahili

Msambazaji → ombi/order → approval → mapokezi → stock movement → ushahidi wa deni/finance.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.4 POS to reconciliation

Register/shift → item/customer → price/stock validation → tender → confirmed sale → receipt → return/reconciliation.

### Kiswahili

Register/shift → item/mteja → uthibitishaji wa bei na stock → tender → sale → receipt → return/reconciliation.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.5 Finance close

Transaction → journal or subledger → approval → bank/tax reconciliation → period close → report.

### Kiswahili

Muamala → journal/subledger → approval → reconciliation ya benki/kodi → kufunga kipindi → ripoti.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.6 HR and payroll

Secure invite → employee profile → attendance/leave → approval → payroll calculation → report.

### Kiswahili

Invitation salama → wasifu wa mfanyakazi → attendance/leave → approval → payroll → ripoti.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.7 Property rental

Portfolio → unit → owner/tenant/application → lease → inspection → invoice → payment → maintenance/expense → reconciliation.

### Kiswahili

Portfolio → unit → owner/tenant/application → lease → inspection → invoice → malipo → maintenance/expense → reconciliation.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.8 Healthcare care path

Patient → appointment → visit/vitals → prescription/lab → report/claim → consent-based reminder → audit.

### Kiswahili

Mgonjwa → appointment → visit/vitals → prescription/lab → report/claim → reminder yenye consent → audit.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.9 Subscription lifecycle

Catalog → Free activation or paid intent → provider status → verified settlement → subscription/invoice → access snapshot → expiry/renewal decision.

### Kiswahili

Catalog → Free au paid intent → status ya provider → settlement iliyothibitishwa → subscription/invoice → access snapshot → expiry/renewal.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

## V.10 AI proposal path

Verified user → bounded context → structured response → navigation/proposal → independent approval → confirmed module mutation.

### Kiswahili

Mtumiaji aliyehakikiwa → context yenye mipaka → response iliyopangwa → proposal → approval huru → mutation iliyothibitishwa.

#### Control points

At each transition, confirm identity, company scope, role, input validation, database response, and audit/result state. A failed step must remain failed; a local optimistic row is not a durable business record.

#### Evidence boundary

This workflow is a map of connected repository contracts. It is not a claim that every external provider, schedule, credential, device, or tenant dataset is enabled in every deployment.

---

# PART VI — USER MANUAL

## VI.1 First-day onboarding

Sign in through the supported gateway, verify the company context, review your role, open one permitted module, and create only a record that the server confirms.

### Kiswahili

Siku ya kwanza ingia kupitia gateway, hakikisha company context, soma role yako, fungua module inayoruhusiwa na tengeneza record ambayo server imethibitisha.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.2 Daily operating rhythm

Start with the dashboard, inspect exceptions, execute the module workflow, verify returned state, and leave approvals or reconciliation items visible to the responsible role.

### Kiswahili

Anza na dashibodi, kagua exceptions, tekeleza workflow, thibitisha hali iliyorejeshwa na acha approvals/reconciliation zionekane kwa role husika.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.3 Safe data entry

Use required fields, valid dates and amounts, company-scoped references, and clear descriptions. Do not paste secrets into business notes.

### Kiswahili

Tumia fields zinazohitajika, tarehe na kiasi sahihi, references za kampuni na maelezo wazi. Usiweke siri ndani ya notes za biashara.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.4 Errors and retries

Read the error state, preserve the form, correct the input or permission, and retry only after the cause is understood. Do not click repeatedly on payment or approval actions without an idempotency path.

### Kiswahili

Soma error, hifadhi form, rekebisha input au permission na retry baada ya kuelewa sababu. Usibonyeze payment au approval mara nyingi bila idempotency.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.5 Reports and review

Use reports to ask a question of recorded data. Follow a surprising number back to the source document, payment, movement, or journal entry.

### Kiswahili

Tumia ripoti kuuliza swali la data iliyorekodiwa. Namba ya kushangaza ifuatilie hadi document, payment, movement au journal entry ya chanzo.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.6 Subscription access

Read the server access state. FREE_15 is free for 15 days; paid access requires verified payment. Do not use local browser state as entitlement authority.

### Kiswahili

Soma access state ya server. FREE_15 ni bure kwa siku 15; paid access inahitaji payment iliyothibitishwa. Browser si mamlaka ya entitlement.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.7 Working on mobile

Use responsive views for review and entry, maintain stable connectivity for writes, and wait for confirmed response before navigating away from a critical action.

### Kiswahili

Tumia responsive view kwa review na entry, hakikisha connection kwa writes na subiri response iliyothibitishwa kabla ya kuondoka kwenye action muhimu.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

## VI.8 Support handoff

Record company, module, time, user role, exact message, and safe reproduction steps without including passwords or tokens.

### Kiswahili

Andika kampuni, module, muda, role, ujumbe kamili na hatua salama za kurudia bila kuingiza password au token.

#### Practical control

Treat the server-confirmed response as the completion signal. If it is unavailable, keep the operation visible as pending, failed, or unavailable rather than completed.

---

# PART VII — ADMINISTRATOR MANUAL

## VII.1 Provision a company

Confirm the authenticated owner, create or join the company through the supported path, verify membership and role, and review module entitlements before inviting staff.

### Kiswahili

Thibitisha owner, unda au jiunge na kampuni, hakikisha membership na role, kagua entitlements kabla ya kualika wafanyakazi.

#### Administrator evidence

An administrator should be able to show the source migration, the live ledger, the policy boundary, the successful verification result, and the remaining limitation. A green UI alone is not administration evidence.

---

## VII.2 Manage roles

Use role-change approval where required. Review the target user, old role, new role, approver, and audit record.

### Kiswahili

Tumia role-change approval inapohitajika. Kagua mtumiaji, role ya zamani/mpya, approver na audit record.

#### Administrator evidence

An administrator should be able to show the source migration, the live ledger, the policy boundary, the successful verification result, and the remaining limitation. A green UI alone is not administration evidence.

---

## VII.3 Configure providers

Keep provider keys server-side, test readiness, expose disabled states, and document which environment is sandbox or production.

### Kiswahili

Hifadhi keys server-side, pima readiness, onyesha disabled state na andika mazingira ya sandbox au production.

#### Administrator evidence

An administrator should be able to show the source migration, the live ledger, the policy boundary, the successful verification result, and the remaining limitation. A green UI alone is not administration evidence.

---

## VII.4 Review RLS

For each table, identify the company boundary, intended commands, membership helper, and policy. Avoid broad authenticated policies that bypass tenant scope.

### Kiswahili

Kwa kila table tambua company boundary, commands, helper ya membership na policy. Epuka policy pana ya authenticated inayovunja tenant scope.

#### Administrator evidence

An administrator should be able to show the source migration, the live ledger, the policy boundary, the successful verification result, and the remaining limitation. A green UI alone is not administration evidence.

---

## VII.5 Run migrations

Use source-versioned migrations, review prerequisites and compatibility guards, back up the target environment, apply through the controlled Supabase migration path, then rerun schema and RLS checks.

### Kiswahili

Tumia migrations zenye version, kagua prerequisites na guards, hifadhi backup, apply kupitia njia iliyodhibitiwa ya Supabase, kisha rudia schema/RLS checks.

#### Administrator evidence

An administrator should be able to show the source migration, the live ledger, the policy boundary, the successful verification result, and the remaining limitation. A green UI alone is not administration evidence.

---

## VII.6 Respond to incidents

Preserve audit evidence, fail closed, rotate exposed credentials, isolate the affected company or provider, and record the recovery decision.

### Kiswahili

Hifadhi audit, kata access pale inavyohitajika, badilisha credentials zilizoonekana, tenga kampuni/provider iliyoathirika na andika uamuzi wa recovery.

#### Administrator evidence

An administrator should be able to show the source migration, the live ledger, the policy boundary, the successful verification result, and the remaining limitation. A green UI alone is not administration evidence.

---

# PART VIII — DEVELOPER MANUAL

## VIII.1 Source navigation

Start with client/src/App.tsx, BusinessSphereDashboard.jsx, dashboard registries, server/_core/apiApp.ts, server/routers.ts, feature operations, and supabase/migrations. Follow an action from UI to handler/RPC to table and back to confirmed state.

### Kiswahili

Anza na App.tsx, BusinessSphereDashboard.jsx, registries, apiApp.ts, routers.ts, operations na migrations. Fuatilia action kutoka UI hadi handler/RPC, table na response iliyothibitishwa.

#### Developer checklist

Source, database, API, UI, RLS, tests, build, and deployment evidence must agree before a feature is described as complete.

---

## VIII.2 Persistence contract

Critical writes should validate input, resolve verified profile, enforce company scope, call the server/database boundary, require returned row/result, and retain retryable input on failure.

### Kiswahili

Writes muhimu zithibitishe input, profile, company scope, server/database, response ya row/result na zibaki na form kwa retry ikishindikana.

#### Developer checklist

Source, database, API, UI, RLS, tests, build, and deployment evidence must agree before a feature is described as complete.

---

## VIII.3 Migration discipline

Use timestamped source migrations. Prefer additive and guarded changes. Never silently coerce incompatible production columns or create a duplicate architecture around auth.users/profiles.

### Kiswahili

Tumia migrations zenye timestamp. Pendelea additive guards. Usibadilishe column za production kimya kimya wala kuunda users/profiles duplicate.

#### Developer checklist

Source, database, API, UI, RLS, tests, build, and deployment evidence must agree before a feature is described as complete.

---

## VIII.4 Testing

Use contract tests for source promises, Vitest for server logic, Playwright for browser journeys, and controlled Supabase staging for authenticated CRUD and provider acceptance.

### Kiswahili

Tumia contract tests, Vitest, Playwright na staging ya Supabase kwa CRUD ya authenticated na acceptance ya providers.

#### Developer checklist

Source, database, API, UI, RLS, tests, build, and deployment evidence must agree before a feature is described as complete.

---

## VIII.5 Observability

Log safe error categories, request correlation where available, audit outcomes, provider order IDs, and schema-verification status. Never log credentials or raw private payloads.

### Kiswahili

Log categories salama za errors, correlation, audit outcomes, provider order IDs na schema status. Usi-log credentials au payload za faragha.

#### Developer checklist

Source, database, API, UI, RLS, tests, build, and deployment evidence must agree before a feature is described as complete.

---

## VIII.6 Extension strategy

Add new modules through a route/registry decision, server boundary, schema contract, RLS policy, migration, tests, and documentation status. Keep the module’s limitation visible until all evidence exists.

### Kiswahili

Ongeza module kupitia route/registry, server boundary, schema contract, RLS, migration, tests na status ya docs. Usifiche limitation kabla ya ushahidi kamili.

#### Developer checklist

Source, database, API, UI, RLS, tests, build, and deployment evidence must agree before a feature is described as complete.

---

# PART IX — SECURITY BOOK

The security model is layered and the risk register below records actual findings from the repository and live advisors.

## IX.1 Authenticated SECURITY DEFINER routines

**Severity:** WARN

**Evidence:** The live security advisor reported 118 WARN and 1 INFO lint at the audit timestamp; many WARNs identify signed-in execution of SECURITY DEFINER routines.

**Recommended fix:** Review each signature, keep only intentionally callable endpoints, pin search paths, apply narrow grants, and move internal helpers out of the exposed API surface where possible.

### Security principle

The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

### Kiswahili

**Ushahidi:** The live security advisor reported 118 WARN and 1 INFO lint at the audit timestamp; many WARNs identify signed-in execution of SECURITY DEFINER routines. **Hatua:** Review each signature, keep only intentionally callable endpoints, pin search paths, apply narrow grants, and move internal helpers out of the exposed API surface where possible. Mfumo unapaswa kutumia utambulisho ulio wazi, role yenye mipaka, company scope, confirmation ya server, enforcement ya database na audit.

---

## IX.2 Multiple permissive RLS policies

**Severity:** WARN

**Evidence:** The live performance advisor reported 851 lints, including multiple permissive policies on the same table/action.

**Recommended fix:** Consolidate overlapping policies by command and role after verifying semantics; do not blindly drop production policies.

### Security principle

The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

### Kiswahili

**Ushahidi:** The live performance advisor reported 851 lints, including multiple permissive policies on the same table/action. **Hatua:** Consolidate overlapping policies by command and role after verifying semantics; do not blindly drop production policies. Mfumo unapaswa kutumia utambulisho ulio wazi, role yenye mipaka, company scope, confirmation ya server, enforcement ya database na audit.

---

## IX.3 Legacy non-atomic invoice payment path

**Severity:** P0 historical finding

**Evidence:** The audit report records separate sales_payments insertion and invoice balance update without a proven atomic idempotency RPC.

**Recommended fix:** Add a reviewed tenant-scoped atomic RPC and durable idempotency key before claiming concurrent-safe posting.

### Security principle

The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

### Kiswahili

**Ushahidi:** The audit report records separate sales_payments insertion and invoice balance update without a proven atomic idempotency RPC. **Hatua:** Add a reviewed tenant-scoped atomic RPC and durable idempotency key before claiming concurrent-safe posting. Mfumo unapaswa kutumia utambulisho ulio wazi, role yenye mipaka, company scope, confirmation ya server, enforcement ya database na audit.

---

## IX.4 Large dashboard boundary

**Severity:** P2

**Evidence:** BusinessSphereDashboard.jsx remains a very large monolithic component and the build reports a non-fatal large-chunk warning.

**Recommended fix:** Decompose incrementally after persistence and live-environment blockers are addressed; avoid cosmetic rewrites that increase risk.

### Security principle

The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

### Kiswahili

**Ushahidi:** BusinessSphereDashboard.jsx remains a very large monolithic component and the build reports a non-fatal large-chunk warning. **Hatua:** Decompose incrementally after persistence and live-environment blockers are addressed; avoid cosmetic rewrites that increase risk. Mfumo unapaswa kutumia utambulisho ulio wazi, role yenye mipaka, company scope, confirmation ya server, enforcement ya database na audit.

---

## IX.5 External provider readiness

**Severity:** Configuration boundary

**Evidence:** HarakaPay, TRA/VFD, WhatsApp, email/SMS, storage, and AI services depend on deployment configuration and approved credentials.

**Recommended fix:** Keep provider secrets server-side, expose readiness states, and test only controlled sandbox or authorized production paths.

### Security principle

The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

### Kiswahili

**Ushahidi:** HarakaPay, TRA/VFD, WhatsApp, email/SMS, storage, and AI services depend on deployment configuration and approved credentials. **Hatua:** Keep provider secrets server-side, expose readiness states, and test only controlled sandbox or authorized production paths. Mfumo unapaswa kutumia utambulisho ulio wazi, role yenye mipaka, company scope, confirmation ya server, enforcement ya database na audit.

---

## IX.6 Demo fallback risk

**Severity:** Medium

**Evidence:** The client has an explicit seed-data fallback when Supabase is not configured.

**Recommended fix:** Production deployments must fail closed with a clear configuration message; demo mode must remain explicit and non-operational.

### Security principle

The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

### Kiswahili

**Ushahidi:** The client has an explicit seed-data fallback when Supabase is not configured. **Hatua:** Production deployments must fail closed with a clear configuration message; demo mode must remain explicit and non-operational. Mfumo unapaswa kutumia utambulisho ulio wazi, role yenye mipaka, company scope, confirmation ya server, enforcement ya database na audit.

---

# PART X — DATABASE DICTIONARY

The live read-only Supabase inventory returned 542 tables (519 public and 23 auth), with 535 reporting RLS enabled. The following dictionary records the public table surface without exposing row contents.

| Table | Observed columns | Primary key | RLS | Rows reported |
| --- | --- | --- | --- | --- |
| approval_signatures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| audit_log | id, company_id, action, module, actor, details, subject, detail, created_at, updated_at | id | Enabled | 53 |
| bank_account_beneficiaries | id, company_id, customer_id, account_id, beneficiary_name, beneficiary_account_number, bank_name, phone, status, verified_at, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_account_types | id, company_id, code, name, product_kind, currency, minimum_opening_balance, minimum_operating_balance, annual_interest_rate, withdrawal_fee, status, data, created_at, updated_at | id | Enabled | 0 |
| bank_accounts | id, company_id, name, status, amount, notes, data, created_at, updated_at, account_number, customer_id, account_type_id, branch_id, currency, ledger_balance, available_balance, hold_amount, opened_at, closed_at, version, created_by | id | Enabled | 0 |
| bank_agents | id, company_id, agent_code, name, phone, national_id, branch_id, status, float_balance, commission_rate, data, created_at, updated_at | id | Enabled | 0 |
| bank_aml_alerts | id, company_id, alert_number, customer_id, transaction_id, rule_code, risk_level, status, rationale, assigned_to, mlro_decision, closed_at, data, created_at, updated_at | id | Enabled | 0 |
| bank_audit_events | id, company_id, actor_id, operation, entity_type, entity_id, outcome, request_id, redacted_payload, created_at | id | Enabled | 0 |
| bank_beneficial_owners | id, company_id, customer_id, full_name, national_id, ownership_percent, verification_status, data, created_at, updated_at | id | Enabled | 0 |
| bank_branches | id, company_id, institution_id, code, name, region, district, address, phone, status, created_at, updated_at | id | Enabled | 0 |
| bank_cash_movements | id, company_id, teller_id, branch_id, movement_type, amount, currency, status, transaction_id, approved_by, approved_at, idempotency_key, narration, created_by, created_at | id | Enabled | 0 |
| bank_collateral | id, company_id, application_id, collateral_type, description, ownership_document, estimated_value, valuation_date, verification_status, data, created_at | id | Enabled | 0 |
| bank_customer_documents | id, company_id, customer_id, document_type, document_number, file_url, issued_at, expires_at, verification_status, verified_by, verified_at, data, created_at, updated_at | id | Enabled | 0 |
| bank_customers | id, company_id, customer_number, customer_kind, full_name, phone, email, date_of_birth, gender, occupation, address, national_id, tin, risk_rating, pep_status, source_of_funds, relationship_purpose, kyc_status, kyc_verified_at, kyc_verified_by, kyc_expires_at, status, branch_id, data, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_fixed_deposits | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| bank_group_members | id, company_id, group_id, customer_id, role, shares_count, joined_at, status | id | Enabled | 0 |
| bank_groups | id, company_id, group_number, name, group_type, meeting_frequency, status, branch_id, data, created_at, updated_at | id | Enabled | 0 |
| bank_guarantors | id, company_id, application_id, customer_id, guarantee_amount, consent_status, consented_at, data, created_at | id | Enabled | 0 |
| bank_idempotency_keys | id, company_id, idempotency_key, operation, request_hash, status, result, created_by, created_at, completed_at | id | Enabled | 0 |
| bank_institutions | id, company_id, legal_name, trading_name, institution_type, licence_number, licence_status, country_code, currency, currency_exponent, timezone, fiscal_year_start_month, data, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_journal_batches | id, company_id, batch_number, currency, total_debit, total_credit, status, source_type, source_id, idempotency_key, posted_by, posted_at, created_at | id | Enabled | 0 |
| bank_journal_lines | id, company_id, batch_id, account_id, gl_code, line_description, debit, credit, created_at | id | Enabled | 0 |
| bank_loan_applications | id, company_id, application_number, customer_id, product_id, amount, term_months, purpose, status, credit_score, score_inputs, submitted_by, submitted_at, decision_by, decision_at, decision_note, branch_id, data, created_at, updated_at, disbursement_account_id | id | Enabled | 0 |
| bank_loan_approvals | id, company_id, application_id, step_number, approver_id, decision, note, decided_at | id | Enabled | 0 |
| bank_loan_products | id, company_id, code, name, product_kind, currency, minimum_amount, maximum_amount, minimum_term_months, maximum_term_months, annual_interest_rate, interest_method, processing_fee_rate, late_penalty_rate, collateral_required, guarantors_required, approval_threshold, status, data, created_at, updated_at | id | Enabled | 0 |
| bank_loan_repayments | id, company_id, repayment_number, loan_id, account_id, amount, principal_amount, interest_amount, fee_amount, penalty_amount, channel, status, idempotency_key, transaction_id, posted_by, posted_at | id | Enabled | 0 |
| bank_loan_schedules | id, company_id, loan_id, installment_number, due_date, principal_due, interest_due, fee_due, penalty_due, principal_paid, interest_paid, fee_paid, penalty_paid, status, paid_at | id | Enabled | 0 |
| bank_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at, loan_number, application_id, customer_id, product_id, principal, outstanding_principal, outstanding_interest, outstanding_fees, outstanding_penalties, annual_interest_rate, term_months, interest_method, disbursed_at, maturity_date, days_past_due, par_bucket, write_off_at, restructure_count, created_by | id | Enabled | 0 |
| bank_notifications | id, company_id, profile_id, customer_id, notification_type, title, body, channel, status, sent_at, data, created_at | id | Enabled | 0 |
| bank_payment_instructions | id, company_id, instruction_number, payment_type, channel, source_account_id, destination_account_id, amount, currency, provider, msisdn, provider_reference, status, requested_at, confirmed_at, failure_reason, idempotency_key, data, created_by | id | Enabled | 0 |
| bank_reconciliations | id, company_id, reconciliation_number, account_id, period_start, period_end, statement_balance, ledger_balance, difference, status, reviewed_by, reviewed_at, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_shares | id, company_id, group_id, customer_id, shares_count, price_per_share, transaction_id, status, created_at | id | Enabled | 0 |
| bank_standing_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at, order_number, source_account_id, destination_account_id, destination_msisdn, frequency, next_run_date, end_date, last_run_at, last_result, created_by | id | Enabled | 0 |
| bank_tellers | id, company_id, profile_id, branch_id, teller_code, name, status, opening_balance, closing_balance, opened_at, closed_at, version, data, created_at, updated_at | id | Enabled | 0 |
| bank_transactions | id, company_id, name, status, amount, notes, data, created_at, updated_at, transaction_number, transaction_type, channel, source_account_id, destination_account_id, customer_id, fee_amount, currency, idempotency_key, provider, provider_reference, narration, journal_batch_id, teller_id, initiated_by, posted_at, reversed_transaction_id | id | Enabled | 0 |
| bank_wallets | id, company_id, wallet_number, customer_id, provider, msisdn, balance, status, provider_customer_ref, data, created_at, updated_at | id | Enabled | 0 |
| billing_plan_audit_log | id, plan_id, company_id, action, changed_by, source, previous_values, new_values, created_at | id | Enabled | 13 |
| billing_plans | id, company_id, code, name, description, status, currency, monthly_price, annual_price, annual_savings_label, included_users, included_branches, included_storage_mb, included_transactions, features, module_entitlements, sort_order, recommended, created_by, created_at, updated_at, plan_category, badge, visual_theme, paid_months, bonus_months, total_months, duration_days | id | Enabled | 7 |
| billing_profiles | id, company_id, legal_name, contact_name, email, phone, tax_identifier, address, notes, created_at, updated_at | id | Enabled | 0 |
| bnk_accounts | id, company_id, member_id, name, type, balance, status, open_date, branch, acct_no, interest, data, created_at, updated_at | id | Enabled | 0 |
| bnk_applications | id, company_id, member_id, member, product, amount, term, purpose, collateral, submitted_date, status, officer, score, data, created_at, updated_at | id | Enabled | 0 |
| bnk_loans | id, company_id, member_id, member, product, principal, rate, term, disbursed, maturity, balance, status, collateral, emi, paid, dpd, data, created_at, updated_at | id | Enabled | 0 |
| bnk_members | id, company_id, name, dob, national_id, phone, email, gender, occupation, kyc_status, join_date, branch, data, created_at, updated_at | id | Enabled | 0 |
| bnk_transactions | id, company_id, acct_no, member, type, amount, balance, date, channel, narration, ref, data, created_at, updated_at | id | Enabled | 0 |
| branches | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 6 |
| business_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 3 |
| calendar_events | id, company_id, attendees, description, end_time, event_date, event_type, meeting_link, start_time, title, created_at, updated_at | id | Enabled | 0 |
| collab_channels | id, company_id, description, name, scope, created_at, updated_at | id | Enabled | 0 |
| collab_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| community_contributions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| community_group_announcements | id, company_id, group_id, title, body, audience, status, published_at, expires_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_approvals | id, company_id, group_id, entity_type, entity_id, action, status, requested_by, decided_by, decision_notes, requested_at, decided_at, created_at, updated_at | id | Enabled | 0 |
| community_group_assets | id, company_id, group_id, asset_code, name, category, acquisition_date, acquisition_cost, current_value, location, custodian, status, created_at, updated_at | id | Enabled | 0 |
| community_group_attendance | id, company_id, meeting_id, member_id, status, notes, created_at, updated_at | id | Enabled | 0 |
| community_group_audit_log | id, company_id, group_id, actor_id, actor_name, action, entity_type, entity_id, details, created_at, updated_at | id | Enabled | 3 |
| community_group_budgets | id, company_id, group_id, project_id, category, budget_amount, fiscal_year, status, approved_by, approved_at, created_at, updated_at | id | Enabled | 0 |
| community_group_committee_members | id, company_id, committee_id, member_id, committee_role, start_date, end_date, created_at, updated_at | id | Enabled | 0 |
| community_group_committees | id, company_id, group_id, name, committee_type, status, created_at, updated_at | id | Enabled | 0 |
| community_group_contributions | id, company_id, group_id, member_id, contribution_number, contribution_type, amount, currency, contribution_date, due_date, payment_method, mobile_money_provider, payment_reference, status, receipt_number, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_documents | id, company_id, group_id, document_type, title, file_url, document_date, expires_at, status, uploaded_by, created_at, updated_at | id | Enabled | 0 |
| community_group_events | id, company_id, group_id, title, event_type, event_date, start_time, venue, description, reminder_sent_at, status, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_expenses | id, company_id, group_id, project_id, category, description, amount, expense_date, payment_method, payment_reference, status, approved_by, approved_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_fundraising | id, company_id, group_id, project_id, donor_name, amount, donation_date, payment_method, payment_reference, status, notes, created_at, updated_at | id | Enabled | 0 |
| community_group_income | id, company_id, group_id, income_type, description, amount, income_date, payment_method, payment_reference, status, created_at, updated_at | id | Enabled | 0 |
| community_group_loan_guarantors | id, company_id, loan_id, guarantor_member_id, guaranteed_amount, consent_status, consented_at, created_at, updated_at | id | Enabled | 0 |
| community_group_loan_penalties | id, company_id, loan_id, penalty_date, reason, amount, status, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_loan_repayments | id, company_id, loan_id, repayment_number, repayment_date, amount, principal_amount, interest_amount, penalty_amount, payment_method, mobile_money_provider, payment_reference, status, receipt_number, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_loans | id, company_id, group_id, member_id, loan_number, purpose, principal, interest_rate, interest_method, term_months, application_date, approval_status, status, approved_by, approved_at, disbursed_at, first_due_date, total_interest, total_repayable, outstanding_principal, outstanding_interest, currency, payment_method, disbursement_reference, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_meetings | id, company_id, group_id, meeting_number, meeting_date, start_time, venue, agenda, minutes, chairperson_id, status, reminder_sent_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_members | id, company_id, group_id, member_number, full_name, phone, email, national_id, id_type, gender, date_of_birth, address, occupation, next_of_kin, next_of_kin_phone, join_date, exit_date, role, kyc_status, membership_status, kyc_data, data, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_messages | id, company_id, group_id, sender_member_id, subject, body, channel, status, created_at, updated_at | id | Enabled | 0 |
| community_group_notifications | id, company_id, group_id, member_id, notification_type, title, body, channel, status, scheduled_for, sent_at, created_at, updated_at | id | Enabled | 0 |
| community_group_projects | id, company_id, group_id, project_number, name, description, start_date, end_date, target_amount, status, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_savings | id, company_id, group_id, member_id, transaction_type, amount, transaction_date, payment_method, reference, status, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_vote_ballots | id, company_id, vote_id, option_id, member_id, cast_at | id | Enabled | 0 |
| community_group_vote_options | id, company_id, vote_id, label, candidate_member_id, vote_count, created_at, updated_at | id | Enabled | 0 |
| community_group_votes | id, company_id, group_id, title, description, vote_type, opens_at, closes_at, status, quorum_percent, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_welfare_claims | id, company_id, group_id, member_id, event_type, description, amount_requested, amount_approved, claim_date, status, payment_method, payment_reference, approved_by, approved_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_groups | id, company_id, name, status, amount, notes, data, created_at, updated_at, group_number, group_type, registration_number, description, country, region, district, ward, village, meeting_frequency, contribution_frequency, contribution_amount, currency, rules, created_by | id | Enabled | 1 |
| companies | id, name, category, tin, vrn, phone, email, address, city, country, currency, tax_rate, logo, join_code, created_at, updated_at, website, tax_id, business_scale, timezone, receipt_width, receipt_footer, receipt_show_logo, brand_primary_color, brand_accent_color | id | Enabled | 7 |
| company_memberships | user_id, company_id, role, created_at | user_id, company_id | Enabled | 7 |
| company_modules | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 62 |
| company_profile_settings | company_id, profile_data, updated_at | company_id | Enabled | 1 |
| competitors | id, company_id, category, name, notes, threat_level, created_at, updated_at | id | Enabled | 0 |
| crm_contacts | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| crm_interactions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| crm_leads | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 4 |
| custom_kpis | id, company_id, label, metric_id, target_value, created_at, updated_at | id | Enabled | 0 |
| customer_feedback | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| departments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 11 |
| digital_signatures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| documents | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| ecommerce_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| ecommerce_products | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| emails | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| expense_budgets | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| fin_accounts | id, company_id, account_code, account_name, account_type, normal_side, parent_id, is_postable, is_cash, currency, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_approval_requests | id, company_id, entity_type, entity_id, action, requested_by, status, required_approvals, decided_by, decided_at, decision_note, maker_checker_key, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_idempotency_keys | id, company_id, scope, idempotency_key, request_hash, response, status, expires_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_journal_batches | id, company_id, batch_number, source_module, source_type, source_id, business_date, currency, status, debit_total, credit_total, posted_at, posted_by, reversal_of_batch_id, narration, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_journal_lines | id, company_id, journal_batch_id, line_no, business_date, account_id, debit, credit, currency, branch_id, member_id, customer_id, description, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_periods | id, company_id, period_start, period_end, status, timezone, closed_by, closed_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_posting_links | id, company_id, journal_batch_id, source_table, source_id, link_role, created_by, created_at, updated_at, version, metadata | id | Enabled | 0 |
| fin_reconciliation_batches | id, company_id, account_scope, external_source, statement_date, opening_balance, closing_balance, status, file_reference, import_hash, approved_by, approved_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_reconciliation_items | id, company_id, batch_id, external_reference, external_date, amount, direction, provider, provider_status, matched_source_table, matched_source_id, match_status, exception_reason, resolved_by, resolved_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| finance_assets | id, company_id, acquisition_date, category, cost, name, useful_life_years, created_at, updated_at | id | Enabled | 0 |
| finance_expenses | id, company_id, amount, category, due_date, expense_date, method, status, vendor, created_at, updated_at | id | Enabled | 2 |
| financial_benchmarks | id, company_id, benchmark_value, label, metric_id, created_at, updated_at | id | Enabled | 0 |
| fleet_alerts | id, company_id, alert_key, severity, alert_type, entity_type, entity_id, title, body, due_on, status, acknowledged_by, acknowledged_at, created_at | id | Enabled | 0 |
| fleet_audit_events | id, company_id, actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, created_at | id | Enabled | 0 |
| fleet_driver_assignments | id, company_id, vehicle_id, driver_id, starts_at, ends_at, status, notes, assigned_by, created_at | id | Enabled | 0 |
| fleet_drivers | id, company_id, employee_id, profile_id, full_name, mobile_number, licence_number, licence_class, licence_expires_on, status, safety_score, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_fuel_cards | id, company_id, card_number_masked, issuer, vehicle_id, status, daily_limit, monthly_limit, expires_on, created_at | id | Enabled | 0 |
| fleet_fuel_transactions | id, company_id, vehicle_id, trip_id, fuel_card_id, transaction_at, station_name, litres, unit_price, total_cost, odometer_km, receipt_url, payment_reference, notes, created_by, created_at | id | Enabled | 0 |
| fleet_incidents | id, company_id, vehicle_id, driver_id, trip_id, incident_type, occurred_at, location, description, cost, status, evidence_url, created_by, created_at | id | Enabled | 0 |
| fleet_maintenance_jobs | id, company_id, job_number, vehicle_id, plan_id, workshop_id, maintenance_type, status, priority, requested_on, due_on, odometer_km, estimated_cost, approved_by, completed_on, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_maintenance_plans | id, company_id, vehicle_id, name, maintenance_type, interval_km, interval_days, last_completed_odometer_km, last_completed_on, next_due_odometer_km, next_due_on, active, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_routes | id, company_id, name, origin, destination, planned_distance_km, expected_duration_minutes, toll_budget, active, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_service_records | id, company_id, maintenance_job_id, vehicle_id, service_date, odometer_km, labour_cost, parts_cost, total_cost, invoice_reference, notes, created_by, created_at | id | Enabled | 0 |
| fleet_spare_parts | id, company_id, inventory_item_id, part_number, name, quantity_on_hand, reorder_level, average_cost, location, created_at | id | Enabled | 0 |
| fleet_telematics_events | id, company_id, vehicle_id, provider, external_event_id, captured_at, latitude, longitude, speed_kph, odometer_km, ignition_on, payload, created_at | id | Enabled | 0 |
| fleet_trips | id, company_id, trip_number, vehicle_id, driver_id, route_id, purpose, customer_reference, dispatch_status, planned_departure_at, dispatched_at, completed_at, origin, destination, start_odometer_km, end_odometer_km, distance_km, toll_cost, parking_cost, other_cost, approved_by, created_by, notes, created_at, updated_at | id | Enabled | 0 |
| fleet_tyres | id, company_id, vehicle_id, position, brand, size, serial_number, installed_on, installed_odometer_km, expected_life_km, status, notes, created_at | id | Enabled | 0 |
| fleet_vehicle_categories | id, company_id, name, description, created_at | id | Enabled | 0 |
| fleet_vehicle_documents | id, company_id, vehicle_id, document_type, document_number, issuer, issued_on, expires_on, document_url, status, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_vehicles | id, company_id, registration_number, ownership_type, status, category_id, make, model, model_year, vin, engine_number, fuel_type, odometer_km, seats, acquisition_type, acquisition_date, acquisition_cost, lease_end_date, home_branch, cost_center, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_workshops | id, company_id, name, contact_name, phone, email, address, supplier_id, status, created_at | id | Enabled | 0 |
| flt_maintenance | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| flt_trips | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| flt_vehicles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_appointments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_doctors | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_insurance_claims | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_invoices | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_lab_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_patients | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_portal_reference_approvals | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_portal_reference_imports | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_portal_reference_summary_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| hc_prescriptions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_radiology | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_reminder_deliveries | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_reminder_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_reports | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_visits | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_vitals | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_amenities | id, company_id, name, category, status, data | id | Enabled | 0 |
| hospitality_audit_log | id, company_id, actor_profile_id, action, subject, detail, created_at | id | Enabled | 3 |
| hospitality_complaints | id, company_id, reservation_id, guest_id, category, description, status, resolution, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_event_venues | id, company_id, property_id, name, capacity, base_rate, currency, status, data | id | Enabled | 0 |
| hospitality_events | id, company_id, property_id, venue_id, guest_id, name, start_at, end_at, status, amount, currency, data | id | Enabled | 0 |
| hospitality_finance_reconciliations | id, company_id, property_id, business_date, status, currency, gross_revenue, tax_total, payment_total, refund_total, variance, pos_transaction_id, journal_entry_id, finance_reference, data, created_by, created_at, updated_at | id | Enabled | 0 |
| hospitality_folio_lines | id, company_id, folio_id, line_type, description, quantity, unit_amount, amount, tax_amount, currency, source_table, source_record_id, posted_by, posted_at, data | id | Enabled | 0 |
| hospitality_folios | id, company_id, property_id, reservation_id, guest_id, folio_number, status, currency, finance_reference, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_guest_kyc | id, company_id, guest_id, document_id, id_type, id_number, issuing_country, expires_at, verification_status, data, created_at | id | Enabled | 0 |
| hospitality_guest_requests | id, company_id, reservation_id, guest_id, request_type, description, priority, status, assigned_employee_id, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_guests | id, company_id, profile_id, first_name, last_name, email, phone, nationality, date_of_birth, loyalty_number, status, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_housekeeping_tasks | id, company_id, property_id, room_id, assigned_employee_id, task_type, status, due_at, completed_at, notes, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_laundry_orders | id, company_id, reservation_id, guest_id, status, amount, currency, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_loyalty_accounts | id, company_id, guest_id, tier, points, status, data | id | Enabled | 0 |
| hospitality_maintenance_requests | id, company_id, property_id, room_id, category, priority, status, assigned_employee_id, notes, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_menu_items | id, company_id, menu_id, inventory_item_id, name, price, currency, status, data | id | Enabled | 0 |
| hospitality_menus | id, company_id, property_id, name, meal_period, status, data | id | Enabled | 0 |
| hospitality_minibar_postings | id, company_id, reservation_id, inventory_item_id, quantity, amount, status, data, created_at | id | Enabled | 0 |
| hospitality_notifications | id, company_id, profile_id, employee_id, title, body, type, module, record_id, read_at, created_at | id | Enabled | 0 |
| hospitality_order_lines | id, company_id, order_id, menu_item_id, name, quantity, unit_price, status, data | id | Enabled | 0 |
| hospitality_orders | id, company_id, property_id, table_id, reservation_id, folio_id, order_number, status, currency, data, created_by, created_at, updated_at | id | Enabled | 0 |
| hospitality_payments | id, company_id, folio_id, payment_method, amount, currency, status, reference, finance_payment_id, received_by, received_at, data | id | Enabled | 0 |
| hospitality_properties | id, company_id, branch_id, name, code, address, timezone, currency, status, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_rate_plans | id, company_id, property_id, room_type_id, name, currency, nightly_rate, effective_from, effective_to, status, data | id | Enabled | 0 |
| hospitality_reservations | id, company_id, property_id, guest_id, room_type_id, room_id, confirmation_code, arrival_date, departure_date, adults, children, status, nightly_rate, currency, source, special_requests, checked_in_at, checked_out_at, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_restaurant_tables | id, company_id, property_id, table_number, capacity, zone, status, data | id | Enabled | 0 |
| hospitality_room_types | id, company_id, property_id, name, code, capacity_adults, capacity_children, base_rate, currency, amenities, status, data | id | Enabled | 0 |
| hospitality_rooms | id, company_id, property_id, room_type_id, room_number, floor, status, housekeeping_status, maintenance_status, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_taxes | id, company_id, property_id, name, code, rate, applies_to, effective_from, effective_to, status, data | id | Enabled | 0 |
| hr_announcement_reads | announcement_id, profile_id, read_at | announcement_id, profile_id | Enabled | 0 |
| hr_announcements | id, company_id, title, body, audience_type, department_id, status, published_at, expires_at, created_by, created_at, updated_at | id | Enabled | 0 |
| hr_approval_requests | id, company_id, request_type, source_table, source_record_id, requester_employee_id, subject_employee_id, status, current_step, data, created_at, updated_at | id | Enabled | 0 |
| hr_approval_steps | id, company_id, approval_request_id, step_number, approver_profile_id, approver_role, status, decision_note, decided_at, created_at | id | Enabled | 0 |
| hr_attendance | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, attendance_date, shift_id, clock_in_at, clock_out_at, worked_minutes, source | id | Enabled | 0 |
| hr_benefit_enrollments | id, company_id, employee_id, benefit_plan_id, status, effective_from, effective_to, data, created_at, updated_at | id | Enabled | 0 |
| hr_benefit_plans | id, company_id, name, provider, benefit_type, employee_contribution, employer_contribution, currency, status, data, created_at, updated_at | id | Enabled | 0 |
| hr_benefits | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, benefit_plan_id, effective_from, effective_to | id | Enabled | 0 |
| hr_candidates | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hr_duties | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, assignee_profile_id, duty_date, started_at, completed_at, approved_by, approved_at | id | Enabled | 1 |
| hr_employee_documents | id, company_id, employee_id, document_id, title, document_type, file_url, status, expires_at, data, created_by, created_at, updated_at | id | Enabled | 0 |
| hr_employees | id, company_id, name, status, amount, notes, data, created_at, updated_at, profile_id, department_id, position_id, manager_employee_id, employee_number, employment_start_date, employment_end_date, timezone | id | Enabled | 1 |
| hr_expense_claims | id, company_id, employee_id, expense_date, category, amount, currency, merchant, description, status, finance_expense_id, document_id, decided_by, decided_at, decision_note, data, created_at, updated_at | id | Enabled | 0 |
| hr_goal_updates | id, company_id, goal_id, employee_id, current_value, note, created_at | id | Enabled | 0 |
| hr_goals | id, company_id, employee_id, title, description, metric_name, target_value, current_value, unit, status, due_date, owner_employee_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_holidays | id, company_id, holiday_date, name, holiday_type, paid, branch_id, created_at, updated_at | id | Enabled | 0 |
| hr_invite_codes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hr_leave_balances | id, company_id, employee_id, leave_policy_id, period_year, opening_balance, accrued_days, used_days, adjustment_days, updated_at | id | Enabled | 0 |
| hr_leave_policies | id, company_id, name, leave_type, annual_entitlement, carry_forward_limit, requires_approval, status, data, created_at, updated_at | id | Enabled | 0 |
| hr_leave_requests | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, leave_policy_id, start_date, end_date, requested_days, decision_by, decided_at, decision_note | id | Enabled | 0 |
| hr_notifications | id, company_id, profile_id, employee_id, title, body, notification_type, link_module, link_record_id, read_at, created_at | id | Enabled | 0 |
| hr_offboarding_cases | id, company_id, employee_id, status, last_working_date, reason, owner_profile_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_onboarding_cases | id, company_id, employee_id, status, start_date, due_date, owner_profile_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_onboarding_tasks | id, company_id, onboarding_case_id, employee_id, title, owner_profile_id, due_date, status, completed_at, data, created_at, updated_at | id | Enabled | 0 |
| hr_payroll_items | id, company_id, payroll_run_id, employee_id, gross_pay, taxable_pay, deductions, net_pay, currency, status, data, created_at, updated_at, employer_contributions, employer_cost | id | Enabled | 0 |
| hr_payroll_runs | id, company_id, name, status, amount, notes, data, created_at, updated_at, period_start, period_end, currency, timezone, approved_by, approved_at, posted_at, finance_reference | id | Enabled | 0 |
| hr_payslips | id, company_id, payroll_item_id, employee_id, pay_period, status, issued_at, document_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_performance_reviews | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, reviewer_employee_id, review_period_start, review_period_end, due_date, submitted_at, completed_at | id | Enabled | 0 |
| hr_positions | id, company_id, department_id, title, code, grade, status, description, created_at, updated_at | id | Enabled | 0 |
| hr_service_requests | id, company_id, employee_id, request_type, subject, description, status, assigned_to, decided_by, decided_at, decision_note, data, created_at, updated_at | id | Enabled | 0 |
| hr_shift_assignments | id, company_id, employee_id, shift_id, assignment_date, status, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| hr_shifts | id, company_id, name, start_time, end_time, unpaid_break_minutes, timezone, status, data, created_at, updated_at | id | Enabled | 0 |
| hr_statutory_rules | id, company_id, name, rule_code, effective_from, effective_to, applies_to, calculation_type, rate, fixed_amount, threshold_amount, currency, status, data, created_at, updated_at | id | Enabled | 5 |
| hr_timesheet_entries | id, company_id, timesheet_id, work_date, minutes, project_reference, work_note, created_at, updated_at | id | Enabled | 0 |
| hr_timesheets | id, company_id, employee_id, period_start, period_end, total_minutes, status, submitted_at, decided_by, decided_at, decision_note, data, created_at, updated_at | id | Enabled | 0 |
| hr_training | id, company_id, completion_date, course, due_date, employee_name, hr_employees, is_compliance, is_mandatory, status, video_url, created_at, updated_at | id | Enabled | 0 |
| hr_training_assignments | id, company_id, employee_id, course_id, assigned_by, due_date, status, completed_at, data, created_at, updated_at | id | Enabled | 0 |
| hr_training_courses | id, company_id, title, provider, duration_minutes, mandatory, status, content_url, data, created_at, updated_at | id | Enabled | 0 |
| htl_bookings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| htl_rooms | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| integration_connections | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| inventory_batches | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| inventory_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 81 |
| inventory_stock_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 11 |
| inventory_suppliers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| inventory_transfers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| inventory_warehouses | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| journal_entries | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| kb_articles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| loan_repayments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| manufacturing_bom_components | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| manufacturing_boms | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| manufacturing_machines | id, company_id, machine_type, name, purchase_date, status, warehouse_id, created_at, updated_at | id | Enabled | 0 |
| manufacturing_maintenance | id, company_id, cost, machine_name, maintenance_date, maintenance_type, next_due_date, notes, technician, created_at, updated_at | id | Enabled | 0 |
| manufacturing_qc_inspections | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| manufacturing_work_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| marketing_campaigns | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_audit_logs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| mfi_cash_sessions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_cash_transactions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_clients | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| mfi_collateral | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_collections | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_credit_scorecards | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_credit_scoring_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_groups | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_guarantors | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_loan_applications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_loan_products | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| mfi_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_par_escalation_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| mfi_repayment_schedules | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_repayments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_savings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_staff_commissions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| money_agent_agents | id, company_id, profile_id, branch_id, supervisor_id, agent_code, full_name, phone, national_id, kyc_status, kyb_status, status, daily_limit, monthly_limit, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_alerts | id, company_id, agent_id, alert_type, severity, title, body, status, created_at, acknowledged_by, acknowledged_at | id | Enabled | 0 |
| money_agent_approvals | id, company_id, transaction_id, status, requested_by, decided_by, note, requested_at, decided_at | id | Enabled | 0 |
| money_agent_audit_events | id, company_id, actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, created_at | id | Enabled | 0 |
| money_agent_branches | id, company_id, branch_code, name, region, district, ward, address, phone, status, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_commission_rules | id, company_id, service_code, commission_type, commission_value, active, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_customers | id, company_id, profile_id, full_name, phone, national_id, kyc_status, status, address, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_daily_summaries | id, company_id, agent_id, branch_id, business_date, transaction_count, successful_count, failed_count, cash_in_amount, cash_out_amount, fee_amount, commission_amount, updated_at | id | Enabled | 0 |
| money_agent_fee_rules | id, company_id, service_code, min_amount, max_amount, fee_type, fee_value, active, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_ledger_entries | id, company_id, transaction_id, account_code, entry_type, amount, currency, posted_at, metadata | id | Enabled | 0 |
| money_agent_limits | id, company_id, agent_id, transaction_type, max_single_amount, daily_amount, monthly_amount, velocity_window_minutes, velocity_count, active, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_notifications | id, company_id, transaction_id, agent_id, channel, status, title, body, provider_reference, created_at, sent_at, read_at | id | Enabled | 0 |
| money_agent_pin_credentials | id, company_id, agent_id, pin_hash, failed_attempts, locked_until, last_used_at, status, created_at, updated_at | id | Enabled | 0 |
| money_agent_receipts | id, company_id, transaction_id, receipt_number, channel, recipient_phone, issued_at, metadata | id | Enabled | 0 |
| money_agent_reconciliations | id, company_id, settlement_id, status, expected_amount, actual_amount, variance, reviewed_by, reviewed_at, notes, created_at, updated_at | id | Enabled | 0 |
| money_agent_risk_events | id, company_id, agent_id, transaction_id, risk_type, severity, status, score, reason, metadata, created_at, resolved_by, resolved_at | id | Enabled | 0 |
| money_agent_services | id, company_id, service_code, name, service_type, provider_code, requires_provider, active, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_settlements | id, company_id, agent_id, branch_id, business_date, opening_float, closing_float, expected_float, variance, status, submitted_by, settled_by, notes, created_at, updated_at | id | Enabled | 0 |
| money_agent_transactions | id, company_id, transaction_ref, idempotency_key, agent_id, branch_id, customer_id, service_id, transaction_type, amount, fee, commission, currency, status, authorization_method, authorization_reference_hash, provider_code, provider_reference, failure_code, failure_reason, requested_at, authorized_at, processed_at, completed_at, reversed_at, created_by, metadata, created_at, updated_at | id | Enabled | 0 |
| money_agent_wallets | id, company_id, owner_type, owner_id, wallet_type, currency, available_balance, status, created_at, updated_at | id | Enabled | 0 |
| network_profiles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| network_rfqs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| notebook_notes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| notification_channels | id, company_id, business_number, channel_id, enabled, from_address, from_number, server_key, webhook_url, created_at, updated_at | id | Enabled | 0 |
| notification_log | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| notification_rules | id, company_id, alert_type, channels, created_at, updated_at | id | Enabled | 0 |
| other_debtors | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| other_income | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| period_closes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_audit_logs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| phm_batches | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_brands | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_categories | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_controlled_medicine_register | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_dispense | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_dispense_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_drugs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| phm_insurance_claims | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_payments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_purchase_order_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_purchase_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_return_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_returns | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_sale_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_sales | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_adjustments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_receipts | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_transfers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_suppliers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| platform_admin_actions | id, actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details, created_at | id | Enabled | 1 |
| pos_cash_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 3 |
| pos_discount_rules | id, company_id, discount_code, name, scope_type, inventory_item_id, discount_type, value, max_discount_amount, minimum_subtotal, stackable, requires_approval, contra_revenue_account_id, effective_from, effective_to, status, approval_request_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_ledger | id, company_id, member_id, entry_type, points_delta, points_balance_after, sale_id, redemption_id, idempotency_key, reference, status, occurred_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_members | id, company_id, program_id, customer_id, member_number, status, points_balance, lifetime_earned, lifetime_redeemed, joined_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_programs | id, company_id, program_code, name, earn_points_per_100_tzs, redemption_tzs_per_point, minimum_redeem_points, expiry_days, points_liability_account_id, status, approval_request_id, effective_from, effective_to, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_redemptions | id, company_id, member_id, reward_id, sale_id, points_spent, cash_value, status, approval_request_id, journal_batch_id, idempotency_key, request_hash, applied_at, applied_by, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_rewards | id, company_id, program_id, reward_code, name, points_cost, cash_value, inventory_item_id, status, approval_request_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_promotion_items | id, company_id, promotion_id, inventory_item_id, item_role, required_quantity, reward_price, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_promotions | id, company_id, promotion_code, name, trigger_type, benefit_type, minimum_spend, minimum_quantity, benefit_value, reward_quantity, points_multiplier_bps, stackable, priority, customer_limit, daily_limit, effective_from, effective_to, status, approval_request_id, requires_approval, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_registers | id, company_id, register_code, name, branch_id, warehouse_id, default_currency, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_return_commits | id, company_id, return_id, idempotency_key, created_by, created_at, updated_at | id | Enabled | 2 |
| pos_return_headers | id, company_id, return_number, sale_id, register_id, terminal_id, shift_id, cashier_id, reason, refund_method, currency, refund_total, status, approval_request_id, journal_batch_id, idempotency_key, request_hash, legacy_pos_return_id, posted_at, posted_by, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_return_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| pos_return_lines | id, company_id, return_id, sale_line_id, line_no, quantity, unit_price, tax_amount, refund_amount, restock_quantity, condition, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_returns | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| pos_sale_adjustments | id, company_id, sale_id, sale_line_id, adjustment_no, adjustment_type, tax_rule_id, discount_rule_id, promotion_id, base_amount, rate_bps, amount, status, approval_request_id, journal_batch_id, idempotency_key, request_hash, applied_at, applied_by, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_headers | id, company_id, sale_number, register_id, terminal_id, shift_id, cashier_id, customer_id, customer_name, business_date, source_channel, status, payment_status, currency, subtotal, discount_total, tax_total, total, paid_total, change_total, refunded_total, journal_batch_id, idempotency_key, request_hash, receipt_issued_at, completed_at, voided_at, legacy_pos_transaction_id, created_by, created_at, updated_by, updated_ | id | Enabled | 0 |
| pos_sale_lines | id, company_id, sale_id, line_no, inventory_item_id, item_sku, item_name, quantity, unit_price, discount_amount, tax_amount, line_subtotal, line_total, cost_total, returned_quantity, status, legacy_pos_transaction_item_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_tax_lines | id, company_id, sale_id, sale_line_id, tax_rule_id, taxable_amount, rate_bps, tax_amount, included_in_price, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_tenders | id, company_id, sale_id, tender_no, method, currency, tendered_amount, applied_amount, change_amount, reference, provider_code, provider_reference, provider_status, status, journal_batch_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_shift_cash_movements | id, company_id, shift_id, movement_type, amount, reason, reference, approval_request_id, journal_batch_id, status, occurred_at, legacy_pos_cash_movement_id, created_by, created_at, updated_by, updated_at, version, metadata, idempotency_key, request_hash, posted_at, posted_by, reversal_of_movement_id | id | Enabled | 0 |
| pos_shift_sessions | id, company_id, shift_number, register_id, terminal_id, cashier_id, business_date, opened_at, opening_float, expected_cash, counted_cash, variance, status, closed_at, closed_by, close_reason, open_idempotency_key, close_idempotency_key, legacy_pos_shift_id, created_by, created_at, updated_by, updated_at, version, metadata, open_request_hash, close_request_hash | id | Enabled | 0 |
| pos_shifts | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 4 |
| pos_sync_devices | id, company_id, device_key, terminal_id, last_sequence, last_seen_at, status, created_by, created_at, updated_by, updated_at, version, metadata, last_accepted_hash | id | Enabled | 0 |
| pos_sync_events | id, company_id, idempotency_key, transaction_id, status, message, created_by, created_at, updated_at | id | Enabled | 4 |
| pos_tax_rules | id, company_id, tax_code, name, tax_type, scope_type, inventory_item_id, rate_bps, calculation_method, tax_account_id, effective_from, effective_to, status, approval_request_id, requires_approval, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_terminals | id, company_id, register_id, device_key, device_label, app_version, last_seen_at, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_transaction_commits | id, company_id, transaction_id, idempotency_key, created_by, created_at, updated_at | id | Enabled | 5 |
| pos_transaction_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 5 |
| pos_transactions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 5 |
| procurement_contracts | id, company_id, contract_type, doc_number, end_date, notes, start_date, supplier, value, created_at, updated_at | id | Enabled | 0 |
| procurement_purchase_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| profiles | id, company_id, full_name, email, role, phone, avatar_url, is_active, created_at, updated_at, customer_ref, onboarding_tour_completed_at, onboarding_tour_role_track, preferred_name, first_name, middle_name, last_name, date_of_birth, gender, address, country, preferred_language, currency_display, profile_timezone, date_format, theme_preference, notification_preferences, avatar_storage_key, profile_completed_at | id | Enabled | 9 |
| project_expenses | id, company_id, amount, description, expense_date, project_ref, created_at, updated_at | id | Enabled | 0 |
| project_milestones | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| project_tasks | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| projects | id, company_id, budget, client, end_date, manager, name, start_date, status, created_at, updated_at | id | Enabled | 0 |
| property_agents | id, company_id, profile_id, agent_code, full_name, phone, email, licence_number, commission_rate, status, branch_label, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_applications | id, company_id, application_number, unit_id, tenant_id, agent_id, requested_start_date, proposed_rent, status, decision_note, decided_by, decided_at, idempotency_key, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_approvals | id, company_id, entity_type, entity_id, action, status, requested_by, decided_by, note, requested_at, decided_at | id | Enabled | 0 |
| property_audit_log | id, company_id, actor_id, action, entity_type, entity_id, details, created_at | id | Enabled | 0 |
| property_budgets | id, company_id, portfolio_id, fiscal_year, category, budget_amount, status, approved_by, approved_at, created_by, created_at | id | Enabled | 0 |
| property_buildings | id, company_id, portfolio_id, property_code, name, property_type, address, country, region, district, ward, village, latitude, longitude, year_built, floors, status, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_contractors | id, company_id, contractor_code, name, phone, email, trade, tax_number, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_documents | id, company_id, entity_type, entity_id, document_type, title, storage_key, file_url, document_date, expires_at, verification_status, uploaded_by, metadata, created_at | id | Enabled | 0 |
| property_expenses | id, company_id, expense_number, property_id, unit_id, work_order_id, category, description, amount, expense_date, status, payment_method, payment_reference, approved_by, approved_at, created_by, created_at, updated_at | id | Enabled | 0 |
| property_handover_records | id, company_id, lease_id, handover_type, handover_date, keys_count, meter_snapshot, signed_by_tenant, signed_by_manager, notes, created_by, created_at | id | Enabled | 0 |
| property_inspection_items | id, company_id, inspection_id, area_name, condition, notes, estimated_cost, created_at | id | Enabled | 0 |
| property_inspections | id, company_id, lease_id, inspection_type, inspection_date, condition_summary, status, inspector_id, metadata, created_at | id | Enabled | 0 |
| property_insurances | id, company_id, property_id, unit_id, insurer, policy_number, cover_type, premium, start_date, end_date, status, notes, created_by, created_at | id | Enabled | 0 |
| property_integration_events | id, company_id, target_module, entity_type, entity_id, event_type, status, payload, created_by, created_at, processed_at | id | Enabled | 0 |
| property_invoice_lines | id, company_id, invoice_id, line_type, description, quantity, unit_amount, line_total, account_code, created_at | id | Enabled | 0 |
| property_invoices | id, company_id, invoice_number, lease_id, tenant_id, unit_id, invoice_type, period_start, period_end, issue_date, due_date, subtotal, tax_amount, late_fee_amount, total_amount, amount_paid, status, currency, idempotency_key, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| property_leases | id, company_id, lease_number, unit_id, tenant_id, owner_id, application_id, start_date, end_date, rent_amount, service_charge_amount, deposit_amount, rent_frequency, notice_days, status, terms, created_by, approved_by, approved_at, terminated_at, created_at, updated_at | id | Enabled | 0 |
| property_ledger_entries | id, company_id, source_type, source_id, account_code, entry_type, amount, currency, metadata, created_at | id | Enabled | 0 |
| property_listings | id, company_id, unit_id, agent_id, listing_type, asking_amount, commission_rate, status, available_from, published_at, expires_at, description, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_maintenance_requests | id, company_id, request_number, unit_id, lease_id, tenant_id, category, priority, title, description, status, requested_at, completed_at, created_by, created_at, updated_at | id | Enabled | 0 |
| property_meter_readings | id, company_id, meter_id, reading_date, reading_value, previous_value, consumption, captured_by, source, notes, created_at | id | Enabled | 0 |
| property_notices | id, company_id, lease_id, tenant_id, notice_type, title, body, notice_date, effective_date, status, created_by, created_at | id | Enabled | 0 |
| property_notifications | id, company_id, recipient_profile_id, tenant_id, notice_id, notification_type, title, body, channel, status, scheduled_for, sent_at, dedupe_key, created_at | id | Enabled | 0 |
| property_owners | id, company_id, profile_id, owner_type, legal_name, phone, email, national_id, tin, kyc_status, status, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_payments | id, company_id, payment_number, invoice_id, tenant_id, amount, payment_method, provider_code, provider_reference, status, idempotency_key, paid_at, posted_by, metadata, created_at | id | Enabled | 0 |
| property_plots | id, company_id, portfolio_id, plot_code, title_number, land_use, area_sqm, address, region, district, ward, latitude, longitude, owner_id, status, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_portfolios | id, company_id, portfolio_code, name, description, currency, timezone, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_receipts | id, company_id, payment_id, receipt_number, channel, recipient_phone, issued_at, metadata | id | Enabled | 0 |
| property_reconciliations | id, company_id, payment_id, invoice_id, expected_amount, actual_amount, variance, status, reviewed_by, reviewed_at, notes, created_by, created_at | id | Enabled | 0 |
| property_rent_schedules | id, company_id, lease_id, next_invoice_date, frequency, active, last_invoice_id, created_at, updated_at | id | Enabled | 0 |
| property_service_charges | id, company_id, unit_id, name, amount, frequency, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_tax_fee_rules | id, company_id, code, name, applies_to, rate, flat_amount, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_tenant_documents | id, company_id, tenant_id, document_type, document_number, storage_key, file_url, verification_status, expires_at, metadata, uploaded_by, created_at | id | Enabled | 0 |
| property_tenants | id, company_id, profile_id, tenant_code, full_name, phone, email, national_id, tin, kyc_status, status, address, emergency_contact, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_units | id, company_id, building_id, plot_id, owner_id, unit_code, unit_type, floor_label, bedrooms, bathrooms, area_sqm, rent_amount, service_charge_amount, deposit_amount, currency, status, furnishing, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_utility_meters | id, company_id, unit_id, utility_type, meter_number, unit_of_measure, rate, status | id | Enabled | 0 |
| property_work_orders | id, company_id, work_order_number, request_id, contractor_id, assigned_profile_id, estimated_cost, actual_cost, status, due_date, completion_note, created_by, created_at, updated_at | id | Enabled | 0 |
| purchase_order_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| resource_bookings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| restaurant_alerts | id, company_id, outlet_id, alert_key, alert_type, severity, title, body, status, due_at, created_at | id | Enabled | 0 |
| restaurant_audit_events | id, company_id, outlet_id, actor_id, action, subject_type, subject_id, detail, created_at | id | Enabled | 0 |
| restaurant_bill_splits | id, company_id, parent_order_id, split_order_id, split_number, amount, status | id | Enabled | 0 |
| restaurant_combo_items | id, company_id, parent_menu_item_id, child_menu_item_id, quantity | id | Enabled | 0 |
| restaurant_customers | id, company_id, guest_id, name, phone, email, loyalty_points, status, data | id | Enabled | 0 |
| restaurant_dining_areas | id, company_id, outlet_id, name, area_type, layout, status | id | Enabled | 0 |
| restaurant_fiscal_profiles | id, company_id, outlet_id, tax_profile_id, tin, vrn, business_name, trading_name, physical_address, region, district, device_serial, provider_code, environment, status, receipt_prefix, fiscalized_at, data, created_by, created_at, updated_at | id | Enabled | 0 |
| restaurant_fiscal_receipts | id, company_id, outlet_id, fiscal_profile_id, order_id, internal_reference, official_receipt_number, fiscal_serial, verification_code, qr_payload, status, gross_amount, vat_amount, net_amount, currency, idempotency_key, provider_response, failure_reason, queued_at, submitted_at, verified_at, created_at, updated_at | id | Enabled | 0 |
| restaurant_kitchen_tickets | id, company_id, outlet_id, order_id, ticket_number, station, status, opened_at, completed_at | id | Enabled | 0 |
| restaurant_menu_categories | id, company_id, outlet_id, name, sort_order, status | id | Enabled | 0 |
| restaurant_menu_items | id, company_id, outlet_id, category_id, inventory_item_id, sku, name, description, price, cost_price, preparation_minutes, station, tax_rate, status, data | id | Enabled | 0 |
| restaurant_mobile_money_intents | id, company_id, outlet_id, order_id, profile_id, provider_reference, phone_last_four, amount, currency, status, provider_payload, failure_reason, expires_at, paid_at, created_by, created_at, updated_at | id | Enabled | 0 |
| restaurant_mobile_money_profiles | id, company_id, outlet_id, provider, merchant_label, merchant_account_reference, collection_mode, status, webhook_configured, data, created_by, created_at, updated_at | id | Enabled | 0 |
| restaurant_modifier_groups | id, company_id, outlet_id, name, min_select, max_select, status | id | Enabled | 0 |
| restaurant_modifier_options | id, company_id, group_id, inventory_item_id, name, price_delta, status | id | Enabled | 0 |
| restaurant_order_lines | id, company_id, order_id, menu_item_id, name, quantity, unit_price, discount_amount, status, modifiers, notes, stock_consumed, created_at | id | Enabled | 0 |
| restaurant_orders | id, company_id, outlet_id, table_id, reservation_id, customer_id, hotel_folio_id, waiter_employee_id, order_number, order_type, status, subtotal, discount_amount, tax_amount, service_charge_amount, tip_amount, total_amount, currency, opened_at, closed_at, data | id | Enabled | 0 |
| restaurant_outlets | id, company_id, property_id, branch_id, name, code, timezone, currency, tax_rate, service_charge_rate, status, data, created_at, updated_at | id | Enabled | 0 |
| restaurant_payments | id, company_id, order_id, method, amount, reference, status, received_by, received_at, data | id | Enabled | 0 |
| restaurant_promotions | id, company_id, outlet_id, code, name, discount_type, discount_value, starts_at, ends_at, status | id | Enabled | 0 |
| restaurant_purchase_lines | id, company_id, request_id, inventory_item_id, quantity, unit_cost, received_quantity | id | Enabled | 0 |
| restaurant_purchase_requests | id, company_id, outlet_id, supplier_id, request_number, status, total_amount, currency, data, created_at | id | Enabled | 0 |
| restaurant_recipe_ingredients | id, company_id, menu_item_id, inventory_item_id, quantity, unit, waste_pct | id | Enabled | 0 |
| restaurant_refunds | id, company_id, order_id, payment_id, reason, amount, status, idempotency_key, created_by, created_at | id | Enabled | 0 |
| restaurant_reservations | id, company_id, outlet_id, table_id, customer_id, reference, reservation_at, duration_minutes, covers, status, notes, created_at | id | Enabled | 0 |
| restaurant_shifts | id, company_id, outlet_id, employee_id, role, starts_at, ends_at, status, opening_cash, closing_cash, data, created_at | id | Enabled | 0 |
| restaurant_staff_roles | id, company_id, outlet_id, employee_id, role, status | id | Enabled | 0 |
| restaurant_suppliers | id, company_id, name, phone, email, address, status, data | id | Enabled | 0 |
| restaurant_tables | id, company_id, outlet_id, area_id, code, capacity, status, position, current_order_id, data, updated_at | id | Enabled | 0 |
| restaurant_tax_profiles | id, company_id, outlet_id, code, name, tax_type, rate_percent, is_inclusive, is_default, is_active, legal_basis, created_at, updated_at | id | Enabled | 0 |
| restaurant_wastage | id, company_id, outlet_id, inventory_item_id, quantity, reason, cost, created_by, created_at | id | Enabled | 0 |
| rst_menu | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| rst_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| rst_reservations | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| rst_tables | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sales_invoice_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, invoice_id, item_name, item_sku, qty, rate, sort_order | id | Enabled | 2 |
| sales_invoices | id, company_id, name, status, amount, notes, data, created_at, updated_at, doc_number, customer, issue_date, due_date, order_id, amount_paid | id | Enabled | 1 |
| sales_order_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, order_id, item_name, item_sku, qty, rate, sort_order | id | Enabled | 0 |
| sales_order_return_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, return_id, item_name, item_sku, qty, rate | id | Enabled | 0 |
| sales_order_returns | id, company_id, name, status, amount, notes, data, created_at, updated_at, order_id, reason | id | Enabled | 0 |
| sales_orders | id, company_id, customer, doc_number, order_date, owner_id, quotation_id, sales_order_items, sales_order_returns, status, created_at, updated_at, quotation_reference, owner_name | id | Enabled | 0 |
| sales_payments | id, company_id, name, status, amount, notes, data, created_at, updated_at, invoice_id, method, payment_date, reference | id | Enabled | 12 |
| sales_quotation_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, quotation_id, item_name, item_sku, qty, rate, sort_order | id | Enabled | 1 |
| sales_quotations | id, company_id, name, status, amount, notes, data, created_at, updated_at, doc_number, customer, issue_date, valid_until, owner_id | id | Enabled | 4 |
| sales_subscriptions | id, company_id, name, status, amount, notes, data, created_at, updated_at, doc_number, customer, plan, cycle, start_date, next_billing_date | id | Enabled | 1 |
| sch_academic_years | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_admissions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_announcements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_approval_requests | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assessment_scores | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assessments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assignment_submissions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assignments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_attendance_records | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_attendance_sessions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_audit_logs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_books | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_classes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_departments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_disciplinary_records | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_documents | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_enrollments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_exams | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fee_invoice_lines | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fee_invoices | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fee_structures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fees | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_grading_scales | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_guardians | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_hostel_allocations | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_hostels | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_inventory_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_inventory_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_library_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_payments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_portal_links | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_report_cards | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_scholarships | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_streams | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_student_guardians | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_students | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_subjects | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_teacher_assignments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_teachers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_terms | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_timetables | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_transport | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_transport_assignments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| scheduled_reports | id, company_id, format, frequency, last_run, recipient_email, report_type, status, created_at, updated_at | id | Enabled | 0 |
| scm_shipments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| scm_vehicles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| signatures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sms_group_members | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sms_groups | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sms_templates | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| stock_audit_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| stock_audits | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| subscription_events | id, company_id, subscription_id, payment_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details, created_at | id | Enabled | 6 |
| subscription_invoices | id, company_id, subscription_id, payment_id, invoice_number, status, currency, subtotal, tax_amount, total_amount, paid_amount, issued_at, due_at, paid_at, document_data, created_at, updated_at | id | Enabled | 0 |
| subscription_notifications | id, company_id, subscription_id, notification_key, notification_type, title, message, status, scheduled_for, delivered_at, read_at, metadata, created_at | id | Enabled | 2 |
| subscription_payments | id, company_id, subscription_id, plan_id, provider, internal_reference, idempotency_key, provider_order_id, amount, fee, net_amount, currency, phone, description, billing_cycle, status, initiated_by, provider_response, verified_at, paid_at, failure_reason, created_at, updated_at | id | Enabled | 2 |
| subscription_usage | id, company_id, usage_key, period_start, period_end, usage_value, limit_value, source, metadata, recorded_at | id | Enabled | 0 |
| support_agents | id, company_id, profile_id, team_id, availability, workload_limit, is_active, created_at, updated_at | id | Enabled | 0 |
| support_call_log | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| support_chat_conversations | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 3 |
| support_chat_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 6 |
| support_message_templates | id, company_id, name, provider, channel, language, category, body, variables, approval_status, is_active, created_by, created_at, updated_at | id | Enabled | 0 |
| support_sla_policies | id, company_id, name, priority, first_response_minutes, resolution_minutes, warning_minutes, is_active, created_at, updated_at | id | Enabled | 0 |
| support_team_members | id, company_id, team_id, profile_id, role, created_at | id | Enabled | 0 |
| support_teams | id, company_id, name, department_name, is_active, created_by, created_at, updated_at | id | Enabled | 0 |
| support_ticket_activity | id, company_id, ticket_id, actor_profile_id, event_type, details, created_at | id | Enabled | 0 |
| support_ticket_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at, ticket_id, body, sender_kind, sender_profile_id, channel, is_internal, delivery_status, provider_message_id, sent_at | id | Enabled | 0 |
| support_ticket_notes | id, company_id, ticket_id, author_profile_id, body, kind, created_at | id | Enabled | 0 |
| support_tickets | id, company_id, assignee, category, created_date, customer, doc_number, priority, status, subject, support_ticket_messages, created_at, updated_at, assigned_profile_id, team_id, source_channel, customer_reference, due_at, resolved_at, closed_at | id | Enabled | 0 |
| tenant_subscriptions | id, company_id, plan_id, status, billing_cycle, amount, currency, started_at, renewed_at, expires_at, grace_expires_at, cancelled_at, cancellation_reason, source_payment_id, metadata, created_at, updated_at, offer_code, paid_months, bonus_months, total_months, duration_days | id | Enabled | 2 |
| user_table_preferences | company_id, user_id, preference_key, value, updated_at | company_id, user_id, preference_key | Enabled | 0 |
| vicoba_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| vicoba_meetings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| vicoba_members | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| whatsapp_account_links | id, company_id, profile_id, phone_e164, code_hash, expires_at, used_at, created_by, created_at | id | Enabled | 0 |
| whatsapp_accounts | id, company_id, provider, phone_number_id, display_phone_number, enabled, allowed_capabilities, created_by, created_at, updated_at | id | Enabled | 0 |
| whatsapp_contacts | id, company_id, profile_id, phone_e164, display_name, preferred_language, linked_at, last_seen_at, created_at, updated_at | id | Enabled | 0 |
| whatsapp_conversations | id, company_id, contact_id, status, last_message_at, context_expires_at, created_at, updated_at | id | Enabled | 0 |
| whatsapp_message_events | id, provider_message_id, company_id, phone_e164, event_type, status, payload_hash, error_category, received_at, processed_at | id | Enabled | 0 |
| whatsapp_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at, provider_message_id, direction, phone_e164, body, message_type, provider_timestamp, conversation_id, contact_id, request_id, error_category, tool_name, ai_model | id | Enabled | 0 |
| workflow_marketplace_templates | id, company_id, category, description, install_count, is_official, name, published_by_company_name, steps, trigger_type, created_at, updated_at | id | Enabled | 0 |
| workflows | id, company_id, condition, enabled, last_run, name, steps, trigger_type, created_at, updated_at | id | Enabled | 0 |
| workforce_approval_limits | id, company_id, target_profile_id, target_role_id, permission_id, currency, single_transaction_limit, daily_limit, requires_checker, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_data_scopes | id, company_id, target_profile_id, target_role_id, scope_type, scope_id, effect, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_member_roles | id, company_id, profile_id, employee_id, role_id, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_module_access | id, company_id, target_profile_id, target_role_id, module_id, permission_action, effect, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_permission_conflicts | id, company_id, conflict_code, permission_a_id, permission_b_id, severity, resolution_policy, status, description, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 21 |
| workforce_permissions | id, company_id, code, module_id, resource, permission_action, description, is_sensitive, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 140 |
| workforce_role_permissions | id, company_id, role_id, permission_id, effect, status, effective_from, effective_to, approval_request_id, granted_by, granted_at, revoked_by, revoked_at, version, metadata | id | Enabled | 469 |
| workforce_roles | id, company_id, code, name, role_kind, description, hierarchy_level, is_assignable, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 42 |
| workspaces | id, company_id, channel_ref, department, description, members, name, created_at, updated_at | id | Enabled | 0 |

## Canonical identity and tenancy tables

| Table | Purpose | Security boundary | Used by |
| --- | --- | --- | --- |
| auth.users | Supabase Auth identity | Auth session and token boundary | PublicAuthGateway and profile resolution |
| profiles | User/company profile and role context | Authenticated self-service and company scope | Most protected workflows |
| companies | Organization/company identity | Tenant boundary | All company-scoped modules |
| company_memberships | Membership and role relationship | Company plus user plus role/status | Invitations, onboarding, authorization |
| workspaces | Workspace context where present | Workspace-aware navigation | Shell and module context |
| user_table_preferences | User preference persistence | Self-only or company-scoped policy | Dashboard/profile settings |

## Canonical subscription tables

| Table | Purpose | Contract | Evidence |
| --- | --- | --- | --- |
| billing_plans | Package catalog | Free and paid plan metadata, entitlements | Subscription migrations and live inventory |
| billing_profiles | Billing contact/configuration | Company-scoped billing profile | Billing foundation migration |
| tenant_subscriptions | Company subscription state | Pending/Active/Grace/Expired/RequiresPlan/Cancelled/Superseded | Subscription model migrations |
| subscription_payments | Provider payment state | Monthly cycle, idempotency, provider order | HarakaPay handlers and migrations |
| subscription_invoices | Billing invoice evidence | Payment/subscription linkage | Billing foundation migration |
| subscription_usage | Usage/limits evidence | Company and plan context | Billing foundation migration |
| subscription_events | Billing lifecycle events | Audit and reconciliation history | Billing migrations |
| subscription_notifications | Billing notifications | Company-scoped notification state | Billing migrations |
| billing_access_snapshot | Authoritative access result | Server/database snapshot; not a table | Access adapter and protected API |

# PART XI — INTEGRATIONS

| Integration | Purpose | Current evidence | Security/operational boundary |
| --- | --- | --- | --- |
| Supabase | Auth, Postgres/REST, RPC, RLS | Live schema and migration evidence present | Service keys server-side; client uses public anon configuration only |
| HarakaPay | USSD collection, status, webhook, balance | Server handlers present; provider readiness required | API key, order matching, server verification, idempotency |
| TRA/VFD | Fiscal profile, receipts, retries, Z reports | Router and provider boundary present; external readiness required | TIN/VRN, branch/device/configuration, audit |
| Storage/S3 | Avatars, property documents, exports | Storage helper and proxy present | Scoped keys, validation, signed/download boundaries |
| Email/SMS/WhatsApp | Notifications and customer/workforce communication | Persistence and provider boundaries present | No claim of delivery without provider configuration |
| AI model | Structured assistant responses and proposals | Built-in model integration present | Context limits, JSON schema, proposal-only mutation, approvals |
| Maps | Location support for property/fleet where configured | UI component and route boundary present | API key/provider configuration required |
| Vercel | Deployment/runtime | Build and serverless import contract present | Environment variables and schema verification |

## XI.1 Supabase

**English:** Auth, Postgres/REST, RPC, RLS. Live schema and migration evidence present Service keys server-side; client uses public anon configuration only

**Kiswahili:** Supabase hutumika kwa auth, postgres/rest, rpc, rls. Live schema and migration evidence present. Service keys server-side; client uses public anon configuration only.

---

## XI.2 HarakaPay

**English:** USSD collection, status, webhook, balance. Server handlers present; provider readiness required API key, order matching, server verification, idempotency

**Kiswahili:** HarakaPay hutumika kwa ussd collection, status, webhook, balance. Server handlers present; provider readiness required. API key, order matching, server verification, idempotency.

---

## XI.3 TRA/VFD

**English:** Fiscal profile, receipts, retries, Z reports. Router and provider boundary present; external readiness required TIN/VRN, branch/device/configuration, audit

**Kiswahili:** TRA/VFD hutumika kwa fiscal profile, receipts, retries, z reports. Router and provider boundary present; external readiness required. TIN/VRN, branch/device/configuration, audit.

---

## XI.4 Storage/S3

**English:** Avatars, property documents, exports. Storage helper and proxy present Scoped keys, validation, signed/download boundaries

**Kiswahili:** Storage/S3 hutumika kwa avatars, property documents, exports. Storage helper and proxy present. Scoped keys, validation, signed/download boundaries.

---

## XI.5 Email/SMS/WhatsApp

**English:** Notifications and customer/workforce communication. Persistence and provider boundaries present No claim of delivery without provider configuration

**Kiswahili:** Email/SMS/WhatsApp hutumika kwa notifications and customer/workforce communication. Persistence and provider boundaries present. No claim of delivery without provider configuration.

---

## XI.6 AI model

**English:** Structured assistant responses and proposals. Built-in model integration present Context limits, JSON schema, proposal-only mutation, approvals

**Kiswahili:** AI model hutumika kwa structured assistant responses and proposals. Built-in model integration present. Context limits, JSON schema, proposal-only mutation, approvals.

---

## XI.7 Maps

**English:** Location support for property/fleet where configured. UI component and route boundary present API key/provider configuration required

**Kiswahili:** Maps hutumika kwa location support for property/fleet where configured. UI component and route boundary present. API key/provider configuration required.

---

## XI.8 Vercel

**English:** Deployment/runtime. Build and serverless import contract present Environment variables and schema verification

**Kiswahili:** Vercel hutumika kwa deployment/runtime. Build and serverless import contract present. Environment variables and schema verification.

---

# PART XII — TROUBLESHOOTING

| Problem | Possible cause | Diagnosis | Solution and prevention |
| --- | --- | --- | --- |
| Login fails | Missing public Supabase configuration, invalid credentials, expired recovery session, or provider rejection. | Check /api/config/public, browser network response, Auth status, and the exact user-facing error; do not log passwords or tokens. | Restore approved configuration or repeat the supported recovery flow; keep error messages generic enough to avoid account enumeration. |
| Signup does not enter workspace | Email confirmation, profile provisioning, or company assignment is incomplete. | Inspect Auth confirmation state, verified profile, company_memberships, and server logs without exposing secrets. | Complete verification and secure onboarding; do not create a duplicate users table. |
| RLS permission error | Session missing, wrong company scope, role not permitted, or policy/column contract mismatch. | Verify bearer extraction, profile company_id, role, table company_id, and policy command. | Fail closed, fix the specific policy or caller contract, and add a regression test. |
| Catalog returns 503 | Server-side Supabase billing configuration missing or billing RPC unavailable. | Check /api/billing/catalog, server env presence, migration ledger, and billing_public_plan_catalog readiness. | Restore server configuration or apply the intended migration in a controlled window; never send the service key to the browser. |
| Free activation rejected | No verified manager role, missing company profile, or FREE_15 catalog/routine not ready. | Confirm authenticated profile, company scope, active catalog row, and billing_start_free_plan routine. | Correct prerequisites and retry idempotently; never treat a failed call as active. |
| Paid payment remains pending | Provider has not verified the order, webhook/status polling has not settled, or provider configuration is unavailable. | Check payment record, provider order ID, server status call, and webhook receipt. | Keep access inactive until verified; retry only through idempotent server/database flow. |
| Data appears missing | Wrong company scope, empty state, failed query, or UI cache not refreshed. | Compare authenticated company scope, raw server response, loading/error state, and table RLS. | Show unavailable/empty/error explicitly; never replace a failed read with fake seed data in production. |
| File upload fails | Storage configuration, size/type validation, path scope, or signed URL problem. | Inspect server validation and storage response; verify only metadata after confirmed upload. | Keep bytes in storage, metadata in database, and show a retryable failure. |
| TRA/VFD submission blocked | Profile not configured, provider readiness false, missing credentials, or duplicate idempotency key. | Read fiscal profile, readiness, receipt/retry queue status, and audit event. | Configure approved provider or retain a truthful blocked state; do not call a local receipt fiscalized. |
| AI response cannot be used as an action | AI returned a proposal, not an approved mutation, or the request exceeded safe targets. | Inspect structured response, proposal operation, approval state, and source context. | Require independent role approval and confirmed module write; explain missing evidence. |
| Deployment build fails | Schema verification credentials, dependency resolution, TypeScript, or route/runtime incompatibility. | Run pnpm check, pnpm test, verify:supabase-schema with approved env, and inspect the exact build diagnostic. | Fix the specific contract; do not bypass the schema guard or suppress audit failures. |
| Webhook is not reconciled | Unknown provider order, failed status verification, invalid payload, or endpoint configuration. | Confirm order lookup, provider status request, response order match, and service RPC result. | Return a safe error, preserve audit state, and retry through a controlled path. |

## XII.1 Login fails

**Possible cause:** Missing public Supabase configuration, invalid credentials, expired recovery session, or provider rejection.

**Diagnosis:** Check /api/config/public, browser network response, Auth status, and the exact user-facing error; do not log passwords or tokens.

**Solution:** Restore approved configuration or repeat the supported recovery flow; keep error messages generic enough to avoid account enumeration.

### Kiswahili

**Sababu:** Missing public Supabase configuration, invalid credentials, expired recovery session, or provider rejection. **Utambuzi:** Check /api/config/public, browser network response, Auth status, and the exact user-facing error; do not log passwords or tokens. **Suluhisho:** Restore approved configuration or repeat the supported recovery flow; keep error messages generic enough to avoid account enumeration.

---

## XII.2 Signup does not enter workspace

**Possible cause:** Email confirmation, profile provisioning, or company assignment is incomplete.

**Diagnosis:** Inspect Auth confirmation state, verified profile, company_memberships, and server logs without exposing secrets.

**Solution:** Complete verification and secure onboarding; do not create a duplicate users table.

### Kiswahili

**Sababu:** Email confirmation, profile provisioning, or company assignment is incomplete. **Utambuzi:** Inspect Auth confirmation state, verified profile, company_memberships, and server logs without exposing secrets. **Suluhisho:** Complete verification and secure onboarding; do not create a duplicate users table.

---

## XII.3 RLS permission error

**Possible cause:** Session missing, wrong company scope, role not permitted, or policy/column contract mismatch.

**Diagnosis:** Verify bearer extraction, profile company_id, role, table company_id, and policy command.

**Solution:** Fail closed, fix the specific policy or caller contract, and add a regression test.

### Kiswahili

**Sababu:** Session missing, wrong company scope, role not permitted, or policy/column contract mismatch. **Utambuzi:** Verify bearer extraction, profile company_id, role, table company_id, and policy command. **Suluhisho:** Fail closed, fix the specific policy or caller contract, and add a regression test.

---

## XII.4 Catalog returns 503

**Possible cause:** Server-side Supabase billing configuration missing or billing RPC unavailable.

**Diagnosis:** Check /api/billing/catalog, server env presence, migration ledger, and billing_public_plan_catalog readiness.

**Solution:** Restore server configuration or apply the intended migration in a controlled window; never send the service key to the browser.

### Kiswahili

**Sababu:** Server-side Supabase billing configuration missing or billing RPC unavailable. **Utambuzi:** Check /api/billing/catalog, server env presence, migration ledger, and billing_public_plan_catalog readiness. **Suluhisho:** Restore server configuration or apply the intended migration in a controlled window; never send the service key to the browser.

---

## XII.5 Free activation rejected

**Possible cause:** No verified manager role, missing company profile, or FREE_15 catalog/routine not ready.

**Diagnosis:** Confirm authenticated profile, company scope, active catalog row, and billing_start_free_plan routine.

**Solution:** Correct prerequisites and retry idempotently; never treat a failed call as active.

### Kiswahili

**Sababu:** No verified manager role, missing company profile, or FREE_15 catalog/routine not ready. **Utambuzi:** Confirm authenticated profile, company scope, active catalog row, and billing_start_free_plan routine. **Suluhisho:** Correct prerequisites and retry idempotently; never treat a failed call as active.

---

## XII.6 Paid payment remains pending

**Possible cause:** Provider has not verified the order, webhook/status polling has not settled, or provider configuration is unavailable.

**Diagnosis:** Check payment record, provider order ID, server status call, and webhook receipt.

**Solution:** Keep access inactive until verified; retry only through idempotent server/database flow.

### Kiswahili

**Sababu:** Provider has not verified the order, webhook/status polling has not settled, or provider configuration is unavailable. **Utambuzi:** Check payment record, provider order ID, server status call, and webhook receipt. **Suluhisho:** Keep access inactive until verified; retry only through idempotent server/database flow.

---

## XII.7 Data appears missing

**Possible cause:** Wrong company scope, empty state, failed query, or UI cache not refreshed.

**Diagnosis:** Compare authenticated company scope, raw server response, loading/error state, and table RLS.

**Solution:** Show unavailable/empty/error explicitly; never replace a failed read with fake seed data in production.

### Kiswahili

**Sababu:** Wrong company scope, empty state, failed query, or UI cache not refreshed. **Utambuzi:** Compare authenticated company scope, raw server response, loading/error state, and table RLS. **Suluhisho:** Show unavailable/empty/error explicitly; never replace a failed read with fake seed data in production.

---

## XII.8 File upload fails

**Possible cause:** Storage configuration, size/type validation, path scope, or signed URL problem.

**Diagnosis:** Inspect server validation and storage response; verify only metadata after confirmed upload.

**Solution:** Keep bytes in storage, metadata in database, and show a retryable failure.

### Kiswahili

**Sababu:** Storage configuration, size/type validation, path scope, or signed URL problem. **Utambuzi:** Inspect server validation and storage response; verify only metadata after confirmed upload. **Suluhisho:** Keep bytes in storage, metadata in database, and show a retryable failure.

---

## XII.9 TRA/VFD submission blocked

**Possible cause:** Profile not configured, provider readiness false, missing credentials, or duplicate idempotency key.

**Diagnosis:** Read fiscal profile, readiness, receipt/retry queue status, and audit event.

**Solution:** Configure approved provider or retain a truthful blocked state; do not call a local receipt fiscalized.

### Kiswahili

**Sababu:** Profile not configured, provider readiness false, missing credentials, or duplicate idempotency key. **Utambuzi:** Read fiscal profile, readiness, receipt/retry queue status, and audit event. **Suluhisho:** Configure approved provider or retain a truthful blocked state; do not call a local receipt fiscalized.

---

## XII.10 AI response cannot be used as an action

**Possible cause:** AI returned a proposal, not an approved mutation, or the request exceeded safe targets.

**Diagnosis:** Inspect structured response, proposal operation, approval state, and source context.

**Solution:** Require independent role approval and confirmed module write; explain missing evidence.

### Kiswahili

**Sababu:** AI returned a proposal, not an approved mutation, or the request exceeded safe targets. **Utambuzi:** Inspect structured response, proposal operation, approval state, and source context. **Suluhisho:** Require independent role approval and confirmed module write; explain missing evidence.

---

## XII.11 Deployment build fails

**Possible cause:** Schema verification credentials, dependency resolution, TypeScript, or route/runtime incompatibility.

**Diagnosis:** Run pnpm check, pnpm test, verify:supabase-schema with approved env, and inspect the exact build diagnostic.

**Solution:** Fix the specific contract; do not bypass the schema guard or suppress audit failures.

### Kiswahili

**Sababu:** Schema verification credentials, dependency resolution, TypeScript, or route/runtime incompatibility. **Utambuzi:** Run pnpm check, pnpm test, verify:supabase-schema with approved env, and inspect the exact build diagnostic. **Suluhisho:** Fix the specific contract; do not bypass the schema guard or suppress audit failures.

---

## XII.12 Webhook is not reconciled

**Possible cause:** Unknown provider order, failed status verification, invalid payload, or endpoint configuration.

**Diagnosis:** Confirm order lookup, provider status request, response order match, and service RPC result.

**Solution:** Return a safe error, preserve audit state, and retry through a controlled path.

### Kiswahili

**Sababu:** Unknown provider order, failed status verification, invalid payload, or endpoint configuration. **Utambuzi:** Confirm order lookup, provider status request, response order match, and service RPC result. **Suluhisho:** Return a safe error, preserve audit state, and retry through a controlled path.

---

# PART XIII — OPERATIONS

## XIII.1 Release readiness

Confirm source migration, tests, TypeScript, build, browser journeys, live schema, RLS, provider configuration, and rollback evidence.

### Kiswahili

Thibitisha migration, tests, TypeScript, build, browser journeys, schema, RLS, provider na rollback.

---

## XIII.2 Backup and recovery

Distinguish database reachability from managed PITR or snapshot configuration. Do not report backup controls that were not checked.

### Kiswahili

Tenganisha database reachability na PITR/snapshot. Usiripoti backup ambayo haikuthibitishwa.

---

## XIII.3 Monitoring

Watch API status, scheduled handlers, webhook deliveries, provider errors, failed mutations, security advisors, and schema drift.

### Kiswahili

Fuatilia API, scheduled handlers, webhooks, provider errors, failed writes, security advisors na schema drift.

---

## XIII.4 Support handover

Keep the repository, migration ledger, environment checklist, role matrix, error reference, and incident notes together.

### Kiswahili

Hifadhi repository, migration ledger, env checklist, role matrix, error reference na incident notes pamoja.

---

## XIII.5 Data governance

Define retention, privacy, least privilege, export, deletion, and incident escalation by business and regulatory context.

### Kiswahili

Weka retention, privacy, least privilege, export, deletion na escalation kulingana na biashara na compliance.

---

## XIII.6 Change control

Every schema, role, provider, and entitlement change needs a source commit, migration/version record, test evidence, and updated status.

### Kiswahili

Kila mabadiliko ya schema, role, provider na entitlement yanahitaji commit, migration/version, tests na status mpya.

---

# PART XIV — FUTURE ROADMAP

## XIV.1 Atomic legacy invoice payment RPC

Replace the separate payment insert and invoice update with a reviewed atomic, idempotent database boundary.

### Kiswahili

Hatua hii inapaswa kufanywa baada ya uthibitisho wa source, data, ruhusa na deployment. Lengo si kuongeza madai ya bidhaa, bali kuimarisha ushahidi wa kazi iliyopo: Replace the separate payment insert and invoice update with a reviewed atomic, idempotent database boundary.

---

## XIV.2 Broader authenticated CRUD journeys

Expand role-by-role Playwright and controlled Supabase staging coverage across legacy modules.

### Kiswahili

Hatua hii inapaswa kufanywa baada ya uthibitisho wa source, data, ruhusa na deployment. Lengo si kuongeza madai ya bidhaa, bali kuimarisha ushahidi wa kazi iliyopo: Expand role-by-role Playwright and controlled Supabase staging coverage across legacy modules.

---

## XIV.3 Signature-specific SECURITY DEFINER hardening

Review each exposed signature, preserve intentional endpoints, and revoke or relocate internal helpers.

### Kiswahili

Hatua hii inapaswa kufanywa baada ya uthibitisho wa source, data, ruhusa na deployment. Lengo si kuongeza madai ya bidhaa, bali kuimarisha ushahidi wa kazi iliyopo: Review each exposed signature, preserve intentional endpoints, and revoke or relocate internal helpers.

---

## XIV.4 RLS policy consolidation

Reduce overlapping permissive policies after proving equivalent tenant semantics.

### Kiswahili

Hatua hii inapaswa kufanywa baada ya uthibitisho wa source, data, ruhusa na deployment. Lengo si kuongeza madai ya bidhaa, bali kuimarisha ushahidi wa kazi iliyopo: Reduce overlapping permissive policies after proving equivalent tenant semantics.

---

## XIV.5 Provider readiness

Complete approved HarakaPay, TRA/VFD, storage, email/SMS/WhatsApp, maps, and AI configuration and acceptance.

### Kiswahili

Hatua hii inapaswa kufanywa baada ya uthibitisho wa source, data, ruhusa na deployment. Lengo si kuongeza madai ya bidhaa, bali kuimarisha ushahidi wa kazi iliyopo: Complete approved HarakaPay, TRA/VFD, storage, email/SMS/WhatsApp, maps, and AI configuration and acceptance.

---

## XIV.6 Dashboard decomposition

Extract safe, high-risk boundaries and code-split the large dashboard only after persistence and live blockers are addressed.

### Kiswahili

Hatua hii inapaswa kufanywa baada ya uthibitisho wa source, data, ruhusa na deployment. Lengo si kuongeza madai ya bidhaa, bali kuimarisha ushahidi wa kazi iliyopo: Extract safe, high-risk boundaries and code-split the large dashboard only after persistence and live blockers are addressed.

---

# PART XV — SWAHILI EDITION

The following is the complete professional Tanzanian Swahili module reference. Technical English terms remain in parentheses where they reduce ambiguity.

## XV.1 Ukurasa wa Umma wa Chapa na Masoko

### Muhtasari wa Moduli

Ukurasa wa mwanzo unaeleza thamani ya Smart Manager, unaunganisha mgeni na kuingia kwenye mfumo, na unaonyesha kwa uaminifu kwamba mwonekano wa masoko si rekodi ya biashara ya kampuni. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Ukurasa wa Umma wa Chapa na Masoko ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `companies`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Discover product → review capabilities → choose launch or authentication → enter the secure workspace. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Marketing delivery and conversion analytics are not the same as a signed-in company workflow; external campaign channels require configuration. Ukurasa wa mwanzo unaeleza thamani ya Smart Manager, unaunganisha mgeni na kuingia kwenye mfumo, na unaonyesha kwa uaminifu kwamba mwonekano wa masoko si rekodi ya biashara ya kampuni.

### Madhumuni na Changamoto

Ukurasa wa mwanzo unaeleza thamani ya Smart Manager, unaunganisha mgeni na kuingia kwenye mfumo, na unaonyesha kwa uaminifu kwamba mwonekano wa masoko si rekodi ya biashara ya kampuni. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Public visitor; prospective customer. UI iliyothibitishwa: `client/src/pages/Home.tsx`. Vipengele muhimu vinafuata mtiririko huu: Discover product → review capabilities → choose launch or authentication → enter the secure workspace.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/_core/apiApp.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: companies. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: Marketing delivery and conversion analytics are not the same as a signed-in company workflow; external campaign channels require configuration. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Ukurasa wa Umma wa Chapa na Masoko. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Discover product → review capabilities → choose launch or authentication → enter the secure workspace.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Marketing delivery and conversion analytics are not the same as a signed-in company workflow; external campaign channels require configuration.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Ukurasa wa Umma wa Chapa na Masoko ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.2 Uthibitishaji na Uanzishaji Salama

### Muhtasari wa Moduli

Gateway ya umma inasaidia kuingia kwa nenosiri, kurejesha nenosiri, kuthibitisha barua pepe, OAuth iliyokubaliwa, passkeys na uhifadhi wa kikao kabla ya kuingia kwenye nafasi ya kampuni. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Uthibitishaji na Uanzishaji Salama ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `companies`, `company_memberships`, `profiles`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Load public Supabase configuration → authenticate or recover → persist token/session → resolve verified profile → enter /app. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Actual OAuth delivery, email delivery, and passkey availability remain dependent on Supabase/provider configuration and browser capability. Gateway ya umma inasaidia kuingia kwa nenosiri, kurejesha nenosiri, kuthibitisha barua pepe, OAuth iliyokubaliwa, passkeys na uhifadhi wa kikao kabla ya kuingia kwenye nafasi ya kampuni.

### Madhumuni na Changamoto

Gateway ya umma inasaidia kuingia kwa nenosiri, kurejesha nenosiri, kuthibitisha barua pepe, OAuth iliyokubaliwa, passkeys na uhifadhi wa kikao kabla ya kuingia kwenye nafasi ya kampuni. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Unauthenticated visitor; verified user; company owner. UI iliyothibitishwa: `client/src/components/PublicAuthGateway.jsx; client/src/App.tsx`. Vipengele muhimu vinafuata mtiririko huu: Load public Supabase configuration → authenticate or recover → persist token/session → resolve verified profile → enter /app.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/_core/apiApp.ts; server/_core/oauth.ts; server/authHeaders.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: companies, company_memberships, profiles. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: Actual OAuth delivery, email delivery, and passkey availability remain dependent on Supabase/provider configuration and browser capability. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Uthibitishaji na Uanzishaji Salama. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Load public Supabase configuration → authenticate or recover → persist token/session → resolve verified profile → enter /app.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Actual OAuth delivery, email delivery, and passkey availability remain dependent on Supabase/provider configuration and browser capability.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Uthibitishaji na Uanzishaji Salama ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.3 Ganda Kuu la Programu na Urambazaji

### Muhtasari wa Moduli

Ganda la programu linaunganisha routes, uthibitishaji, lugha, mandhari, mapendeleo ya dashibodi, lazy loading na urambazaji unaozingatia jukumu pamoja na entitlement. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Ganda Kuu la Programu na Urambazaji ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `company_modules`, `workspaces`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Route match → auth decision → lazy workspace load → role/entitlement-aware navigation → module action. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The dashboard remains a large legacy single-file boundary and produces a non-fatal bundle-size warning; safe decomposition is a future engineering workstream. Ganda la programu linaunganisha routes, uthibitishaji, lugha, mandhari, mapendeleo ya dashibodi, lazy loading na urambazaji unaozingatia jukumu pamoja na entitlement.

### Madhumuni na Changamoto

Ganda la programu linaunganisha routes, uthibitishaji, lugha, mandhari, mapendeleo ya dashibodi, lazy loading na urambazaji unaozingatia jukumu pamoja na entitlement. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: All authenticated users, filtered by role and entitlement. UI iliyothibitishwa: `client/src/App.tsx; client/src/BusinessSphereDashboard.jsx`. Vipengele muhimu vinafuata mtiririko huu: Route match → auth decision → lazy workspace load → role/entitlement-aware navigation → module action.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts; server/_core/apiApp.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: company_modules, workspaces. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: The dashboard remains a large legacy single-file boundary and produces a non-fatal bundle-size warning; safe decomposition is a future engineering workstream. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Ganda Kuu la Programu na Urambazaji. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Route match → auth decision → lazy workspace load → role/entitlement-aware navigation → module action.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The dashboard remains a large legacy single-file boundary and produces a non-fatal bundle-size warning; safe decomposition is a future engineering workstream.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Ganda Kuu la Programu na Urambazaji ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.4 Kituo cha Utambulisho wa Wasifu

### Muhtasari wa Moduli

Kituo cha wasifu hutenganisha utambulisho binafsi, kazi, usalama, mapendeleo, arifa na shughuli. Mtumiaji hubadilisha tu sehemu anazoruhusiwa na server ndiyo mamlaka ya mwisho. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Kituo cha Utambulisho wa Wasifu ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `profiles`, `user_table_preferences`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Open profile → read verified profile → update permitted self-service fields → upload or remove avatar through controlled storage → refresh confirmed state. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Device/session listing and workspace switching are explicitly unavailable unless supported by a verified backend contract. Kituo cha wasifu hutenganisha utambulisho binafsi, kazi, usalama, mapendeleo, arifa na shughuli. Mtumiaji hubadilisha tu sehemu anazoruhusiwa na server ndiyo mamlaka ya mwisho.

### Madhumuni na Changamoto

Kituo cha wasifu hutenganisha utambulisho binafsi, kazi, usalama, mapendeleo, arifa na shughuli. Mtumiaji hubadilisha tu sehemu anazoruhusiwa na server ndiyo mamlaka ya mwisho. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Authenticated user; workspace administrator for linked context. UI iliyothibitishwa: `client/src/components/ProfileIdentityCenter.jsx`. Vipengele muhimu vinafuata mtiririko huu: Open profile → read verified profile → update permitted self-service fields → upload or remove avatar through controlled storage → refresh confirmed state.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/profileIdentity.ts; server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: profiles, user_table_preferences. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: Device/session listing and workspace switching are explicitly unavailable unless supported by a verified backend contract. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Kituo cha Utambulisho wa Wasifu. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Open profile → read verified profile → update permitted self-service fields → upload or remove avatar through controlled storage → refresh confirmed state.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Device/session listing and workspace switching are explicitly unavailable unless supported by a verified backend contract.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Kituo cha Utambulisho wa Wasifu ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.5 Dashibodi ya Uongozi

### Muhtasari wa Moduli

Dashibodi ya uongozi hukusanya ishara za uendeshaji kutoka moduli zilizounganishwa. Ni ya mapitio na kupanga kipaumbele, si chanzo tofauti cha ukweli wa fedha. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Dashibodi ya Uongozi ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `custom_kpis`, `financial_benchmarks`, `scheduled_reports`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Select company context → load confirmed metrics → inspect trends/exceptions → navigate to source module → approve or act through the protected boundary. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. A dashboard is only as complete as the connected records, schedules, and integrations that feed it; empty or unavailable states must remain visible. Dashibodi ya uongozi hukusanya ishara za uendeshaji kutoka moduli zilizounganishwa. Ni ya mapitio na kupanga kipaumbele, si chanzo tofauti cha ukweli wa fedha.

### Madhumuni na Changamoto

Dashibodi ya uongozi hukusanya ishara za uendeshaji kutoka moduli zilizounganishwa. Ni ya mapitio na kupanga kipaumbele, si chanzo tofauti cha ukweli wa fedha. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: CEO; COO; CFO; organization owner; manager roles. UI iliyothibitishwa: `client/src/components/ExecutiveCommandCenter.jsx; client/src/BusinessSphereDashboard.jsx`. Vipengele muhimu vinafuata mtiririko huu: Select company context → load confirmed metrics → inspect trends/exceptions → navigate to source module → approve or act through the protected boundary.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/dashboardReports.ts; server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: custom_kpis, financial_benchmarks, scheduled_reports. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: A dashboard is only as complete as the connected records, schedules, and integrations that feed it; empty or unavailable states must remain visible. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Dashibodi ya Uongozi. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Select company context → load confirmed metrics → inspect trends/exceptions → navigate to source module → approve or act through the protected boundary.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: A dashboard is only as complete as the connected records, schedules, and integrations that feed it; empty or unavailable states must remain visible.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Dashibodi ya Uongozi ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.6 CRM na Mfuatano wa Wateja

### Muhtasari wa Moduli

CRM huweka pamoja mawasiliano, leads, mwingiliano na mrejesho wa wateja. Lengo ni kuunganisha mazungumzo ya kibiashara na mauzo pamoja na huduma kwa mteja. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la CRM na Mfuatano wa Wateja ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `crm_contacts`, `crm_interactions`, `crm_leads`, `customer_feedback`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create or import lead → qualify → record interaction → convert or follow up → connect to quotation/invoice/support. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The repository contains strong persistence and truthfulness contracts, but broader authenticated CRUD walkthroughs remain required for every legacy screen. CRM huweka pamoja mawasiliano, leads, mwingiliano na mrejesho wa wateja. Lengo ni kuunganisha mazungumzo ya kibiashara na mauzo pamoja na huduma kwa mteja.

### Madhumuni na Changamoto

CRM huweka pamoja mawasiliano, leads, mwingiliano na mrejesho wa wateja. Lengo ni kuunganisha mazungumzo ya kibiashara na mauzo pamoja na huduma kwa mteja. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Sales Manager; sales user; account owner; support user. UI iliyothibitishwa: `client/src/components/CommercialCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx`. Vipengele muhimu vinafuata mtiririko huu: Create or import lead → qualify → record interaction → convert or follow up → connect to quotation/invoice/support.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts; server/salesInteractions.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: crm_contacts, crm_interactions, crm_leads, customer_feedback. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: The repository contains strong persistence and truthfulness contracts, but broader authenticated CRUD walkthroughs remain required for every legacy screen. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua CRM na Mfuatano wa Wateja. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create or import lead → qualify → record interaction → convert or follow up → connect to quotation/invoice/support.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The repository contains strong persistence and truthfulness contracts, but broader authenticated CRUD walkthroughs remain required for every legacy screen.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa CRM na Mfuatano wa Wateja ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.7 Mauzo na Utozaji

### Muhtasari wa Moduli

Sehemu ya mauzo inahusu quotations, ankara, subscriptions, malipo, returns na mwingiliano wa wateja. Bei na hali ya mwisho vinatoka server na database, si thamani ya browser. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mauzo na Utozaji ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `ecommerce_orders`, `ecommerce_products`, `sales_invoice_items`, `sales_invoices`, `sales_order_items`, `sales_order_return_items`, `sales_order_returns`, `sales_orders`, `sales_payments`, `sales_quotation_items`, `sales_quotations`, `sales_subscriptions`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Customer → quotation/order → invoice → payment or collection → receipt/ledger/report → follow-up. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Legacy invoice payment posting still requires an atomic database RPC and durable idempotency constraint before concurrent-safe payment posting can be claimed. Sehemu ya mauzo inahusu quotations, ankara, subscriptions, malipo, returns na mwingiliano wa wateja. Bei na hali ya mwisho vinatoka server na database, si thamani ya browser.

### Madhumuni na Changamoto

Sehemu ya mauzo inahusu quotations, ankara, subscriptions, malipo, returns na mwingiliano wa wateja. Bei na hali ya mwisho vinatoka server na database, si thamani ya browser. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Sales Manager; finance manager; sales user; billing manager. UI iliyothibitishwa: `client/src/components/SalesDetailWorkspace.jsx; client/src/components/CommercialCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Customer → quotation/order → invoice → payment or collection → receipt/ledger/report → follow-up.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts; server/subscriptionBilling.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: ecommerce_orders, ecommerce_products, sales_invoice_items, sales_invoices, sales_order_items, sales_order_return_items, sales_order_returns, sales_orders, sales_payments, sales_quotation_items, sales_quotations, sales_subscriptions. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Legacy invoice payment posting still requires an atomic database RPC and durable idempotency constraint before concurrent-safe payment posting can be claimed. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mauzo na Utozaji. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Customer → quotation/order → invoice → payment or collection → receipt/ledger/report → follow-up.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Legacy invoice payment posting still requires an atomic database RPC and durable idempotency constraint before concurrent-safe payment posting can be claimed.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mauzo na Utozaji ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.8 Mauzo ya Moja kwa Moja (POS)

### Muhtasari wa Moduli

POS inasimamia register, shift, bidhaa, malipo, returns, kodi, promotions, loyalty, reconciliation na audit. Mstari wa usalama ni kuthibitisha muamala kabla ya kuuita umehifadhiwa. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mauzo ya Moja kwa Moja (POS) ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `pos_cash_movements`, `pos_discount_rules`, `pos_loyalty_ledger`, `pos_loyalty_members`, `pos_loyalty_programs`, `pos_loyalty_redemptions`, `pos_loyalty_rewards`, `pos_promotion_items`, `pos_promotions`, `pos_registers`, `pos_return_commits`, `pos_return_headers`, `pos_return_items`, `pos_return_lines`, `pos_returns`, `pos_sale_adjustments`, `pos_sale_headers`, `pos_sale_lines`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Open register/shift → scan or select item → validate price and stock → collect tender → confirm sale → receipt → reconcile or return. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Controlled staging credentials and real device/provider behavior remain operational acceptance requirements; client pending queues are not treated as durable server saves. POS inasimamia register, shift, bidhaa, malipo, returns, kodi, promotions, loyalty, reconciliation na audit. Mstari wa usalama ni kuthibitisha muamala kabla ya kuuita umehifadhiwa.

### Madhumuni na Changamoto

POS inasimamia register, shift, bidhaa, malipo, returns, kodi, promotions, loyalty, reconciliation na audit. Mstari wa usalama ni kuthibitisha muamala kabla ya kuuita umehifadhiwa. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Cashier; finance manager; warehouse manager; administrator. UI iliyothibitishwa: `client/src/components/OperationsCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx`. Vipengele muhimu vinafuata mtiririko huu: Open register/shift → scan or select item → validate price and stock → collect tender → confirm sale → receipt → reconcile or return.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/posWorkforceRpcAdapters.ts; server/posTransactionEngine.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: pos_cash_movements, pos_discount_rules, pos_loyalty_ledger, pos_loyalty_members, pos_loyalty_programs, pos_loyalty_redemptions, pos_loyalty_rewards, pos_promotion_items, pos_promotions, pos_registers, pos_return_commits, pos_return_headers, pos_return_items, pos_return_lines, pos_returns, pos_sale_adjustments, pos_sale_headers, pos_sale_lines. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PASSED**. Mpaka unaojulikana: Controlled staging credentials and real device/provider behavior remain operational acceptance requirements; client pending queues are not treated as durable server saves. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mauzo ya Moja kwa Moja (POS). Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Open register/shift → scan or select item → validate price and stock → collect tender → confirm sale → receipt → reconcile or return.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Controlled staging credentials and real device/provider behavior remain operational acceptance requirements; client pending queues are not treated as durable server saves.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mauzo ya Moja kwa Moja (POS) ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.9 Usimamizi wa Hesabu na Maghala

### Muhtasari wa Moduli

Hesabu na maghala huunganisha items, batches, movement, suppliers, warehouses, transfers na audits. Kila mabadiliko ya quantity inapaswa kuonekana kama movement yenye ushahidi. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Usimamizi wa Hesabu na Maghala ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `inventory_batches`, `inventory_items`, `inventory_stock_movements`, `inventory_suppliers`, `inventory_transfers`, `inventory_warehouses`, `stock_audit_items`, `stock_audits`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create item → receive or adjust stock → transfer or sell → record movement → inspect balance/audit → replenish. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Full authenticated import/export and concurrency walkthroughs remain part of the broader acceptance backlog. Hesabu na maghala huunganisha items, batches, movement, suppliers, warehouses, transfers na audits. Kila mabadiliko ya quantity inapaswa kuonekana kama movement yenye ushahidi.

### Madhumuni na Changamoto

Hesabu na maghala huunganisha items, batches, movement, suppliers, warehouses, transfers na audits. Kila mabadiliko ya quantity inapaswa kuonekana kama movement yenye ushahidi. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Warehouse Manager; procurement officer; sales user; administrator. UI iliyothibitishwa: `client/src/components/OperationsCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Create item → receive or adjust stock → transfer or sell → record movement → inspect balance/audit → replenish.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/supabasePersistence.ts; server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: inventory_batches, inventory_items, inventory_stock_movements, inventory_suppliers, inventory_transfers, inventory_warehouses, stock_audit_items, stock_audits. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Full authenticated import/export and concurrency walkthroughs remain part of the broader acceptance backlog. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Usimamizi wa Hesabu na Maghala. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create item → receive or adjust stock → transfer or sell → record movement → inspect balance/audit → replenish.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Full authenticated import/export and concurrency walkthroughs remain part of the broader acceptance backlog.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Usimamizi wa Hesabu na Maghala ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.10 Ununuzi na Wasambazaji

### Muhtasari wa Moduli

Ununuzi unaunganisha wasambazaji, purchase orders, contracts, mapokezi, stock, approvals na madeni. Mfumo unapaswa kutenganisha kilichoombwa, kilichoidhinishwa, kilichopokelewa na kinachodaiwa. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Ununuzi na Wasambazaji ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `procurement_contracts`, `procurement_purchase_orders`, `purchase_order_items`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Supplier → request/order → approval → receipt → stock update → payable/finance evidence → report. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Downstream integrations and external supplier channels are configuration-dependent; recorded integration evidence must not be replaced with fabricated acknowledgements. Ununuzi unaunganisha wasambazaji, purchase orders, contracts, mapokezi, stock, approvals na madeni. Mfumo unapaswa kutenganisha kilichoombwa, kilichoidhinishwa, kilichopokelewa na kinachodaiwa.

### Madhumuni na Changamoto

Ununuzi unaunganisha wasambazaji, purchase orders, contracts, mapokezi, stock, approvals na madeni. Mfumo unapaswa kutenganisha kilichoombwa, kilichoidhinishwa, kilichopokelewa na kinachodaiwa. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Procurement Officer; warehouse manager; finance manager; administrator. UI iliyothibitishwa: `client/src/components/OperationsCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Supplier → request/order → approval → receipt → stock update → payable/finance evidence → report.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts; server/procurementPersistence.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: procurement_contracts, procurement_purchase_orders, purchase_order_items. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Downstream integrations and external supplier channels are configuration-dependent; recorded integration evidence must not be replaced with fabricated acknowledgements. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Ununuzi na Wasambazaji. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Supplier → request/order → approval → receipt → stock update → payable/finance evidence → report.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Downstream integrations and external supplier channels are configuration-dependent; recorded integration evidence must not be replaced with fabricated acknowledgements.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Ununuzi na Wasambazaji ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.11 Fedha na Uhasibu

### Muhtasari wa Moduli

Fedha na uhasibu vina accounts, journal, mapato na matumizi, bajeti, kodi/VAT, kufunga vipindi, reconciliation ya benki, assets na ripoti. Data halisi ndiyo msingi wa ripoti. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Fedha na Uhasibu ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `expense_budgets`, `fin_accounts`, `fin_approval_requests`, `fin_idempotency_keys`, `fin_journal_batches`, `fin_journal_lines`, `fin_periods`, `fin_posting_links`, `fin_reconciliation_batches`, `fin_reconciliation_items`, `finance_assets`, `finance_expenses`, `journal_entries`, `period_closes`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Capture transaction → validate company scope → post or approve → reconcile → close period → report. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Production reporting depends on intended schema alignment and real company data; tax filing itself is not implied by a local summary. Fedha na uhasibu vina accounts, journal, mapato na matumizi, bajeti, kodi/VAT, kufunga vipindi, reconciliation ya benki, assets na ripoti. Data halisi ndiyo msingi wa ripoti.

### Madhumuni na Changamoto

Fedha na uhasibu vina accounts, journal, mapato na matumizi, bajeti, kodi/VAT, kufunga vipindi, reconciliation ya benki, assets na ripoti. Data halisi ndiyo msingi wa ripoti. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: CFO; Finance Manager; accountant; organization owner. UI iliyothibitishwa: `client/src/components/FinanceCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Capture transaction → validate company scope → post or approve → reconcile → close period → report.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/financeCommandCenters.ts; server/financePersistence.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: expense_budgets, fin_accounts, fin_approval_requests, fin_idempotency_keys, fin_journal_batches, fin_journal_lines, fin_periods, fin_posting_links, fin_reconciliation_batches, fin_reconciliation_items, finance_assets, finance_expenses, journal_entries, period_closes. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Production reporting depends on intended schema alignment and real company data; tax filing itself is not implied by a local summary. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Fedha na Uhasibu. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Capture transaction → validate company scope → post or approve → reconcile → close period → report.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Production reporting depends on intended schema alignment and real company data; tax filing itself is not implied by a local summary.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Fedha na Uhasibu ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.12 Ripoti na Ripoti Zilizopangwa

### Muhtasari wa Moduli

Ripoti huonyesha mwenendo, exports, schedules na hali ya delivery. Ripoti inaonyesha data iliyorekodiwa; haimaanishi moja kwa moja kwamba email ya nje imefika. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Ripoti na Ripoti Zilizopangwa ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `scheduled_reports`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Choose report → apply company/time scope → compute from source records → export or schedule → inspect delivery history. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Email delivery remains provider-configured; CSV is the dependency-safe export path when spreadsheet dependencies are intentionally absent. Ripoti huonyesha mwenendo, exports, schedules na hali ya delivery. Ripoti inaonyesha data iliyorekodiwa; haimaanishi moja kwa moja kwamba email ya nje imefika.

### Madhumuni na Changamoto

Ripoti huonyesha mwenendo, exports, schedules na hali ya delivery. Ripoti inaonyesha data iliyorekodiwa; haimaanishi moja kwa moja kwamba email ya nje imefika. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Executive roles; manager; administrator. UI iliyothibitishwa: `client/src/components/FinanceCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx`. Vipengele muhimu vinafuata mtiririko huu: Choose report → apply company/time scope → compute from source records → export or schedule → inspect delivery history.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/dashboardReports.ts; server/reportSchedules.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: scheduled_reports. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Email delivery remains provider-configured; CSV is the dependency-safe export path when spreadsheet dependencies are intentionally absent. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Ripoti na Ripoti Zilizopangwa. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Choose report → apply company/time scope → compute from source records → export or schedule → inspect delivery history.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Email delivery remains provider-configured; CSV is the dependency-safe export path when spreadsheet dependencies are intentionally absent.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Ripoti na Ripoti Zilizopangwa ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.13 Rasilimali Watu na Mishahara

### Muhtasari wa Moduli

HR inahusu wafanyakazi, mahudhurio, benefits, leave, malengo, approvals, payroll, announcements na invitations salama. Data ya mfanyakazi inapaswa kubaki ndani ya kampuni yake. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Rasilimali Watu na Mishahara ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `hr_announcement_reads`, `hr_announcements`, `hr_approval_requests`, `hr_approval_steps`, `hr_attendance`, `hr_benefit_enrollments`, `hr_benefit_plans`, `hr_benefits`, `hr_candidates`, `hr_duties`, `hr_employee_documents`, `hr_employees`, `hr_expense_claims`, `hr_goal_updates`, `hr_goals`, `hr_holidays`, `hr_invite_codes`, `hr_leave_balances`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Invite employee → accept securely → assign role → record attendance/leave → approve → calculate payroll → report. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Payroll and employee records need a full authenticated tenant-data walkthrough; external salary/payment rails are outside the repository’s verified contract. HR inahusu wafanyakazi, mahudhurio, benefits, leave, malengo, approvals, payroll, announcements na invitations salama. Data ya mfanyakazi inapaswa kubaki ndani ya kampuni yake.

### Madhumuni na Changamoto

HR inahusu wafanyakazi, mahudhurio, benefits, leave, malengo, approvals, payroll, announcements na invitations salama. Data ya mfanyakazi inapaswa kubaki ndani ya kampuni yake. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: HR Manager; manager; employee; payroll approver; administrator. UI iliyothibitishwa: `client/src/components/PeopleCommandCenters.jsx; client/src/components/EmployeePortalWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Invite employee → accept securely → assign role → record attendance/leave → approve → calculate payroll → report.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/teamWorkforce.ts; server/tanzaniaPayroll.ts; server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: hr_announcement_reads, hr_announcements, hr_approval_requests, hr_approval_steps, hr_attendance, hr_benefit_enrollments, hr_benefit_plans, hr_benefits, hr_candidates, hr_duties, hr_employee_documents, hr_employees, hr_expense_claims, hr_goal_updates, hr_goals, hr_holidays, hr_invite_codes, hr_leave_balances. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Payroll and employee records need a full authenticated tenant-data walkthrough; external salary/payment rails are outside the repository’s verified contract. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Rasilimali Watu na Mishahara. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Invite employee → accept securely → assign role → record attendance/leave → approve → calculate payroll → report.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Payroll and employee records need a full authenticated tenant-data walkthrough; external salary/payment rails are outside the repository’s verified contract.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Rasilimali Watu na Mishahara ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.14 Uzalishaji na Maagizo ya Kazi

### Muhtasari wa Moduli

Repository ina mipaka ya manufacturing na work orders, lakini kitabu kinatenganisha uwepo wa surface na uthibitisho wa workflow kamili wa uzalishaji. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Uzalishaji na Maagizo ya Kazi ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `manufacturing_bom_components`, `manufacturing_boms`, `manufacturing_machines`, `manufacturing_maintenance`, `manufacturing_qc_inspections`, `manufacturing_work_orders`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Define work order → allocate or consume material → update status → record output → review cost and exceptions. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The visible surface is broader than the independently verified end-to-end contract for every manufacturing scenario. Repository ina mipaka ya manufacturing na work orders, lakini kitabu kinatenganisha uwepo wa surface na uthibitisho wa workflow kamili wa uzalishaji.

### Madhumuni na Changamoto

Repository ina mipaka ya manufacturing na work orders, lakini kitabu kinatenganisha uwepo wa surface na uthibitisho wa workflow kamili wa uzalishaji. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Production manager; warehouse manager; project manager. UI iliyothibitishwa: `client/src/BusinessSphereDashboard.jsx; client/src/components/OperationsCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Define work order → allocate or consume material → update status → record output → review cost and exceptions.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/manufacturingPersistence.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: manufacturing_bom_components, manufacturing_boms, manufacturing_machines, manufacturing_maintenance, manufacturing_qc_inspections, manufacturing_work_orders. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: The visible surface is broader than the independently verified end-to-end contract for every manufacturing scenario. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Uzalishaji na Maagizo ya Kazi. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Define work order → allocate or consume material → update status → record output → review cost and exceptions.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The visible surface is broader than the independently verified end-to-end contract for every manufacturing scenario.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Uzalishaji na Maagizo ya Kazi ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.15 Mnyororo wa Ugavi na Magari

### Muhtasari wa Moduli

Ugavi na fleet huunganisha shipments, magari, trips, madereva, mafuta, matengenezo, incidents, routes, telematics na alerts. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mnyororo wa Ugavi na Magari ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `fleet_alerts`, `fleet_audit_events`, `fleet_driver_assignments`, `fleet_drivers`, `fleet_fuel_cards`, `fleet_fuel_transactions`, `fleet_incidents`, `fleet_maintenance_jobs`, `fleet_maintenance_plans`, `fleet_routes`, `fleet_service_records`, `fleet_spare_parts`, `fleet_telematics_events`, `fleet_trips`, `fleet_tyres`, `fleet_vehicle_categories`, `fleet_vehicle_documents`, `fleet_vehicles`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Plan route/trip → assign driver/vehicle → record movement or fuel → ingest event → inspect alert → close maintenance or incident. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Telematics and external vehicle providers require approved webhook configuration and secrets; no external movement is claimed from a local screen alone. Ugavi na fleet huunganisha shipments, magari, trips, madereva, mafuta, matengenezo, incidents, routes, telematics na alerts.

### Madhumuni na Changamoto

Ugavi na fleet huunganisha shipments, magari, trips, madereva, mafuta, matengenezo, incidents, routes, telematics na alerts. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Fleet manager; logistics user; administrator. UI iliyothibitishwa: `client/src/components/OperationsCommandCenters.jsx; client/src/components/FleetWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Plan route/trip → assign driver/vehicle → record movement or fuel → ingest event → inspect alert → close maintenance or incident.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/fleetManagement.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: fleet_alerts, fleet_audit_events, fleet_driver_assignments, fleet_drivers, fleet_fuel_cards, fleet_fuel_transactions, fleet_incidents, fleet_maintenance_jobs, fleet_maintenance_plans, fleet_routes, fleet_service_records, fleet_spare_parts, fleet_telematics_events, fleet_trips, fleet_tyres, fleet_vehicle_categories, fleet_vehicle_documents, fleet_vehicles. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Telematics and external vehicle providers require approved webhook configuration and secrets; no external movement is claimed from a local screen alone. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mnyororo wa Ugavi na Magari. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Plan route/trip → assign driver/vehicle → record movement or fuel → ingest event → inspect alert → close maintenance or incident.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Telematics and external vehicle providers require approved webhook configuration and secrets; no external movement is claimed from a local screen alone.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mnyororo wa Ugavi na Magari ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.16 Kampeni za Masoko

### Muhtasari wa Moduli

Masoko huandaa segments, templates, ujumbe na analytics. Ujumbe wa draft unatenganishwa na dispatch halisi ya huduma ya nje. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Kampeni za Masoko ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `crm_contacts`, `crm_interactions`, `crm_leads`, `emails`, `marketing_campaigns`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Define audience → draft message → validate template/link → obtain approval → dispatch through configured channel → measure response. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. External email, SMS, WhatsApp, and campaign providers remain configuration-dependent; the UI must not claim dispatch when only a draft exists. Masoko huandaa segments, templates, ujumbe na analytics. Ujumbe wa draft unatenganishwa na dispatch halisi ya huduma ya nje.

### Madhumuni na Changamoto

Masoko huandaa segments, templates, ujumbe na analytics. Ujumbe wa draft unatenganishwa na dispatch halisi ya huduma ya nje. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: CMO; marketing manager; sales manager. UI iliyothibitishwa: `client/src/components/CommercialCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Define audience → draft message → validate template/link → obtain approval → dispatch through configured channel → measure response.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts; server/emailTemplateWorkflow.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: crm_contacts, crm_interactions, crm_leads, emails, marketing_campaigns. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: External email, SMS, WhatsApp, and campaign providers remain configuration-dependent; the UI must not claim dispatch when only a draft exists. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Kampeni za Masoko. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Define audience → draft message → validate template/link → obtain approval → dispatch through configured channel → measure response.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: External email, SMS, WhatsApp, and campaign providers remain configuration-dependent; the UI must not claim dispatch when only a draft exists.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Kampeni za Masoko ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.17 Duka la Kielektroniki

### Muhtasari wa Moduli

Mfumo una surfaces za bidhaa na oda za e-commerce, lakini haujadai kuwa Shopify au mtoa huduma mwingine amewezeshwa bila ushahidi wa configuration. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Duka la Kielektroniki ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `ecommerce_orders`, `ecommerce_products`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Publish catalog → receive order → validate customer/order → connect fulfilment and finance → report. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. External commerce provider credentials and production storefront activation are not verified by this book. Mfumo una surfaces za bidhaa na oda za e-commerce, lakini haujadai kuwa Shopify au mtoa huduma mwingine amewezeshwa bila ushahidi wa configuration.

### Madhumuni na Changamoto

Mfumo una surfaces za bidhaa na oda za e-commerce, lakini haujadai kuwa Shopify au mtoa huduma mwingine amewezeshwa bila ushahidi wa configuration. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Store manager; sales manager; customer. UI iliyothibitishwa: `client/src/components/CommercialCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Publish catalog → receive order → validate customer/order → connect fulfilment and finance → report.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: ecommerce_orders, ecommerce_products. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: External commerce provider credentials and production storefront activation are not verified by this book. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Duka la Kielektroniki. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Publish catalog → receive order → validate customer/order → connect fulfilment and finance → report.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: External commerce provider credentials and production storefront activation are not verified by this book.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Duka la Kielektroniki ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.18 Nyaraka na Mafaili Salama

### Muhtasari wa Moduli

Nyaraka huhifadhi metadata na reference ya storage, si file bytes ndani ya business table. Upload, kusaini na download vinahitaji mipaka ya ruhusa. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Nyaraka na Mafaili Salama ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `approval_signatures`, `digital_signatures`, `documents`, `signatures`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create metadata → upload through storage boundary → verify reference → share or sign under role control → download/export evidence. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. S3/storage configuration is required for live file bytes; metadata persistence alone is not evidence that a file was uploaded successfully. Nyaraka huhifadhi metadata na reference ya storage, si file bytes ndani ya business table. Upload, kusaini na download vinahitaji mipaka ya ruhusa.

### Madhumuni na Changamoto

Nyaraka huhifadhi metadata na reference ya storage, si file bytes ndani ya business table. Upload, kusaini na download vinahitaji mipaka ya ruhusa. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: All authenticated users within permitted company scope; approver. UI iliyothibitishwa: `client/src/components/PeopleCommandCenters.jsx; client/src/components/ProfileIdentityCenter.jsx`. Vipengele muhimu vinafuata mtiririko huu: Create metadata → upload through storage boundary → verify reference → share or sign under role control → download/export evidence.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/storage.ts; server/documentDownloadBoundaries.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: approval_signatures, digital_signatures, documents, signatures. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: S3/storage configuration is required for live file bytes; metadata persistence alone is not evidence that a file was uploaded successfully. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Nyaraka na Mafaili Salama. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create metadata → upload through storage boundary → verify reference → share or sign under role control → download/export evidence.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: S3/storage configuration is required for live file bytes; metadata persistence alone is not evidence that a file was uploaded successfully.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Nyaraka na Mafaili Salama ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.19 Miradi na Usimamizi wa Kazi

### Muhtasari wa Moduli

Miradi huunganisha tasks, milestones, expenses na maendeleo. Uthibitisho wa kina wa kila operation unahitaji data halisi ya kampuni na majukumu sahihi. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Miradi na Usimamizi wa Kazi ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `project_expenses`, `project_milestones`, `project_tasks`, `projects`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create project → add milestone/task → assign owner → update progress → record expense → review completion. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The repository contains the persistence boundary, but complete project operations still depend on authenticated data and role-specific acceptance. Miradi huunganisha tasks, milestones, expenses na maendeleo. Uthibitisho wa kina wa kila operation unahitaji data halisi ya kampuni na majukumu sahihi.

### Madhumuni na Changamoto

Miradi huunganisha tasks, milestones, expenses na maendeleo. Uthibitisho wa kina wa kila operation unahitaji data halisi ya kampuni na majukumu sahihi. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Project Manager; team member; executive. UI iliyothibitishwa: `client/src/components/PeopleCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Create project → add milestone/task → assign owner → update progress → record expense → review completion.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/routers.ts; server/projectsPersistence.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: project_expenses, project_milestones, project_tasks, projects. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: The repository contains the persistence boundary, but complete project operations still depend on authenticated data and role-specific acceptance. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Miradi na Usimamizi wa Kazi. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create project → add milestone/task → assign owner → update progress → record expense → review completion.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The repository contains the persistence boundary, but complete project operations still depend on authenticated data and role-specific acceptance.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Miradi na Usimamizi wa Kazi ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.20 Huduma kwa Wateja na Helpdesk

### Muhtasari wa Moduli

Helpdesk ina tickets, timelines, internal notes, chat/call evidence, SLA, assignment, resolution na metrics. Dispatch ya nje inategemea channel iliyosanidiwa. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Huduma kwa Wateja na Helpdesk ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `support_agents`, `support_call_log`, `support_chat_conversations`, `support_chat_messages`, `support_message_templates`, `support_sla_policies`, `support_team_members`, `support_teams`, `support_ticket_activity`, `support_ticket_messages`, `support_ticket_notes`, `support_tickets`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Receive issue → create ticket → classify/SLA → assign → communicate → resolve → audit and measure. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Automated external support execution is intentionally not claimed without configured channels; internal ticket persistence remains the source of record. Helpdesk ina tickets, timelines, internal notes, chat/call evidence, SLA, assignment, resolution na metrics. Dispatch ya nje inategemea channel iliyosanidiwa.

### Madhumuni na Changamoto

Helpdesk ina tickets, timelines, internal notes, chat/call evidence, SLA, assignment, resolution na metrics. Dispatch ya nje inategemea channel iliyosanidiwa. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Support agent; manager; customer; administrator. UI iliyothibitishwa: `client/src/components/IntelligenceCommandCenters.jsx; client/src/components/PeopleCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Receive issue → create ticket → classify/SLA → assign → communicate → resolve → audit and measure.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/supportOperations.ts; server/supportMetrics.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: support_agents, support_call_log, support_chat_conversations, support_chat_messages, support_message_templates, support_sla_policies, support_team_members, support_teams, support_ticket_activity, support_ticket_messages, support_ticket_notes, support_tickets. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Automated external support execution is intentionally not claimed without configured channels; internal ticket persistence remains the source of record. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Huduma kwa Wateja na Helpdesk. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Receive issue → create ticket → classify/SLA → assign → communicate → resolve → audit and measure.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Automated external support execution is intentionally not claimed without configured channels; internal ticket persistence remains the source of record.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Huduma kwa Wateja na Helpdesk ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.21 Uchambuzi wa Biashara na BI

### Muhtasari wa Moduli

BI huleta KPI, benchmarks, market na trend pamoja. Ubora wa uchambuzi unategemea data iliyokamilika na iliyowekwa ndani ya kampuni sahihi. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Uchambuzi wa Biashara na BI ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `competitors`, `custom_kpis`, `financial_benchmarks`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Select scope → read source metrics → compare or trend → investigate source record → document action. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Analytical quality depends on complete, correctly scoped input data and configured market services. BI huleta KPI, benchmarks, market na trend pamoja. Ubora wa uchambuzi unategemea data iliyokamilika na iliyowekwa ndani ya kampuni sahihi.

### Madhumuni na Changamoto

BI huleta KPI, benchmarks, market na trend pamoja. Ubora wa uchambuzi unategemea data iliyokamilika na iliyowekwa ndani ya kampuni sahihi. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Executive; analyst; manager. UI iliyothibitishwa: `client/src/components/IntelligenceCommandCenters.jsx; client/src/components/PredictiveAnalyticsWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Select scope → read source metrics → compare or trend → investigate source record → document action.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/dashboardReports.ts; server/marketIntelligence.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: competitors, custom_kpis, financial_benchmarks. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: Analytical quality depends on complete, correctly scoped input data and configured market services. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Uchambuzi wa Biashara na BI. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Select scope → read source metrics → compare or trend → investigate source record → document action.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Analytical quality depends on complete, correctly scoped input data and configured market services.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Uchambuzi wa Biashara na BI ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.22 Arifa na Tahadhari

### Muhtasari wa Moduli

Arifa zinarekodi tukio, delivery history, hali ya kusoma na retries. Rekodi ya notification si uthibitisho wa delivery ya mtoa huduma wa nje. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Arifa na Tahadhari ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `emails`, `notification_channels`, `notification_log`, `notification_rules`, `sms_group_members`, `sms_groups`, `sms_templates`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Detect event → create notification record → deliver through configured channel → mark read or retry → audit result. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. SMS, email, push, and WhatsApp delivery depend on external provider configuration and should show explicit unavailable states. Arifa zinarekodi tukio, delivery history, hali ya kusoma na retries. Rekodi ya notification si uthibitisho wa delivery ya mtoa huduma wa nje.

### Madhumuni na Changamoto

Arifa zinarekodi tukio, delivery history, hali ya kusoma na retries. Rekodi ya notification si uthibitisho wa delivery ya mtoa huduma wa nje. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Authenticated users; managers; administrators. UI iliyothibitishwa: `client/src/BusinessSphereDashboard.jsx; module workspaces`. Vipengele muhimu vinafuata mtiririko huu: Detect event → create notification record → deliver through configured channel → mark read or retry → audit result.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/notificationHistory.ts; server/transactionalEmail.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: emails, notification_channels, notification_log, notification_rules, sms_group_members, sms_groups, sms_templates. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: SMS, email, push, and WhatsApp delivery depend on external provider configuration and should show explicit unavailable states. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Arifa na Tahadhari. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Detect event → create notification record → deliver through configured channel → mark read or retry → audit result.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: SMS, email, push, and WhatsApp delivery depend on external provider configuration and should show explicit unavailable states.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Arifa na Tahadhari ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.23 Mtiririko wa Shughuli na Ushahidi wa Ukaguzi

### Muhtasari wa Moduli

Ushahidi wa audit unaonyesha nani alifanya kitendo, kwenye kampuni ipi na matokeo yake pale taarifa hiyo ipo. Rekodi za global admin zinalindwa tofauti. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mtiririko wa Shughuli na Ushahidi wa Ukaguzi ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `audit_log`, `audit_log_entries`, `bank_audit_events`, `billing_plan_audit_log`, `community_group_audit_log`, `hospitality_audit_log`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Authenticated action → protected mutation → audit record → scoped search/export → review or incident follow-up. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. An audit record increases traceability but does not correct an unsafe write; mutation confirmation and database constraints remain primary controls. Ushahidi wa audit unaonyesha nani alifanya kitendo, kwenye kampuni ipi na matokeo yake pale taarifa hiyo ipo. Rekodi za global admin zinalindwa tofauti.

### Madhumuni na Changamoto

Ushahidi wa audit unaonyesha nani alifanya kitendo, kwenye kampuni ipi na matokeo yake pale taarifa hiyo ipo. Rekodi za global admin zinalindwa tofauti. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Auditor; administrator; company manager with scope. UI iliyothibitishwa: `client/src/components/ComplianceAuditLogView.tsx; dashboard views`. Vipengele muhimu vinafuata mtiririko huu: Authenticated action → protected mutation → audit record → scoped search/export → review or incident follow-up.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/auditLogs.ts; server/tenantAuditViewer.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: audit_log, audit_log_entries, bank_audit_events, billing_plan_audit_log, community_group_audit_log, hospitality_audit_log. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: An audit record increases traceability but does not correct an unsafe write; mutation confirmation and database constraints remain primary controls. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mtiririko wa Shughuli na Ushahidi wa Ukaguzi. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Authenticated action → protected mutation → audit record → scoped search/export → review or incident follow-up.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: An audit record increases traceability but does not correct an unsafe write; mutation confirmation and database constraints remain primary controls.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mtiririko wa Shughuli na Ushahidi wa Ukaguzi ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.24 Kitovu cha Miunganisho

### Muhtasari wa Moduli

Kitovu cha miunganisho huonyesha metadata, webhooks, readiness na delivery history. Bila configuration halali, mfumo haupaswi kuonyesha kana kwamba channel inafanya kazi. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Kitovu cha Miunganisho ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `integration_connections`, `notification_channels`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Define connection → validate configuration → test safely → enable dispatch → monitor delivery → retry or disable. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. No provider credential, endpoint, or delivery success is assumed when configuration is missing; controls must remain disabled or clearly unavailable. Kitovu cha miunganisho huonyesha metadata, webhooks, readiness na delivery history. Bila configuration halali, mfumo haupaswi kuonyesha kana kwamba channel inafanya kazi.

### Madhumuni na Changamoto

Kitovu cha miunganisho huonyesha metadata, webhooks, readiness na delivery history. Bila configuration halali, mfumo haupaswi kuonyesha kana kwamba channel inafanya kazi. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Administrator; integration manager; finance manager. UI iliyothibitishwa: `client/src/components/FinanceCommandCenters.jsx; client/src/components/PeopleCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Define connection → validate configuration → test safely → enable dispatch → monitor delivery → retry or disable.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/webhooks.ts; server/transactionalEmail.ts; server/integration connections`. Tables zinazohusiana zinazonekana kwenye inventory ni: integration_connections, notification_channels. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **CONFIGURATION REQUIRED**. Mpaka unaojulikana: No provider credential, endpoint, or delivery success is assumed when configuration is missing; controls must remain disabled or clearly unavailable. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Kitovu cha Miunganisho. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Define connection → validate configuration → test safely → enable dispatch → monitor delivery → retry or disable.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: No provider credential, endpoint, or delivery success is assumed when configuration is missing; controls must remain disabled or clearly unavailable.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Kitovu cha Miunganisho ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.25 Studio ya Mitiririko na Soko

### Muhtasari wa Moduli

Workflow Studio huandaa templates, steps, approvals, tasks, notifications na audit. Draft ya ujumbe si uthibitisho wa kutumwa kwa mteja. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Studio ya Mitiririko na Soko ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `workflow_marketplace_templates`, `workflows`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Choose template → inspect steps → configure target → approve or run → record task/result → review audit. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. A workflow step that drafts an email or notification is not proof of external dispatch; complete orchestration requires channel configuration. Workflow Studio huandaa templates, steps, approvals, tasks, notifications na audit. Draft ya ujumbe si uthibitisho wa kutumwa kwa mteja.

### Madhumuni na Changamoto

Workflow Studio huandaa templates, steps, approvals, tasks, notifications na audit. Draft ya ujumbe si uthibitisho wa kutumwa kwa mteja. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Workflow administrator; approver; manager. UI iliyothibitishwa: `client/src/components/PeopleCommandCenters.jsx; dashboard registry`. Vipengele muhimu vinafuata mtiririko huu: Choose template → inspect steps → configure target → approve or run → record task/result → review audit.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/workflows.ts; server/aiApprovals.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: workflow_marketplace_templates, workflows. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: A workflow step that drafts an email or notification is not proof of external dispatch; complete orchestration requires channel configuration. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Studio ya Mitiririko na Soko. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Choose template → inspect steps → configure target → approve or run → record task/result → review audit.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: A workflow step that drafts an email or notification is not proof of external dispatch; complete orchestration requires channel configuration.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Studio ya Mitiririko na Soko ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.26 Kitovu cha Ushirikiano

### Muhtasari wa Moduli

Ushirikiano huunganisha channels, messages, presence, calendar na read receipts pale huduma hizo zimesanidiwa. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Kitovu cha Ushirikiano ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `calendar_events`, `collab_channels`, `collab_messages`, `emails`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create channel/event → post message → notify participants → track read/presence → retain evidence. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. External collaboration delivery and realtime behavior depend on configuration and provider availability; local state is not a durable message authority. Ushirikiano huunganisha channels, messages, presence, calendar na read receipts pale huduma hizo zimesanidiwa.

### Madhumuni na Changamoto

Ushirikiano huunganisha channels, messages, presence, calendar na read receipts pale huduma hizo zimesanidiwa. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Team member; manager; executive. UI iliyothibitishwa: `client/src/components/PeopleCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Create channel/event → post message → notify participants → track read/presence → retain evidence.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/collaborationEmailLinkCheck.ts; server/collaborationPersistence.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: calendar_events, collab_channels, collab_messages, emails. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: External collaboration delivery and realtime behavior depend on configuration and provider availability; local state is not a durable message authority. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Kitovu cha Ushirikiano. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create channel/event → post message → notify participants → track read/presence → retain evidence.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: External collaboration delivery and realtime behavior depend on configuration and provider availability; local state is not a durable message authority.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Kitovu cha Ushirikiano ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.27 TRA, VFD na Fiscalization ya Tanzania

### Muhtasari wa Moduli

Mifumo ya fiscal ina profiles, receipts, retry queue, Z-reports na tax settings. Uwasilishaji halisi wa TRA unahitaji TIN/VRN, configuration ya branch, credentials na mtoa huduma. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la TRA, VFD na Fiscalization ya Tanzania ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha tables za shared company scope. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Configure TIN/VRN and branch → validate readiness → submit idempotent transaction → receive provider result → store receipt/retry/audit evidence. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Production fiscalization requires approved provider credentials, device/branch configuration, and provider availability; a local receipt screen is not a TRA acceptance claim. Mifumo ya fiscal ina profiles, receipts, retry queue, Z-reports na tax settings. Uwasilishaji halisi wa TRA unahitaji TIN/VRN, configuration ya branch, credentials na mtoa huduma.

### Madhumuni na Changamoto

Mifumo ya fiscal ina profiles, receipts, retry queue, Z-reports na tax settings. Uwasilishaji halisi wa TRA unahitaji TIN/VRN, configuration ya branch, credentials na mtoa huduma. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: CFO; Finance Manager; administrator; fiscal operator. UI iliyothibitishwa: `client/src/components/TraPortalModule.jsx`. Vipengele muhimu vinafuata mtiririko huu: Configure TIN/VRN and branch → validate readiness → submit idempotent transaction → receive provider result → store receipt/retry/audit evidence.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/traFiscalRouter.ts; server/traFiscal.ts; server/traZReportArchive.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: tables za shared company scope. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **CONFIGURATION REQUIRED**. Mpaka unaojulikana: Production fiscalization requires approved provider credentials, device/branch configuration, and provider availability; a local receipt screen is not a TRA acceptance claim. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua TRA, VFD na Fiscalization ya Tanzania. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Configure TIN/VRN and branch → validate readiness → submit idempotent transaction → receive provider result → store receipt/retry/audit evidence.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Production fiscalization requires approved provider credentials, device/branch configuration, and provider availability; a local receipt screen is not a TRA acceptance claim.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa TRA, VFD na Fiscalization ya Tanzania ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.28 Msaidizi wa AI na Akili ya Biashara

### Muhtasari wa Moduli

Msaidizi wa AI hupokea context yenye mipaka, hutumia response iliyopangwa, na huandaa proposal badala ya kubadilisha rekodi bila approval ya jukumu husika. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Msaidizi wa AI na Akili ya Biashara ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `custom_kpis`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Verified user → scoped context → structured assistant response → optional navigation/proposal → independent role approval → confirmed business action. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. AI model availability and response quality depend on configured service access and supplied evidence; the assistant must not claim a mutation it did not execute. Msaidizi wa AI hupokea context yenye mipaka, hutumia response iliyopangwa, na huandaa proposal badala ya kubadilisha rekodi bila approval ya jukumu husika.

### Madhumuni na Changamoto

Msaidizi wa AI hupokea context yenye mipaka, hutumia response iliyopangwa, na huandaa proposal badala ya kubadilisha rekodi bila approval ya jukumu husika. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Authenticated user; approver for proposed actions. UI iliyothibitishwa: `client/src/components/AIChatBox.tsx; client/src/components/IntelligenceCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Verified user → scoped context → structured assistant response → optional navigation/proposal → independent role approval → confirmed business action.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/smartAssistant.ts; server/aiApprovals.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: custom_kpis. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **EXTERNAL SERVICE REQUIRED**. Mpaka unaojulikana: AI model availability and response quality depend on configured service access and supplied evidence; the assistant must not claim a mutation it did not execute. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Msaidizi wa AI na Akili ya Biashara. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Verified user → scoped context → structured assistant response → optional navigation/proposal → independent role approval → confirmed business action.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: AI model availability and response quality depend on configured service access and supplied evidence; the assistant must not claim a mutation it did not execute.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Msaidizi wa AI na Akili ya Biashara ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.29 Muunganisho wa WhatsApp Web

### Muhtasari wa Moduli

WhatsApp ina metadata ya account, contacts, messages na conversations. API key au token haipaswi kuhifadhiwa kwenye browser, na delivery inategemea provider. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Muunganisho wa WhatsApp Web ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `whatsapp_account_links`, `whatsapp_accounts`, `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_message_events`, `whatsapp_messages`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Configure provider → link account/contact → draft message → validate content → dispatch through provider → record status. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Provider configuration and message delivery are not assumed; credential persistence in browser storage is a security risk and must remain removed or blocked. WhatsApp ina metadata ya account, contacts, messages na conversations. API key au token haipaswi kuhifadhiwa kwenye browser, na delivery inategemea provider.

### Madhumuni na Changamoto

WhatsApp ina metadata ya account, contacts, messages na conversations. API key au token haipaswi kuhifadhiwa kwenye browser, na delivery inategemea provider. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Marketing manager; support agent; administrator. UI iliyothibitishwa: `client/src/BusinessSphereDashboard.jsx; messaging surfaces`. Vipengele muhimu vinafuata mtiririko huu: Configure provider → link account/contact → draft message → validate content → dispatch through provider → record status.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/whatsappProvider.ts; server/whatsAppSecurity.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: whatsapp_account_links, whatsapp_accounts, whatsapp_contacts, whatsapp_conversations, whatsapp_message_events, whatsapp_messages. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **CONFIGURATION REQUIRED**. Mpaka unaojulikana: Provider configuration and message delivery are not assumed; credential persistence in browser storage is a security risk and must remain removed or blocked. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Muunganisho wa WhatsApp Web. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Configure provider → link account/contact → draft message → validate content → dispatch through provider → record status.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Provider configuration and message delivery are not assumed; credential persistence in browser storage is a security risk and must remain removed or blocked.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Muunganisho wa WhatsApp Web ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.30 Mikopo Midogo

### Muhtasari wa Moduli

Microfinance inahusu borrowers, vikundi, bidhaa, applications, approvals, disbursement, repayments, savings, cash sessions na collections. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mikopo Midogo ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `mfi_audit_logs`, `mfi_cash_sessions`, `mfi_cash_transactions`, `mfi_clients`, `mfi_collateral`, `mfi_collections`, `mfi_credit_scorecards`, `mfi_credit_scoring_settings`, `mfi_groups`, `mfi_guarantors`, `mfi_loan_applications`, `mfi_loan_products`, `mfi_loans`, `mfi_notifications`, `mfi_par_escalation_settings`, `mfi_repayment_schedules`, `mfi_repayments`, `mfi_savings`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Register borrower/group → choose product → submit application → approve → disburse → collect repayment/savings → monitor PAR/escalation. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Financial persistence and controlled data must be exercised against a real tenant schema; seeded UI examples are not production records. Microfinance inahusu borrowers, vikundi, bidhaa, applications, approvals, disbursement, repayments, savings, cash sessions na collections.

### Madhumuni na Changamoto

Microfinance inahusu borrowers, vikundi, bidhaa, applications, approvals, disbursement, repayments, savings, cash sessions na collections. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: MFI manager; loan officer; cashier; approver; auditor. UI iliyothibitishwa: `client/src/components/MicrofinanceWorkspace.jsx; client/src/components/MicrofinanceGovernanceDialogs.jsx`. Vipengele muhimu vinafuata mtiririko huu: Register borrower/group → choose product → submit application → approve → disburse → collect repayment/savings → monitor PAR/escalation.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/microfinanceOperations.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: mfi_audit_logs, mfi_cash_sessions, mfi_cash_transactions, mfi_clients, mfi_collateral, mfi_collections, mfi_credit_scorecards, mfi_credit_scoring_settings, mfi_groups, mfi_guarantors, mfi_loan_applications, mfi_loan_products, mfi_loans, mfi_notifications, mfi_par_escalation_settings, mfi_repayment_schedules, mfi_repayments, mfi_savings. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Financial persistence and controlled data must be exercised against a real tenant schema; seeded UI examples are not production records. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mikopo Midogo. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Register borrower/group → choose product → submit application → approve → disburse → collect repayment/savings → monitor PAR/escalation.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Financial persistence and controlled data must be exercised against a real tenant schema; seeded UI examples are not production records.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mikopo Midogo ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.31 Wakala wa Fedha

### Muhtasari wa Moduli

Wakala wa fedha huunganisha mawakala, wateja, wallets, cash actions, commissions, ledger, approvals na reconciliation. Movement halisi ya mtoa huduma inahitaji acceptance ya kudhibitiwa. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Wakala wa Fedha ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `money_agent_agents`, `money_agent_alerts`, `money_agent_approvals`, `money_agent_audit_events`, `money_agent_branches`, `money_agent_commission_rules`, `money_agent_customers`, `money_agent_daily_summaries`, `money_agent_fee_rules`, `money_agent_ledger_entries`, `money_agent_limits`, `money_agent_notifications`, `money_agent_pin_credentials`, `money_agent_receipts`, `money_agent_reconciliations`, `money_agent_risk_events`, `money_agent_services`, `money_agent_settlements`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Register agent/customer → open cash/wallet context → initiate action → validate balance/role → record ledger → reconcile and audit. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The live schema includes the migration history and tables, but real wallet/provider movement still requires controlled credentials and operational acceptance. Wakala wa fedha huunganisha mawakala, wateja, wallets, cash actions, commissions, ledger, approvals na reconciliation. Movement halisi ya mtoa huduma inahitaji acceptance ya kudhibitiwa.

### Madhumuni na Changamoto

Wakala wa fedha huunganisha mawakala, wateja, wallets, cash actions, commissions, ledger, approvals na reconciliation. Movement halisi ya mtoa huduma inahitaji acceptance ya kudhibitiwa. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Money agent; supervisor; cashier; auditor. UI iliyothibitishwa: `client/src/components/MoneyAgentWorkspace.jsx; client/src/components/SectorCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Register agent/customer → open cash/wallet context → initiate action → validate balance/role → record ledger → reconcile and audit.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/moneyAgentOperations.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: money_agent_agents, money_agent_alerts, money_agent_approvals, money_agent_audit_events, money_agent_branches, money_agent_commission_rules, money_agent_customers, money_agent_daily_summaries, money_agent_fee_rules, money_agent_ledger_entries, money_agent_limits, money_agent_notifications, money_agent_pin_credentials, money_agent_receipts, money_agent_reconciliations, money_agent_risk_events, money_agent_services, money_agent_settlements. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: The live schema includes the migration history and tables, but real wallet/provider movement still requires controlled credentials and operational acceptance. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Wakala wa Fedha. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Register agent/customer → open cash/wallet context → initiate action → validate balance/role → record ledger → reconcile and audit.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The live schema includes the migration history and tables, but real wallet/provider movement still requires controlled credentials and operational acceptance.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Wakala wa Fedha ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.32 VICOBA, SACCOS na Vikundi vya Jamii

### Muhtasari wa Moduli

Vikundi vina groups, members, michango, savings, loans, meetings, attendance, budgets, welfare, votes, approvals na audit. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la VICOBA, SACCOS na Vikundi vya Jamii ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `community_contributions`, `community_group_announcements`, `community_group_approvals`, `community_group_assets`, `community_group_attendance`, `community_group_audit_log`, `community_group_budgets`, `community_group_committee_members`, `community_group_committees`, `community_group_contributions`, `community_group_documents`, `community_group_events`, `community_group_expenses`, `community_group_fundraising`, `community_group_income`, `community_group_loan_guarantors`, `community_group_loan_penalties`, `community_group_loan_repayments`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create group → add member → record contribution/meeting → approve loan or welfare action → update ledger/report. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Relationship guards and approvals are present, but broader group-accounting walkthroughs should still be completed with controlled tenant data. Vikundi vina groups, members, michango, savings, loans, meetings, attendance, budgets, welfare, votes, approvals na audit.

### Madhumuni na Changamoto

Vikundi vina groups, members, michango, savings, loans, meetings, attendance, budgets, welfare, votes, approvals na audit. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Group chairperson; treasurer; secretary; member; auditor. UI iliyothibitishwa: `client/src/components/SectorCommandCenters.jsx; community group surfaces`. Vipengele muhimu vinafuata mtiririko huu: Create group → add member → record contribution/meeting → approve loan or welfare action → update ledger/report.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/communityGroups.ts; server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: community_contributions, community_group_announcements, community_group_approvals, community_group_assets, community_group_attendance, community_group_audit_log, community_group_budgets, community_group_committee_members, community_group_committees, community_group_contributions, community_group_documents, community_group_events, community_group_expenses, community_group_fundraising, community_group_income, community_group_loan_guarantors, community_group_loan_penalties, community_group_loan_repayments. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Relationship guards and approvals are present, but broader group-accounting walkthroughs should still be completed with controlled tenant data. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua VICOBA, SACCOS na Vikundi vya Jamii. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create group → add member → record contribution/meeting → approve loan or welfare action → update ledger/report.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Relationship guards and approvals are present, but broader group-accounting walkthroughs should still be completed with controlled tenant data.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa VICOBA, SACCOS na Vikundi vya Jamii ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.33 Afya na Kliniki

### Muhtasari wa Moduli

Kliniki ina patients, appointments, visits, vitals, prescriptions, labs, radiology, claims, reports, reminders na patient consent. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Afya na Kliniki ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `hc_appointments`, `hc_doctors`, `hc_insurance_claims`, `hc_invoices`, `hc_lab_orders`, `hc_notifications`, `hc_patients`, `hc_portal_reference_approvals`, `hc_portal_reference_imports`, `hc_portal_reference_summary_settings`, `hc_prescriptions`, `hc_radiology`, `hc_reminder_deliveries`, `hc_reminder_settings`, `hc_reports`, `hc_visits`, `hc_vitals`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Register patient → book appointment → record visit/vitals → prescribe/order → issue report or claim → notify with consent → audit. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. SMS and interoperability depend on provider configuration; clinical data requires strict least-privilege review and must not be exposed through generic tenant screens. Kliniki ina patients, appointments, visits, vitals, prescriptions, labs, radiology, claims, reports, reminders na patient consent.

### Madhumuni na Changamoto

Kliniki ina patients, appointments, visits, vitals, prescriptions, labs, radiology, claims, reports, reminders na patient consent. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Clinician; nurse; receptionist; finance user; patient portal user. UI iliyothibitishwa: `client/src/components/HealthcareClinicWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Register patient → book appointment → record visit/vitals → prescribe/order → issue report or claim → notify with consent → audit.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/healthcareOperations.ts; server/healthcareInteroperability.ts; server/healthcareReminders.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: hc_appointments, hc_doctors, hc_insurance_claims, hc_invoices, hc_lab_orders, hc_notifications, hc_patients, hc_portal_reference_approvals, hc_portal_reference_imports, hc_portal_reference_summary_settings, hc_prescriptions, hc_radiology, hc_reminder_deliveries, hc_reminder_settings, hc_reports, hc_visits, hc_vitals. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: SMS and interoperability depend on provider configuration; clinical data requires strict least-privilege review and must not be exposed through generic tenant screens. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Afya na Kliniki. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Register patient → book appointment → record visit/vitals → prescribe/order → issue report or claim → notify with consent → audit.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: SMS and interoperability depend on provider configuration; clinical data requires strict least-privilege review and must not be exposed through generic tenant screens.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Afya na Kliniki ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.34 Usimamizi wa Shule

### Muhtasari wa Moduli

Mfumo wa shule una miaka ya masomo, terms, departments, subjects, classes, admissions, attendance, assessments, report cards, fees, scholarships, transport, library na announcements. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Usimamizi wa Shule ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `sch_academic_years`, `sch_admissions`, `sch_announcements`, `sch_approval_requests`, `sch_assessment_scores`, `sch_assessments`, `sch_assignment_submissions`, `sch_assignments`, `sch_attendance_records`, `sch_attendance_sessions`, `sch_audit_logs`, `sch_books`, `sch_classes`, `sch_departments`, `sch_disciplinary_records`, `sch_documents`, `sch_enrollments`, `sch_exams`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Set academic structure → admit learner → assign teacher/class → record attendance/assessment → publish report → invoice/receive fees → communicate. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Automated browser coverage is strong for the surface, while full per-school CRUD remains a data-backed acceptance task. Mfumo wa shule una miaka ya masomo, terms, departments, subjects, classes, admissions, attendance, assessments, report cards, fees, scholarships, transport, library na announcements.

### Madhumuni na Changamoto

Mfumo wa shule una miaka ya masomo, terms, departments, subjects, classes, admissions, attendance, assessments, report cards, fees, scholarships, transport, library na announcements. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: School administrator; teacher; student/guardian portal user; finance user. UI iliyothibitishwa: `client/src/components/SchoolWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Set academic structure → admit learner → assign teacher/class → record attendance/assessment → publish report → invoice/receive fees → communicate.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/schoolOperations.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: sch_academic_years, sch_admissions, sch_announcements, sch_approval_requests, sch_assessment_scores, sch_assessments, sch_assignment_submissions, sch_assignments, sch_attendance_records, sch_attendance_sessions, sch_audit_logs, sch_books, sch_classes, sch_departments, sch_disciplinary_records, sch_documents, sch_enrollments, sch_exams. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PASSED**. Mpaka unaojulikana: Automated browser coverage is strong for the surface, while full per-school CRUD remains a data-backed acceptance task. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Usimamizi wa Shule. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Set academic structure → admit learner → assign teacher/class → record attendance/assessment → publish report → invoice/receive fees → communicate.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Automated browser coverage is strong for the surface, while full per-school CRUD remains a data-backed acceptance task.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Usimamizi wa Shule ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.35 Usimamizi wa Famasi

### Muhtasari wa Moduli

Famasi inahifadhi dawa, categories, brands, suppliers, purchase orders, stock, dispensing, sales, malipo, claims, returns na audit. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Usimamizi wa Famasi ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `phm_audit_logs`, `phm_batches`, `phm_brands`, `phm_categories`, `phm_controlled_medicine_register`, `phm_dispense`, `phm_dispense_items`, `phm_drugs`, `phm_insurance_claims`, `phm_notifications`, `phm_payments`, `phm_purchase_order_items`, `phm_purchase_orders`, `phm_return_items`, `phm_returns`, `phm_sale_items`, `phm_sales`, `phm_stock`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Create medicine → receive stock → adjust/transfer → dispense or sell → collect payment → return/claim → reconcile. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Live dispensing and inventory walkthroughs remain dependent on controlled pharmacy records and appropriate clinical/financial permissions. Famasi inahifadhi dawa, categories, brands, suppliers, purchase orders, stock, dispensing, sales, malipo, claims, returns na audit.

### Madhumuni na Changamoto

Famasi inahifadhi dawa, categories, brands, suppliers, purchase orders, stock, dispensing, sales, malipo, claims, returns na audit. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Pharmacist; storekeeper; cashier; clinician; administrator. UI iliyothibitishwa: `client/src/components/PharmacyWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Create medicine → receive stock → adjust/transfer → dispense or sell → collect payment → return/claim → reconcile.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/pharmacyOperations.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: phm_audit_logs, phm_batches, phm_brands, phm_categories, phm_controlled_medicine_register, phm_dispense, phm_dispense_items, phm_drugs, phm_insurance_claims, phm_notifications, phm_payments, phm_purchase_order_items, phm_purchase_orders, phm_return_items, phm_returns, phm_sale_items, phm_sales, phm_stock. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Live dispensing and inventory walkthroughs remain dependent on controlled pharmacy records and appropriate clinical/financial permissions. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Usimamizi wa Famasi. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Create medicine → receive stock → adjust/transfer → dispense or sell → collect payment → return/claim → reconcile.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Live dispensing and inventory walkthroughs remain dependent on controlled pharmacy records and appropriate clinical/financial permissions.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Usimamizi wa Famasi ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.36 Hoteli na Ukarimu

### Muhtasari wa Moduli

Hoteli inahusu properties, room types, rooms, rates, reservations, guests, KYC, folios, payments, housekeeping, laundry, events na reconciliation. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Hoteli na Ukarimu ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `hospitality_amenities`, `hospitality_audit_log`, `hospitality_complaints`, `hospitality_event_venues`, `hospitality_events`, `hospitality_finance_reconciliations`, `hospitality_folio_lines`, `hospitality_folios`, `hospitality_guest_kyc`, `hospitality_guest_requests`, `hospitality_guests`, `hospitality_housekeeping_tasks`, `hospitality_laundry_orders`, `hospitality_loyalty_accounts`, `hospitality_maintenance_requests`, `hospitality_menu_items`, `hospitality_menus`, `hospitality_minibar_postings`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Configure property/rooms → create reservation → check in → post folio/service → receive payment → housekeeping/check out → reconcile. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. External booking-channel and payment connections remain provider-dependent; local reservation state is not proof of channel synchronization. Hoteli inahusu properties, room types, rooms, rates, reservations, guests, KYC, folios, payments, housekeeping, laundry, events na reconciliation.

### Madhumuni na Changamoto

Hoteli inahusu properties, room types, rooms, rates, reservations, guests, KYC, folios, payments, housekeeping, laundry, events na reconciliation. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Hotel manager; front desk; housekeeping; finance; guest. UI iliyothibitishwa: `client/src/components/HospitalityWorkspace.jsx; client/src/components/VerticalCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Configure property/rooms → create reservation → check in → post folio/service → receive payment → housekeeping/check out → reconcile.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/hospitalityOperations.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: hospitality_amenities, hospitality_audit_log, hospitality_complaints, hospitality_event_venues, hospitality_events, hospitality_finance_reconciliations, hospitality_folio_lines, hospitality_folios, hospitality_guest_kyc, hospitality_guest_requests, hospitality_guests, hospitality_housekeeping_tasks, hospitality_laundry_orders, hospitality_loyalty_accounts, hospitality_maintenance_requests, hospitality_menu_items, hospitality_menus, hospitality_minibar_postings. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: External booking-channel and payment connections remain provider-dependent; local reservation state is not proof of channel synchronization. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Hoteli na Ukarimu. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Configure property/rooms → create reservation → check in → post folio/service → receive payment → housekeeping/check out → reconcile.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: External booking-channel and payment connections remain provider-dependent; local reservation state is not proof of channel synchronization.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Hoteli na Ukarimu ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.37 Mgahawa na Chakula/Vinywaji

### Muhtasari wa Moduli

Mgahawa una menus, items, tables, orders, reservations, waiters, payments, receipts, refunds na fiscal configuration ya Tanzania. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mgahawa na Chakula/Vinywaji ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `restaurant_alerts`, `restaurant_audit_events`, `restaurant_bill_splits`, `restaurant_combo_items`, `restaurant_customers`, `restaurant_dining_areas`, `restaurant_fiscal_profiles`, `restaurant_fiscal_receipts`, `restaurant_kitchen_tickets`, `restaurant_menu_categories`, `restaurant_menu_items`, `restaurant_mobile_money_intents`, `restaurant_mobile_money_profiles`, `restaurant_modifier_groups`, `restaurant_modifier_options`, `restaurant_order_lines`, `restaurant_orders`, `restaurant_outlets`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Configure menu/table → open order → add items → prepare/serve → collect payment → issue receipt/fiscal evidence → reconcile. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Delivery and external payment channels require configuration; fiscal status is a readiness state until a provider confirms submission. Mgahawa una menus, items, tables, orders, reservations, waiters, payments, receipts, refunds na fiscal configuration ya Tanzania.

### Madhumuni na Changamoto

Mgahawa una menus, items, tables, orders, reservations, waiters, payments, receipts, refunds na fiscal configuration ya Tanzania. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Restaurant manager; waiter; cashier; kitchen; finance. UI iliyothibitishwa: `client/src/components/RestaurantWorkspace.jsx; client/src/components/RestaurantTanzaniaFiscalPanel.jsx`. Vipengele muhimu vinafuata mtiririko huu: Configure menu/table → open order → add items → prepare/serve → collect payment → issue receipt/fiscal evidence → reconcile.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/restaurantManagement.ts; server/traFiscal.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: restaurant_alerts, restaurant_audit_events, restaurant_bill_splits, restaurant_combo_items, restaurant_customers, restaurant_dining_areas, restaurant_fiscal_profiles, restaurant_fiscal_receipts, restaurant_kitchen_tickets, restaurant_menu_categories, restaurant_menu_items, restaurant_mobile_money_intents, restaurant_mobile_money_profiles, restaurant_modifier_groups, restaurant_modifier_options, restaurant_order_lines, restaurant_orders, restaurant_outlets. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: Delivery and external payment channels require configuration; fiscal status is a readiness state until a provider confirms submission. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mgahawa na Chakula/Vinywaji. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Configure menu/table → open order → add items → prepare/serve → collect payment → issue receipt/fiscal evidence → reconcile.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Delivery and external payment channels require configuration; fiscal status is a readiness state until a provider confirms submission.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mgahawa na Chakula/Vinywaji ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.38 Benki na MFI

### Muhtasari wa Moduli

Benki na MFI zina institutions, branches, customers, KYC, accounts, beneficiaries, transactions, loans, schedules, repayments, AML, reconciliation na audit. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Benki na MFI ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `bank_account_beneficiaries`, `bank_account_types`, `bank_accounts`, `bank_agents`, `bank_aml_alerts`, `bank_audit_events`, `bank_beneficial_owners`, `bank_branches`, `bank_cash_movements`, `bank_collateral`, `bank_customer_documents`, `bank_customers`, `bank_fixed_deposits`, `bank_group_members`, `bank_groups`, `bank_guarantors`, `bank_idempotency_keys`, `bank_institutions`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Set institution → register customer/KYC → open account → post transaction → originate/approve loan → schedule/collect → reconcile/resolve AML. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. External banking rails are not connected without approved adapters; SECURITY DEFINER routines require endpoint-by-endpoint privilege review. Benki na MFI zina institutions, branches, customers, KYC, accounts, beneficiaries, transactions, loans, schedules, repayments, AML, reconciliation na audit.

### Madhumuni na Changamoto

Benki na MFI zina institutions, branches, customers, KYC, accounts, beneficiaries, transactions, loans, schedules, repayments, AML, reconciliation na audit. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Bank administrator; teller; loan officer; compliance officer; auditor. UI iliyothibitishwa: `client/src/components/BankMfiWorkspace.jsx; client/src/components/SectorCommandCenters.jsx`. Vipengele muhimu vinafuata mtiririko huu: Set institution → register customer/KYC → open account → post transaction → originate/approve loan → schedule/collect → reconcile/resolve AML.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/bankMfiOperations.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: bank_account_beneficiaries, bank_account_types, bank_accounts, bank_agents, bank_aml_alerts, bank_audit_events, bank_beneficial_owners, bank_branches, bank_cash_movements, bank_collateral, bank_customer_documents, bank_customers, bank_fixed_deposits, bank_group_members, bank_groups, bank_guarantors, bank_idempotency_keys, bank_institutions. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **TESTING**. Mpaka unaojulikana: External banking rails are not connected without approved adapters; SECURITY DEFINER routines require endpoint-by-endpoint privilege review. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Benki na MFI. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Set institution → register customer/KYC → open account → post transaction → originate/approve loan → schedule/collect → reconcile/resolve AML.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: External banking rails are not connected without approved adapters; SECURITY DEFINER routines require endpoint-by-endpoint privilege review.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Benki na MFI ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.39 Portal ya Mfanyakazi

### Muhtasari wa Moduli

Portal ya mfanyakazi hutoa self-service ya wasifu, attendance, leave, announcements, benefits na nyaraka kwa mipaka ya kampuni na role. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Portal ya Mfanyakazi ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `hr_announcement_reads`, `hr_announcements`, `hr_approval_requests`, `hr_approval_steps`, `hr_attendance`, `hr_benefit_enrollments`, `hr_benefit_plans`, `hr_benefits`, `hr_candidates`, `hr_duties`, `hr_employee_documents`, `hr_employees`, `hr_expense_claims`, `hr_goal_updates`, `hr_goals`, `hr_holidays`, `hr_invite_codes`, `hr_leave_balances`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Accept secure invitation → verify profile → view or request employee action → manager/HR decision → record outcome. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. An employee view does not imply access to payroll or HR administration; role boundaries must be enforced by server and RLS. Portal ya mfanyakazi hutoa self-service ya wasifu, attendance, leave, announcements, benefits na nyaraka kwa mipaka ya kampuni na role.

### Madhumuni na Changamoto

Portal ya mfanyakazi hutoa self-service ya wasifu, attendance, leave, announcements, benefits na nyaraka kwa mipaka ya kampuni na role. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Employee; manager; HR administrator. UI iliyothibitishwa: `client/src/components/EmployeePortalWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Accept secure invitation → verify profile → view or request employee action → manager/HR decision → record outcome.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/teamWorkforce.ts; server/employeePortal.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: hr_announcement_reads, hr_announcements, hr_approval_requests, hr_approval_steps, hr_attendance, hr_benefit_enrollments, hr_benefit_plans, hr_benefits, hr_candidates, hr_duties, hr_employee_documents, hr_employees, hr_expense_claims, hr_goal_updates, hr_goals, hr_holidays, hr_invite_codes, hr_leave_balances. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: An employee view does not imply access to payroll or HR administration; role boundaries must be enforced by server and RLS. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Portal ya Mfanyakazi. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Accept secure invitation → verify profile → view or request employee action → manager/HR decision → record outcome.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: An employee view does not imply access to payroll or HR administration; role boundaries must be enforced by server and RLS.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Portal ya Mfanyakazi ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.40 Usimamizi wa Mali Isiyohamishika

### Muhtasari wa Moduli

Property Management ina portfolio, owners, buildings, plots, units, listings, agents, tenants, applications, leases, inspections, handover, rent, utilities, invoices, payments, maintenance, expenses, budgets, insurance, notices na audit. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Usimamizi wa Mali Isiyohamishika ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `property_agents`, `property_applications`, `property_approvals`, `property_audit_log`, `property_budgets`, `property_buildings`, `property_contractors`, `property_documents`, `property_expenses`, `property_handover_records`, `property_inspection_items`, `property_inspections`, `property_insurances`, `property_integration_events`, `property_invoice_lines`, `property_invoices`, `property_leases`, `property_ledger_entries`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Portfolio → building/unit → owner/tenant/application → lease → inspection/handover → rent/utility invoice → payment/receipt → maintenance/expense → reconciliation. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The live audit shows the property migration and tables present; external payment, map, messaging, and contractor channels still require configuration and controlled acceptance. Property Management ina portfolio, owners, buildings, plots, units, listings, agents, tenants, applications, leases, inspections, handover, rent, utilities, invoices, payments, maintenance, expenses, budgets, insurance, notices na audit.

### Madhumuni na Changamoto

Property Management ina portfolio, owners, buildings, plots, units, listings, agents, tenants, applications, leases, inspections, handover, rent, utilities, invoices, payments, maintenance, expenses, budgets, insurance, notices na audit. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Property manager; landlord/owner; agent; tenant; finance manager; maintenance user. UI iliyothibitishwa: `client/src/components/PropertyManagementWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Portfolio → building/unit → owner/tenant/application → lease → inspection/handover → rent/utility invoice → payment/receipt → maintenance/expense → reconciliation.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/propertyManagementOperations.ts; server/propertyManagement.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: property_agents, property_applications, property_approvals, property_audit_log, property_budgets, property_buildings, property_contractors, property_documents, property_expenses, property_handover_records, property_inspection_items, property_inspections, property_insurances, property_integration_events, property_invoice_lines, property_invoices, property_leases, property_ledger_entries. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: The live audit shows the property migration and tables present; external payment, map, messaging, and contractor channels still require configuration and controlled acceptance. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Usimamizi wa Mali Isiyohamishika. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Portfolio → building/unit → owner/tenant/application → lease → inspection/handover → rent/utility invoice → payment/receipt → maintenance/expense → reconciliation.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The live audit shows the property migration and tables present; external payment, map, messaging, and contractor channels still require configuration and controlled acceptance.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Usimamizi wa Mali Isiyohamishika ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.41 Usajili na Utozaji

### Muhtasari wa Moduli

Mfumo wa usajili una FREE_15 ya TZS 0 kwa siku 15 na packages sita za kila mwezi. Paid access hutolewa baada ya provider kuthibitisha malipo; server na database ndiyo mamlaka. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Usajili na Utozaji ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `billing_plan_audit_log`, `billing_plans`, `billing_profiles`, `subscription_events`, `subscription_invoices`, `subscription_notifications`, `subscription_payments`, `subscription_usage`, `tenant_subscriptions`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Read catalog → start Free or create paid intent → send/verify provider request → reconcile payment → activate subscription/invoice → refresh access snapshot. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. HarakaPay account authorization and provider credentials remain deployment prerequisites; failed or cancelled requests must not be shown as active entitlement. Mfumo wa usajili una FREE_15 ya TZS 0 kwa siku 15 na packages sita za kila mwezi. Paid access hutolewa baada ya provider kuthibitisha malipo; server na database ndiyo mamlaka.

### Madhumuni na Changamoto

Mfumo wa usajili una FREE_15 ya TZS 0 kwa siku 15 na packages sita za kila mwezi. Paid access hutolewa baada ya provider kuthibitisha malipo; server na database ndiyo mamlaka. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Billing manager; owner; CEO; CFO; finance manager; administrator. UI iliyothibitishwa: `client/src/components/SubscriptionBillingWorkspace.jsx; client/src/lib/subscriptionAccess.js`. Vipengele muhimu vinafuata mtiririko huu: Read catalog → start Free or create paid intent → send/verify provider request → reconcile payment → activate subscription/invoice → refresh access snapshot.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/subscriptionBilling.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: billing_plan_audit_log, billing_plans, billing_profiles, subscription_events, subscription_invoices, subscription_notifications, subscription_payments, subscription_usage, tenant_subscriptions. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: HarakaPay account authorization and provider credentials remain deployment prerequisites; failed or cancelled requests must not be shown as active entitlement. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Usajili na Utozaji. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Read catalog → start Free or create paid intent → send/verify provider request → reconcile payment → activate subscription/invoice → refresh access snapshot.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: HarakaPay account authorization and provider credentials remain deployment prerequisites; failed or cancelled requests must not be shown as active entitlement.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Usajili na Utozaji ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.42 Kituo cha Udhibiti wa Msimamizi wa Mfumo

### Muhtasari wa Moduli

Global Admin ni control plane tofauti ya kampuni, watumiaji, subscriptions, usalama, integrations, health na audit. Si ruhusa pana kwa mtumiaji wa tenant. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Kituo cha Udhibiti wa Msimamizi wa Mfumo ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `billing_plan_audit_log`, `companies`, `platform_admin_actions`, `profiles`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Verify platform-admin authority → inspect scoped snapshot → perform explicit action → record platform audit → review outcome. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. The platform_admin_actions table is intentionally protected from a broad authenticated policy; access uses the protected platform-admin RPC boundary. Global Admin ni control plane tofauti ya kampuni, watumiaji, subscriptions, usalama, integrations, health na audit. Si ruhusa pana kwa mtumiaji wa tenant.

### Madhumuni na Changamoto

Global Admin ni control plane tofauti ya kampuni, watumiaji, subscriptions, usalama, integrations, health na audit. Si ruhusa pana kwa mtumiaji wa tenant. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Super Administrator; platform administrator. UI iliyothibitishwa: `client/src/components/GlobalAdminControlCenter.tsx`. Vipengele muhimu vinafuata mtiririko huu: Verify platform-admin authority → inspect scoped snapshot → perform explicit action → record platform audit → review outcome.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/globalAdmin.ts; server/routers.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: billing_plan_audit_log, companies, platform_admin_actions, profiles. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: The platform_admin_actions table is intentionally protected from a broad authenticated policy; access uses the protected platform-admin RPC boundary. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Kituo cha Udhibiti wa Msimamizi wa Mfumo. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Verify platform-admin authority → inspect scoped snapshot → perform explicit action → record platform audit → review outcome.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: The platform_admin_actions table is intentionally protected from a broad authenticated policy; access uses the protected platform-admin RPC boundary.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Kituo cha Udhibiti wa Msimamizi wa Mfumo ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.43 Mipangilio na Udhibiti wa Usalama

### Muhtasari wa Moduli

Mipangilio inahusu kampuni, branding, lugha, timezone/currency, receipts, idle timeout, modules, branches, departments, preferences, passkeys na role approvals. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Mipangilio na Udhibiti wa Usalama ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `branches`, `company_modules`, `company_profile_settings`, `departments`, `user_table_preferences`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Open settings → read confirmed configuration → edit permitted field → server validates and persists → refresh UI → audit sensitive change. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Provider-specific email, SMS, API-key, and storage configuration remains environment-dependent; secret values must be redacted. Mipangilio inahusu kampuni, branding, lugha, timezone/currency, receipts, idle timeout, modules, branches, departments, preferences, passkeys na role approvals.

### Madhumuni na Changamoto

Mipangilio inahusu kampuni, branding, lugha, timezone/currency, receipts, idle timeout, modules, branches, departments, preferences, passkeys na role approvals. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Organization owner; administrator; manager; user with permitted settings. UI iliyothibitishwa: `client/src/components/DashboardPreferencesDrawer.jsx; client/src/components/ProfileIdentityCenter.jsx`. Vipengele muhimu vinafuata mtiririko huu: Open settings → read confirmed configuration → edit permitted field → server validates and persists → refresh UI → audit sensitive change.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/workspaceSettings.ts; server/workspaceBranding.ts; server/roleChangeApprovals.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: branches, company_modules, company_profile_settings, departments, user_table_preferences. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **IMPLEMENTED**. Mpaka unaojulikana: Provider-specific email, SMS, API-key, and storage configuration remains environment-dependent; secret values must be redacted. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Mipangilio na Udhibiti wa Usalama. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Open settings → read confirmed configuration → edit permitted field → server validates and persists → refresh UI → audit sensitive change.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Provider-specific email, SMS, API-key, and storage configuration remains environment-dependent; secret values must be redacted.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Mipangilio na Udhibiti wa Usalama ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

## XV.44 Uchambuzi wa Utabiri

### Muhtasari wa Moduli

Utabiri ni msaada wa maamuzi unaotegemea data ya kutosha na huduma iliyosanidiwa; si ahadi ya matokeo ya biashara. Sura hii imetokana na UI ya repository, mpaka wa server, migration history na inventory ya Supabase iliyosomwa bila kubadilisha data. Pale ushahidi unategemea configuration, data ya kampuni au provider wa nje, mpaka huo umeelezwa wazi.
Lengo la Uchambuzi wa Utabiri ni kufanya kazi inayorudiwa ionekane na idhibitiwe. Changamoto si kutokuwepo kwa screen pekee; ni hatari ya kuandika ukweli uleule mara nyingi, role kuona zaidi ya inavyoruhusiwa, au write iliyokataliwa kuonekana kana kwamba imefanikiwa. Kwa hiyo module inapaswa kufuata input, validation, persistence, ushahidi na review ya uongozi.
Sehemu za persistence zinazoonekana kwa module hii zinajumuisha `competitors`, `custom_kpis`, `financial_benchmarks`. Majina haya ni ushahidi wa inventory ya sasa au contract ya repository; hayamaanishi kwamba kila table inatumika na kila deployment au kwamba kila table ina data ya production.
Mtiririko uliothibitishwa ni: Select evidence set → compute signal → present confidence/limitation → inspect source metrics → decide manually. Mtumiaji athibitishe hali iliyorejeshwa na atumie empty/error state badala ya kukisia. Predictions are decision support, not guarantees. Sparse or stale data, configuration, and model availability constrain their reliability. Utabiri ni msaada wa maamuzi unaotegemea data ya kutosha na huduma iliyosanidiwa; si ahadi ya matokeo ya biashara.

### Madhumuni na Changamoto

Utabiri ni msaada wa maamuzi unaotegemea data ya kutosha na huduma iliyosanidiwa; si ahadi ya matokeo ya biashara. Moduli hii inalenga kupunguza rekodi zilizotawanyika, kuongeza uwazi wa kazi na kuweka mpaka wa uwajibikaji.

### Watumiaji, Urambazaji na Vipengele

Majukumu yanayohusika: Executive; analyst; manager. UI iliyothibitishwa: `client/src/components/PredictiveAnalyticsWorkspace.jsx`. Vipengele muhimu vinafuata mtiririko huu: Select evidence set → compute signal → present confidence/limitation → inspect source metrics → decide manually.

### Hifadhidata, Ruhusa na Usalama

Server boundary: `server/marketIntelligence.ts; server/smartAssistant.ts`. Tables zinazohusiana zinazonekana kwenye inventory ni: competitors, custom_kpis, financial_benchmarks. Access inapaswa kupita kwenye profile iliyothibitishwa, company scope, role, database constraints na RLS/policies.

### Ripoti, Integrations na Mobile

Ripoti inategemea data iliyorekodiwa. Integration ya nje inahitaji configuration na credentials zilizoidhinishwa. Kwenye simu, mtumiaji athibitishe response kabla ya kuondoka kwenye action muhimu.

### Mipaka, Hali ya Sasa na Maboresho

Hali ya sasa: **PARTIALLY IMPLEMENTED**. Mpaka unaojulikana: Predictions are decision support, not guarantees. Sparse or stale data, configuration, and model availability constrain their reliability. Maboresho yanayofuata ni CRUD ya authenticated yenye data iliyodhibitiwa, tests za role/workflow, provider readiness au decomposition salama kulingana na hitaji.

### Mwongozo wa Uendeshaji

**1. Hakikisha context:** Hakikisha profile iliyothibitishwa, company/workspace na role kabla ya kufungua Uchambuzi wa Utabiri. Usinakili company identifier kutoka screen au URL isiyoaminika.
**2. Andaa record:** Kusanya taarifa muhimu za biashara, tumia tarehe/kiasi kwa format inayokubalika na hakikisha reference ya mteja, item, unit, mfanyakazi au account ni ya kampuni hiyo.
**3. Ingiza na thibitisha:** Ingiza record kupitia screen inayoungwa mkono. Schema na business rules za server zikatae input mbovu; usivunje validation kwa browser storage au request iliyofichwa.
**4. Thibitisha matokeo:** Subiri response ya server/database. ID, status au row iliyothibitishwa ndiyo signal ya kumaliza. Response ikiwa haipo, acha action ikiwa pending au failed.
**5. Kagua ushahidi unaofuata:** Kagua record inayohusiana, ripoti, audit, notification au reconciliation. Mtiririko unaotarajiwa ni Select evidence set → compute signal → present confidence/limitation → inspect source metrics → decide manually.
**6. Escalate exceptions:** Andika error kamili, muda, kampuni, role na hatua salama za kurudia. Tenganisha tatizo la configuration/provider na defect ya application. Mpaka unaojulikana: Predictions are decision support, not guarantees. Sparse or stale data, configuration, and model availability constrain their reliability.

### Jedwali la Ushahidi wa Udhibiti

| Hatua ya udhibiti | Ushahidi unaotarajiwa | Swali la review |
| --- | --- | --- |
| Utambulisho | Profile na company iliyothibitishwa | Nani anafanya action? |
| Input | Fields na references sahihi | Data inakubalika? |
| Persistence | ID, status au RPC result | Imehifadhiwa kweli? |
| Control | Approval, reconciliation au audit | Nani amekagua? |
| Integration | Readiness na delivery outcome | Provider amethibitisha nini? |

### Exception na Recovery

Ikiwa Uchambuzi wa Utabiri ina hali ya unavailable, failed, pending au rejected, hifadhi hali na input, nakili response, hakikisha company na role, kisha tumia server/database path inayoungwa mkono. Usibadilishe local optimistic state kuwa madai ya completion.

---

# APPENDICES

## Appendix A — Role and permission matrix

| Role | Dashboard | Primary modules | Boundary |
| --- | --- | --- | --- |
| Super Administrator | Platform control plane; not ordinary tenant access | Global admin; security; health; audit | Explicit platform-admin boundary |
| Organization Owner | Company-wide visibility and approvals | All configured company modules | Company scope plus sensitive settings |
| CEO / COO / CFO | Executive and financial review | Reports, finance, sales, operational modules by assignment | Manager checks and company scope |
| Finance Manager / Accountant | Finance, billing, reconciliation | Finance, sales billing, subscriptions, tax evidence | Billing-manager roles and RLS |
| HR Manager / Manager | Workforce and approvals | HR, employee portal, leave, payroll as assigned | Role-aware HR operations |
| Sales Manager / Sales User | Commercial pipeline and sales | CRM, sales, POS as assigned | Tenant scope and confirmed writes |
| Warehouse Manager / Procurement Officer | Stock and supply chain | Inventory, procurement, fleet as assigned | Movement, approval, and company scope |
| Specialist operator | Assigned industry workflow | Healthcare, school, pharmacy, property, hospitality, banking, or MFI | Verified profile, role, and module entitlement |
| Member / Employee | Self-service and assigned tasks | Permitted records only | RLS and server permission checks |

## Appendix B — Master feature status matrix

| Module | UI evidence | Server/API evidence | Status | Database prefix |
| --- | --- | --- | --- | --- |
| Public Brand and Marketing Entry | client/src/pages/Home.tsx | server/_core/apiApp.ts | IMPLEMENTED | companies |
| Authentication and Secure Onboarding | client/src/components/PublicAuthGateway.jsx; client/src/App.tsx | server/_core/apiApp.ts; server/_core/oauth.ts; server/authHeaders.ts | IMPLEMENTED | companies, company_memberships, profiles |
| Master Application Shell and Navigation | client/src/App.tsx; client/src/BusinessSphereDashboard.jsx | server/routers.ts; server/_core/apiApp.ts | IMPLEMENTED | company_modules, workspaces |
| Profile Identity Center | client/src/components/ProfileIdentityCenter.jsx | server/profileIdentity.ts; server/routers.ts | IMPLEMENTED | profiles, user_table_preferences |
| Executive Dashboard | client/src/components/ExecutiveCommandCenter.jsx; client/src/BusinessSphereDashboard.jsx | server/dashboardReports.ts; server/routers.ts | IMPLEMENTED | custom_kpis, financial_benchmarks, scheduled_reports |
| CRM and Customer Pipeline | client/src/components/CommercialCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx | server/routers.ts; server/salesInteractions.ts | TESTING | crm_contacts, crm_interactions, crm_leads, customer_feedback |
| Sales and Billing | client/src/components/SalesDetailWorkspace.jsx; client/src/components/CommercialCommandCenters.jsx | server/routers.ts; server/subscriptionBilling.ts | TESTING | ecommerce_orders, ecommerce_products, sales_invoice_items, sales_invoices, sales_order_items, sales_order_return_items, sales_order_returns, sales_orders |
| Point of Sale | client/src/components/OperationsCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx | server/posWorkforceRpcAdapters.ts; server/posTransactionEngine.ts | PASSED | pos_cash_movements, pos_discount_rules, pos_loyalty_ledger, pos_loyalty_members, pos_loyalty_programs, pos_loyalty_redemptions, pos_loyalty_rewards, pos_promotion_items |
| Inventory and Warehouse Management | client/src/components/OperationsCommandCenters.jsx | server/supabasePersistence.ts; server/routers.ts | TESTING | inventory_batches, inventory_items, inventory_stock_movements, inventory_suppliers, inventory_transfers, inventory_warehouses, stock_audit_items, stock_audits |
| Procurement and Vendor Management | client/src/components/OperationsCommandCenters.jsx | server/routers.ts; server/procurementPersistence.ts | TESTING | procurement_contracts, procurement_purchase_orders, purchase_order_items |
| Finance and Accounting | client/src/components/FinanceCommandCenters.jsx | server/financeCommandCenters.ts; server/financePersistence.ts | TESTING | expense_budgets, fin_accounts, fin_approval_requests, fin_idempotency_keys, fin_journal_batches, fin_journal_lines, fin_periods, fin_posting_links |
| Reports and Scheduled Reporting | client/src/components/FinanceCommandCenters.jsx; client/src/BusinessSphereDashboard.jsx | server/dashboardReports.ts; server/reportSchedules.ts | TESTING | scheduled_reports |
| Human Resources and Payroll | client/src/components/PeopleCommandCenters.jsx; client/src/components/EmployeePortalWorkspace.jsx | server/teamWorkforce.ts; server/tanzaniaPayroll.ts; server/routers.ts | TESTING | hr_announcement_reads, hr_announcements, hr_approval_requests, hr_approval_steps, hr_attendance, hr_benefit_enrollments, hr_benefit_plans, hr_benefits |
| Manufacturing and Work Orders | client/src/BusinessSphereDashboard.jsx; client/src/components/OperationsCommandCenters.jsx | server/manufacturingPersistence.ts | PARTIALLY IMPLEMENTED | manufacturing_bom_components, manufacturing_boms, manufacturing_machines, manufacturing_maintenance, manufacturing_qc_inspections, manufacturing_work_orders |
| Supply Chain and Fleet | client/src/components/OperationsCommandCenters.jsx; client/src/components/FleetWorkspace.jsx | server/fleetManagement.ts | TESTING | fleet_alerts, fleet_audit_events, fleet_driver_assignments, fleet_drivers, fleet_fuel_cards, fleet_fuel_transactions, fleet_incidents, fleet_maintenance_jobs |
| Marketing Campaigns | client/src/components/CommercialCommandCenters.jsx | server/routers.ts; server/emailTemplateWorkflow.ts | TESTING | crm_contacts, crm_interactions, crm_leads, emails, marketing_campaigns |
| E-Commerce Storefront | client/src/components/CommercialCommandCenters.jsx | server/routers.ts | PARTIALLY IMPLEMENTED | ecommerce_orders, ecommerce_products |
| Documents and Secure Files | client/src/components/PeopleCommandCenters.jsx; client/src/components/ProfileIdentityCenter.jsx | server/storage.ts; server/documentDownloadBoundaries.ts | TESTING | approval_signatures, digital_signatures, documents, signatures |
| Projects and Task Management | client/src/components/PeopleCommandCenters.jsx | server/routers.ts; server/projectsPersistence.ts | PARTIALLY IMPLEMENTED | project_expenses, project_milestones, project_tasks, projects |
| Customer Support and Helpdesk | client/src/components/IntelligenceCommandCenters.jsx; client/src/components/PeopleCommandCenters.jsx | server/supportOperations.ts; server/supportMetrics.ts | TESTING | support_agents, support_call_log, support_chat_conversations, support_chat_messages, support_message_templates, support_sla_policies, support_team_members, support_teams |
| Enterprise Analytics and BI | client/src/components/IntelligenceCommandCenters.jsx; client/src/components/PredictiveAnalyticsWorkspace.jsx | server/dashboardReports.ts; server/marketIntelligence.ts | PARTIALLY IMPLEMENTED | competitors, custom_kpis, financial_benchmarks |
| Notifications and Alerting | client/src/BusinessSphereDashboard.jsx; module workspaces | server/notificationHistory.ts; server/transactionalEmail.ts | TESTING | emails, notification_channels, notification_log, notification_rules, sms_group_members, sms_groups, sms_templates |
| Activity Stream and Audit Evidence | client/src/components/ComplianceAuditLogView.tsx; dashboard views | server/auditLogs.ts; server/tenantAuditViewer.ts | TESTING | audit_log, audit_log_entries, bank_audit_events, billing_plan_audit_log, community_group_audit_log, hospitality_audit_log |
| Integration Hub | client/src/components/FinanceCommandCenters.jsx; client/src/components/PeopleCommandCenters.jsx | server/webhooks.ts; server/transactionalEmail.ts; server/integration connections | CONFIGURATION REQUIRED | integration_connections, notification_channels |
| Workflow Studio and Marketplace | client/src/components/PeopleCommandCenters.jsx; dashboard registry | server/workflows.ts; server/aiApprovals.ts | PARTIALLY IMPLEMENTED | workflow_marketplace_templates, workflows |
| Collaboration Hub | client/src/components/PeopleCommandCenters.jsx | server/collaborationEmailLinkCheck.ts; server/collaborationPersistence.ts | PARTIALLY IMPLEMENTED | calendar_events, collab_channels, collab_messages, emails |
| TRA, VFD, and Tanzania Fiscalization | client/src/components/TraPortalModule.jsx | server/traFiscalRouter.ts; server/traFiscal.ts; server/traZReportArchive.ts | CONFIGURATION REQUIRED | shared |
| AI Assistant and Smart Intelligence | client/src/components/AIChatBox.tsx; client/src/components/IntelligenceCommandCenters.jsx | server/smartAssistant.ts; server/aiApprovals.ts | EXTERNAL SERVICE REQUIRED | custom_kpis |
| WhatsApp Web Integration | client/src/BusinessSphereDashboard.jsx; messaging surfaces | server/whatsappProvider.ts; server/whatsAppSecurity.ts | CONFIGURATION REQUIRED | whatsapp_account_links, whatsapp_accounts, whatsapp_contacts, whatsapp_conversations, whatsapp_message_events, whatsapp_messages |
| Microfinance | client/src/components/MicrofinanceWorkspace.jsx; client/src/components/MicrofinanceGovernanceDialogs.jsx | server/microfinanceOperations.ts | TESTING | mfi_audit_logs, mfi_cash_sessions, mfi_cash_transactions, mfi_clients, mfi_collateral, mfi_collections, mfi_credit_scorecards, mfi_credit_scoring_settings |
| Money Agent | client/src/components/MoneyAgentWorkspace.jsx; client/src/components/SectorCommandCenters.jsx | server/moneyAgentOperations.ts | IMPLEMENTED | money_agent_agents, money_agent_alerts, money_agent_approvals, money_agent_audit_events, money_agent_branches, money_agent_commission_rules, money_agent_customers, money_agent_daily_summaries |
| VICOBA, SACCOS, and Community Groups | client/src/components/SectorCommandCenters.jsx; community group surfaces | server/communityGroups.ts; server/routers.ts | TESTING | community_contributions, community_group_announcements, community_group_approvals, community_group_assets, community_group_attendance, community_group_audit_log, community_group_budgets, community_group_committee_members |
| Healthcare and Clinic | client/src/components/HealthcareClinicWorkspace.jsx | server/healthcareOperations.ts; server/healthcareInteroperability.ts; server/healthcareReminders.ts | PARTIALLY IMPLEMENTED | hc_appointments, hc_doctors, hc_insurance_claims, hc_invoices, hc_lab_orders, hc_notifications, hc_patients, hc_portal_reference_approvals |
| School Management | client/src/components/SchoolWorkspace.jsx | server/schoolOperations.ts | PASSED | sch_academic_years, sch_admissions, sch_announcements, sch_approval_requests, sch_assessment_scores, sch_assessments, sch_assignment_submissions, sch_assignments |
| Pharmacy Management | client/src/components/PharmacyWorkspace.jsx | server/pharmacyOperations.ts | TESTING | phm_audit_logs, phm_batches, phm_brands, phm_categories, phm_controlled_medicine_register, phm_dispense, phm_dispense_items, phm_drugs |
| Hotel and Hospitality | client/src/components/HospitalityWorkspace.jsx; client/src/components/VerticalCommandCenters.jsx | server/hospitalityOperations.ts | TESTING | hospitality_amenities, hospitality_audit_log, hospitality_complaints, hospitality_event_venues, hospitality_events, hospitality_finance_reconciliations, hospitality_folio_lines, hospitality_folios |
| Restaurant and Food & Beverage | client/src/components/RestaurantWorkspace.jsx; client/src/components/RestaurantTanzaniaFiscalPanel.jsx | server/restaurantManagement.ts; server/traFiscal.ts | TESTING | restaurant_alerts, restaurant_audit_events, restaurant_bill_splits, restaurant_combo_items, restaurant_customers, restaurant_dining_areas, restaurant_fiscal_profiles, restaurant_fiscal_receipts |
| Banking and MFI | client/src/components/BankMfiWorkspace.jsx; client/src/components/SectorCommandCenters.jsx | server/bankMfiOperations.ts | TESTING | bank_account_beneficiaries, bank_account_types, bank_accounts, bank_agents, bank_aml_alerts, bank_audit_events, bank_beneficial_owners, bank_branches |
| Employee Portal | client/src/components/EmployeePortalWorkspace.jsx | server/teamWorkforce.ts; server/employeePortal.ts | IMPLEMENTED | hr_announcement_reads, hr_announcements, hr_approval_requests, hr_approval_steps, hr_attendance, hr_benefit_enrollments, hr_benefit_plans, hr_benefits |
| Property Management | client/src/components/PropertyManagementWorkspace.jsx | server/propertyManagementOperations.ts; server/propertyManagement.ts | IMPLEMENTED | property_agents, property_applications, property_approvals, property_audit_log, property_budgets, property_buildings, property_contractors, property_documents |
| Subscription and Billing | client/src/components/SubscriptionBillingWorkspace.jsx; client/src/lib/subscriptionAccess.js | server/subscriptionBilling.ts | IMPLEMENTED | billing_plan_audit_log, billing_plans, billing_profiles, subscription_events, subscription_invoices, subscription_notifications, subscription_payments, subscription_usage |
| Global Admin Control Center | client/src/components/GlobalAdminControlCenter.tsx | server/globalAdmin.ts; server/routers.ts | IMPLEMENTED | billing_plan_audit_log, companies, platform_admin_actions, profiles |
| Enterprise Settings and Security Control Center | client/src/components/DashboardPreferencesDrawer.jsx; client/src/components/ProfileIdentityCenter.jsx | server/workspaceSettings.ts; server/workspaceBranding.ts; server/roleChangeApprovals.ts | IMPLEMENTED | branches, company_modules, company_profile_settings, departments, user_table_preferences |
| Predictive Analytics | client/src/components/PredictiveAnalyticsWorkspace.jsx | server/marketIntelligence.ts; server/smartAssistant.ts | PARTIALLY IMPLEMENTED | competitors, custom_kpis, financial_benchmarks |

## Appendix C — Glossary

| Term | English definition | Kiswahili |
| --- | --- | --- |
| RLS | Row Level Security; database policy enforcement over which rows a role can read or change. | Usalama wa kiwango cha mstari; sera za database zinazoamua rows ambazo role inaweza kusoma au kubadilisha. |
| Company scope | The organization boundary used to separate tenant operations. | Mpaka wa kampuni unaotenganisha shughuli za tenant. |
| Entitlement | A server/database-confirmed permission to use a package or module. | Ruhusa iliyothibitishwa na server/database ya kutumia package au module. |
| Idempotency | Repeating a request with the same key does not create a duplicate operation. | Kurudia request yenye key ileile hakutengenezi operation ya pili. |
| SECURITY DEFINER | A database function that runs with owner privileges and therefore requires narrow grants and safe search_path. | Function ya database inayotumia mamlaka ya owner; inahitaji grants finyu na search_path salama. |
| FREE_15 | The free subscription package at TZS 0 for 15 days, with no automatic charge. | Kifurushi cha bure cha TZS 0 kwa siku 15 bila automatic charge. |
| Calendar month | A billing period calculated with calendar-month arithmetic rather than a fixed number of days. | Kipindi kinachohesabiwa kwa miezi ya kalenda, si idadi ya siku isiyobadilika. |
| Fail closed | Deny access or mutation when verification is missing rather than guessing success. | Kukataa access au mutation pale uthibitisho haupo badala ya kukisia mafanikio. |

## Appendix D — Verification record

Repository version: `1.0.0` from `package.json`. Documentation date: 24 August 2026. Live Supabase project audit: read-only. Live table count: 542; public: 519; auth: 23; RLS enabled: 535; RLS not enabled: 7; migration records: 133. Security advisor lints: 119; performance advisor lints: 851.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/App.tsx "Application routes and providers"
[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/BusinessSphereDashboard.jsx "Authenticated dashboard and module composition"
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/_core/apiApp.ts "Express API bootstrap and HTTP routes"
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/subscriptionBilling.ts "Subscription and HarakaPay server handlers"
[5]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/propertyManagementOperations.ts "Property Management validation and RPC boundary"
[6]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/smartAssistant.ts "AI assistant prompt, limits, and structured proposal contract"
[7]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/traFiscalRouter.ts "TRA/VFD fiscal router"
[8]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/FULL_SYSTEM_AUDIT_REPORT.md "Full-system audit and known blockers"
[9]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/FULL_SYSTEM_IMPLEMENTATION_MATRIX.md "Feature implementation matrix"
[10]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/package.json "Runtime and build scripts"
[11]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"

## Documentation QA statement
The book was generated from repository files and read-only live evidence. It does not expose production credentials, does not fabricate screenshots, does not create a duplicate auth/users architecture, and explicitly records known limitations and external prerequisites. The render and QA reports are retained beside the deliverables.
