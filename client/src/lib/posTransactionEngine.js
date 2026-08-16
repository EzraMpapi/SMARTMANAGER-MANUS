export function normalizePosLookup(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

export function productMatchesPosLookup(product, lookup) {
  const term = normalizePosLookup(lookup);
  if (!term) return true;
  return [product?.name, product?.sku, product?.barcode, product?.code, product?.category, product?.brand]
    .some((candidate) => normalizePosLookup(candidate).includes(term));
}

export function calculatePosPaymentSummary(payments, total) {
  const amountDue = Math.max(0, Number(total) || 0);
  const normalized = (Array.isArray(payments) ? payments : []).map((payment) => ({
    id: String(payment?.id || ""),
    method: String(payment?.method || "Cash"),
    amount: Math.max(0, Number(payment?.amount) || 0),
  }));
  const paid = normalized.reduce((sum, payment) => sum + payment.amount, 0);
  let remainingToAllocate = amountDue;
  const allocations = normalized.filter((payment) => payment.amount > 0).map((payment) => {
    const appliedAmount = Math.min(payment.amount, remainingToAllocate);
    remainingToAllocate = Math.max(0, remainingToAllocate - appliedAmount);
    return { ...payment, appliedAmount };
  });
  const overpayment = Math.max(0, paid - amountDue);
  const cashTendered = normalized.filter((payment) => payment.method === "Cash").reduce((sum, payment) => sum + payment.amount, 0);
  return {
    amountDue,
    paid,
    remaining: Math.max(0, amountDue - paid),
    change: cashTendered > 0 ? overpayment : 0,
    overpaymentWithoutCash: cashTendered === 0 ? overpayment : 0,
    allocations,
    isComplete: amountDue > 0 && paid >= amountDue && (cashTendered > 0 || overpayment === 0),
  };
}

export function createPosSaleAttempt({ createDocumentNumber, createIdempotencyKey }) {
  const docNumber = createDocumentNumber();
  return {
    docNumber,
    idempotencyKey: createIdempotencyKey?.() || `${docNumber}-${Date.now().toString(36)}`,
  };
}

export function addProductToPosCart(cart, product, availableQuantity) {
  const currentCart = Array.isArray(cart) ? cart : [];
  const stock = Math.max(0, Number(availableQuantity) || 0);
  const index = currentCart.findIndex((line) => line.sku === product.sku);
  if (stock <= 0) return { cart: currentCart, added: false, reason: "OUT_OF_STOCK" };
  if (index < 0) {
    return { cart: [...currentCart, { sku: product.sku, name: product.name, price: product.price, qty: 1, unit: product.unit, barcode: product.barcode || null }], added: true };
  }
  if (currentCart[index].qty >= stock) return { cart: currentCart, added: false, reason: "INSUFFICIENT_STOCK" };
  return {
    cart: currentCart.map((line, lineIndex) => lineIndex === index ? { ...line, qty: line.qty + 1 } : line),
    added: true,
  };
}
