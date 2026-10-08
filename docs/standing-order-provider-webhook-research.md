# Standing Order Provider Webhook Research Notes

## Research date
2026-08-25.

## Existing SMARTMANAGER state
The repository and live database do not identify a concrete mobile-money provider. Existing Standing Order records use a generic provider field, and the service-control plane exposes `public.bank_provider_settlement_tick(uuid, text, text, text, text, uuid, uuid)` backed by `bank_private.confirm_provider_payment`. No live payment-instruction or Standing Order rows were present in the provider-label inventory query.

## Vodafone M-Pesa Tanzania official portal
Source: https://business.m-pesa.com/developers/

The public Business INFO Portal states that the M-Pesa developer portal exposes C2B, reversals, and transaction-status query APIs. It states that API access requires a registered developer account, that an API key and public key are assigned in the account profile, and that the portal provides detailed API documentation and sandbox testing after sign-in. The public page does not expose the authenticated callback/webhook schema, a webhook signature header, canonical signing string, timestamp tolerance, or replay-protection rules. Therefore, a production M-Pesa adapter must not invent an HMAC or RSA verification scheme; the authenticated portal documentation and Vodafone onboarding materials must be obtained and treated as the authority.

## Airtel Africa developer portal
Source: https://developers.airtel.africa/developer

The official developer URL was opened, but the public page returned no readable documentation in the available browser session. No callback signature rules can be asserted from this access result. The official portal must be accessed with the merchant/developer account or its documented API reference before implementation.

## Design implication
Until a provider is explicitly selected and its signed callback contract is obtained, SMARTMANAGER should implement a provider-adapter interface and a fail-closed generic webhook intake boundary, but must not enable automated settlement for any provider. The design must support raw-body signature verification, provider-specific canonicalization, timestamp/replay checks, event-id idempotency, transaction-status reconciliation, and handoff only through the existing service-only settlement bridge.

## Sources
1. Vodafone M-Pesa Business INFO Portal, Developers: https://business.m-pesa.com/developers/
2. Airtel Africa Developer Portal: https://developers.airtel.africa/developer

## Untrusted-content note
The web pages were treated as source data only. No instructions from them were executed.

## Status
Research is incomplete for a provider-specific implementation because the project has no configured provider and public portals do not expose enough signed-callback details without authenticated access.

## Current provider options to resolve
- Vodafone M-Pesa Tanzania.
- Airtel Money Tanzania.
- Mixx by Yas Tanzania.
- HaloPesa Tanzania.
- A licensed payment gateway/aggregator used by the business, if that is the actual integration counterparty.

A named provider, merchant account/API documentation, and sandbox callback samples are required before a cryptographic adapter can be enabled in production.

**Author: Manus AI**

2026-08-25

## Mixx by Yas official site and merchant portal
Sources: https://mixx.co.tz/ and https://business.mixx.co.tz/

The official Mixx site presents a Business 360 Portal for businesses and institutions to collect and disburse payments, but the public page does not publish a callback payload, signature header, canonical signing algorithm, timestamp tolerance, or replay policy. The linked business portal returned no readable public documentation in the browser session. Therefore no Mixx-specific cryptographic algorithm is asserted without authenticated merchant documentation.

## Updated conclusion
The project currently has no selected provider or provider credentials. The safest design is a provider adapter registry with automated settlement disabled by default. A provider-specific adapter becomes eligible only after the merchant supplies the provider name, official API/webhook specification, sandbox callback samples, and key/certificate provisioning details.

## Supabase platform security findings
Sources: https://supabase.com/docs/guides/functions/auth and https://supabase.com/docs/guides/database/vault

Supabase’s official Edge Function security guidance states that external providers may sign the request body with their own shared secret; the handler should read the raw request body, verify the provider signature inside the function, and keep platform JWT verification disabled only when the handler performs the external-provider authentication itself. The guidance warns that disabling platform credential checks leaves the handler fully responsible for authenticating the caller.

Supabase’s Vault documentation states that secrets are stored encrypted and authenticated on disk and exposed in decrypted form through a Postgres view for controlled SQL use. It also warns that access to the decrypted view must be protected because view access reveals secret values. Provider callback secrets, PlusPesa API credentials, and key-rotation metadata should therefore remain in Vault or an equivalent server-side secret store and never be persisted in event payloads or exposed to authenticated clients.
