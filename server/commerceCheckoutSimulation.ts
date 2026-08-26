export type CheckoutStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "FULFILLING"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "PAYMENT_FAILED";

export type PaymentStatus =
  | "REQUIRES_ACTION"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type ReservationStatus = "HELD" | "CONSUMED" | "RELEASED" | "EXPIRED" | "FAILED";

export type ShipmentStatus =
  | "PENDING"
  | "LABEL_REQUESTED"
  | "LABEL_CREATED"
  | "READY_FOR_PICKUP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED"
  | "RETURNED";

export type CommerceSimulationItem = {
  sku: string;
  productName: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
};

export type CommerceSimulationState = {
  companyId: string;
  checkoutId: string;
  orderId: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  checkoutStatus: CheckoutStatus;
  paymentIntentId: string;
  paymentStatus: PaymentStatus;
  reservationStatus: ReservationStatus;
  shipmentId: string | null;
  shipmentStatus: ShipmentStatus | null;
  eventIds: string[];
  statusHistory: Array<{ status: string; at: string; reason: string }>;
};

export type CommerceSimulationStep = {
  name: string;
  rpc: string;
  ok: boolean;
  detail: string;
};

export type CommerceSimulationResult = {
  state: CommerceSimulationState;
  steps: CommerceSimulationStep[];
};

const CHECKOUT_TRANSITIONS: Record<CheckoutStatus, CheckoutStatus[]> = {
  CREATED: ["PAYMENT_PENDING", "CANCELLED", "EXPIRED"],
  PAYMENT_PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED", "EXPIRED"],
  PAID: ["FULFILLING", "CANCELLED"],
  FULFILLING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  PAYMENT_FAILED: ["PAYMENT_PENDING", "CANCELLED", "EXPIRED"],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  REQUIRES_ACTION: ["PROCESSING", "FAILED", "CANCELLED"],
  PROCESSING: ["SUCCEEDED", "FAILED", "CANCELLED"],
  SUCCEEDED: ["PARTIALLY_REFUNDED", "REFUNDED"],
  FAILED: ["REQUIRES_ACTION", "CANCELLED"],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};

function transitionCheckout(state: CommerceSimulationState, next: CheckoutStatus, reason: string, at: string) {
  if (!CHECKOUT_TRANSITIONS[state.checkoutStatus].includes(next)) {
    throw new Error(`Invalid checkout transition ${state.checkoutStatus} -> ${next}`);
  }
  state.checkoutStatus = next;
  state.statusHistory.push({ status: next, at, reason });
}

function transitionPayment(state: CommerceSimulationState, next: PaymentStatus) {
  if (!PAYMENT_TRANSITIONS[state.paymentStatus].includes(next)) {
    throw new Error(`Invalid payment transition ${state.paymentStatus} -> ${next}`);
  }
  state.paymentStatus = next;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function simulateCommerceCheckoutPaymentShipping(input: {
  companyId?: string;
  now?: string;
  items?: CommerceSimulationItem[];
  currency?: string;
} = {}): CommerceSimulationResult {
  const companyId = input.companyId ?? "company-sim-1";
  const now = input.now ?? "2026-08-26T20:00:00.000Z";
  const currency = input.currency ?? "TZS";
  const items = input.items ?? [{
    sku: "SKU-SIM-001",
    productName: "Confirmed ERP item",
    inventoryItemId: "inventory-sim-1",
    quantity: 2,
    unitPrice: 25000,
    availableQuantity: 10,
  }];
  if (!items.length) throw new Error("Checkout requires at least one item");
  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error(`Invalid quantity for ${item.sku}`);
    if (item.quantity > item.availableQuantity) throw new Error(`Insufficient stock for ${item.sku}`);
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) throw new Error(`Invalid server price for ${item.sku}`);
  }

  const subtotal = money(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const taxTotal = money(subtotal * 0.18);
  const shippingTotal = 5000;
  const state: CommerceSimulationState = {
    companyId,
    checkoutId: "checkout-sim-1",
    orderId: "order-sim-1",
    currency,
    subtotal,
    taxTotal,
    shippingTotal,
    grandTotal: money(subtotal + taxTotal + shippingTotal),
    checkoutStatus: "CREATED",
    paymentIntentId: "payment-intent-sim-1",
    paymentStatus: "REQUIRES_ACTION",
    reservationStatus: "HELD",
    shipmentId: null,
    shipmentStatus: null,
    eventIds: [],
    statusHistory: [{ status: "CREATED", at: now, reason: "commerce_checkout_create" }],
  };
  const steps: CommerceSimulationStep[] = [];
  const step = (name: string, rpc: string, detail: string) => steps.push({ name, rpc, ok: true, detail });

  transitionCheckout(state, "PAYMENT_PENDING", "Server-priced checkout snapshot created", now);
  step("Create checkout", "commerce_checkout_create", `Created ${state.checkoutId} for ${state.currency} ${state.grandTotal.toFixed(2)} and held ${items.length} inventory line(s).`);

  step("Create payment intent", "commerce_payment_attempt_create", `Created ${state.paymentIntentId} for the server-derived grand total; browser cannot mark it paid.`);
  transitionPayment(state, "PROCESSING");
  step("Provider processing", "provider_adapter (simulated)", "Payment provider handoff is represented without network access or credentials.");

  const eventId = "provider-event-sim-1";
  state.eventIds.push(eventId);
  transitionPayment(state, "SUCCEEDED");
  transitionCheckout(state, "PAID", "Verified payment_intent.succeeded event applied", now);
  state.reservationStatus = "CONSUMED";
  step("Apply payment webhook", "commerce_payment_event_apply", `Accepted ${eventId} once, marked payment succeeded, consumed the reservation, and linked the order.`);

  state.shipmentId = "shipment-sim-1";
  state.shipmentStatus = "PENDING";
  transitionCheckout(state, "FULFILLING", "Paid order released to fulfillment", now);
  step("Create shipment", "commerce_shipment_create", `Created ${state.shipmentId} only after confirmed payment.`);

  state.shipmentStatus = "IN_TRANSIT";
  step("Record shipping event", "commerce_shipment_event_record", "Recorded a provider-neutral in-transit event with replay-safe event identity.");

  state.shipmentStatus = "DELIVERED";
  transitionCheckout(state, "COMPLETED", "Delivery event applied", now);
  step("Complete order", "commerce_shipment_event_record", "Applied the delivered event and closed the supported order state machine.");

  return { state, steps };
}

export function simulateDuplicatePaymentEvent(result: CommerceSimulationResult) {
  const eventId = "provider-event-sim-1";
  if (result.state.eventIds.includes(eventId)) {
    return { ok: true as const, decision: "DUPLICATE" as const, detail: "Duplicate provider event ignored; payment and reservation were not applied twice." };
  }
  result.state.eventIds.push(eventId);
  return { ok: true as const, decision: "RECORDED" as const, detail: "Provider event recorded." };
}

export function simulateCheckoutFailure(items: CommerceSimulationItem[]) {
  try {
    simulateCommerceCheckoutPaymentShipping({ items });
    return { ok: false as const, code: "EXPECTED_FAILURE_NOT_RAISED" };
  } catch (error) {
    return { ok: true as const, code: "CHECKOUT_REJECTED", detail: error instanceof Error ? error.message : String(error) };
  }
}
