# Account Security Operations

## Release scope

BusinessSphere ERP now renews a live Supabase browser session before its access token reaches expiry, while retaining the existing confirmed session-refresh signal that reloads tenant-scoped table data. A failed network renewal does not discard the active browser session. Only a definitive refresh-token failure clears local session storage and returns the user to sign-in.

The Security Settings page now includes **Tenant Activity Audit**. It reads confirmed records from `public.audit_log` through the authenticated Supabase session, applies the database’s existing `current_company_id()` RLS policy, and does not send a company identifier from the browser. The viewer offers server-side-history refresh plus local module, period, and text filters. Client-generated activity is shown as durable history only after a confirmed database insert succeeds.

## Native passkeys

The Account Passkeys panel in Security Settings uses Supabase Auth’s native passkey workflow. It lists, creates, renames, and revokes the signed-in user’s credentials through Supabase Auth; passkey private keys and biometric templates remain with the user’s authenticator and are never stored by this application. Registration, rename, and revocation update the interface only after Supabase confirms the operation.

The login page also offers **Sign in with a passkey**. It uses Supabase Auth’s discoverable-credential ceremony, which lets the selected authenticator identify the user without an email field. The application stores a session only when Supabase returns a complete access token, refresh token, and user. If passkeys are disabled, unavailable, cancelled, or do not match an enrolled credential, the page preserves all other sign-in methods and shows a clear recovery message.

After a verified user signs in, Security Settings shows **Set up your first passkey** when the account has no enrolled passkeys. The guidance does not replace password, recovery, or approved OAuth methods. The **Passkey readiness** card is visible only to organization-administrator roles. It reports the local browser’s WebAuthn capability and surfaces an explicit action-required state when Supabase confirms that passkeys are disabled; it does not claim that the platform relying-party configuration is complete unless a live enrollment succeeds.

After the first passkey is enrolled, the same panel shows **Add a second passkey for recovery** until the account has at least two registered credentials. The recommendation is to use separate approved devices or password managers and retain a tested recovery method. Two registered passkeys improve account recovery options but do not replace the need for organization-approved account recovery procedures.

Confirmed passkey enrollment and revocation now write `Passkey enrolled` and `Passkey revoked` events to the current tenant’s `public.audit_log` only after the Supabase Auth operation and subsequent audit insert both confirm. If an audit insert fails, the interface reports that the passkey operation succeeded but its history event was not persisted; it does not display an unconfirmed event as durable history.

## Organization industry focus

An organization administrator can select one supported industry focus in Company Profile: universal business, retail, manufacturing, professional services, healthcare, education, or hospitality. The value is persisted in the tenant’s `companies.category` field through the existing owner-authorized branding procedure. After a confirmed authenticated workspace bootstrap, the login presentation keeps a non-authoritative browser presentation cache of that confirmed value so the next login can restore the appropriate module constellation. The browser cache never authorizes access or replaces the tenant-scoped server value.

New workspace setup flows—both password-based and OAuth—present the same controlled focus selection. The selected focus is submitted to the tenant-creating RPC and followed by the confirmed branding save where applicable. A confirmed industry-focus change from Settings writes `Organization industry focus changed` to the RLS-scoped `public.audit_log` history only after the tenant audit insert returns a database row. If the audit insert fails, the UI reports that the focus change succeeded but the audit event needs retry; it never presents an unconfirmed audit record as durable history.

The authenticated header and account menu display only the current workspace’s confirmed industry focus. It is passed from the hydrated active company record and is not an organization-switcher or a lookup into other tenant data. Organization administrators also receive a guided **Quarterly security review** checklist in Security Settings. Its checkbox progress is deliberately browser-local and expressly not compliance evidence; operators should use the tenant audit history and their formal compliance process for evidence.

Quarterly review completion is scoped to the active browser, active account, active workspace, and calendar quarter. A completion marker belonging to a different user or workspace cannot suppress the current administrator’s reminder. The marker does not write a compliance record, create an audit event, or trigger email; confirmed tenant audit exports and formal compliance processes remain the evidence source.

| Requirement | Operator action |
|---|---|
| Enablement status | **Enabled on 16 August 2026** in the production Supabase project. |
| Relying-party display name | `Smart Manager` |
| Production origin | `https://bserp-dashbo-xgm6fauw.manus.space` is configured as an allowed origin. Add any approved custom domain before asking users to enroll from it. |
| Relying-party ID | `bserp-dashbo-xgm6fauw.manus.space` is the current stable bare domain. Changing it invalidates existing passkeys for sign-in. |
| Browser support | Enroll from a recent HTTPS browser with WebAuthn and an available platform authenticator, security key, or password manager. |
| Recovery | Keep a tested password or OAuth recovery method until at least two passkeys have been verified. |

> Supabase documents passkeys as an experimental feature that requires explicit client opt-in and project-level relying-party configuration. The application enables the client opt-in and reports `passkey_disabled` clearly until the project setting is completed. Supabase’s discoverable passkey sign-in returns both a user and session only after server verification. [1]

## Validation evidence

The account-security release passed TypeScript validation, production bundling, and the full automated suite: **53 passing test files, 187 passing tests, and 7 intentionally gated skips**. Focused coverage verifies renewal timing and terminal-error handling, tenant audit-log loading and filtering boundaries, and confirmed passkey list, registration, rename, and revocation behavior.

## Security operations follow-up

Production passkey authentication is enabled for the Smart Manager relying party at `bserp-dashbo-xgm6fauw.manus.space`. Users must register a passkey before attempting discoverable passkey sign-in; a user without an enrolled credential should continue with password or an approved provider and then enroll from Security Settings.

The public Smart Manager landing page also exposes a **Sign in with a passkey** action. It invokes the same native Supabase discoverable-passkey ceremony and shared confirmed-session persistence helper as the secure `/app` login gateway; it does not create a second authentication route, accept a browser-supplied identity, or store a session before Supabase returns a confirmed session.

Security Settings now includes a quarterly review-due reminder that remains visible to administrators until the checklist is completed in that browser. The reminder is intentionally local and does not claim compliance completion. Confirmed tenant activity can be exported as a formula-safe CSV evidence file, filtered to the authenticated user’s existing RLS-scoped audit history.

Role changes are no longer applied by the local Settings role selector. A user submits a role request to a server-backed approval record; an independent Organization Owner, CEO, Super Administrator, or System Administrator may approve or reject it. The server rejects self-approval and applies an approved role only after the authenticated request and secure profile update both succeed. A project-approved email sender is still required before quarterly reminder emails can be sent; until then, the application shows the in-app reminder and never reports an email as delivered.

The Compliance Audit Trail export now combines confirmed audit events with role-change approval history through a server-verified `auditLogs.complianceExport` boundary. The boundary rejects a company identifier that does not match the authenticated profile’s company before returning either data source. CSV fields are quoted, newline-normalized, and guarded against spreadsheet formulas beginning with `=`, `+`, `-`, or `@`.

Resend has been explicitly approved for the future quarterly reminder sender, but the current `From` candidate is not a syntactically valid email identity and therefore cannot be verified. The Resend sender-verification test remains gated until an exact verified sender address is configured; outbound quarterly reminders remain disabled, and no delivery success state is shown.

## Reference

[1]: https://supabase.com/docs/guides/auth/passkeys "Supabase Auth: Passkey authentication"
