# SMART MANAGER — Anonymous `SECURITY DEFINER` Review and Wave 006 Plan

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Status:** Review and plan only; no Wave 006 DDL or privilege change was executed.

## Executive decision

The six anonymous-executable `SECURITY DEFINER` routines are part of the public booking and seat-hold surface. They are not safe for a blanket `REVOKE`, blanket `SECURITY INVOKER` conversion, or generic RLS change without first proving which public workflows depend on each exact signature.

The immediate recommendation is **not to remove all six from `anon`**. Instead, Wave 006 should use a function-by-function contract review, reduce public exposure where a documented workflow does not require it, and harden state-changing routines before any grant change. The current catalog already pins every reviewed function to `search_path=public, pg_temp`, but the stronger final form should use `search_path=''` with fully schema-qualified references after regression testing. The six functions currently also grant `EXECUTE` to `authenticated`, `service_role`, and `postgres`; no `PUBLIC` grant was returned for these signatures.

## Live function inventory

| Function signature | Current behavior | Main exposure concern | Wave 006 disposition |
|---|---|---|---|
| `cancel_booking(text,text,bigint,smallint)` | Finds a confirmed booking by locator and passenger surname, changes it to `REFUNDED`, releases confirmed seats, writes an audit row, and returns refund values. | The caller supplies refund amount and percentage; the function performs a financial/state mutation and exposes whether the verification matched. | **P0 review.** Keep anonymous only if cancellation is a documented public workflow and refund values are recomputed or validated against server-owned booking policy. Otherwise revoke `anon` and route through an authenticated or separately protected service boundary. |
| `extend_hold(uuid,integer)` | Extends a non-expired `HELD` seat record by hold token for 60–3,600 seconds. | Possession of a hold UUID is the only ownership proof; a compromised token can extend another party’s hold. | **P0 review.** Require a documented holder proof/rate-limit contract, enforce maximum lifetime rather than only per-call TTL, and audit the mutation. Revoke anonymous execution if the public client does not require it. |
| `get_booking(text,text)` | Returns booking status, itinerary/quote data, contact phone/email, passengers, tickets, seat numbers, and barcodes after locator/surname matching. | This is a high-value public disclosure surface containing contact data, passenger data, and ticket/barcode material; it is vulnerable to locator/surname enumeration. | **P0 hardening.** Minimize the return shape, suppress or separately protect contact/ticket/barcode fields, add enumeration resistance and rate limiting, and test indistinguishable failure behavior. Do not revoke until the public self-service contract is replaced or confirmed unnecessary. |
| `hold_seats(text,smallint[],integer)` | Creates a UUID hold token for up to six seats on a service key, validates TTL, clears expired holds, and relies on a unique constraint for concurrency. | Any caller able to use a service key can reserve seats; there is no visible caller identity, quote binding, idempotency key, or rate limit in the reviewed body. | **P0 hardening.** Bind the request to a short-lived quote/session proof, enforce service metadata server-side, add rate limiting and idempotency, and audit abuse signals. Keep anonymous only if the public booking workflow requires it and the abuse controls are proven. |
| `release_hold(uuid)` | Releases all `HELD` seats associated with a hold token. | Token possession is the only authorization check; a stolen token can cancel someone else’s hold. The mutation has no visible audit write. | **P0 review.** Require holder proof or a stronger signed token, record an audit/security event, and revoke anonymous execution if release is server-only. |
| `seat_availability(text,smallint)` | Computes free seat numbers for a service key and caller-supplied capacity, considering confirmed and live held seats. | Public enumeration and caller-controlled capacity can reveal operational data or create inconsistent views if service capacity is not server-owned. | **P1 hardening.** Resolve capacity from the service record, return only the intended public availability shape, rate-limit requests, and consider `SECURITY INVOKER` or a narrow public read path if RLS permits. |

## Existing controls and gaps

All six definitions have `SECURITY DEFINER` and `SET search_path TO 'public', 'pg_temp'`. Their table and function references are unqualified, so changing the path to the empty string is not a mechanical one-line change; the body must be rewritten with `public.` qualification and retested. The current bodies include useful validation such as null/range checks, bounded seat counts, TTL limits, non-expired hold checks, and a unique-constraint-based seat race control. They do not, by themselves, establish rate limiting, caller ownership beyond the supplied locator/surname/token, quote binding, or complete mutation audit coverage.

## Wave 006 execution gates

### Gate 1 — Freeze the public contract

Map every browser, server, Edge Function, and external booking-client call to the exact routine signature. Record whether the call is made with the `anon` or `authenticated` Postgres role, what fields are required by the client, and whether any result is displayed or persisted. No grant change should be made until the call map is complete.

