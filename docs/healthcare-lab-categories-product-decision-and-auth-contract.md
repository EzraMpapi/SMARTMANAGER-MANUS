# Healthcare Laboratory Categories: Product Decision and Authorization Contract

**Status:** Draft for product and security approval; no SQL has been applied.
**Candidate migration:** `20260825_018_healthcare_lab_categories_*`
**Author:** Manus AI

## Decision gate

The `New Category` control must not create a table or call a new RPC until the product owner confirms that it represents a **Healthcare Laboratory category** rather than a Pharmacy catalog category. The existing Pharmacy implementation already owns `phm_categories`; redirecting a Pharmacy action into a new Healthcare table would create two competing category systems and make reporting, permissions, and data ownership ambiguous.

If the decision is Healthcare Laboratory, the category resource should be tenant-scoped, server-confirmed, auditable, idempotent, and separate from laboratory orders. If the decision is Pharmacy, no Healthcare migration should be created and the existing `createPharmacyCategory` contract should remain the sole write path.

## Required product decisions

| Decision area | Required answer | Acceptance criterion | Default recommendation |
|---|---|---|---|
| Owning domain | Healthcare Laboratory or Pharmacy catalog | One named product owner records the choice | Healthcare only if the control configures test categories used by lab orders; otherwise Pharmacy |
| Stable identifier | Category code format and mutability | Codes are unique within a company and immutable after creation | Uppercase `A-Z0-9_-`, 2–32 characters; no silent code renaming |
| Display name | Name length, localization, and duplicate behavior | Names are usable in orders and reports | 1–120 trimmed characters; code, not name, is the stable reference |
| Category scope | Grouping of investigations, specimens, or services | Category does not become a hidden order or price engine | Store configuration only; laboratory orders remain a separate workflow |
| Specimen metadata | Allowed structure and limits | Invalid JSON shapes are rejected | JSON array of bounded non-empty strings, maximum 30 entries |
| Turnaround | Operational range and unit | The UI and database use the same unit | Integer hours, 1–720 |
| Pricing | Whether category pricing is authoritative | No downstream workflow infers business meaning from zero | `base_price` is optional configuration; product owner must define whether zero means free or not configured |
| Currency | Supported currencies | Reports and APIs show an explicit currency | Default `TZS`, uppercase three-letter code; do not silently convert amounts |
| Lifecycle | Status vocabulary and transitions | Archived categories cannot unexpectedly reappear | `DRAFT → ACTIVE`, `DRAFT → ARCHIVED`, `ACTIVE → SUSPENDED/ARCHIVED`, `SUSPENDED → ACTIVE/ARCHIVED`; archived terminal in v1 |
| Archive behavior | Hard delete or status transition | Historical orders and events remain reconstructable | Status transition with `archived_at` and reason; no hard delete |
| Audit | Lifecycle history and shared audit channel | Every mutation has a reconstructable before/after event | Append-only `hc_lab_category_events` plus the established shared audit channel in one transaction |
| Idempotency | Scope and replay semantics | Retries do not create duplicate categories/events | Company-scoped key; same key plus equivalent payload returns the original result; changed payload fails |
| Concurrency | Update conflict behavior | Lost updates are not silently accepted | Optimistic `version` check with stable stale-version error |
| Read visibility | Which Healthcare users may list or view categories | Tenant isolation is testable | Approved Healthcare configuration/read capability; no cross-tenant existence disclosure |
| Write authority | Who may create/update/archive | Permission is server-enforced | Dedicated workforce permissions; organization administrators may bypass only through approved role policy |
| Direct table writes | Whether PostgREST DML is allowed | Browser cannot bypass validation or event creation | No direct authenticated insert/update/delete; use RPCs |
| UI owner | Which screen owns the action | There is one navigation and persistence path | Healthcare Laboratory configuration screen if Healthcare is selected |
| Backward compatibility | Impact on `hc_lab_orders` and Pharmacy | Existing workflows remain unchanged | Additive schema and dedicated adapter; no generic table-writer expansion until reviewed |

## Authorization decision

The live workforce schema provides `profiles`, `workforce_permissions`, `workforce_roles`, `workforce_role_permissions`, and `workforce_member_roles`. The confirmed fields include tenant keys, active/status fields, permission `code`, `module_id`, `resource`, `permission_action`, role assignments, allow/deny `effect`, and effective time windows. The migration should reuse these tables rather than introduce a Healthcare-specific role table.

The recommended stable permission records are:

| Permission code | Module | Resource | Action | Intended use |
|---|---|---|---|---|
| `healthcare.lab_categories.read` | `healthcare` | `lab_categories` | `read` | List and view categories |
| `healthcare.lab_categories.create` | `healthcare` | `lab_categories` | `create` | Create a draft category |
| `healthcare.lab_categories.update` | `healthcare` | `lab_categories` | `update` | Edit mutable metadata |
| `healthcare.lab_categories.archive` | `healthcare` | `lab_categories` | `archive` | Suspend or archive a category |

