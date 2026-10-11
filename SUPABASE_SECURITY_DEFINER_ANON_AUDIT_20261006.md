# Supabase SECURITY DEFINER / Anonymous Execution Audit

**Audit date:** 2026-10-06  
**Target:** Supabase project `rlhngsrihahhyxnjxrxm`  
**Scope:** All non-system PostgreSQL functions with `prosecdef = true`, effective `EXECUTE` privilege for the `anon` role, ownership, search path, and repository hardening contracts.

## Executive result

The live catalog contains **8 anonymous-executable SECURITY DEFINER functions**:

- **6 application/public-schema functions** requiring product/security remediation.
- **2 Supabase `pg_net` extension functions** that are extension-level outbound HTTP capabilities and should not be exposed through the anonymous PostgREST role unless an explicit public use case exists.

There are **no additional anonymous-executable SECURITY DEFINER functions in `public`** beyond the six listed below. The older advisor findings for `release_hold` and `seat_availability` are not present in the current live function catalog.

The newly added `public.fin_post_operational_entry(jsonb)` was verified separately and is correctly restricted: `anon_execute = false`, `authenticated_execute = true`, `SECURITY DEFINER = true`.

## Live findings

| Priority | Schema | Function signature | Owner | Anonymous execution | Assessment |
|---|---|---|---|---:|---|
| P0 | public | `bank_run_standing_orders(date, uuid, integer)` | postgres | Yes | Unauthenticated access to a financial standing-order runner. The repository contains hardening migrations intended to revoke this overload, but the live ACL still exposes it. |
| P0 | public | `cancel_booking(text, text, bigint, smallint)` | postgres | Yes | Anonymous state mutation and refund metadata acceptance. The function changes booking and seat state and returns refund information. |
| P1 | public | `get_booking(text, text)` | postgres | Yes | Anonymous locator/surname lookup returns contact data, passenger data, itinerary/quote data, ticket numbers, seats, and barcodes. Enumeration and privacy risk. |
| P1 | public | `hold_seats(text, smallint[], integer)` | postgres | Yes | Anonymous inventory mutation. A caller with a service key can hold up to six seats and retain them for up to one hour. No visible caller identity or rate-limit contract. |
| P1 | public | `extend_hold(uuid, integer)` | postgres | Yes | Possession of a hold UUID permits extending an active hold. This can hoard inventory if a token leaks. |
| P1 | public | `record_offline_sync_operation(text, text, text, text, jsonb, jsonb, timestamptz)` | postgres | Yes | The body fails closed when `auth.uid()` is null, but anonymous RPC exposure is still an incorrect privilege boundary. Repository migration intends to revoke it. |
| P0 | extension | `net.http_get(text, jsonb, jsonb, integer)` | supabase_admin | Yes | Anonymous callers can enqueue arbitrary outbound HTTP GET requests through `pg_net`. This is an SSRF/abuse surface unless intentionally exposed. |
| P0 | extension | `net.http_post(text, jsonb, jsonb, jsonb, integer)` | supabase_admin | Yes | Anonymous callers can enqueue outbound HTTP POST requests through `pg_net`, including caller-controlled URL/body/headers. This is a high-risk outbound request surface. |

## Functions confirmed safe from anonymous execution

The live query also confirmed `anon_execute = false` for the protected application routines reviewed in this audit, including:

- `auth_identity_snapshot()`
- Bank/MFI posting, approval, standing-order, AML, KYC, and loan routines except the parameterized `bank_run_standing_orders(date, uuid, integer)` overload noted above
- `complete_pos_sale(...)` and `complete_pos_return(...)`
- `employee_portal_action(...)` and `employee_portal_snapshot()`
- `fin_post_operational_entry(jsonb)`
- Finance capability helpers and `fin_require(...)`
- Fleet, hospitality, payroll, billing, community-groups, and platform-control routines
- Trigger-only and internal audit helpers

These functions are generally restricted to `authenticated`, `service_role`, or neither, according to their intended caller. The audit also confirmed hardened search paths on the reviewed functions, generally using `pg_catalog, public, auth, pg_temp`; the `net` extension functions use `search_path = net`.

## Repository-to-production discrepancy

The repository contains hardening migrations for the two unintended application exposures:

- `supabase/migrations/20260825_008_standing_order_security_hardening.sql`
- `supabase/migrations/20260915_002_resolve_bank_run_standing_orders_overload.sql`
- `supabase/migrations/20260920_001_offline_sync_receipts.sql`

Those migrations revoke anonymous execution in source control, but the production ACL for the parameterized standing-order overload and offline-sync routine still reports `anon_execute = true`. This indicates production drift, an incomplete migration application, or a later privilege re-grant.

## Recommended remediation

### Immediate, low-risk hardening

1. Revoke `PUBLIC, anon` from:
   - `public.bank_run_standing_orders(date, uuid, integer)`
   - `public.record_offline_sync_operation(text, text, text, text, jsonb, jsonb, timestamptz)`
2. Keep the parameterized standing-order runner on the controlled scheduler/service path. Do not expose the internal `bank_run_standing_orders_for_date(...)` helper to browser roles.
3. Revoke `anon` and ordinary `authenticated` execution from `net.http_get` and `net.http_post` unless the project has a documented public HTTP-use case. The existing scheduled standing-order workflow runs as a database-owned/server-controlled path and should not require anonymous execution.

### Public booking workflow remediation

The four booking functions may be required by an unauthenticated guest booking experience, so revoking them without replacing the public contract could break production booking. Before changing them:

- Replace locator/surname lookup with a short-lived opaque access token or OTP.
- Return only the minimum booking data needed by the guest journey.
- Derive cancellation/refund values server-side; do not accept caller-supplied refund amounts and percentages as authoritative values.
- Bind holds to a short-lived quote/session proof, enforce a maximum cumulative hold lifetime, and add rate limiting/idempotency.
- Add indistinguishable failure responses, enumeration resistance, and abuse telemetry.
- After the replacement is deployed, revoke anonymous execution from the legacy functions.

## Audit conclusion

The answer to the audit question is **not yet clean**: anonymous-executable SECURITY DEFINER functions remain in production. The exposure is fully enumerated above. The application-owned findings are not hidden or unknown, and the new finance posting function is correctly hardened; however, the live database still requires a privilege-remediation migration and a product decision/replacement path for the public booking functions.

No data was modified during this audit.
