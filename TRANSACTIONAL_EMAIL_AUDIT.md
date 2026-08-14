# Transactional Email Architecture Audit

## Existing delivery model

Smart Manager currently has two server-confirmed application email paths, both delivered through the Resend HTTP API with server-only `RESEND_API_KEY` and `RESEND_FROM_EMAIL` values. Scheduled dashboard report attachments are generated in `server/dashboardReports.ts`; team invitations are delivered in `server/teamInvitations.ts`, record a provider delivery outcome, and visibly retain `delivery_failed` status when Resend rejects a request. The existing credential test validates the configured Resend key without revealing it.

Supabase Auth remains responsible for password signup confirmation, account verification, password recovery, session management, and OAuth. The browser invokes standard GoTrue `signup`, `recover`, and `resend` endpoints; authentication mail transport is therefore configured in Supabase Auth rather than through the application’s Resend helper.

## Security finding

The dashboard also contains an unrelated manual Email Center that stores a user-entered SMTP configuration in browser `localStorage` and opens `mailto:` links. It is not a transactional delivery service and must not be extended to accept the supplied secret. This will be changed so it does not invite browser-side SMTP credential storage or claim server delivery.

## Supplied credential assessment

The supplied credential is a 32-character hexadecimal value with no provider identifier, SMTP hostname, port, username, sender address, or API base URL. It does not establish compatibility with the existing Resend HTTP API and cannot safely be treated as an SMTP password or used as a replacement for the configured Resend key. No supplied value has been copied into project files, browser code, logs, or deployment configuration.

## Required production configuration for auth emails

To change Supabase Auth’s verification and recovery sender, a configured SMTP provider requires its provider name and the actual SMTP host, port, username, password/API key, and verified `from` address to be entered in the Supabase Auth SMTP settings. The application must not attempt to emulate or bypass those messages.

## Implemented application-side repair

The existing Resend paths are now centralised in a server-only transactional delivery module. The manual Email Center no longer stores SMTP fields in `localStorage`, opens a `mailto:` link, or creates a sent-state record before the provider accepts the message. It now uses a tenant-verified server procedure and shows a sent item only after a Resend acceptance ID is returned. Team invitations and scheduled reports use the same protected delivery boundary. Invoice reminders prepare a message in the secure Email Center rather than bypassing it with `mailto:`.
