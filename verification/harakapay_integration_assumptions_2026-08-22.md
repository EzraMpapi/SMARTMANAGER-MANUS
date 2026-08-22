# HarakaPay Integration Assumptions — 22 August 2026

Public discovery reached the HarakaPay sign-in page but did not expose a public developer-documentation route or any API/webhook specification. The implementation will therefore use only the API contract explicitly supplied by the user: server-side `X-API-Key` authentication, payment collection initiated through the stated collect endpoint, and payment status retrieved through the stated status endpoint.

The supplied brief requests a webhook handler but does not specify a HarakaPay webhook signature header, signature algorithm, retry semantics, or canonical payload. The handler must therefore remain provider-contract-gated: it will not treat a webhook as authoritative until the matching provider order has been queried through the server-side status verification endpoint and its expected amount, tenant, and immutable order reference match the local transaction. This avoids inventing a webhook signing scheme or granting payment success based on unverified request data.

No HarakaPay secret is present in the task integration configuration. The attachment contains only a redacted-looking fragment, which must not be copied into source control, browser code, `.env.example`, logs, or any other artifact. A valid credential must be added as a server-side deployment secret before live USSD collection can be activated.
