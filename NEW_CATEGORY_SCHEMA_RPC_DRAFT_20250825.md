# New Category Workflow: Database Schema and Server-Side RPC Contract

**Status:** Design draft for review. No migration or live database change is included in this document.

**Decision recorded:** The legacy `New Category` control reviewed in the repository is rendered in the **Healthcare Laboratory** section. This draft therefore defines a Healthcare laboratory-category resource named `hc_lab_categories`. The control must not write to the Pharmacy `phm_categories` table unless product ownership is explicitly changed. If the intended business meaning is Pharmacy catalog classification, the safer alternative is to reuse the existing Pharmacy category contract and create no new Healthcare table.

## 1. Design goals

The workflow must create a persistent laboratory category through a server-owned transaction. It must be tenant-scoped, role-authorized, idempotent, auditable, safe for Tanzania-ready TZS pricing, and compatible with the existing Healthcare generic-envelope architecture. A successful UI action must be confirmed by the server before the category is added to local state.

The database contract is intentionally limited to category configuration. It does not create a laboratory order, post a payment, change a patient record, or alter inventory. Those are separate workflows and must not be hidden inside the category RPC.

## 2. Lifecycle and ownership

| Concern | Contract |
|---|---|
| Owning domain | Healthcare Laboratory |
| Table | `public.hc_lab_categories` |
| Tenant key | `company_id`, always resolved or verified against `public.current_company_id()` |
| Create authority | Laboratory configuration role, Clinic Administrator, Organization Owner, CEO, or Super Administrator |
| Read authority | Authorized tenant healthcare users who can view laboratory configuration |
| Update authority | Same configuration authority as create |
| Archive authority | Same configuration authority as update; archival is a status transition, not a hard delete |
| Currency | `TZS` by default; stored explicitly on every category |
| Audit | Append-only `hc_lab_category_events` plus the project’s shared audit channel where available |
| Client write path | RPC/tRPC only; no generic client-side table insert or update |

The server adapter must use the verified profile and access token already used by `healthcareOperations.ts`. The RPC must independently enforce tenant ownership and payload invariants; UI role checks are convenience only and are not a security boundary.

## 3. Database schema

