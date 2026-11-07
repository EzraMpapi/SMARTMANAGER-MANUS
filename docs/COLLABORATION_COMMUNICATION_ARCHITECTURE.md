# Collaboration communication architecture

## Recommendation

Smart Manager should not become a second Gmail or WhatsApp inbox. The recommended split is:

- **Team Channels**: internal collaboration, mentions, threads, pins, reactions, and tenant-scoped persistence.
- **Email Center**: branded transactional email composer and a durable sent/draft audit view. Messages leave through a server-side approved provider only.
- **WhatsApp Center**: customer/employee contact list, templates, click-to-chat handoff, and an activity record. Automated WhatsApp delivery is a separate provider integration and must not expose credentials in the browser.
- **Customer interaction history**: every outbound email or WhatsApp handoff should be retained as an interaction record linked to the customer/CRM lead when the persistence table is available.

This avoids duplicate inboxes while preserving an auditable record of how customers relate with the company.

## Email delivery status

The Email Center now calls `trpc.transactionalEmail.send`. It does not use `mailto:`, browser SMTP credentials, or a fake success state. The server returns a sent record only after the provider accepts the message. If provider configuration is missing, the server fails closed and the user can save a draft or export a branded template.

Current delivery implementation: **Resend API**, using `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on the server. Delivery is enabled only when both variables are present.

## About `smatimeneja@gmail.com`

A Gmail mailbox address cannot normally be used as a sender through Resend unless the provider has explicitly verified and authorised that sender/domain. Do not put a Gmail password, SMTP password, API key, or refresh token in the React application.

Choose one of these production configurations:

### Option A — recommended for business mail

1. Verify a company domain in Resend (for example `mail.example.co.tz`).
2. Set the server secret `RESEND_API_KEY`.
3. Set `RESEND_FROM_EMAIL` to a verified address such as `Smart Manager <no-reply@mail.example.co.tz>`.
4. Deploy/restart the server and run the sender verification test.

### Option B — exact Gmail From address

If messages must show exactly `smatimeneja@gmail.com`, add a server-side Gmail transport using Google OAuth 2.0 or Gmail SMTP with an app password. This requires a Google Cloud OAuth client and a refresh token/app password supplied through the deployment secret manager. It is intentionally not implemented with browser credentials. The existing Email Center contract can remain unchanged while the provider adapter is swapped on the server.

Required external setup is still outstanding because this repository/environment has no Gmail or Resend credentials configured. No email can be sent until an authorised provider is configured.

## WhatsApp recommendation

Keep the current click-to-chat path for ordinary human-led conversations. It opens WhatsApp with a pre-filled message and records the handoff. Add Bird/Meta automated delivery only when the business has:

- an approved WhatsApp Business sender,
- server-side provider credentials,
- consent/template governance,
- delivery and failure webhooks, and
- tenant-scoped audit records.

Do not remove the archive/handoff behavior when automated delivery is enabled; it is the customer-history layer.
