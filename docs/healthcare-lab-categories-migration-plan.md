# Healthcare Laboratory Categories Migration Plan

**Status:** Proposed plan only; no migration has been applied.
**Author:** Manus AI
**Candidate objects:** `public.hc_lab_categories` and `public.hc_lab_category_events`
**Proposed migration family:** `20260825_018_healthcare_lab_categories_*`

## Executive decision

The Healthcare Laboratory schema draft is technically viable, but it is not yet safe to apply as live DDL. The draft itself records that it is a design document and that the product owner must first decide whether **New Category** belongs to Healthcare Laboratory or the existing Pharmacy catalog. It also requires confirmation of the approved Healthcare configuration permission and audit path. The live table inventory confirms that both proposed tables are currently absent, so this is a genuine future schema addition rather than a missing application of an existing migration.

The recommended implementation is a dedicated, tenant-scoped Laboratory Category resource with a separate append-only lifecycle-event table. Category writes should go through server-owned RPCs and a dedicated tRPC adapter rather than the current generic Healthcare CRUD path. The UI should remain disabled or feature-flagged until the product and authorization decisions below are recorded.

## Current-state findings

| Area | Finding | Consequence |
|---|---|---|
| Live database | `hc_lab_categories` and `hc_lab_category_events` are absent from the live table inventory. | A new additive migration is required if the Healthcare decision is approved. |
| Existing Healthcare server | `healthcareOperations.ts` uses a generic table allow-list and direct tenant-filtered PostgREST CRUD. | Do not expose the new category tables through generic writes; add a specialized server contract. |
| Existing role model | Healthcare roles include `Laboratory Technician`, `Clinic Administrator`, organization-level administrators, and other clinical roles. | The exact configuration permission must be confirmed against the existing workforce permission system. |
| Existing Pharmacy category | `pharmacyOperations.ts` already owns `phm_categories` and exposes a Pharmacy-specific catalog permission. | If product ownership is Pharmacy, reuse `createPharmacyCategory`; create no Healthcare tables. |
| Audit design | The draft proposes category lifecycle events plus the shared audit channel. | Confirm the canonical Healthcare audit sink before implementation; do not create an unreviewed duplicate audit system. |
| Tenant boundary | Current Healthcare access derives the verified profile and company context. | Every table, index, policy, RPC, and test must bind to `company_id`. |

## Required decisions before migration

The migration must remain blocked until the following decisions are explicit and recorded in the issue or release checklist.

First, the product owner must choose **Healthcare Laboratory** versus **Pharmacy catalog** ownership. If the button is a Pharmacy catalog action, the correct change is a server-routed call to the existing Pharmacy category contract and no new tables. If it is a Laboratory configuration action, continue with this plan.

Second, the project owner must identify the existing workforce permission code or approved Healthcare role helper for laboratory-category configuration. The migration must not invent a new role table, trust a client-supplied role, or assume that every Laboratory Technician may administer category configuration. A least-privilege default is read access for authorized laboratory users and create/update/archive access only for an explicitly approved configuration capability plus existing organization administrators.

Third, confirm whether direct authenticated reads are permitted for the category tables. The recommended posture is tenant-scoped `SELECT` for authorized authenticated users and no direct authenticated `INSERT`, `UPDATE`, or `DELETE`; all writes should use authenticated RPCs with server-side authorization. If the project’s PostgREST privilege model differs, record the exception before applying grants.

Fourth, identify the canonical shared audit function or table used by Healthcare. The lifecycle event table is necessary for reconstructing category changes, but it does not replace the project-wide audit channel. Both writes must be atomic.

## Proposed migration sequence

### Phase A — Schema foundation

Create a reviewed forward-only migration, proposed as `20260825_018_healthcare_lab_categories_schema.sql`. It should create `public.hc_lab_categories` with the draft’s stable business key and operational fields: `id`, `company_id`, `code`, `name`, `description`, `specimen_requirements`, turnaround and requirement flags, `base_price`, `currency`, `status`, `sort_order`, compatibility `data`, idempotency metadata, optimistic-concurrency `version`, server-owned actor fields, and timestamps.

The migration should retain the draft’s bounded checks for code format, name and description length, specimen-array type, turnaround range, non-negative price, three-letter uppercase currency, supported status values, sort range, non-negative version, and archive consistency. Foreign keys should reference `public.companies(id)` with the project’s approved deletion behavior; `ON DELETE CASCADE` should be retained only if it matches the established Healthcare tenant-retention policy.

The required indexes are a tenant/code uniqueness index, a partial tenant/idempotency uniqueness index, a tenant/status/sort/name list index, and a tenant/updated-at index. Index names must be stable and migration-safe.

### Phase B — Immutable lifecycle evidence

Create `public.hc_lab_category_events` in the same or a separately reviewed migration. It should include `company_id`, `category_id`, event type, actor and timestamps, idempotency key, previous and next status, before and after snapshots, reason, and metadata. Add foreign keys and tenant-scoped indexes for category history, event time, and idempotency.

Add an immutable trigger for update and delete attempts. The trigger helper must use a fixed search path, must not be exposed as a client-callable function, and must have `EXECUTE` revoked from `PUBLIC`, `anon`, and `authenticated`. The trigger and event insert must be part of the same transaction as the category mutation.

