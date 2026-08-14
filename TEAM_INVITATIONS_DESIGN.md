# Team Invitation Service

## Purpose

Workspace administrators can invite a teammate from **Settings → Team Members**. Invitations are persistent server records rather than local UI state, and the existing self-service organization branding flow remains unchanged.

## Security model

The service derives the tenant exclusively from the verified Supabase profile attached to the caller’s bearer session. The browser cannot submit a company identifier. Only Organization Owner, CEO, Super Administrator, System Administrator, and HR Manager roles can list, create, resend, or revoke invitations. Recipient roles are allow-listed and cannot elevate an invitee to Super Administrator.

Tokens are generated on the server, stored only as SHA-256 hashes, expire after seven days, and are replaced during a resend. The acceptance route verifies the recipient’s authenticated Supabase identity and requires its email to match the invitation recipient before a server-only profile assignment can occur. Existing profiles assigned to a different company are rejected; the service never reassigns cross-tenant membership.

## Delivery and audit behavior

The service uses the existing server-only Resend credentials. A delivery failure remains visible as a truthful `delivery_failed` state and can be resent or revoked; the UI never reports an email as sent without a confirmed delivery response. Persistent data lives in the additive `team_invitations` application table and records the inviting profile, role, expiry, delivery state, revocation, and acceptance.

## Public authentication bundle

Unauthenticated `/app`, recovery, reset, and verification routes now load `PublicAuthGateway` instead of the full ERP shell. The final production build emitted a **6.64 kB (2.04 kB gzip)** public-auth chunk, while the retained dashboard shell remains a separate **9.44 MB (1.39 MB gzip)** deferred chunk for active sessions and the current full signup journey. Desktop visual checks confirmed both login and password recovery render correctly through the smaller boundary.