### 3.1 Laboratory categories

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.hc_lab_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Stable business key. Do not silently regenerate it during updates.
  code text NOT NULL,
  name text NOT NULL,
  description text,

  -- Laboratory operating metadata.
  specimen_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_turnaround_hours integer NOT NULL DEFAULT 24,
  requires_fasting boolean NOT NULL DEFAULT false,
  requires_referral boolean NOT NULL DEFAULT false,

  -- Optional service pricing, stored in minor-unit-safe numeric precision.
  base_price numeric(20,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',

  -- DRAFT is not selectable for new laboratory orders.
  status text NOT NULL DEFAULT 'DRAFT',
  sort_order integer NOT NULL DEFAULT 0,

  -- Compatibility and operational metadata.
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text,
  version bigint NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,

  CONSTRAINT hc_lab_categories_code_format
    CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  CONSTRAINT hc_lab_categories_name_length
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  CONSTRAINT hc_lab_categories_description_length
    CHECK (description IS NULL OR char_length(description) <= 4000),
  CONSTRAINT hc_lab_categories_specimen_array
    CHECK (jsonb_typeof(specimen_requirements) = 'array'),
  CONSTRAINT hc_lab_categories_turnaround_valid
    CHECK (default_turnaround_hours BETWEEN 1 AND 720),
  CONSTRAINT hc_lab_categories_base_price_valid
    CHECK (base_price >= 0 AND base_price <= 100000000000),
  CONSTRAINT hc_lab_categories_currency_valid
    CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT hc_lab_categories_status_valid
    CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  CONSTRAINT hc_lab_categories_sort_order_valid
    CHECK (sort_order BETWEEN -100000 AND 100000),
  CONSTRAINT hc_lab_categories_version_valid
    CHECK (version >= 0),
  CONSTRAINT hc_lab_categories_archive_consistency
    CHECK (
      (status = 'ARCHIVED' AND archived_at IS NOT NULL)
      OR (status <> 'ARCHIVED' AND archived_at IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS hc_lab_categories_company_code_key
  ON public.hc_lab_categories(company_id, code);

CREATE UNIQUE INDEX IF NOT EXISTS hc_lab_categories_company_idempotency_key
  ON public.hc_lab_categories(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS hc_lab_categories_company_status_sort
  ON public.hc_lab_categories(company_id, status, sort_order, name);

CREATE INDEX IF NOT EXISTS hc_lab_categories_company_updated
  ON public.hc_lab_categories(company_id, updated_at DESC);
```

`code` is a stable tenant-local identifier suitable for order templates and reports. The server should reject code changes after creation unless a controlled migration explicitly supports key renaming. Category names and operating metadata may be edited while the category is not archived.

### 3.2 Append-only lifecycle events

```sql
CREATE TABLE IF NOT EXISTS public.hc_lab_category_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL
    REFERENCES public.hc_lab_categories(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid DEFAULT auth.uid(),
  idempotency_key text,
  previous_status text,
  next_status text,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hc_lab_category_events_type_valid
    CHECK (event_type IN ('CREATED', 'UPDATED', 'ACTIVATED', 'SUSPENDED', 'ARCHIVED')),
  CONSTRAINT hc_lab_category_events_reason_length
    CHECK (reason IS NULL OR char_length(reason) <= 4000)
);

CREATE UNIQUE INDEX IF NOT EXISTS hc_lab_category_events_company_idempotency
  ON public.hc_lab_category_events(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS hc_lab_category_events_category_time
  ON public.hc_lab_category_events(company_id, category_id, event_at DESC);

CREATE INDEX IF NOT EXISTS hc_lab_category_events_company_time
  ON public.hc_lab_category_events(company_id, event_at DESC);
```

The lifecycle event table is not a substitute for a general audit log. It exists so that category changes remain reconstructable even if a shared audit channel changes. The event row and category mutation must be inserted in the same RPC transaction.

### 3.3 Updated-at and append-only protection

```sql
CREATE OR REPLACE FUNCTION public.hc_lab_categories_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hc_lab_categories_updated_at ON public.hc_lab_categories;
CREATE TRIGGER hc_lab_categories_updated_at
  BEFORE UPDATE ON public.hc_lab_categories
  FOR EACH ROW EXECUTE FUNCTION public.hc_lab_categories_set_updated_at();

CREATE OR REPLACE FUNCTION public.hc_lab_category_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'Healthcare laboratory category events are immutable.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS hc_lab_category_events_immutable_trigger ON public.hc_lab_category_events;
CREATE TRIGGER hc_lab_category_events_immutable_trigger
  BEFORE UPDATE OR DELETE ON public.hc_lab_category_events
  FOR EACH ROW EXECUTE FUNCTION public.hc_lab_category_events_immutable();

REVOKE ALL ON FUNCTION public.hc_lab_categories_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hc_lab_category_events_immutable() FROM PUBLIC, anon, authenticated;
```

The trigger functions are PostgreSQL trigger targets, not client RPCs. Their execute privileges must be revoked from API roles so Supabase security advisors do not report them as callable `SECURITY DEFINER` or exposed helper functions.

## 4. Row-level security posture

Both tables must have RLS enabled. Direct table writes from `anon` and `authenticated` should not be the primary mutation path. The RPCs perform the role check, tenant check, validation, mutation, event insertion, and response in one transaction.

```sql
ALTER TABLE public.hc_lab_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_lab_category_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_lab_categories_tenant_select
  ON public.hc_lab_categories FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY hc_lab_category_events_tenant_select
  ON public.hc_lab_category_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
```

No direct `INSERT`, `UPDATE`, or `DELETE` policy should be added for `authenticated` until the project’s approved Healthcare role helper is confirmed. If the RPC is implemented as `SECURITY DEFINER`, it must set `search_path = public, auth`, validate `auth.uid()`, resolve the current company, and check the verified membership role before any write. The RPC must never trust a client-supplied `company_id`, `created_by`, `actor_id`, or authorization field.

The owner must also ensure that API roles cannot directly mutate the category or event tables through PostgREST. If the project’s privilege model grants table DML by default, the migration should explicitly revoke client DML and grant only the minimum read access required by the existing Healthcare workspace.

## 5. RPC contract

### 5.1 Shared conventions

All write RPCs accept an `idempotencyKey` either in the JSON payload or as a dedicated parameter. The key is scoped to the current company and operation. A repeated request with the same key and equivalent payload returns the original result without a second category or event. Reuse of a key with a different payload returns `IDEMPOTENCY_KEY_REUSED`.

All write RPCs return a single category record plus the resulting event identifier. Errors must be raised with stable SQLSTATE/application error codes that the tRPC adapter maps to user-safe messages. Do not return raw PostgREST or PostgreSQL errors to the browser.

The RPC must resolve the actor and company from the authenticated request. The following request values are server-owned and must be ignored if supplied by the client: `companyId`, `createdBy`, `updatedBy`, `actorId`, `archivedBy`, `actorRole`, and all audit timestamps.

### 5.2 `hc_list_lab_categories`

```sql
public.hc_list_lab_categories(
  p_include_archived boolean DEFAULT false,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  code text,
  name text,
  description text,
  specimen_requirements jsonb,
  default_turnaround_hours integer,
  requires_fasting boolean,
  requires_referral boolean,
  base_price numeric,
  currency text,
  status text,
  sort_order integer,
  data jsonb,
  version bigint,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
)
```

The list RPC requires an authenticated tenant member with Healthcare laboratory configuration visibility. It filters by the current company, excludes archived rows by default, applies a bounded limit between 1 and 250, and orders by `sort_order`, `name`, and `id`. Search must be performed against `code`, `name`, and `description` using normalized text. It must not expose another company’s categories even if a caller supplies a foreign identifier.

### 5.3 `hc_get_lab_category`

```sql
public.hc_get_lab_category(p_category_id uuid)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  code text,
  name text,
  description text,
  specimen_requirements jsonb,
  default_turnaround_hours integer,
  requires_fasting boolean,
  requires_referral boolean,
  base_price numeric,
  currency text,
  status text,
  sort_order integer,
  data jsonb,
  version bigint,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
)
```

The get RPC returns one current-company row or raises `CATEGORY_NOT_FOUND`. It must not reveal whether a same-ID row exists in another tenant.

### 5.4 `hc_create_lab_category`

```sql
public.hc_create_lab_category(p_payload jsonb)
RETURNS TABLE (
  category_id uuid,
  event_id uuid,
  code text,
  name text,
  status text,
  version bigint,
  created_at timestamptz
)
```

Accepted payload:

```json
{
  "code": "CHEMISTRY",
  "name": "Clinical Chemistry",
  "description": "Routine chemistry investigations",
  "specimenRequirements": ["Serum", "Plasma"],
  "defaultTurnaroundHours": 24,
  "requiresFasting": false,
  "requiresReferral": false,
  "basePrice": 0,
  "currency": "TZS",
  "sortOrder": 10,
  "data": {},
  "idempotencyKey": "client-generated-uuid-or-stable-request-key"
}
```

Server validation must trim text, uppercase and validate `code`, enforce a bounded payload size, verify `specimenRequirements` is an array of non-empty strings, normalize currency to uppercase, and reject unknown payload keys. The product decision should determine whether `basePrice = 0` means “price configured elsewhere” or “free”; the RPC must not infer a price.

The create RPC must:

1. Resolve the verified actor and current company.
2. Require the laboratory-category configuration permission.
3. Validate all fields and reject duplicate `(company_id, code)` values with `CATEGORY_CODE_EXISTS`.
4. Check the company-scoped idempotency key before inserting.
5. Insert the category in `DRAFT` status with server-owned actor and timestamp fields.
6. Insert a `CREATED` event containing the normalized after-image.
7. Return the inserted row and event ID after the transaction commits.

### 5.5 `hc_update_lab_category`

```sql
public.hc_update_lab_category(
  p_category_id uuid,
  p_payload jsonb,
  p_expected_version bigint
)
RETURNS TABLE (
  category_id uuid,
  event_id uuid,
  code text,
  name text,
  status text,
  version bigint,
  updated_at timestamptz
)
```

Allowed update fields are `name`, `description`, `specimenRequirements`, `defaultTurnaroundHours`, `requiresFasting`, `requiresReferral`, `basePrice`, `currency`, `sortOrder`, and `data`. The `code`, `company_id`, actor fields, timestamps, status, and version are server-controlled. An empty patch returns `NO_FIELDS_TO_UPDATE`.

The update must use optimistic concurrency:

```sql
UPDATE public.hc_lab_categories
SET ...,
    version = version + 1
WHERE id = p_category_id
  AND company_id = public.current_company_id()
  AND version = p_expected_version
  AND status <> 'ARCHIVED';
```

A zero-row update returns `STALE_CATEGORY_VERSION` if the tenant row exists, or `CATEGORY_NOT_FOUND` otherwise. The RPC then inserts an `UPDATED` event with before and after snapshots and returns the confirmed row.

### 5.6 `hc_set_lab_category_status`

```sql
public.hc_set_lab_category_status(
  p_category_id uuid,
  p_status text,
  p_reason text DEFAULT NULL,
  p_expected_version bigint DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE (
  category_id uuid,
  event_id uuid,
  previous_status text,
  status text,
  version bigint,
  updated_at timestamptz
)
```

Allowed transitions are:

| Current | Allowed next status |
|---|---|
| `DRAFT` | `ACTIVE`, `ARCHIVED` |
| `ACTIVE` | `SUSPENDED`, `ARCHIVED` |
| `SUSPENDED` | `ACTIVE`, `ARCHIVED` |
| `ARCHIVED` | None; archived categories are terminal in this first contract |

The RPC requires a non-empty reason for suspension and archival, rejects invalid transitions with `INVALID_CATEGORY_TRANSITION`, and records `ACTIVATED`, `SUSPENDED`, or `ARCHIVED` in the event table. Archiving sets `archived_at` and `archived_by`; reactivation is deliberately excluded until the product confirms whether historical category codes may be reused.

### 5.7 Optional `hc_archive_lab_category` convenience RPC

If the UI needs a dedicated archive action, expose the following wrapper rather than allowing direct table patches:

```sql
public.hc_archive_lab_category(
  p_category_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text
)
RETURNS TABLE (
  category_id uuid,
  event_id uuid,
  status text,
  version bigint,
  archived_at timestamptz
)
```

This wrapper must call the same status-transition implementation as `hc_set_lab_category_status`, not duplicate its validation logic.

## 6. Stable error contract

| Code | Meaning | Client behavior |
|---|---|---|
| `UNAUTHENTICATED` | No verified workspace session | Ask the user to sign in again |
| `FORBIDDEN` | Actor lacks Healthcare laboratory configuration permission | Keep the form closed and show an authorization message |
| `CATEGORY_NOT_FOUND` | Category is not visible in the current tenant | Refresh the list without revealing cross-tenant existence |
| `CATEGORY_CODE_INVALID` | Code violates the stable-key format | Highlight the code field |
| `CATEGORY_CODE_EXISTS` | Code already exists in this tenant | Ask for a different code |
| `CATEGORY_NAME_INVALID` | Name is empty or exceeds the limit | Highlight the name field |
| `CATEGORY_PAYLOAD_INVALID` | Unsupported or malformed field | Reject without mutation |
| `CATEGORY_PRICE_INVALID` | Price is negative, too large, or not finite | Highlight the price field |
| `CATEGORY_TURNAROUND_INVALID` | Turnaround is outside the approved range | Highlight the turnaround field |
| `INVALID_CATEGORY_TRANSITION` | Requested lifecycle change is not allowed | Refresh the row and show the current status |
| `STALE_CATEGORY_VERSION` | Another user changed the row | Reload and ask the user to retry |
| `IDEMPOTENCY_KEY_REUSED` | Same key was submitted with a different payload | Stop retrying and request a new key |
| `CATEGORY_EVENT_FAILED` | Event write could not be confirmed | Roll back the category mutation |
| `CATEGORY_DATA_SERVICE_UNAVAILABLE` | Database/RPC service unavailable | Do not update local state; allow retry |

The tRPC layer should map these to stable `TRPCError` codes such as `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, or `PRECONDITION_FAILED`, while preserving the stable application code in structured metadata where the project’s error format supports it.

## 7. Execute privileges and security requirements

Each exposed RPC must be `SECURITY DEFINER` only when necessary to keep client table writes closed. Every function must use a fixed `search_path`, validate `auth.uid()`, derive the tenant from the verified session, and avoid dynamic SQL. The functions must not accept a client-supplied tenant or role.

```sql
REVOKE ALL ON FUNCTION public.hc_list_lab_categories(boolean, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_get_lab_category(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_create_lab_category(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_update_lab_category(uuid, jsonb, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_set_lab_category_status(uuid, text, text, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hc_list_lab_categories(boolean, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hc_get_lab_category(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hc_create_lab_category(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hc_update_lab_category(uuid, jsonb, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hc_set_lab_category_status(uuid, text, text, bigint, text) TO authenticated;
```

The exact role helper must be selected from the project’s approved Healthcare authorization implementation before migration. Do not invent a new role table or bypass `resolveVerifiedProfile` in the server adapter merely to make the button appear functional.

## 8. tRPC/server adapter contract

The server adapter should follow the existing `healthcareOperations.ts` pattern but use dedicated category RPCs rather than the generic `healthcareCreateInput` path. The adapter must pass the caller’s Supabase bearer token and return only the confirmed RPC representation.

```ts
const labCategoryCreateInput = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{1,31}$/),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).nullable().optional(),
  specimenRequirements: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  defaultTurnaroundHours: z.number().int().min(1).max(720).default(24),
  requiresFasting: z.boolean().default(false),
  requiresReferral: z.boolean().default(false),
  basePrice: z.number().finite().min(0).max(100_000_000_000).default(0),
  currency: z.string().trim().length(3).toUpperCase().default("TZS"),
  sortOrder: z.number().int().min(-100_000).max(100_000).default(0),
  data: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().uuid(),
});

async function createHealthcareLabCategory(req, input) {
  const { profile, token } = await resolveVerifiedProfile(req);
  // Check the approved Healthcare laboratory-configuration permission.
  const result = await callSupabaseRpc(token, "hc_create_lab_category", {
    p_payload: { ...input, actorId: profile.id },
  });
  if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The category could not be confirmed after saving." });
  return result;
}
```

The UI should open a modal from the legacy `New Category` button, submit through this adapter, and append the returned record only after the RPC returns successfully. On error, it must keep the existing list unchanged and display the mapped error. A demo-mode fallback may be retained only if it is explicitly labeled as local demo behavior and is not used in configured production mode.

## 9. Required tests before connecting the legacy button

| Test area | Required assertion |
|---|---|
| Input validation | Invalid code, empty name, oversized description, invalid specimen array, negative price, and invalid turnaround are rejected before mutation |
| Tenant isolation | A signed-in actor cannot read, update, archive, or infer the existence of another company’s category |
| Role authorization | Laboratory Technician/configuration role can create only when approved; clinician/read-only roles cannot create or update unless explicitly granted |
| Duplicate handling | Duplicate company/code returns `CATEGORY_CODE_EXISTS`; another company may use the same code |
| Idempotency | Same key and payload returns the original row; same key and different payload returns `IDEMPOTENCY_KEY_REUSED` |
| Atomicity | A failed event insert rolls back the category mutation; no category exists without its `CREATED` event |
| Concurrency | Stale version returns `STALE_CATEGORY_VERSION` and does not overwrite the current row |
| Lifecycle | Only the documented status transitions succeed; archive requires a reason and is terminal |
| Security | Trigger helpers are not executable by `anon` or `authenticated`; exposed RPCs are authenticated-only |
| UI confirmation | The category is added to local state only after the server returns the inserted representation |
| Regression | Existing Healthcare lab order, patient, and Pharmacy category workflows remain unchanged |

Live mutation tests must use an isolated authenticated test tenant and cleanup strategy. Without controlled credentials and a disposable tenant, use source-contract and mocked-RPC tests rather than mutating a production tenant.

## 10. Migration and rollout sequence

1. Confirm the product owner: Healthcare laboratory category versus Pharmacy catalog category.
2. Confirm the project’s approved Healthcare role helper and whether `hc_lab_categories` must be added to `HEALTHCARE_TABLES`.
3. Apply the schema, indexes, RLS, triggers, and privilege hardening as one reviewed additive migration through the Supabase connector.
4. Implement and test the RPCs and tRPC adapters.
5. Add the modal and connect the legacy button only after server confirmation tests pass.
6. Add browser coverage for create, duplicate, validation error, reload persistence, and unauthorized-role behavior.
7. Run Supabase security and performance advisors; remediate only findings introduced by this workflow.

No table should be created if the product decision changes the owner to Pharmacy. In that case, the implementation should call the existing Pharmacy `createPharmacyCategory` server contract, which already validates the verified profile, enforces the Pharmacy catalog permission, scopes the write to the current company, and records an audit entry.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/dashboardExtractedModules.jsx "Legacy Healthcare and Banking module source"
[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/healthcareOperations.ts "Healthcare authorization and persistence operations"
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/pharmacyOperations.ts "Pharmacy category authorization and persistence operations"
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_015_bank_mfi_core.sql "Existing tenant, RLS, audit, and RPC conventions"