### Phase C — Tenant and privilege posture

Enable RLS on both tables. Add only the approved authenticated tenant-read policy, using the project’s established company resolver. Do not permit a client-supplied `company_id` to widen access. Revoke direct client mutation privileges unless the approved Healthcare design explicitly requires them.

The migration must apply the final grants only after the workforce permission helper is confirmed. If RPCs are `SECURITY DEFINER`, each must use a pinned search path, derive the actor from `auth.uid()`, derive the company from the verified session, validate the authorization capability before any write, and avoid dynamic SQL. If the approved helper cannot be identified, stop before creating write RPCs.

### Phase D — Server-owned RPC contract

Implement the following functions only after the schema and permission decisions are approved:

| RPC | Responsibility | Required safeguards |
|---|---|---|
| `hc_list_lab_categories` | Bounded tenant-scoped list | Authenticated visibility check, current-company filter, bounded limit/offset, archived filter, deterministic ordering |
| `hc_get_lab_category` | Fetch one visible category | Current-company filter and non-disclosing not-found behavior |
| `hc_create_lab_category` | Create category and `CREATED` event | Strict payload allow-list, normalized code/currency, duplicate-code handling, company idempotency, server-owned actor and timestamps |
| `hc_update_lab_category` | Patch mutable metadata | Immutable code/company/status fields, optimistic `version` check, before/after event, stale-version error |
| `hc_set_lab_category_status` | Activate, suspend, or archive | Explicit transition matrix, required reason for suspension/archive, archive timestamp, lifecycle event, idempotency |
| `hc_archive_lab_category` | Optional convenience wrapper | Delegates to the status-transition implementation; no duplicated lifecycle rules |

All RPCs must return only confirmed database representations. Stable application error codes should be mapped by the tRPC adapter to safe client errors without leaking raw PostgreSQL or PostgREST messages.

### Phase E — Application integration

Add a dedicated `healthcareLabCategories.ts` server module rather than extending the generic record writer. It should follow the existing `resolveVerifiedProfile` pattern, pass the verified bearer token where required, validate with Zod, call the dedicated RPC, and return the confirmed row only after the RPC succeeds.

The generic `HEALTHCARE_TABLES` allow-list should not automatically grant generic create/update/archive access to the new category table. If a read-only list is needed by existing Healthcare screens, add it deliberately with a corresponding access contract and tenant-scoped query. Add a dedicated client panel for category configuration only after the backend tests pass.

## Test and verification gate

The migration cannot be promoted until the following tests pass against an isolated authenticated tenant and a disposable or controlled test environment.

| Test group | Required proof |
|---|---|
| Migration contract | Table names, columns, constraints, indexes, RLS, grants, fixed search paths, and immutable triggers match the approved migration. |
| Tenant isolation | Two companies cannot read, update, archive, or infer each other’s categories or events. |
| Role authorization | Approved configuration capability succeeds; Laboratory Technician, clinician, receptionist, and read-only roles are denied unless explicitly granted. |
| Input validation | Invalid codes, names, descriptions, specimen arrays, turnaround, price, currency, status, and unknown payload keys are rejected before mutation. |
| Idempotency | Repeated equivalent create/status requests return the original result; reused keys with different payloads fail safely. |
| Concurrency | Concurrent updates with the same expected version produce one success and stable stale-version errors for losers. |
| Atomicity | A failed lifecycle-event write rolls back the category mutation. |
| Lifecycle | Only `DRAFT → ACTIVE/ARCHIVED`, `ACTIVE → SUSPENDED/ARCHIVED`, and `SUSPENDED → ACTIVE/ARCHIVED` succeed; archived is terminal unless a later product decision changes it. |
| Privilege | Trigger helpers and table DML are not callable by `anon`; unauthorized authenticated callers cannot mutate data. |
| Regression | Existing Healthcare lab orders and Pharmacy category workflows remain unchanged. |
| UI confirmation | The UI updates local state only after the server returns the confirmed RPC result. |

## Rollout and rollback

Apply the migration through the Supabase connector as a reviewed, forward-only migration after the decisions and tests above are complete. Immediately verify table existence, RLS status, indexes, function signatures, grants, and security-advisor findings. Enable the UI behind a feature flag or server capability check, then run an authenticated tenant-isolation smoke test.

Rollback should be logical rather than destructive. Disable the UI capability and revoke the category write RPC grants if a defect is found. Preserve evidence rows and data for investigation. A later forward migration may repair constraints, policies, or functions; do not drop the tables or delete category history as an emergency rollback.

## Current recommendation

**Do not apply `hc_lab_categories` yet.** The missing tables are expected because the source is explicitly a design draft, not an approved migration. Record the ownership and permission decisions, confirm the audit path, produce the reviewed SQL migration and contract tests, and then apply the additive schema through the Supabase connector in a controlled staging or approved environment.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/NEW_CATEGORY_SCHEMA_RPC_DRAFT_20250825.md "Healthcare Laboratory category schema draft"

[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/healthcareOperations.ts "Existing Healthcare server access and persistence contract"

[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/pharmacyOperations.ts "Existing Pharmacy category workflow"

[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/healthcareRouter.integration.test.ts "Healthcare tenant and role integration contract tests"
