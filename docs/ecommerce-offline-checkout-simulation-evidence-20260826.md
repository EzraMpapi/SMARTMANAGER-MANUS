# E-Commerce Offline Checkout, Payment, and Shipping Simulation Evidence

**Date:** 26 August 2026
**Author:** Manus AI
**Scope:** Deterministic local simulation only; no provider, HTTP, Supabase, or live settlement side effect.

## Executive result

The proposed server-first storefront workflow was exercised as a deterministic state-machine simulation based on the design-only checkout/payment/shipping contract in [`ecommerce-checkout-payment-shipping-schema-rpc-contract-20260826.md`](./ecommerce-checkout-payment-shipping-schema-rpc-contract-20260826.md). The implementation is intentionally an offline model and test fixture. It does **not** create a checkout, payment intent, reservation, order, shipment, webhook event, or database row in the connected Supabase project.

The happy path completed in the required order: server-priced checkout snapshot, inventory hold, payment-intent creation, simulated provider handoff, one verified-event application, reservation consumption, shipment creation, in-transit event, delivered event, and order completion. Payment success is required before fulfillment begins.

## Happy-path evidence

The default fixture contains two units of one confirmed ERP item at TZS 25,000 per unit. The simulation applies an 18% tax rate and a TZS 5,000 shipping charge.

| Checkpoint | RPC or adapter boundary | Result | Evidence |
|---|---|---:|---|
| Checkout snapshot | `commerce_checkout_create` | Passed | `checkout-sim-1`; status `CREATED` → `PAYMENT_PENDING`; reservation `HELD` |
| Payment attempt | `commerce_payment_attempt_create` | Passed | `payment-intent-sim-1`; amount derived from server snapshot |
| Provider handoff | `provider_adapter (simulated)` | Passed | No network access and no credentials |
| Verified payment event | `commerce_payment_event_apply` | Passed | `provider-event-sim-1` accepted once; payment `SUCCEEDED` |
| Reservation consumption | Within payment-event application | Passed | Reservation `HELD` → `CONSUMED` only after payment success |
| Shipment creation | `commerce_shipment_create` | Passed | `shipment-sim-1` created after confirmed payment; checkout `PAID` → `FULFILLING` |
| In-transit event | `commerce_shipment_event_record` | Passed | Shipment `PENDING` → `IN_TRANSIT` |
| Delivered event and close | `commerce_shipment_event_record` | Passed | Shipment `IN_TRANSIT` → `DELIVERED`; checkout `FULFILLING` → `COMPLETED` |

### Totals

| Amount | Value |
|---|---:|
| Currency | TZS |
| Subtotal | TZS 50,000.00 |
| Tax at 18% | TZS 9,000.00 |
| Shipping | TZS 5,000.00 |
| Grand total | TZS 64,000.00 |

The final state was `checkoutStatus=COMPLETED`, `paymentStatus=SUCCEEDED`, `reservationStatus=CONSUMED`, and `shipmentStatus=DELIVERED`. The only recorded provider event identity was `provider-event-sim-1`.

## Idempotency and rejection evidence

A second delivery of the same provider event was classified as `DUPLICATE`. It was ignored, the event list remained length one, and the consumed reservation was not consumed again. This models the durable duplicate-event guard required by the future database contract; it is not itself a durable production event log.

Oversell was rejected before checkout or reservation creation when quantity 11 was requested against available quantity 10. Empty lines were rejected, and a negative quantity was rejected as an invalid checkout line. These checks ensure the simulation fails closed before a payment intent or fulfillment action exists.

| Scenario | Expected decision | Observed decision |
|---|---|---|
| Duplicate `provider-event-sim-1` | Ignore without replaying side effects | `DUPLICATE`; no second reservation application |
| Quantity greater than available stock | Reject before checkout | `CHECKOUT_REJECTED`; `Insufficient stock` |
| Empty line collection | Reject before checkout | Error: checkout requires at least one item |
| Negative quantity | Reject before checkout | Error: invalid quantity |

## Validation command and boundary

The evidence is backed by `server/commerceCheckoutSimulation.test.ts`, which passed **4 tests** in the targeted run and was included in the authoritative full run. The model is deliberately not a substitute for a staging integration test. Before production use, the real implementation must add server-generated idempotency keys, a request hash, raw-body provider signature verification, durable event uniqueness, tenant-derived authorization, RLS/grants, advisory or row locking for inventory, and explicit state-transition checks. Settlement, refunds, external shipment calls, and live database mutations remain gated.

> **Safety boundary:** This simulation is offline-only. It does not call a payment provider, does not read or mutate Supabase, does not expose credentials, and does not claim that a payment was actually collected or a shipment was actually delivered.

## References

1. [`ecommerce-checkout-payment-shipping-schema-rpc-contract-20260826.md`](./ecommerce-checkout-payment-shipping-schema-rpc-contract-20260826.md), design-only schema and RPC contract.
2. [`ecommerce-integration-references-20260826.md`](./ecommerce-integration-references-20260826.md), official Supabase RLS/function and Stripe idempotency/webhook guidance summary.
3. [`server/commerceCheckoutSimulation.ts`](../server/commerceCheckoutSimulation.ts) and [`server/commerceCheckoutSimulation.test.ts`](../server/commerceCheckoutSimulation.test.ts), implementation and executable evidence.
