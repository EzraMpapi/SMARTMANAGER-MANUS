# Release Note: Persistent Trial Expiry Notice and Global Admin Support

## Summary

SMART MANAGER now handles free-trial expiry notices as a server-authoritative, per-account workflow. When an authenticated user’s trial has actually ended, the system checks backend subscription timestamps and shows the expiry notice once. The notice state is stored against the authenticated user and subscription, so it is not replayed after refresh, logout/login, browser restart, device change, or navigation.

## What changed

The backend adds a durable trial-notice record with claim and acknowledgement state. Row locking, a short claim lease, and a unique user/subscription key prevent concurrent tabs or devices from displaying the same notice more than once. Paid, renewed, active, cancelled, inactive, and already-acknowledged subscriptions are suppressed according to their server-side lifecycle state.

The notice gate is mounted at the shared authenticated root, covering the internal ERP shell and the External Client and Supplier portals. External portal users receive the notice without being given internal billing navigation; plan changes remain administrator-managed for those roles.

Global Admins now have a dedicated dashboard panel to inspect notice records by company, user, or subscription. A reset requires a documented support/testing reason, is authorized on the server, and records the action through the existing Subscription Billing audit sinks.

## Verification status

| Area | Status |
|---|---|
| Focused trial-notice tests | Passed: 10/10 |
| Full Vitest suite | Passed: 205 files, 845 tests; 5 files and 13 tests skipped |
| TypeScript check | Passed |
| Vercel-compatible production build | Passed; existing large dashboard chunk warning remains |
| Live Supabase migration | Applied and validated previously |
| Live disposable-user HTTP E2E | Pending: no isolated staging project/branch or disposable Auth fixture is available |
| Vercel preview for `auth-provider-preview-e2e` | Not available in the inspected linked project; listed deployments point to `main` or an unrelated Dependabot branch |

## Release boundary

The implementation is pushed to `auth-provider-preview-e2e` at commit `34f0defd7e37b9a0c49ca18249297dadd2a52b53`. PR #15 remains open. Production deployment and PR merge are not implied by this release note.

## Stakeholder action

Approve a non-production Vercel preview and disposable Supabase Auth fixture environment before live HTTP E2E certification. Until then, the automated unit, contract, runtime, build, and controlled concurrency evidence remains the release basis.
