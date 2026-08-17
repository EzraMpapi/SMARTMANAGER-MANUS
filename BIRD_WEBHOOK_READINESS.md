# Bird WhatsApp Webhook Readiness

Source reviewed: [Bird Webhooks & events documentation](https://bird.com/en-us/docs/guides/webhooks), accessed 2026-08-17.

Bird supports webhook subscriptions and requires inbound handlers to verify the webhook signature, reject deliveries whose `webhook-timestamp` is more than five minutes old, and deduplicate on `webhook-id` because deliveries are at-least-once. Signature verification must use the raw request body bytes. The HMAC-SHA256 input is `{webhook-id}.{webhook-timestamp}.{raw request body}`, keyed by the endpoint secret after removing the `whsec_` prefix and base64-decoding the remainder. During secret rotation, the handler should accept any valid `v1` signature in the header using a timing-safe comparison.

Project decision: the ERP keeps Bird inbound handling disabled until the owner supplies provider credentials, an approved channel, and the endpoint secret. No inbound webhook capability is claimed or enabled by this checkpoint. The existing server-side adapter remains outbound/provider-gated only.
