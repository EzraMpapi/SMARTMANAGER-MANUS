import { describe, expect, it } from "vitest";
import {
  simulateCheckoutFailure,
  simulateCommerceCheckoutPaymentShipping,
  simulateDuplicatePaymentEvent,
} from "./commerceCheckoutSimulation";

describe("offline commerce checkout/payment/shipping simulation", () => {
  it("walks the supported server-first workflow to delivery", () => {
    const result = simulateCommerceCheckoutPaymentShipping();
    expect(result.state.companyId).toBe("company-sim-1");
    expect(result.state.currency).toBe("TZS");
    expect(result.state.subtotal).toBe(50000);
    expect(result.state.taxTotal).toBe(9000);
    expect(result.state.shippingTotal).toBe(5000);
    expect(result.state.grandTotal).toBe(64000);
    expect(result.state.checkoutStatus).toBe("COMPLETED");
    expect(result.state.paymentStatus).toBe("SUCCEEDED");
    expect(result.state.reservationStatus).toBe("CONSUMED");
    expect(result.state.shipmentStatus).toBe("DELIVERED");
    expect(result.state.eventIds).toEqual(["provider-event-sim-1"]);
    expect(result.steps.map((step) => step.rpc)).toEqual([
      "commerce_checkout_create",
      "commerce_payment_attempt_create",
      "provider_adapter (simulated)",
      "commerce_payment_event_apply",
      "commerce_shipment_create",
      "commerce_shipment_event_record",
      "commerce_shipment_event_record",
    ]);
  });

  it("does not apply a provider webhook twice", () => {
    const result = simulateCommerceCheckoutPaymentShipping();
    const duplicate = simulateDuplicatePaymentEvent(result);
    expect(duplicate).toEqual({
      ok: true,
      decision: "DUPLICATE",
      detail: "Duplicate provider event ignored; payment and reservation were not applied twice.",
    });
    expect(result.state.eventIds).toHaveLength(1);
    expect(result.state.reservationStatus).toBe("CONSUMED");
  });

  it("rejects oversell before checkout or reservation creation", () => {
    const failure = simulateCheckoutFailure([{
      sku: "SKU-SIM-OVERSELL",
      productName: "Unavailable item",
      inventoryItemId: "inventory-sim-over",
      quantity: 11,
      unitPrice: 1000,
      availableQuantity: 10,
    }]);
    expect(failure).toMatchObject({ ok: true, code: "CHECKOUT_REJECTED" });
    expect(failure.detail).toContain("Insufficient stock");
  });

  it("rejects empty and invalid checkout lines", () => {
    expect(() => simulateCommerceCheckoutPaymentShipping({ items: [] })).toThrow("at least one item");
    expect(() => simulateCommerceCheckoutPaymentShipping({ items: [{
      sku: "SKU-SIM-NEGATIVE",
      productName: "Invalid item",
      inventoryItemId: "inventory-sim-negative",
      quantity: -1,
      unitPrice: 1000,
      availableQuantity: 10,
    }] })).toThrow("Invalid quantity");
  });
});
