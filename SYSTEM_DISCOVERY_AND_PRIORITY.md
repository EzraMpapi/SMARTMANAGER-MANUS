# Smart Manager ERP — System Discovery and First-Area Priority

## Discovery basis

This record implements the discovery stage of the attached enterprise-transformation directive. It is based on the active application source, service layer, test suite, Supabase migrations, authenticated workspace behavior, and read-only live policy inspection. No operational record, RLS policy, credential, or external provider configuration was changed during this stage.

## Architecture snapshot

| Dimension | Verified implementation | Discovery implication |
| --- | --- | --- |
| Client application | React 19 application with a single `BusinessSphereDashboard.jsx` surface of approximately 3.1 MB and 48,000+ lines, plus focused components for authentication, layout, preferences, analytics, and chat. | The dominant maintainability and performance risk is the oversized dashboard boundary; upgrades must be incremental and regression-tested. |
| Server boundary | Express, tRPC, Zod validation, and focused services for settings, support, invitations, audit records, reports, AI approvals, passkeys, and integrations. | Sensitive workflows can use verified server identity rather than browser-provided tenant claims. |
| Live data | Authenticated Supabase REST access through a shared client wrapper, generic-table normalization, retry handling, confirmed-response mutation helpers, and per-table query hooks. | Live mode starts from confirmed rows rather than seed data and keeps prior confirmed rows visible during refresh failures. |
| Multi-tenancy | Verified profile resolution links authenticated identity to a workspace; tenant-owned data policies are anchored to `current_company_id()`. | Client-supplied workspace identifiers are not accepted as authorization proof for the server-backed sensitive workflows reviewed. |
| Data protection | Read-only policy inventory found tenant predicates on the discovered business tables. Support configuration policies currently target the `public` role but still enforce `company_id = current_company_id()`. | The predicate prevents an unaffiliated caller from matching a tenant row, but role targeting should be normalized to `authenticated` as part of the related area’s defense-in-depth review. |
| Quality gates | Current suite: 84 passing files and 285 passing tests, with 5 intentionally gated files and 8 skips. | Every change to shared boundaries must retain this baseline or improve it. |

## Functional-area inventory

The active application contains a general business core, operational workflows, service and collaboration capabilities, reporting and configuration surfaces, industry-specific extensions, authentication/onboarding flows, and customer, supplier, and employee portals. The canonical in-app navigation, industry module configuration, server services, migrations, and table policies agree that these are implemented functional areas rather than merely marketing links.

The system also includes verified shared patterns for authenticated data loading, role-aware actions, row-level tenant isolation, pending offline synchronization for point-of-sale transactions, browser-safe local device preferences, audit-related services, server-backed workspace settings, managed invitations, and read-only/approval-gated AI assistance.

## Priority decision

The first full upgrade area is the **customer-support workspace**. This is selected by evidence rather than by visual preference:

| Priority factor | Evidence | Result |
| --- | --- | --- |
| Business impact | The area manages customer tickets, internal notes, service-level policy, workflow configuration, chat, knowledge resources, calls, and review-only AI drafts. | High |
| Architecture | It crosses the large dashboard UI, dedicated tRPC service, verified-role handling, Supabase REST with session-bound tokens, automation policy, and AI review boundaries. | High |
| Data integrity | New tickets and status changes already await server confirmation in connected mode. | Strong foundation; must be preserved. |
| Security | Configuration writes use verified roles, and live row policies are tenant-scoped. Role target consistency requires focused review. | High sensitivity |
| Confirmed UX/data defect | The overview contains a hard-coded `Avg Handle Time: 8 min` card while claiming it is derived from the call log. | Must be replaced with a truthful confirmed-data or unavailable state. |
| Completion scope | The area has focused services and tests, allowing a bounded, testable upgrade rather than a risky global redesign. | Appropriate first upgrade |

## First-area workflow model

The verified primary workflow is: open the workspace, review confirmed tickets, search/select a ticket, create or update a ticket or add an internal note, submit through a protected server procedure, receive confirmed feedback, refresh the server-backed view, and then proceed to a permitted next action. Configuration workflows follow the same verified profile and tenant boundary, with configuration roles required before a policy can be saved.

## Baseline rules for the next implementation stage

The first-area upgrade will retain server confirmation before success feedback, preserve draft input on safe errors, remove unconfirmed operational metrics, use current workspace locale and timezone context, keep tenant and role enforcement server-side, expose intentional loading/empty/error states, use keyboard-accessible controls, and add focused tests before changing another area. No fake ticket, call, or customer data will be introduced.

## Deferred environment-dependent items

Physical mobile and printer certification, provider-credential-dependent inbound messaging, and the user-directed Resend work remain outside this upgrade and unchanged. Their existing checklist entries remain separate from this discovery decision.
