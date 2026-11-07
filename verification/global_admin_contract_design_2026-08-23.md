# Global Admin Control Center contract design — 2026-08-23

## Authorization

The platform-admin boundary will reuse the existing live Supabase function `billing_is_platform_admin()`, which derives `auth.uid()` from the current bearer token and allows only profiles whose normalized role is `super administrator` or `platform administrator`. The server will first validate the authenticated Supabase session with the existing `resolveVerifiedProfile()` pattern, then call platform-admin RPCs using the verified user token. The client will not submit a trusted company ID, actor ID, or platform scope.

The existing tenant roles (`owner`, `admin`, `staff`) and workforce role/capability model remain unchanged for ordinary workspace behavior. The legacy Drizzle `ctx.user.role === 'admin'` procedures are not reused for cross-tenant visibility because they do not prove the live Supabase platform role.

## Live read contract

A new `platform_admin_snapshot()` RPC will return a bounded JSON document assembled from live relations. It will include aggregate counts and limited lists for companies, profiles, module status, subscription events/payments, support tickets, WhatsApp accounts/messages, and workforce catalogs. It will report runtime/provider surfaces that have no live source as `{ status: 'unavailable', reason: 'No configured source' }` rather than fabricate values. It will include a database health signal only for successful execution of the function itself.

The snapshot will use `billing_is_platform_admin()` as its first gate, fixed `search_path`, `SECURITY DEFINER`, bounded `jsonb_agg` subqueries, and only non-secret operational fields. It will not expose password, provider secrets, raw webhook payloads, access tokens, or broad unbounded tenant rows.

## Controlled action contract

A new `platform_admin_record_action(p_action, p_target_type, p_target_id, p_reason, p_confirmation_text, p_details)` RPC will require the same platform-admin gate, non-empty reason, and an exact confirmation token derived from the target/action. It will insert into a new `platform_admin_actions` ledger. No destructive business mutation is included in the first release; the ledger is the safe foundation for future server-side actions. The UI will require explicit confirmation and reason, and will show that impersonation is not available.

The new ledger is necessary because the existing `audit_log` table is tenant-scoped by `audit_log_tenant` and grants broad authenticated CRUD; it is not an adequate global-admin action boundary. The new table will deny direct `anon`/`authenticated` table privileges, enable RLS with no direct authenticated policies, and expose only the guarded RPC to authenticated platform administrators. Service-role access remains available for operational support.

## UI sections and source availability

The workspace will use a responsive control-center layout with Overview, Platform health, Tenants, Users & access, Subscriptions & billing, Modules, Security & audit, Integrations, WhatsApp, AI, Support, Notifications, Database, API & webhooks, Reports, and Settings. Overview, Tenants, Users, Subscriptions, Modules, Security, WhatsApp, Support, Notifications, and RBAC will use the live snapshot. AI, generic integrations, API runtime telemetry, and report scheduling will show explicit unavailable states when no live source exists. Existing billing and compliance components will be linked or reused rather than duplicated.

All loading, error, retry, and empty states are explicit. Dangerous-action UI is disabled until both reason and confirmation text validate. No client-only role check grants access; unauthorized callers receive a server denial.
