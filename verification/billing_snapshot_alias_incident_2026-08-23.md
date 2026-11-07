# Billing Snapshot Alias Incident — 2026-08-23

## Symptom

The live billing workspace displayed **“Billing is securely unavailable”** with PostgreSQL error:

```text
missing FROM-clause entry for table "e"
```

The failing request was the protected `GET /api/billing/subscription` path, which calls the authenticated Supabase RPC `public.billing_snapshot()`.

## Root cause

The live function definition contained this inner query:

```sql
FROM (
  SELECT *
  FROM public.subscription_events
  WHERE company_id = v_company_id
  ORDER BY e.created_at DESC
  LIMIT 100
) e
```

The alias `e` was declared only after the closing parenthesis, so it was not in scope inside the inner `SELECT`. PostgreSQL correctly raised `missing FROM-clause entry for table "e"` before returning the billing snapshot.

The same defect was present in the repository’s latest `billing_snapshot()` migration source. The live audit confirmed that all referenced billing relations and columns existed, so no new table was required.

## Correction

Forward-only migration:

`supabase/migrations/20260823_062_fix_billing_snapshot_event_alias.sql`

The correction:

- Replaces the invalid inner `ORDER BY e.created_at` with `ORDER BY created_at`.
- Gives the outer derived table the explicit alias `event_row`.
- Uses `event_row.created_at` only in the outer aggregate ordering.
- Uses explicit aliases for profile, plan, subscription, notification, payment, invoice, and event rows.
- Preserves the existing tenant scope, billing manager guard, `SECURITY DEFINER` posture, fixed `search_path`, and authenticated-only RPC execution.
- Does not create tables, mutate subscription data, change RLS policies, or change provider behavior.

## Live Supabase evidence

Supabase project: `rlhngsrihahhyxnjxrxm` (`ACTIVE_HEALTHY`, `ap-southeast-1`).

The migration was applied successfully through the Supabase connector:

- Migration name: `fix_billing_snapshot_event_alias_20260823`
- Registered version: `20260823204948`
- Result: `success: true`

Post-apply verification confirmed:

- `public.billing_snapshot()` contains the corrected `event_row` query.
- `billing_snapshot` has `EXECUTE` for `authenticated`.
- No `anon` or `public` routine execution privilege was returned.
- Existing billing tables and required columns are present; no schema object was missing.

## Validation

| Check | Result |
| --- | --- |
| Focused billing/access tests before fix | 22 passed |
| Focused billing/access tests after fix | 23 passed |
| TypeScript check | Passed |
| Full test suite | 208 files passed, 5 skipped; 857 tests passed, 13 skipped |
| Vite production build | Passed; existing large-bundle warning remains |
| Server/API esbuild bundles | Passed |
| Live Supabase migration | Passed |
| Live function-definition verification | Passed |
| Live migration registry verification | Passed |

A fully authenticated browser replay was not possible in the available browser session because it currently shows the secure login gateway. The live database function definition and migration registry were verified directly, and all application-side contracts remain green.

## Scope decision

No new table was created. The failure was a SQL alias-scope defect, not a missing schema object. Creating additional tables would have added risk without addressing the incident.
