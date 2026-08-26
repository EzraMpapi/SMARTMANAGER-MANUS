# SMART MANAGER E-Commerce Architecture & Validation — Presenter Script and Speaker Notes

**Date:** 26 August 2026
**Audience:** Product, engineering, operations, and compliance reviewers
**Purpose:** Present the validated authenticated commerce-management scope, the deliberate safety gates, the current bundle evidence, and the next release approvals.

> **Delivery rule:** Distinguish confirmed behavior from design-only and environment-gated work. The checkout simulation is offline-only; it did not collect money, call a provider, create Supabase rows, or deliver a shipment. The route wrapper is 1.66 kB, but the current core remains 3,983.68 kB, so the practical initial dashboard payload is not yet below 500 kB.

## Cover — SMART MANAGER E-Commerce Architecture & Validation

Today’s presentation summarizes the E-Commerce architecture and the validation evidence behind the authenticated management experience. The focus is deliberately narrow: what is connected to confirmed ERP data now, what remains contract-gated, what the test suite proves, and which approvals are required before any live storefront, payment, or shipping integration proceeds. We will move from the current architecture to the delivered admin slice, then cover truthful states, order semantics, validation, bundle delivery, and the design-only checkout contract.

## Slide 1 — The current system is an authenticated ERP commerce workspace

The current commerce surface lives inside the authenticated enterprise shell. It is an administrative workspace, not a public storefront: public product browsing, persistent carts, and live payment checkout are not active routes in this validated slice. The implementation relies on confirmed ERP anchors such as `ecommerce_products`, `ecommerce_orders`, `inventory_items`, sales records, CRM records, finance records, and warehouse data. The governing principle is to extend those confirmed entities rather than create a parallel commerce universe. This keeps tenant identity, authorization, and operational truth aligned with the existing system. Next, we will look at the concrete admin capabilities that were connected to those sources.

## Slide 2 — The delivered slice connects commerce decisions to real ERP data

The delivered admin slice uses confirmed order, product, and inventory rows to derive its visible commerce decisions. Catalog controls support product publication, SKU discovery, stock context, search, filtering, and responsive grid or list presentation. Order management supports customer and order search, status filtering, keyboard-accessible row opening, and an accessible detail dialog with a supported timeline. The capability panel is intentionally explicit: connected catalog, stock, customer, order, and finance workflows are separated from checkout, payment, shipping, returns, review, and promotion features that still require an approved contract. The next slide explains why this distinction is a correctness property rather than a cosmetic label.

## Slide 3 — Truthful states replace misleading commerce assumptions

The implementation distinguishes what the connected schema can support from what remains unavailable. Catalog and stock, orders and finance, and existing customer records are connected to the ERP boundary. Checkout and payments, shipping and returns, reviews, and promotions are contract-gated. Browser state is not authoritative for totals, inventory, payment status, refunds, shipping, or permissions. When a source is absent or a capability is not connected, the interface says so instead of inventing metrics or allowing a misleading action. This is especially important for Tanzania-ready operations, where TZS display and local workflows must still be backed by confirmed server data. We now apply the same discipline to order state transitions.

## Slide 4 — The order workflow now has explicit, accessible state semantics

The order workspace is designed around supported state semantics. Search and status filters reduce discovery effort across the confirmed list. Opening an order uses dialog semantics and an accessible close action, while the timeline presents only states supported by the current workflow. The browser cannot independently advance payment or fulfillment states; those transitions must come from server-confirmed results. This prevents a local click from being presented as a payment collection, refund, shipment, or delivery event. The interaction design therefore makes the safe path visible without pretending the future provider integration already exists. Next, we will review the repository and responsive validation evidence.

## Slide 5 — Validation covered the full repository and responsive browser journeys

The authoritative full Vitest run passed **1,067 tests across 269 files**, with **15 deliberate skips** and no failures. The new offline commerce simulation adds four focused passing tests covering the happy path, duplicate-event idempotency, oversell rejection, and invalid or empty checkout lines. The wrapper/core migration also passed the dashboard integration and source-contract coverage after updating consumers to inspect the moved core. Type checking, direct Vite production building, and whitespace validation were part of the quality gates. Earlier browser evidence covered authentication journeys at 1,440, 768, 390, and 360 pixels. The next slide explains why the 15 skips remain visible rather than being hidden or mocked.

