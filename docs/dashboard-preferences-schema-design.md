# Dashboard Preference Persistence Model

## Purpose and Scope

This design supports **personal, tenant-scoped dashboard customization**. It stores a user’s menu presentation, permitted menu-group visibility, top-bar controls, KPI selection, panel order, density, timezone, and related display options. It is intentionally limited to **presentation preferences**.

> A stored preference must never become an authorization grant. The application must calculate role-, module-, tenant-, and subscription-authorized navigation first, then apply the saved presentation choices as a narrowing layer.

The current Smart Manager implementation already uses a generic preferences record keyed by `company_id`, `user_id`, and `preference_key = "dashboard"`. The recommended model below preserves that isolation boundary, adds explicit schema versioning, and gives a clear path to future evolution.

## Design Principles

| Principle | Model decision |
|---|---|
| **Tenant isolation** | Every row includes `company_id`; all reads and writes compare it with the authenticated user’s verified company. |
| **User isolation** | Every row includes `user_id`; a user may read or update only their own preference row unless a separately authorized administrative feature is added. |
| **No privilege escalation** | Menu group identifiers are allow-listed. The server does not trust stored preferences to determine available modules or actions. |
| **Safe recovery** | Home is mandatory, at least one KPI remains selected, and the active authorized group remains visible while the user is on it. |
| **Extensibility** | Preferences are stored in one validated `jsonb` document with `schema_version`, avoiding frequent schema migrations for display-only settings. |
| **Auditable updates** | `updated_at` is recorded on every mutation; optional audit events can capture changes without storing sensitive session data. |

## Recommended JSON Schema

The following JSON Schema uses Draft 2020-12. It describes the `value` payload stored for the dashboard preference record. The application should continue to use server-side Zod validation or an equivalent typed validator before writing the JSON document.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://smartmanager.example/schemas/dashboard-preferences/v1.json",
  "title": "Smart Manager Dashboard Preferences",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "compactDensity",
    "showKpiBanner",
    "showActivityTimeline",
    "showPendingApprovals",
    "accentColor",
    "currency",
    "timezone",
    "fxRateOverride",
    "departmentBudgets",
    "showRevenueOverview",
    "showSalesMix",
    "showQuickActions",
    "showTopProducts",
    "showCashFlow",
    "showBusinessHealth",
    "showActionCenter",
    "widgetOrder",
    "kpiCardIds",
    "performanceWindow",
    "sidebarPresentation",
    "navigationSort",
    "visibleNavigationGroupIds",
    "showTopBarSearch",
    "showGuidedTour",
    "showConnectionStatus",
    "showTopBarDate"
  ],
  "properties": {
    "schemaVersion": {
      "type": "integer",
      "const": 1,
      "description": "Payload format version. Increment only for incompatible preference changes."
    },
    "compactDensity": { "type": "boolean" },
    "showKpiBanner": { "type": "boolean" },
    "showActivityTimeline": { "type": "boolean" },
    "showPendingApprovals": { "type": "boolean" },
    "accentColor": { "type": "string", "enum": ["gold", "emerald"] },
    "currency": { "type": "string", "enum": ["TZS", "USD"] },
    "timezone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "IANA timezone identifier, validated against an application-maintained allow-list where possible."
    },
    "fxRateOverride": {
      "type": "number",
      "minimum": 1,
      "maximum": 1000000
    },
    "departmentBudgets": {
      "type": "object",
      "maxProperties": 50,
      "propertyNames": { "type": "string", "minLength": 1, "maxLength": 80 },
      "additionalProperties": {
        "type": "number",
        "minimum": 0,
        "maximum": 1000000000000
      },
      "description": "Personal dashboard-display thresholds only; never the source of truth for company budgeting."
    },
    "showRevenueOverview": { "type": "boolean" },
    "showSalesMix": { "type": "boolean" },
    "showQuickActions": { "type": "boolean" },
    "showTopProducts": { "type": "boolean" },
    "showCashFlow": { "type": "boolean" },
    "showBusinessHealth": { "type": "boolean" },
    "showActionCenter": { "type": "boolean" },
    "widgetOrder": {
      "type": "array",
      "minItems": 1,
      "maxItems": 8,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": [
          "revenue",
          "salesMix",
          "quickActions",
          "products",
          "cashFlow",
          "businessHealth",
          "activity",
          "actionCenter"
        ]
      }
    },
    "kpiCardIds": {
      "type": "array",
      "minItems": 1,
      "maxItems": 5,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": ["revenue", "expenses", "net-result", "orders", "receivables"]
      }
    },
    "performanceWindow": {
      "type": "string",
      "enum": ["30d", "3m", "6m", "1y"]
    },
    "sidebarPresentation": {
      "type": "string",
      "enum": ["expanded", "compact"]
    },
    "navigationSort": {
      "type": "string",
      "enum": ["priority", "alphabetical"]
    },
    "visibleNavigationGroupIds": {
      "type": "array",
      "minItems": 1,
      "maxItems": 8,
      "uniqueItems": true,
      "contains": { "const": "home" },
      "minContains": 1,
      "items": {
        "type": "string",
        "enum": [
          "home",
          "sales-crm",
          "operations",
          "finance",
          "people",
          "specialized",
          "analytics",
          "administration"
        ]
      }
    },
    "showTopBarSearch": { "type": "boolean" },
    "showGuidedTour": { "type": "boolean" },
    "showConnectionStatus": { "type": "boolean" },
    "showTopBarDate": { "type": "boolean" }
  }
}
```

## Example Preference Document

```json
{
  "schemaVersion": 1,
  "compactDensity": true,
  "showKpiBanner": true,
  "showActivityTimeline": true,
  "showPendingApprovals": true,
  "accentColor": "emerald",
  "currency": "TZS",
  "timezone": "Africa/Dar_es_Salaam",
  "fxRateOverride": 2600,
  "departmentBudgets": {
    "Operations": 25000,
    "Sales": 15000,
    "Finance": 10000
  },
  "showRevenueOverview": true,
  "showSalesMix": false,
  "showQuickActions": true,
  "showTopProducts": false,
  "showCashFlow": true,
  "showBusinessHealth": true,
  "showActionCenter": true,
  "widgetOrder": [
    "quickActions",
    "actionCenter",
    "cashFlow",
    "revenue",
    "activity",
    "businessHealth",
    "salesMix",
    "products"
  ],
  "kpiCardIds": ["revenue", "orders", "receivables"],
  "performanceWindow": "3m",
  "sidebarPresentation": "compact",
  "navigationSort": "priority",
  "visibleNavigationGroupIds": ["home", "finance", "analytics"],
  "showTopBarSearch": true,
  "showGuidedTour": true,
  "showConnectionStatus": true,
  "showTopBarDate": false
}
```

## Relational Database Model

### Option A — Recommended generic preference table

Use a single generic table if Smart Manager already stores user preferences by key. This pattern avoids a new table for every user-interface preference category while still making the tenant and user scope explicit.

```sql
create table if not exists public.user_table_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  preference_key text not null,
  schema_version smallint not null default 1 check (schema_version >= 1),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_table_preferences_scope_key_unique
    unique (company_id, user_id, preference_key)
);

