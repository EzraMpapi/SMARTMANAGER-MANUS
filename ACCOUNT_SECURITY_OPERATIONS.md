# Account Security Operations

## Release scope

BusinessSphere ERP now renews a live Supabase browser session before its access token reaches expiry, while retaining the existing confirmed session-refresh signal that reloads tenant-scoped table data. A failed network renewal does not discard the active browser session. Only a definitive refresh-token failure clears local session storage and returns the user to sign-in.

The Security Settings page now includes **Tenant Activity Audit**. It reads confirmed records from `public.audit_log` through the authenticated Supabase session, applies the database’s existing `current_company_id()` RLS policy, and does not send a company identifier from the browser. The viewer offers server-side-history refresh plus local module, period, and text filters. Client-generated activity is shown as durable history only after a confirmed database insert succeeds.

## Native passkeys

The Account Passkeys panel in Security Settings uses Supabase Auth’s native passkey workflow. It lists, creates, renames, and revokes the signed-in user’s credentials through Supabase Auth; passkey private keys and biometric templates remain with the user’s authenticator and are never stored by this application. Registration, rename, and revocation update the interface only after Supabase confirms the operation.

| Requirement | Operator action |
|---|---|
| Enable the feature | In Supabase Dashboard, open **Authentication → Passkeys**, enable passkeys, and configure the relying-party display name, stable relying-party ID, and allowed HTTPS origins. |
| Production origin | Include `https://bserp-dashbo-xgm6fauw.manus.space` or the approved custom domain in the allowed origins. |
| Relying-party ID | Choose and keep a stable bare domain. Changing it invalidates existing passkeys for sign-in. |
| Browser support | Enroll from a recent HTTPS browser with WebAuthn and an available platform authenticator, security key, or password manager. |
| Recovery | Keep a tested password or OAuth recovery method until at least two passkeys have been verified. |

> Supabase documents passkeys as an experimental feature that requires explicit client opt-in and project-level relying-party configuration. The application enables the client opt-in and reports `passkey_disabled` clearly until the project setting is completed. [1]

## Validation evidence

The account-security release passed TypeScript validation, production bundling, and the full automated suite: **53 passing test files, 187 passing tests, and 7 intentionally gated skips**. Focused coverage verifies renewal timing and terminal-error handling, tenant audit-log loading and filtering boundaries, and confirmed passkey list, registration, rename, and revocation behavior.

## Reference

[1]: https://supabase.com/docs/guides/auth/passkeys "Supabase Auth: Passkey authentication"