## Slide 6 — The 15 skipped tests are deliberate environment gates

The skipped tests are controlled boundaries, not silent failures. Five Community Groups checks require two real tenant JWTs for cross-tenant RLS penetration validation. Two dashboard persistence checks require the explicit remote integration flag and a provisioned remote tenant. Supabase configuration and credential checks require approved remote credentials, while the live schema/build guard is intentionally protected. The remaining skips cover a live tenant workflow, Resend sender verification, and a live AI check. The workspace used for this validation had no approved Supabase, tenant, or Resend credentials, so these tests were not pointed at production and were not replaced with fake success. Now we turn to the dashboard asset results.

## Slide 7 — Chunking reduced the dashboard entry asset by 13 percent

The first optimization wave reduced the previous dashboard chunk from **4,524,618 bytes** to **3,931,514 bytes**, a reduction of **593,104 bytes or 13.00%**. It also created cacheable community, additional-module, and static-data chunks. The stronger wrapper/core split now emits a **1.66 kB** `BusinessSphereDashboard` route wrapper, but that wrapper immediately lazy-loads a **3,983.68 kB** core. The community module is about **438.01 kB**, the additional module about **93.50 kB**, and static data about **56.26 kB**. Therefore the route filename is below 500 kB, but the practical initial dashboard consumption is not. The next decomposition wave must extract route-specific workspaces such as Settings, Sales, Finance, POS, and Reports behind real lazy boundaries.

## Slide 8 — Checkout integration needs a server-first contract

The proposed checkout contract is design-only and has not been applied to Supabase. It defines typed entities for variants and media, customer accounts and addresses, carts and immutable checkout snapshots, inventory reservations, payment intents and events, shipments and shipment events, returns and refunds, and idempotency keys. The RPC sequence covers checkout creation, payment-attempt creation, verified-event application, expiration, shipment creation, shipment-event recording, return creation, and refund requests. Required controls include tenant-derived authorization, RLS and least-privilege grants, server-priced snapshots, provider idempotency, raw-body signature verification, durable replay protection, and state-machine invariants. The offline simulation proves only the local model: TZS 64,000 total, one accepted event, consumed reservation, and a final simulated delivered state. It does not prove settlement or delivery.

## Closing — The validated scope is clear; contract review is the next gate

The validated scope is the authenticated commerce-management surface connected to confirmed ERP data. The work has not claimed a public storefront, live payment collection, provider settlement, shipment delivery, or a practical sub-500 kB initial dashboard payload. The release sequence is therefore explicit: approve the design-only checkout, payment, and shipping contract; apply reviewed migrations only after that approval; implement provider adapters and persistence in a controlled sandbox; run staging tests with verified signatures, replay protection, tenant isolation, and inventory locking; and only then consider a production rollout. The current result is a truthful foundation for that review, not a substitute for the gated integration work.

## Evidence references

| Evidence | Location |
|---|---|
| Checkout/payment/shipping schema and RPC contract | [`docs/ecommerce-checkout-payment-shipping-schema-rpc-contract-20260826.md`](./ecommerce-checkout-payment-shipping-schema-rpc-contract-20260826.md) |
| Offline simulation implementation and tests | [`server/commerceCheckoutSimulation.ts`](../server/commerceCheckoutSimulation.ts) and [`server/commerceCheckoutSimulation.test.ts`](../server/commerceCheckoutSimulation.test.ts) |
| Simulation evidence report | [`docs/ecommerce-offline-checkout-simulation-evidence-20260826.md`](./ecommerce-offline-checkout-simulation-evidence-20260826.md) |
| Bundle measurements and decomposition roadmap | [`docs/ecommerce-dashboard-bundle-decomposition-20260826.md`](./ecommerce-dashboard-bundle-decomposition-20260826.md) |
| Prior skip inventory and first bundle baseline | [`docs/ecommerce-skipped-tests-and-bundle-optimization-20260826.md`](./ecommerce-skipped-tests-and-bundle-optimization-20260826.md) |
| Official integration-reference summary | [`docs/ecommerce-integration-references-20260826.md`](./ecommerce-integration-references-20260826.md) |