The permission seed must be reviewed against the project’s existing workforce permission naming convention before insertion. A role assignment should be considered active only when the role, role-permission link, and permission are active, the effective start is not in the future, and the effective end is absent or in the future. Deny effects must take precedence over allow effects if both exist for the same actor and action.

The initial product recommendation is:

- `Super Administrator`, `Organization Owner`, `CEO`, and `Clinic Administrator` retain full Healthcare category administration only if that bypass is consistent with the project’s global administrator policy.
- `Laboratory Technician` receives read access by default and receives create/update/archive only if the product owner explicitly grants laboratory configuration authority.
- `Doctor`, `Nurse`, `Receptionist`, `Billing Officer`, `Finance Manager`, `CFO`, and `Pharmacist` receive no category configuration access unless an explicit workforce permission is assigned. Clinical users may consume active categories indirectly through laboratory orders without administering category definitions.
- No browser-supplied role, company, actor, or permission value is trusted by the database functions.

## Draft authorization helper functions

The following SQL is a **contract draft**, not an instruction to execute immediately. Before inclusion in a migration, confirm the exact active-status vocabulary and existing role/permission helper conventions in the target database. The functions deliberately use fully qualified relation names and a fixed search path. They derive the actor from `auth.uid()` and the tenant from `public.current_company_id()`.

### Actor and tenant context

```sql
CREATE OR REPLACE FUNCTION public.hc_lab_category_actor_company()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_company uuid := public.current_company_id();
  v_profile_company uuid;
  v_active boolean;
BEGIN
  IF v_actor IS NULL OR v_company IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.company_id, p.is_active
    INTO v_profile_company, v_active
  FROM public.profiles AS p
  WHERE p.id = v_actor
  LIMIT 1;

  IF v_profile_company IS DISTINCT FROM v_company
     OR v_active IS FALSE THEN
    RETURN NULL;
  END IF;

  RETURN v_company;
END;
$$;
```

The helper returns `NULL` for an unauthenticated, inactive, or tenant-mismatched actor. It does not accept a company parameter. If the project’s canonical tenant resolver has a different contract, the migration must use that resolver consistently instead of maintaining two competing definitions.

### Permission evaluation

```sql
CREATE OR REPLACE FUNCTION public.hc_lab_category_has_permission(p_action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_company uuid := public.hc_lab_category_actor_company();
  v_role text;
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_permission_code text := 'healthcare.lab_categories.' || lower(btrim(coalesce(p_action, '')));
  v_denied boolean;
  v_allowed boolean;
BEGIN
  IF v_actor IS NULL OR v_company IS NULL
     OR v_action NOT IN ('read', 'create', 'update', 'archive') THEN
    RETURN FALSE;
  END IF;

  SELECT lower(btrim(p.role))
    INTO v_role
  FROM public.profiles AS p
  WHERE p.id = v_actor
    AND p.company_id = v_company
    AND p.is_active IS DISTINCT FROM FALSE
  LIMIT 1;

  IF v_role IN ('super administrator', 'organization owner', 'ceo', 'clinic administrator') THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.workforce_member_roles AS mr
    JOIN public.workforce_roles AS r
      ON r.id = mr.role_id
     AND r.company_id = v_company
    JOIN public.workforce_role_permissions AS rp
      ON rp.role_id = r.id
     AND rp.company_id = v_company
    JOIN public.workforce_permissions AS wp
      ON wp.id = rp.permission_id
     AND wp.company_id = v_company
    WHERE mr.profile_id = v_actor
      AND mr.company_id = v_company
      AND lower(coalesce(mr.status, '')) = 'active'
      AND (mr.effective_from IS NULL OR mr.effective_from <= now())
      AND (mr.effective_to IS NULL OR mr.effective_to > now())
      AND lower(coalesce(r.status, '')) = 'active'
      AND lower(coalesce(rp.status, '')) = 'active'
      AND lower(coalesce(rp.effect, 'allow')) = 'deny'
      AND lower(wp.code) = v_permission_code
      AND lower(coalesce(wp.status, '')) = 'active'
  ) INTO v_denied;

  IF v_denied THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.workforce_member_roles AS mr
    JOIN public.workforce_roles AS r
      ON r.id = mr.role_id
     AND r.company_id = v_company
    JOIN public.workforce_role_permissions AS rp
      ON rp.role_id = r.id
     AND rp.company_id = v_company
    JOIN public.workforce_permissions AS wp
      ON wp.id = rp.permission_id
     AND wp.company_id = v_company
    WHERE mr.profile_id = v_actor
      AND mr.company_id = v_company
      AND lower(coalesce(mr.status, '')) = 'active'
      AND (mr.effective_from IS NULL OR mr.effective_from <= now())
      AND (mr.effective_to IS NULL OR mr.effective_to > now())
      AND lower(coalesce(r.status, '')) = 'active'
      AND lower(coalesce(rp.status, '')) = 'active'
      AND lower(coalesce(rp.effect, 'allow')) = 'allow'
      AND lower(wp.code) = v_permission_code
      AND lower(coalesce(wp.status, '')) = 'active'
      AND (wp.module_id IS NULL OR lower(wp.module_id) = 'healthcare')
      AND (wp.resource IS NULL OR lower(wp.resource) = 'lab_categories')
      AND lower(coalesce(wp.permission_action, v_action)) = v_action
  ) INTO v_allowed;

  RETURN v_allowed;
END;
$$;
```

