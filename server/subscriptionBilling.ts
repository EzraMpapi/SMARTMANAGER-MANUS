import type { Request, Response } from "express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

type JsonRecord = Record<string, unknown>;

type PaymentIntent = {
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  phone: string;
  status: string;
  planName: string;
  reused: boolean;
};

const BILLING_MANAGER_ROLES = new Set([
  "super administrator",
  "organization owner",
  "owner",
  "ceo",
  "cfo",
  "finance manager",
  "admin",
]);

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function ensureBillingManager(role: string) {
  if (!BILLING_MANAGER_ROLES.has(role.toLowerCase())) {
    const error = new Error("Your workspace role is not authorized to manage billing.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

function harakaConfiguration() {
  const apiKey = ENV.harakaPayApiKey;
  const baseUrl = ENV.harakaPayBaseUrl;
  const collectUrl = ENV.harakaPayCollectUrl;
  if (!apiKey || !baseUrl || !collectUrl) {
    const error = new Error("HarakaPay payment collection is not configured for this deployment.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
  return { apiKey, baseUrl, collectUrl };
}

async function parseProviderResponse(response: globalThis.Response): Promise<JsonRecord> {
  const body = await response.text();
  let parsed: unknown = null;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = null;
  }
  if (!isRecord(parsed)) return { message: body.slice(0, 500) };
  return parsed;
}

async function userRpc<T>(functionName: string, accessToken: string, body: JsonRecord): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new Error("Billing workspace verification is not configured.");
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: ENV.supabaseAnonKey,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await parseProviderResponse(response);
  if (!response.ok) {
    const error = new Error(asString(payload.message) || "The billing request could not be completed.");
    (error as Error & { status?: number }).status = response.status === 401 || response.status === 403 ? response.status : 400;
    throw error;
  }
  return payload as T;
}

async function serviceRpc<T>(functionName: string, body: JsonRecord): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Billing server verification is not configured.");
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: ENV.supabaseSecretKey,
      authorization: `Bearer ${ENV.supabaseSecretKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await parseProviderResponse(response);
  if (!response.ok) throw new Error(asString(payload.message) || "The billing payment state could not be recorded.");
  return payload as T;
}

async function servicePaymentByOrder(orderId: string): Promise<{ id: string; provider_order_id: string; status: string } | null> {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Billing server verification is not configured.");
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/subscription_payments?select=id,provider_order_id,status&provider=eq.HarakaPay&provider_order_id=eq.${encodeURIComponent(orderId)}&limit=1`, {
    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` },
  });
  const payload = await parseProviderResponse(response);
  if (!response.ok) throw new Error("The payment record could not be located.");
  if (!Array.isArray(payload)) return null;
  const first = payload[0];
  return isRecord(first) && typeof first.id === "string" && typeof first.provider_order_id === "string" && typeof first.status === "string"
    ? { id: first.id, provider_order_id: first.provider_order_id, status: first.status }
    : null;
}

function providerOrderId(payload: JsonRecord) {
  return asString(payload.order_id ?? payload.orderId ?? payload.transaction_id ?? payload.transactionId, 200);
}

function providerStatus(payload: JsonRecord) {
  return asString(payload.status ?? payload.payment_status ?? payload.paymentStatus ?? payload.state, 80).toLowerCase() || "pending";
}

async function fetchHarakaStatus(orderId: string): Promise<JsonRecord> {
  const { apiKey, baseUrl } = harakaConfiguration();
  const statusUrl = new URL(`/api/v1/status/${encodeURIComponent(orderId)}`, baseUrl).toString();
  const response = await fetch(statusUrl, { headers: { "X-API-Key": apiKey, accept: "application/json" } });
  const payload = await parseProviderResponse(response);
  if (!response.ok) {
    const error = new Error("HarakaPay payment status could not be verified.");
    (error as Error & { status?: number }).status = 502;
    throw error;
  }
  const returnedOrderId = providerOrderId(payload);
  if (returnedOrderId && returnedOrderId !== orderId) {
    const error = new Error("HarakaPay returned a payment status for a different order.");
    (error as Error & { status?: number }).status = 502;
    throw error;
  }
  return payload;
}

function publicPaymentState(result: unknown) {
  const row = isRecord(result) && isRecord(result.payment) ? result.payment : result;
  if (!isRecord(row)) return { status: "Pending" };
  return {
    paymentId: asString(row.id, 200),
    reference: asString(row.internal_reference, 200),
    providerOrderId: asString(row.provider_order_id, 200),
    status: asString(row.status, 80),
    amount: row.amount,
    fee: row.fee,
    netAmount: row.net_amount,
    currency: asString(row.currency, 20),
    paidAt: row.paid_at,
    verifiedAt: row.verified_at,
    failureReason: asString(row.failure_reason, 500),
    subscription: isRecord(result) ? result.subscription : undefined,
    invoice: isRecord(result) ? result.invoice : undefined,
  };
}

export async function subscriptionBillingSnapshotHandler(req: Request, res: Response) {
  try {
    const { profile, token } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureBillingManager(profile.role);
    return res.status(200).json(await userRpc("billing_snapshot", token, {}));
  } catch (error) {
    return sendError(res, (error as Error & { status?: number }).status || 500, (error as Error).message || "Billing could not be loaded.");
  }
}

export async function subscriptionBillingProfileHandler(req: Request, res: Response) {
  try {
    const { profile, token } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureBillingManager(profile.role);
    const payload = isRecord(req.body) ? req.body : {};
    return res.status(200).json(await userRpc("billing_upsert_profile", token, { p_payload: payload }));
  } catch (error) {
    return sendError(res, (error as Error & { status?: number }).status || 500, (error as Error).message || "Billing information could not be saved.");
  }
}

export async function subscriptionBillingPlanHandler(req: Request, res: Response) {
  try {
    const { profile, token } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureBillingManager(profile.role);
    const payload = isRecord(req.body) ? req.body : {};
    return res.status(200).json(await userRpc("billing_upsert_plan", token, { p_payload: payload }));
  } catch (error) {
    return sendError(res, (error as Error & { status?: number }).status || 500, (error as Error).message || "The billing plan could not be saved.");
  }
}

export async function harakaPayCollectHandler(req: Request, res: Response) {
  let payment: PaymentIntent | null = null;
  try {
    const { profile, token } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureBillingManager(profile.role);
    const payload = isRecord(req.body) ? req.body : {};
    const planId = asString(payload.planId, 200);
    const billingCycle = asString(payload.billingCycle, 20);
    const phone = asString(payload.phone, 30);
    const description = asString(payload.description, 250);
    const idempotencyKey = asString(payload.idempotencyKey, 200);
    if (!planId || !billingCycle || !phone) return sendError(res, 400, "Plan, billing cycle, and Tanzanian mobile number are required.");
    payment = await userRpc<PaymentIntent>("billing_create_payment_intent", token, {
      p_plan_id: planId,
      p_billing_cycle: billingCycle,
      p_phone: phone,
      p_description: description || null,
      p_idempotency_key: idempotencyKey || null,
    });
    if (payment.reused && payment.status === "Pending" && payment.paymentId) {
      return res.status(200).json({ payment: { paymentId: payment.paymentId, reference: payment.reference, amount: payment.amount, currency: payment.currency, status: payment.status }, waitingForExistingRequest: true });
    }
    const { apiKey, collectUrl } = harakaConfiguration();
    const webhookUrl = ENV.harakaPayWebhookUrl;
    if (!webhookUrl) throw Object.assign(new Error("HarakaPay webhook URL is not configured for this deployment."), { status: 503 });
    const providerResponse = await fetch(collectUrl, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        phone: payment.phone,
        amount: payment.amount,
        description: description || `SMART MANAGER ${payment.planName} subscription`,
        webhook_url: webhookUrl,
        reference: payment.reference,
      }),
    });
    const providerPayload = await parseProviderResponse(providerResponse);
    const orderId = providerOrderId(providerPayload);
    if (!providerResponse.ok || providerPayload.success === false || !orderId) {
      await serviceRpc("billing_mark_payment_dispatch_failure", {
        p_payment_id: payment.paymentId,
        p_failure_reason: asString(providerPayload.message, 500) || "HarakaPay did not accept the payment request.",
        p_provider_response: providerPayload,
      });
      return sendError(res, 502, "The payment provider could not start the USSD request. You can correct the number and try again.");
    }
    const recorded = await serviceRpc<JsonRecord>("billing_record_provider_dispatch", {
      p_payment_id: payment.paymentId,
      p_provider_order_id: orderId,
      p_provider_response: providerPayload,
    });
    return res.status(202).json({
      payment: {
        paymentId: payment.paymentId,
        reference: payment.reference,
        providerOrderId: orderId,
        status: asString(recorded.status, 80) || "Pending",
        amount: payment.amount,
        currency: payment.currency,
      },
      message: asString(providerPayload.message, 300) || "USSD request sent. Approve the payment on your phone.",
    });
  } catch (error) {
    if (payment?.paymentId) {
      try {
        await serviceRpc("billing_mark_payment_dispatch_failure", {
          p_payment_id: payment.paymentId,
          p_failure_reason: "The payment request could not be dispatched safely.",
          p_provider_response: {},
        });
      } catch {
        // The primary response remains generic; details are retained only in server logs.
      }
    }
    return sendError(res, (error as Error & { status?: number }).status || 500, (error as Error).message || "The payment request could not be started.");
  }
}

export async function harakaPayStatusHandler(req: Request, res: Response) {
  try {
    const { profile } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureBillingManager(profile.role);
    const orderId = asString(req.params.orderId, 200);
    if (!orderId) return sendError(res, 400, "A provider order ID is required.");
    const payment = await servicePaymentByOrder(orderId);
    if (!payment) return sendError(res, 404, "The payment request was not found.");
    const providerPayload = await fetchHarakaStatus(orderId);
    const result = await serviceRpc("billing_apply_provider_status", {
      p_payment_id: payment.id,
      p_provider_order_id: orderId,
      p_provider_status: providerStatus(providerPayload),
      p_provider_response: providerPayload,
    });
    return res.status(200).json(publicPaymentState(result));
  } catch (error) {
    return sendError(res, (error as Error & { status?: number }).status || 500, (error as Error).message || "The payment status could not be verified.");
  }
}

export async function harakaPayWebhookHandler(req: Request, res: Response) {
  try {
    const payload = isRecord(req.body) ? req.body : {};
    const orderId = providerOrderId(payload);
    if (!orderId) return sendError(res, 400, "A provider order ID is required.");
    const payment = await servicePaymentByOrder(orderId);
    if (!payment) return sendError(res, 404, "Unknown payment order.");
    const providerPayload = await fetchHarakaStatus(orderId);
    const result = await serviceRpc("billing_apply_provider_status", {
      p_payment_id: payment.id,
      p_provider_order_id: orderId,
      p_provider_status: providerStatus(providerPayload),
      p_provider_response: providerPayload,
    });
    return res.status(200).json({ received: true, payment: publicPaymentState(result) });
  } catch (error) {
    return sendError(res, (error as Error & { status?: number }).status || 500, "The payment webhook could not be processed safely.");
  }
}

export async function harakaPayBalanceHandler(req: Request, res: Response) {
  try {
    const { profile } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureBillingManager(profile.role);
    const { apiKey, baseUrl } = harakaConfiguration();
    const response = await fetch(new URL("/api/v1/balance", baseUrl), { headers: { "X-API-Key": apiKey, accept: "application/json" } });
    const payload = await parseProviderResponse(response);
    if (!response.ok) return sendError(res, 502, "HarakaPay balance could not be retrieved.");
    return res.status(200).json({ walletBalance: payload.wallet_balance ?? payload.balance ?? null, floatBalance: payload.float_balance ?? payload.float ?? null, currency: payload.currency ?? "TZS" });
  } catch (error) {
    return sendError(res, (error as Error & { status?: number }).status || 500, (error as Error).message || "HarakaPay balance could not be retrieved.");
  }
}
