# Customer Support & Workflows Architecture Assessment

## Current implementation evidence

Smart Manager already has the beginnings of a support surface in `BusinessSphereDashboard.jsx`: ticket, live-chat, knowledge-base, call-log, AI-assistant, and WhatsApp-center views. The production Supabase database already contains tenant-scoped `support_tickets`, `support_ticket_messages`, `support_chat_conversations`, `support_chat_messages`, `support_call_log`, `kb_articles`, `workflows`, `whatsapp_accounts`, `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, and `whatsapp_message_events` tables. Every inspected table has RLS enabled.

| Area | Verified state | Required action |
| --- | --- | --- |
| Support tickets | Existing tables and tenant RLS exist, but the active client writes ticket state directly and does not yet provide an enterprise support service boundary. | Reuse the tables, add only necessary structured fields/relations, and move critical actions behind verified server procedures. |
| Live chat | Existing conversation/message tables use generic data-shape columns and tenant RLS. | Normalize a shared support-conversation contract without creating a second customer or tenant model. |
| Knowledge base | `kb_articles` exists with a tenant policy. | Extend its metadata only if a supported internal/external visibility need is verified. |
| WhatsApp external handoff | Existing center opens a user-controlled `wa.me` link and records it as `via-link`; no browser provider secret is retained. | Preserve this truthful fallback. Never label it provider delivery. |
| WhatsApp provider data | Accounts, contacts, conversations, messages, and idempotency-event tables already exist and are tenant-scoped. | Build a server-only provider adapter around these tables rather than duplicating a message model. |
| Workflows | `workflows` exists and is tenant-scoped, but is not a support-specific event engine. | Add structured support trigger/action metadata only after the support core contract is stable. |
| Email support | Transactional email is deliberately disabled. | Do not represent email as an active support channel until an approved sender is configured. |

## Security and provider posture

The support and WhatsApp tables use `current_company_id()`-based tenant RLS. Their application-facing policies must remain in place; new support tables will adopt the same tenant predicate and never trust a browser-supplied company identifier. The current project has no Bird, MessageBird, or WhatsApp connector configuration. This is an expected precondition: provider credentials and webhook secrets must be supplied through secure server configuration before outbound delivery or inbound webhook activation.

Bird documents signed webhook subscriptions for inbound and outbound message events and documents a programmable WhatsApp API for outbound messages. The implementation will use an event-handler pattern, signature verification over the raw request body, idempotency keys, and a provider-status state machine rather than client polling or browser-held credentials. Bird specifies a five-minute delivery-timestamp freshness window and at-least-once webhook delivery, with retries/replays retaining the same `webhook-id`; the future handler will reject stale events and deduplicate that identifier before writing any support record. [1] [2]

## Controlled implementation sequence

The first implementation cycle will reuse the existing support/WhatsApp tables and build server-confirmed ticket, conversation, note, assignment, and activity contracts. It will preserve existing customer records and map support records to a customer only through authorized tenant lookups. The Bird adapter will initially expose a disabled, provider-ready boundary and truthful statuses (`draft`, `queued`, `sending`, `accepted`, `delivered`, `read`, `failed`, and `via-link`). A Bird `202` response supports only `accepted`; `sent`, `delivered`, and `read` must wait for a signed status event. It will not fabricate an accepted, delivered, or read result.

Inbound webhooks will stay inactive until the organization supplies Bird credentials, a registered callback URL, and the applicable signature-validation configuration. When activated, provider event IDs and payload hashes will enforce idempotency before a message, ticket, workflow, or audit action is created.

## Data contract v1

The existing support and WhatsApp tables will remain authoritative. The support core will add only the missing structured collaboration records rather than introduce a second ticket, customer, or conversation system.

| Entity | Decision | Rationale |
| --- | --- | --- |
| `support_tickets` | Reuse and add structured optional metadata only where required. | It already holds company, subject, category, priority, status, assignee, ticket number, and timestamps. |
| `support_ticket_messages` | Reuse for ticket-linked agent/customer messages. | It is already tenant-scoped and should gain message-kind/channel/provider metadata instead of being replaced. |
| `support_chat_conversations` / `support_chat_messages` | Reuse as the web-chat conversation substrate. | Existing company-scoped conversation history should not be duplicated. |
| `whatsapp_accounts`, `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_message_events` | Reuse as the provider-channel data model. | These tables already model company, E.164 contacts, conversation, provider message identifiers, request identifiers, delivery events, and idempotency payload hashes. |
| `kb_articles` | Reuse. | It provides an existing tenant-scoped knowledge repository. |
| `workflows` | Reuse as the compatibility layer; add support-specific trigger/action schema only after server enforcement is implemented. | Avoid a parallel automation model. |
| `support_teams`, `support_team_members`, `support_ticket_notes`, `support_ticket_activity`, `support_sla_policies`, `support_message_templates` | Additive new tables. | No equivalent production table exists, and each represents a distinct normalized enterprise-support capability. |

All support records will carry a non-null `company_id`, enable RLS, and use `company_id = current_company_id()` for read/write policies. Server procedures will resolve the authenticated profile from the forwarded Supabase token, derive `company_id` from that profile, and never accept a company identifier as authorization input. Notes will have an explicit `internal` kind and will never be included in outbound provider payloads. Templates are configuration records, not code constants; provider approval state remains server-confirmed.

## Authorization and retention safeguards

| Boundary | Enforcement rule |
| --- | --- |
| Authentication | Every support mutation and read resolves the current Supabase user and profile from the forwarded bearer token. Missing/invalid sessions are rejected before any lookup. |
| Tenant | Procedures derive `company_id` from the verified profile. A caller cannot choose a company through a request body, URL parameter, or provider payload. |
| Support role | Organization Owner, CEO, Super Administrator, System Administrator, Support Manager, and Support Agent roles can perform the support actions appropriate to their role. A server-side role matrix will gate configuration, assignment, status transition, note, and message actions. |
| Internal notes | Internal notes are stored with `kind = internal_note`; outbound provider and customer-message queries explicitly exclude them. |
| Audit history | Ticket creation, assignment, status/priority change, internal-note creation, provider send acceptance/failure, workflow action, and SLA escalation are appended only after the source operation returns a confirmed record. |
| Attachments | Attachment metadata must reference secure object storage rather than database bytes; accepted types, size, ownership, and tenant relation are checked before records are created. |
| Provider events | Inbound provider callbacks will use signature verification, bounded payload parsing, a provider event ID, and payload hash before any tenant/customer/conversation action. Unmatched tenants/events are rejected or quarantined, never routed by a caller-provided company ID. |
| Retention and privacy | Raw provider payloads are not persisted by default. Only normalized fields needed for support history, traceability, and idempotency are stored. Message body access remains tenant- and permission-scoped. |

These rules preserve existing Supabase RLS and add a server verification layer for sensitive support actions. The provider adapter cannot be activated until the organization supplies the Bird credentials, webhook signing configuration, and an approved channel.

## Implemented support-core contract

The `support` tRPC boundary now resolves the verified Supabase profile for every ticket read or mutation, derives the workspace from that profile, and applies a server-side support-role matrix. It exposes confirmed ticket listing, creation, update, internal-note creation, and ticket timeline procedures. The browser cannot select a company ID for these operations.

Ticket creation writes the tenant record first, then records a support activity record. Updates, assignment/due-state changes, and internal notes likewise return only after their primary database write and subsequent activity record have been confirmed. Internal notes have a dedicated record type and are intentionally excluded from provider message models. Focused tests prove derived tenant ownership, support-role rejection, and internal-note separation; TypeScript validation passes.

## Implemented responsive support inbox boundary

The active configured-workspace ticket view now reads through `support.listTickets` and performs create, status update, and internal-note operations through the verified support tRPC boundary. A ticket form remains open if the server rejects its submission, and the ticket list is invalidated only after a confirmed response. Configured workspaces no longer use the legacy direct browser ticket/message insert path.

The ticket drawer now distinguishes customer messages from amber internal notes. Its only writable control is **Add internal note**, with explicit copy that the note stays within the support team and is never sent to the customer. Ticket deletion is intentionally unavailable in configured workspaces so history is retained; operators can close a ticket through the confirmed status path. Focused client/service regression coverage and TypeScript validation pass.

## Implemented Bird provider readiness boundary

`server/whatsappProvider.ts` is a server-only provider contract. It exposes sanitized readiness metadata to verified support roles, but never returns the API key, webhook secret, workspace identifier, or channel identifier. It requires all four server environment values and a separate explicit `BIRD_WHATSAPP_DELIVERY_ENABLED=true` switch before any future outbound transport can run. In the current deployment, automated provider delivery is disabled.

The contract also prevents unsupported outbound status jumps. A provider request may advance from `sending` to `accepted` only after Bird accepts it; later `sent`, `delivered`, and `read` states require the relevant signed provider event. The existing `via-link` state remains a distinct terminal state for a user-controlled WhatsApp Web handoff, not a claim of provider delivery. The WhatsApp center displays only the server-sanitized availability message and continues to operate through the truthful external-client handoff.

## Approved workflow and SLA configuration contract

The existing tenant-scoped `workflows` table remains the single workflow configuration store. Support configuration will use a bounded namespace in its existing fields: `trigger_type` may be only `support.ticket.created` or `support.ticket.updated`; `condition` and `steps` are serialized bounded JSON documents; and the only allowed support action definitions are **add an internal note**, **set a ticket priority**, and **assign a support team**. A support workflow record is configuration, not a background worker, and no configured workflow will execute automatically while no verified server-side runner exists. The service will therefore never claim an action has run, sent a notification, modified a ticket, or escalated a case solely because a configuration record is enabled.

Only the verified support-configuration role matrix may create, revise, or enable support workflow records. Each confirmed workflow configuration change is recorded in the tenant audit trail only after the workflow table mutation succeeds. The browser does not submit a company identifier, arbitrary action type, arbitrary destination, or executable script.

`support_sla_policies` remains the sole SLA policy store. A policy binds one supported ticket priority to a positive first-response deadline, a positive resolution deadline, an optional non-negative warning lead time, and an active state. Verified support-configuration roles may manage it; support agents may read it but cannot alter it. Policy changes are audited after confirmation. SLA configuration alone does not create a breach, escalation, delivery, or customer notification event; those require an observed ticket event and a separately implemented evaluation/notification path.

## References

[1]: [Bird Webhooks & Events](https://bird.com/en-us/docs/guides/webhooks)

[2]: [Bird Programmable WhatsApp — Sending WhatsApp Messages](https://docs.bird.com/api/channels-api/supported-channels/programmable-whatsapp/sending-whatsapp-messages)