The draft uses explicit `code` matching and also checks module, resource, and action when those columns are populated. Before migration, confirm whether the project represents active values as `Active`, `ACTIVE`, or another approved value; the `lower()` normalization is intended to tolerate case, not to hide a data-quality problem. If deny effects are not supported by the project’s policy, remove the deny query and document the precedence rule instead of silently assuming one.

### Action-specific wrappers and assertion

```sql
CREATE OR REPLACE FUNCTION public.hc_lab_category_can_read()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT public.hc_lab_category_has_permission('read');
$$;

CREATE OR REPLACE FUNCTION public.hc_lab_category_can_create()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT public.hc_lab_category_has_permission('create');
$$;

CREATE OR REPLACE FUNCTION public.hc_lab_category_can_update()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT public.hc_lab_category_has_permission('update');
$$;

CREATE OR REPLACE FUNCTION public.hc_lab_category_can_archive()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT public.hc_lab_category_has_permission('archive');
$$;

CREATE OR REPLACE FUNCTION public.hc_lab_category_assert_permission(p_action text)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.hc_lab_category_has_permission(p_action) THEN
    RAISE EXCEPTION 'Healthcare laboratory category permission denied.'
      USING ERRCODE = '42501';
  END IF;
END;
$$;
```

These helper functions are intended for policies and dedicated RPCs, not direct browser use. Their execution must be revoked from `PUBLIC` and `anon`; `authenticated` should receive only the minimum helper or RPC privileges required by the chosen RLS design. If the helper is used by an RLS policy, verify that it cannot be abused as an information oracle by returning only boolean authorization results and by keeping category reads tenant-scoped.

### Required privilege hardening draft

```sql
REVOKE ALL ON FUNCTION public.hc_lab_category_actor_company() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hc_lab_category_has_permission(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hc_lab_category_can_read() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_lab_category_can_create() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_lab_category_can_update() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_lab_category_can_archive() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hc_lab_category_assert_permission(text) FROM PUBLIC, anon;
```

The final `GRANT EXECUTE` statements must be decided with the RLS strategy. If authenticated clients call only dedicated RPCs, the underlying helpers can remain inaccessible to `authenticated` and be called by the RPCs. If authenticated policies call the boolean helper directly, grant only the boolean read helper needed by the policy and keep assertion/write helpers server-only. Do not grant a broad helper function merely to make a UI request succeed.

## Migration acceptance tests

Before applying the migration, add static contract tests for function signatures, fixed search paths, revocations, permission codes, status transitions, and tenant predicates. Add isolated integration tests for an authorized administrator, an authorized laboratory configuration role, a laboratory read-only role, an unauthorized clinical role, an inactive profile, a cross-tenant role assignment, an expired assignment, an explicit deny effect, and a missing `auth.uid()`.

Every write RPC must be tested with a client-supplied foreign `company_id`, `created_by`, `actor_id`, or role value and must prove that those values are ignored. Tests must also prove that an actor cannot infer a category’s existence in another company from a not-found response, timing distinction, or permission error.

## Sign-off record

The migration is ready for review only when the following fields are completed:

| Sign-off | Required entry |
|---|---|
| Product owner | Healthcare Laboratory or Pharmacy decision, with name and date |
| Healthcare operations owner | Confirmed category purpose and workflow boundary |
| Authorization owner | Permission codes, role assignments, deny precedence, and active-status vocabulary |
| Data owner | Currency, price semantics, retention, archive, and reporting requirements |
| Security reviewer | RLS, grants, fixed search paths, tenant isolation, and information-disclosure review |
| QA owner | Test evidence for validation, idempotency, concurrency, lifecycle, and regression |
| Deployment owner | Staging project, migration identifier, rollback plan, and production promotion gate |

## Recommendation

Keep `hc_lab_categories` and `hc_lab_category_events` unapplied until the ownership and authorization decisions are signed off. The helper functions above are a grounded starting contract based on the live workforce schema, but they still require confirmation of the project’s established permission seed values and active-status conventions before becoming executable migration SQL.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/NEW_CATEGORY_SCHEMA_RPC_DRAFT_20250825.md "Healthcare Laboratory category schema draft"

[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/healthcareOperations.ts "Existing Healthcare role and table access contract"

[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/pharmacyOperations.ts "Existing Pharmacy category implementation"

[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_042_workforce_authorization.sql "Workforce authorization migration reference"