create index if not exists user_table_preferences_user_company_idx
  on public.user_table_preferences (user_id, company_id);

create index if not exists user_table_preferences_dashboard_idx
  on public.user_table_preferences (company_id, user_id)
  where preference_key = 'dashboard';
```

The dashboard record uses `preference_key = 'dashboard'`. The unique constraint provides a safe upsert target and prevents duplicate preference documents for the same user in the same company.

### Option B — Dedicated dashboard preference table

Choose a dedicated table only if dashboard preferences need independent retention, reporting, organization templates, revision history, or a future approval workflow.

```sql
create table if not exists public.user_dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  schema_version smallint not null default 1 check (schema_version >= 1),
  preferences jsonb not null check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_dashboard_preferences_user_company_unique
    unique (company_id, user_id)
);

create index if not exists user_dashboard_preferences_scope_idx
  on public.user_dashboard_preferences (company_id, user_id);
```

| Model | Use it when | Trade-off |
|---|---|---|
| **Generic `user_table_preferences`** | Preferences are a small, user-scoped JSON document and other personal settings use the same pattern. | Requires a `preference_key` predicate on reads and policies. |
| **Dedicated `user_dashboard_preferences`** | You need per-dashboard audit history, sharing, templates, or reporting at scale. | Adds another table, migration, policies, helpers, and maintenance path. |

## Authorization and Row-Level Security

The API must derive `company_id` and `user_id` from the verified session. A browser request must **not** provide either value as a trusted save parameter.

The following is illustrative Supabase RLS pseudocode. Replace `current_profile_id()` and `current_company_id()` with the project’s vetted identity helpers or JWT-claim resolution function. The helpers must return values derived from the authenticated session, not from client-supplied headers or body fields.

```sql
alter table public.user_table_preferences enable row level security;

create policy "read own company dashboard preferences"
on public.user_table_preferences
for select
to authenticated
using (
  preference_key = 'dashboard'
  and user_id = public.current_profile_id()
  and company_id = public.current_company_id()
);

create policy "insert own company dashboard preferences"
on public.user_table_preferences
for insert
to authenticated
with check (
  preference_key = 'dashboard'
  and user_id = public.current_profile_id()
  and company_id = public.current_company_id()
);

create policy "update own company dashboard preferences"
on public.user_table_preferences
for update
to authenticated
using (
  preference_key = 'dashboard'
  and user_id = public.current_profile_id()
  and company_id = public.current_company_id()
)
with check (
  preference_key = 'dashboard'
  and user_id = public.current_profile_id()
  and company_id = public.current_company_id()
);

