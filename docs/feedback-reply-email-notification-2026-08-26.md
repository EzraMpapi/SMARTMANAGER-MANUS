# Feedback Reply Email Notifications — 2026-08-26

## Behavior

When a Global Admin saves a reply to a website feedback record, the server stores the reply and review status first. If the feedback includes a valid email address and notification delivery is enabled, the server sends a branded reply email through the existing Resend transactional email helper. The message includes the admin response and the original feedback text.

Each delivery is classified as `not_requested`, `disabled`, `sent`, or `failed`. The delivery status, provider delivery ID when available, and accepted timestamp are stored on `public.website_feedback_submissions`. The Global Admin panel shows the result after saving.

## Safe configuration

Delivery is intentionally opt-in. The deployment owner must configure these server-only variables in the deployment environment:

```text
FEEDBACK_REPLY_EMAIL_NOTIFICATIONS=true
RESEND_API_KEY=<server secret stored in the deployment secret manager>
RESEND_FROM_EMAIL=<verified sender address>
```

Do not place these values in the repository, frontend variables, browser code, or committed `.env` files. If the feature flag or Resend credentials are missing, the admin reply is still preserved and the notification status is recorded as `disabled`; no provider call is attempted.

## Authorization and audit

Only a verified `Platform Administrator` or `Super Administrator` can read the feedback queue or save a reply. The reply procedure uses server-side service-role access and records `REPLY_TO_WEBSITE_FEEDBACK` in the Global Admin audit ledger. The UI never receives the server secret or performs direct Supabase table writes.

## Delivery safeguards

Recipient parsing accepts only one valid email address from the feedback record. HTML is escaped through the existing branded email helper, and the original reply is sent with a plain-text fallback. An idempotency key derived from the feedback ID and reply content helps prevent duplicate provider acceptance for the same reply.

## Current environment status

The code and database migrations are deployed to the repository and live Supabase migration ledger. The sandbox did not contain or modify production email credentials, so provider delivery was not exercised against a real mailbox. A deployment owner can enable the feature in the managed environment, then verify a disposable feedback submission through the Global Admin panel.
