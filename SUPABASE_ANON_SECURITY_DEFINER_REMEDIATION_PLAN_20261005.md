# Remediation Plan: Anonymous-Executable SECURITY DEFINER Functions

**Date:** 2026-10-05  
**Scope:** Six functions reported by the Supabase security advisor as executable by `anon`  
**Production changes:** None applied during this review

## Executive recommendation

The live ACLs do not match the repository's intended hardening posture:

- `bank_run_standing_orders(date, uuid, integer)` currently grants `EXECUTE` to `anon` even though `20260825_008_standing_order_security_hardening.sql` revokes it.
- `record_offline_sync_operation(...)` currently grants `EXECUTE` to `anon` even though `20260920_001_offline_sync_receipts.sql` revokes it.
- Four booking/seat functions are intentionally public according to `20260907_002_harden_security_definer_search_paths_and_anon_grants.sql`, but their current contracts expose more capability and data than should be granted to an unauthenticated caller.

The safe approach is **not** to convert every function to `SECURITY INVOKER` or to revoke all public booking functionality without replacing the guest journey. Apply a two-track remediation:

1. **Immediate privilege correction:** remove anonymous execution from internal/financial functions.
2. **Public booking redesign:** replace broad bearer-style RPCs with narrow, rate-limited, token/OTP-protected guest wrappers and then revoke anonymous execution from the current functions.

## Current live findings

| Function | Current `anon` execution | Current `authenticated` execution | Main risk | Recommended target |
|---|---:|---:|---|---|
| `bank_run_standing_orders(date, uuid, integer)` | Yes | Yes | Unauthenticated caller reaches a financial standing-order runner through a SECURITY DEFINER wrapper | `service_role` only, or authenticated only if an explicitly authorized operator workflow still requires it |
| `cancel_booking(locator, surname, refund_minor, refund_pct)` | Yes | Yes | Public mutation accepts refund metadata from caller and changes booking/seat state | Revoke current public RPC; replace with token/OTP wrapper deriving refund server-side |
| `extend_hold(hold_token, ttl_seconds)` | Yes | Yes | Bearer hold token can be extended by unauthenticated callers; abuse can hoard inventory | Prefer authenticated-only; if guest booking is required, replace with a narrow, rate-limited token wrapper |
| `get_booking(locator, surname)` | Yes | Yes | Returns contact details, passenger data, ticket numbers, seats and barcodes; brute-force/PII risk | Revoke current public RPC; replace with opaque access token/OTP and redacted response |
| `hold_seats(service_key, seats, ttl_seconds)` | Yes | Yes | Unauthenticated inventory mutation; seat hoarding and service-key probing risk | Revoke current broad RPC; replace with a narrow public hold endpoint with server-side limits and anti-abuse controls |
| `record_offline_sync_operation(...)` | Yes | Yes | `anon` cannot pass its own `auth.uid()` check, but the callable surface is incorrectly exposed and search path is weaker than the standard | Revoke `PUBLIC, anon`; grant only `authenticated` (and `service_role` only if required by a worker) |

All six functions use `SECURITY DEFINER`. The current definitions pin a search path, which is good, but that does not substitute for correct execution privileges and input authorization.

## Priority 0 — remove clearly incorrect anonymous access

### 1. `bank_run_standing_orders(date, uuid, integer)`

This function delegates to `bank_run_standing_orders_for_date(...)`, which performs standing-order processing. The live parameterized wrapper is executable by `anon`; the zero-argument overload is already restricted. This creates an overload inconsistency and a financial control gap.

**Immediate migration action:**

```sql
REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date, uuid, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders(date, uuid, integer)
  TO authenticated;
```

**Preferred final posture:** grant only `service_role` if the function is intended exclusively for the scheduler/service-control plane. If an authenticated operator UI calls it, retain `authenticated` only after the function (or its delegated routine) enforces:

- `auth.uid()` is present;
- current company/tenant resolution is valid;
- operator role/capability is present;
- bounded `p_max_orders` is enforced server-side;
- requested date and order ID cannot escape the caller's tenant;
- execution is audited and idempotent.

Do not expose the internal `bank_run_standing_orders_for_date(...)` helper directly to browser roles.

