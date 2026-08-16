# Account Security Operations

## Release scope

BusinessSphere ERP now renews a live Supabase browser session before its access token reaches expiry, while retaining the existing confirmed session-refresh signal that reloads tenant-scoped table data. A failed network renewal does not discard the active browser session. Only a definitive refresh-token failure clears local session storage and returns the user to sign-in.

The Security Settings page now includes **Tenant Activity Audit**. It reads confirmed records from `public.audit_log` through the authenticated Supabase session, applies the database’s existing `current_company_id()` RLS policy, and does not send a company identifier from the browser. The viewer offers server-side-history refresh plus local module, period, and text filters. Client-generated activity is shown as durable history only after a confirmed database insert succeeds.

## Native passkeys

The Account Passkeys panel in Security Settings uses Supabase Auth’s native passkey workflow. It lists, creates, renames, and revokes the signed-in user’s credentials through Supabase Auth; passkey private keys and biometric templates remain with the user’s authenticator and are never stored by this application. Registration, rename, and revocation update the interface only after Supabase confirms the operation.

The login page also offers **Sign in with a passkey**. It uses Supabase Auth’s discoverable-credential ceremony, which lets the selected authenticator identify the user without an email field. The application stores a session only when Supabase returns a complete access token, refresh token, and user. If passkeys are disabled, unavailable, cancelled, or do not match an enrolled credential, the page preserves all other sign-in methods and shows a clear recovery message.

After a verified user signs in, Security Settings shows **Set up your first passkey** when the account has no enrolled passkeys. The guidance does not replace password, recovery, or approved OAuth methods. The **Passkey readiness** card is visible only to organization-administrator roles. It reports the local browser’s WebAuthn capability and surfaces an explicit action-required state when Supabase confirms that passkeys are disabled; it does not claim that the platform relying-party configuration is complete unless a live enrollment succeeds.

After the first passkey is enrolled, the same panel shows **Add a second passkey for recovery** until the account has at least two registered credentials. The recommendation is to use separate approved devices or password managers and retain a tested recovery method. Two registered passkeys improve account recovery options but do not replace the need for organization-approved account recovery procedures.

## Organization industry focus

An organization administrator can select one supported industry focus in Company Profile: universal business, retail, manufacturing, professional services, healthcare, education, or hospitality. The value is persisted in the tenant’s `companies.category` field through the existing owner-authorized branding procedure. After a confirmed authenticated workspace bootstrap, the login presentation keeps a non-authoritative browser presentation cache of that confirmed value so the next login can restore the appropriate module constellation. The browser cache never authorizes access or replaces the tenant-scoped server value.

New workspace setup flows—both password-based and OAuth—present the same controlled focus selection. The selected focus is submitted to the tenant-creating RPC and followed by the confirmed branding save where applicable. A confirmed industry-focus change from Settings writes `Organization industry focus changed` to the RLS-scoped `public.audit_log` history only after the tenant audit insert returns a database row. If the audit insert fails, the UI reports that the focus change succeeded but the audit event needs retry; it never presents an unconfirmed audit record as durable history.

| Requirement | Operator action |
|---|---|
| Enable the feature | In Supabase Dashboard, open **Authentication → Passkeys**, enable passkeys, and configure the relying-party display name, stable relying-party ID, and allowed HTTPS origins. |
| Production origin | Include `https://bserp-dashbo-xgm6fauw.manus.space` or the approved custom domain in the allowed origins. |
| Relying-party ID | Choose and keep a stable bare domain. Changing it invalidates existing passkeys for sign-in. |
| Browser support | Enroll from a recent HTTPS browser with WebAuthn and an available platform authenticator, security key, or password manager. |
| Recovery | Keep a tested password or OAuth recovery method until at least two passkeys have been verified. |

> Supabase documents passkeys as an experimental feature that requires explicit client opt-in and project-level relying-party configuration. The application enables the client opt-in and reports `passkey_disabled` clearly until the project setting is completed. Supabase’s discoverable passkey sign-in returns both a user and session only after server verification. [1]

## Validation evidence

The account-security release passed TypeScript validation, production bundling, and the full automated suite: **53 passing test files, 187 passing tests, and 7 intentionally gated skips**. Focused coverage verifies renewal timing and terminal-error handling, tenant audit-log loading and filtering boundaries, and confirmed passkey list, registration, rename, and revocation behavior.

## Reference

[1]: https://supabase.com/docs/guides/auth/passkeys "Supabase Auth: Passkey authentication"