### Gate 2 — Define the public threat model

For each routine, test invalid locator/surname combinations, repeated enumeration, guessed or replayed hold tokens, cross-service token use, expired and maximum TTLs, duplicate seats, excessive capacity, concurrent holds, refund manipulation, and cross-tenant/service-key access. Responses for non-existent, mismatched, expired, and unauthorized identifiers should not disclose more than the documented public contract allows.

### Gate 3 — Harden implementation before privilege reduction

Prefer server-owned booking, quote, service, capacity, refund, and expiry values over caller-supplied authority. Add or verify rate limiting at the public boundary, short-lived signed booking/hold proofs, idempotency for state-changing calls, maximum total hold lifetime, and audit/security events for hold creation, extension, release, and cancellation. Preserve the unique constraint and transaction semantics that prevent double booking.

### Gate 4 — Apply only signature-specific privilege changes

After Gates 1–3 pass, evaluate the following candidate actions individually:

| Candidate action | Preconditions |
|---|---|
| Revoke `anon` from `cancel_booking` | Public cancellation is not required, or a protected replacement exists; authenticated/service paths are tested. |
| Revoke `anon` from `release_hold` and/or `extend_hold` | Public clients do not call them directly, or a signed holder proof is enforced by a replacement path. |
| Retain `anon` for `seat_availability` | The returned shape is intentionally public, capacity is server-owned, and rate limiting is in place. |
| Retain `anon` for `hold_seats` | Quote/session binding, abuse controls, idempotency, and concurrency tests pass. |
| Retain `anon` for `get_booking` | Minimal disclosure, enumeration resistance, and public self-service requirements are documented. |
| Revoke `authenticated` from any routine | Exact application call sites confirm no signed-in workflow needs the public RPC; otherwise authenticated users may be unintentionally blocked. |
| Revoke `service_role` or `postgres` | **Not proposed in Wave 006.** Requires platform/infrastructure ownership review. |

Every `REVOKE` must target the exact signature and be preceded by `REVOKE EXECUTE ... FROM public` where appropriate, followed by explicit grants to only the intended roles. No all-functions-in-schema revoke is authorized by this plan.

### Gate 5 — Harden the definer boundary

Rewrite each retained definer with `SET search_path=''` and schema-qualify every relation and callable reference, or document why a narrower fixed path is required. Recheck caller validation, return columns, volatility, exception behavior, and transaction boundaries. Re-run security tests under `anon`, `authenticated`, and service roles with allowed and denied booking cases.

### Gate 6 — Production canary and rollback

Apply one function family at a time in a controlled environment, monitor booking success, hold collisions, release/extension failures, refund mismatches, and public error rates, then promote only after owner approval. Rollback means restoring the prior exact function definition/grant matrix from a reviewed migration; it does not mean disabling RLS or broadly reopening execution.

## Required test matrix

| Test area | Required cases |
|---|---|
| Booking lookup | Correct locator/surname, wrong surname, unknown locator, cancelled/refunded booking, repeated enumeration, response-shape minimization. |
| Seat availability | Valid service, unknown service, fixed server capacity, extreme capacity input, rate-limit behavior, stale/expired holds. |
| Hold creation | Duplicate seats, >6 seats, invalid TTL, expired service/quote, two concurrent callers for the same seat, idempotent retry, cross-service key. |
| Hold mutation | Correct holder proof, wrong proof, guessed UUID, expired hold, maximum lifetime, repeated extension, release/extension audit event. |
| Cancellation | Refund policy recomputation, tampered amount/percentage, wrong passenger verification, replay, audit entry, seat release, financial reconciliation. |
| Role and tenant boundary | `anon`, `authenticated`, `service_role`, and denied cross-tenant/service cases; no caller-supplied tenant or service identifier becomes authority by itself. |

## Wave 006 deliverables

1. A call-site and role matrix for all six exact signatures.
2. Function-by-function contract tests and public abuse tests.
3. A reviewed migration containing only approved exact-signature grant or body changes.
4. A rollback script and canary runbook.
5. Post-change advisor and catalog evidence showing the intended grant reduction without unrelated changes.

## Explicit non-actions

This plan does not authorize disabling RLS, accepting arbitrary JWT algorithms, revoking all public functions, moving routines out of the public schema without client migration, or exposing service credentials. It also does not claim that any of the six functions is already exploitable; it identifies the concrete trust boundaries that must be proven before changing production privileges.

## References

[1]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"  
[3]: https://supabase.com/docs/guides/database/inspect "Supabase Database Debugging and Monitoring"  
[4]: https://www.postgresql.org/docs/current/sql-createfunction.html "PostgreSQL CREATE FUNCTION"