### 2. `record_offline_sync_operation(...)`

The function already rejects unauthenticated execution with `auth.uid()` and `current_company_id()` checks. Nevertheless, exposing it to `anon` is incorrect and causes unnecessary attack surface and confusing advisor findings.

**Immediate migration action:**

```sql
REVOKE ALL ON FUNCTION public.record_offline_sync_operation(
  text, text, text, text, jsonb, jsonb, timestamptz
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_offline_sync_operation(
  text, text, text, text, jsonb, jsonb, timestamptz
) TO authenticated;
```

**Hardening follow-up:** change the function configuration to the standard pinned path:

```sql
ALTER FUNCTION public.record_offline_sync_operation(
  text, text, text, text, jsonb, jsonb, timestamptz
) SET search_path = pg_catalog, public, auth, pg_temp;
```

Keep the existing company-scoped unique key `(company_id, operation_id)`, request-hash mismatch rejection, and authenticated actor check. Add a server-side allowlist for `p_table_name` or map client operation codes to approved tables; do not let a client select arbitrary table names as an authorization mechanism.

## Priority 1 — replace broad public booking RPCs

The repository intentionally kept four booking functions public for a guest flight-booking journey. That is a product requirement, not a reason to leave broad internal RPCs callable by `anon`. Public access should be limited to dedicated wrappers with a deliberately small contract.

### 3. `get_booking(locator, surname)`

**Risk:** the function returns contact phone/email, passenger names and document type, ticket numbers, seat numbers and barcodes. Locator plus surname is a weak knowledge factor and can be brute-forced without request throttling.

**Replacement contract:**

- Generate a cryptographically random booking-access token at booking creation or after an OTP challenge.
- Store only a hash of the access token, with expiry and attempt counters.
- Expose `guest_get_booking(access_token)` rather than locator/surname lookup.
- Return only the minimum necessary data: booking status, itinerary, masked contact information and masked ticket/seat data.
- Require a second factor (email/SMS OTP) before returning barcodes or document-related data.
- Add rate limiting and failed-attempt telemetry at the edge/API layer.
- Use `FOR UPDATE` only where needed and avoid returning raw PII in error messages.

After the replacement is live and clients are migrated:

```sql
REVOKE ALL ON FUNCTION public.get_booking(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking(text, text) TO authenticated;
```

The old function may be retained for authenticated support staff only if the support role and tenant boundary are explicitly enforced; otherwise drop it in a later cleanup migration after an application reference audit.

### 4. `cancel_booking(locator, surname, refund_minor, refund_pct)`

**Risk:** an unauthenticated caller can mutate booking and seat state while supplying `p_refund_minor` and `p_refund_pct`. Even if the payment processor ignores these values, they are persisted in the audit detail and can create misleading financial records.

**Replacement contract:**

- Accept an opaque cancellation token or verified OTP, not locator plus surname alone.
- Lock the booking row with `FOR UPDATE`.
- Derive cancellation eligibility and refund amount from server-side booking/fare policy.
- Never accept refund amount or refund percentage from the public caller.
- Write a durable cancellation request/audit record with actor type, reason, policy version and idempotency key.
- Separate booking cancellation from payment/refund dispatch; refund confirmation must come from the payment provider/service role.
- Make repeated cancellation requests idempotent and return the existing result.
- Enforce tenant/property/flight ownership for authenticated staff paths.

Then revoke anonymous execution from the current function and grant it only to the authenticated support/operations path, or replace it entirely with a restricted guest wrapper.

### 5. `hold_seats(service_key, seats, ttl_seconds)`

**Risk:** anonymous callers can create inventory holds repeatedly. The function limits six seats and TTL, but those limits alone do not prevent distributed seat hoarding, service-key enumeration or repeated calls across sessions.

**Replacement contract:**

- Validate `service_key` against an existing service/flight row and reject unknown services before attempting seat writes.
- Enforce a short public TTL appropriate to the booking funnel; do not allow the maximum internal TTL for all callers.
- Add a booking-attempt/session token and a per-session active-hold limit.
- Add edge/API rate limiting by IP/device/session and alert on abnormal hold-release ratios.
- Keep the unique/locking behavior that prevents double allocation.
- Add an explicit release/expiry cleanup path and metrics for expired holds.
- Return only the hold token and expiry, never internal seat-occupancy details.
- Prefer calling this through a server endpoint that uses a narrow database wrapper rather than granting the broad internal function to `anon`.