create policy "delete own company dashboard preferences"
on public.user_table_preferences
for delete
to authenticated
using (
  preference_key = 'dashboard'
  and user_id = public.current_profile_id()
  and company_id = public.current_company_id()
);
```

Do not add a permissive organization-wide policy simply so a manager can inspect another employee’s layout. If that feature is later needed, define a separate, audited administrative procedure with explicit company and role checks.

## Server-Side Validation and Application Flow

The recommended save flow is as follows.

1. The client sends only the preference payload to a protected procedure such as `dashboardPreferences.save`.
2. The server verifies the session and resolves the authoritative profile, `user_id`, and `company_id`.
3. The server normalizes legacy or partial data, then validates against the allow-listed schema.
4. The server upserts the JSON value on `(company_id, user_id, preference_key)`.
5. At render time, the application derives role/module/subscription-authorized navigation first and applies the preference document only to hide or order those already authorized groups.

The following pseudocode shows the core access invariant.

```ts
const verified = await resolveVerifiedProfile(request);
const preferences = dashboardPreferencesSchema.parse(normalize(input));

await upsert({
  companyId: verified.profile.company_id,
  userId: verified.profile.id,
  preferenceKey: "dashboard",
  value: preferences
});

const authorizedGroups = getNavigationGroups({
  visibleModuleIds: roleAndSubscriptionFilteredModules,
  currentRoleId: verified.profile.role,
  canSeeSettings: verifiedPermissions.canManageSettings
});

const displayedGroups = authorizedGroups.filter(
  group => preferences.visibleNavigationGroupIds.includes(group.id)
);
```

## Validation Rules Beyond JSON Schema

JSON Schema confirms shape and values. The application validator should additionally enforce the business rules below.

| Rule | Reason |
|---|---|
| Add `home` if a legacy payload omitted it; reject a newly submitted payload that attempts to omit it. | Maintains a safe return destination. |
| Reject duplicate widget, KPI, or navigation identifiers. | Avoids inconsistent ordering and duplicate UI controls. |
| Preserve at least one KPI card. | Prevents an empty KPI surface. |
| Remove unknown identifiers during legacy-data normalization; reject unknown identifiers in current API input. | Supports forward-compatible reads while protecting writes. |
| Limit department-budget entry count, key length, and numeric ranges. | Prevents storage abuse and invalid display values. |
| Compare stored menu groups with the freshly authorized group model at render time. | A preference never becomes an entitlement. |
| Keep core account, alert, notification, security, and mobile-menu controls outside the optional-control preference set. | Preserves safe access and recovery pathways. |

## Safe Migration Plan

1. **Inventory existing rows.** Identify the current `preference_key = 'dashboard'` records and confirm they already have user and company scope.
2. **Add non-breaking metadata.** Add `schema_version` with default `1` only if the existing table does not already provide a version field.
3. **Deploy tolerant reads first.** Normalize missing new fields to the documented defaults before the UI begins writing them.
4. **Deploy strict writes.** Validate new submissions with the allow-list and the safe Home/KPI constraints.
5. **Backfill optionally.** Update old dashboard payloads only if a clean, auditable migration is needed; otherwise, lazy normalization avoids a bulk JSON rewrite.
6. **Enable or verify RLS.** Test cross-user and cross-company reads and writes with real authenticated claims in a non-production environment.
7. **Add regression coverage.** Test administrator, operational, read-only, subscription-limited, and external-portal roles.

No schema migration should be applied solely to support a new cosmetic field unless the current preference table cannot safely retain validated JSON. The generic keyed model is usually sufficient for personal dashboard customization.

## Test Matrix

| Test | Expected outcome |
|---|---|
| User A reads User B’s record in the same company | Denied by RLS and server authorization. |
| User A reads their record in Company B | Denied by tenant scope checks. |
| User submits `visibleNavigationGroupIds` without `home` | Rejected on current writes; normalized safely for an approved legacy payload. |
| User submits an unknown widget or navigation group | Rejected or stripped during controlled legacy normalization. |
| Read-only employee selects Finance in stored preferences | Finance does not appear because it is absent from the authorized group model. |
| Subscription-limited owner selects an unavailable module’s group | The unavailable module does not appear and cannot be opened. |
| User changes a preference while on an authorized active group | The active group remains reachable until navigation changes. |
| User chooses Reset Defaults | The value is replaced with the validated default document within the same user/company scope. |

## Recommended Defaults

Use the validated default document as the source of truth for new rows and reset actions. Defaults should expose all **currently authorized** presentation categories, not all modules defined in the product catalog. This gives users a complete starting layout without accidentally advertising inaccessible workspaces.

## Implementation Boundary

This document is a **sample design**, not an instruction to run the included SQL directly against production. Before applying any DDL, reconcile table and identity-helper names with the deployed Supabase schema, verify RLS policies against the project’s authentication claims, generate a migration through the project’s normal schema workflow, and test it in a non-production environment.