Once the replacement is deployed, revoke anonymous execution from `hold_seats(text, smallint[], integer)` and keep authenticated/service execution according to the actual booking architecture.

### 6. `extend_hold(hold_token, ttl_seconds)`

**Risk:** the hold token is a bearer credential. Anyone obtaining it can extend the hold repeatedly within the allowed TTL range, potentially delaying inventory release.

**Replacement contract:**

- Bind the hold to a booking-attempt/session token and require both values.
- Enforce a maximum total hold lifetime, not only a maximum extension interval.
- Track extension count and reject repeated extensions beyond the funnel policy.
- Ensure the hold belongs to a valid service and has not transitioned to confirmed/released state.
- Apply edge/API rate limiting and audit extension attempts.
- Keep the current non-resurrection rule for expired holds.

After migration to the replacement wrapper, revoke anonymous execution from the current `extend_hold(uuid, integer)` function.

## Priority 2 — prevent recurrence

The repository contains a migration that intentionally leaves four booking functions public and a separate standing-order migration that revokes anonymous access. The live ACL contradiction must be investigated before deployment.

1. Compare the live migration ledger with the exact repository migration content and migration version actually applied.
2. Check whether the hardening migration was skipped, applied before a later function recreation, or applied to a different project.
3. Check `ALTER DEFAULT PRIVILEGES` and deployment scripts for any blanket `GRANT EXECUTE TO anon` behavior.
4. Add a CI migration-contract test that fails if any function in the internal denylist has `anon` or `PUBLIC` execute privilege.
5. Add a post-migration live readback query to the schema-health workflow.
6. Keep explicit grants in every function migration; never rely on owner defaults.
7. For every `CREATE OR REPLACE FUNCTION` migration, reassert the intended ACL because replacing a function can interact badly with drifted grants.

## Safe rollout sequence

1. **Inventory callers:** confirm whether production browser flows call the four booking functions directly and whether any worker calls the parameterized standing-order wrapper.
2. **Apply P0 grant correction:** revoke `anon` from the standing-order parameterized wrapper and offline-sync function; retain only the required role grants.
3. **Ship replacement booking wrappers:** token/OTP-based retrieval and cancellation, narrow seat hold/extension wrappers, rate limiting and redaction.
4. **Migrate clients:** update server/API callers first, then browser clients; do not expose the old RPC names to new code.
5. **Revoke old public grants:** remove `anon` and `PUBLIC` from the four old booking functions. Keep authenticated access only when required and authorization-tested.
6. **Run authenticated tenant tests:** verify valid user flows, cross-tenant denial, idempotency, cancellation policy, seat concurrency and hold expiry.
7. **Run anonymous negative tests:** assert HTTP/RPC permission denied for all six old functions.
8. **Run advisor and schema-health checks:** confirm the six findings are gone and no new RLS or function-grant regressions appear.

## Verification queries

Use exact signatures; PostgreSQL treats overloaded functions as separate privileges:

```sql
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'bank_run_standing_orders', 'cancel_booking', 'extend_hold',
    'get_booking', 'hold_seats', 'record_offline_sync_operation'
  )
ORDER BY p.proname, identity_arguments
LIMIT 50;
```

Expected final state:

- `anon_execute = false` for all six legacy functions.
- `authenticated_execute = true` only for functions retained for authenticated workflows.
- `service_execute = true` only for scheduler/provider/worker paths.
- Public guest functionality, if still required, is exposed only through dedicated narrow wrappers with token/OTP controls.

## Decision

No production grants, function definitions, RLS policies or tables were changed during this review. The next production action should be a separately reviewed additive security migration, preceded by caller inventory and a controlled staging/preview test. The first safe change is the P0 revocation for the standing-order parameterized wrapper and offline-sync function; the four booking functions require product-compatible replacement wrappers before anonymous access is removed.
