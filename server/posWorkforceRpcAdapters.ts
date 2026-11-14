import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getBearerToken } from "./_core/authHeaders";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

type Request = CreateExpressContextOptions["req"];
type JsonObject = Record<string, unknown>;

const money = z.string().trim().regex(/^\d{1,18}(\.\d{1,2})?$/, "Use a non-negative TZS amount with at most two decimal places.");
const quantity = z.string().trim().regex(/^\d{1,15}(\.\d{1,4})?$/, "Use a positive quantity with at most four decimal places.");
const uuid = z.string().uuid();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO calendar date.");
const idempotencyKey = z.string().trim().min(8).max(160);
const requestHash = z.string().trim().min(16).max(128);

export const posOpenShiftInput = z.object({
  registerId: uuid,
  terminalId: uuid.nullable().optional(),
  cashierId: uuid.nullable().optional(),
  businessDate: dateOnly,
  openingFloat: money,
  openIdempotencyKey: idempotencyKey,
  openRequestHash: requestHash,
  shiftNumber: z.string().trim().min(1).max(80).optional(),
});

export const posCashMovementInput = z.object({
  shiftId: uuid,
  movementType: z.enum(["Cash In", "Cash Out", "Pay In", "Pay Out", "Paid Out", "Cash Drop", "Adjustment"]),
  amount: money.refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  reason: z.string().trim().min(2).max(500),
  reference: z.string().trim().max(160).optional(),
  idempotencyKey,
  requestHash,
  approvalRequestId: uuid,
});

export const posSyncSequenceInput = z.object({
  deviceId: uuid,
  sequence: z.number().int().nonnegative().max(9_007_199_254_740_991),
  payloadHash: requestHash,
});

const saleItemInput = z.object({
  sku: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(240),
  qty: quantity.refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
  price: money,
});

const salePaymentInput = z.object({
  method: z.enum(["Cash", "Card", "Mobile Money", "Bank Transfer", "Customer Credit"]),
  amount: money.refine((value) => Number(value) > 0, "Tender amount must be greater than zero."),
});

export const posCompleteSaleInput = z.object({
  idempotencyKey,
  docNumber: z.string().trim().min(1).max(120),
  items: z.array(saleItemInput).min(1).max(500),
  payments: z.array(salePaymentInput).min(1).max(20),
  subtotal: money,
  tax: money,
  total: money,
  customerId: uuid.nullable().optional(),
  customerName: z.string().trim().max(240).optional(),
});

export const workforceRoleAssignmentInput = z.object({
  targetProfileId: uuid,
  roleId: uuid,
  idempotencyKey,
  requestHash,
  effectiveFrom: z.string().datetime({ offset: true }),
  effectiveTo: z.string().datetime({ offset: true }).nullable().optional(),
  employeeId: uuid.nullable().optional(),
  reason: z.string().trim().min(2).max(1000),
});

export const workforceRoleDecisionInput = z.object({
  assignmentId: uuid,
  decision: z.enum(["approve", "reject"]),
  idempotencyKey,
  requestHash,
  decisionNote: z.string().trim().max(1000).optional(),
  expectedVersion: z.number().int().nonnegative().max(9_007_199_254_740_991),
});

function requireSupabase() {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The Supabase application data service is not configured." });
  }
  return { url: ENV.supabaseUrl.replace(/\/$/, ""), anonKey: ENV.supabaseAnonKey };
}

function rpcError(status: number, body: unknown) {
  const bodyRecord = body && typeof body === "object" && !Array.isArray(body) ? body as JsonObject : {};
  const code = String(bodyRecord.code || bodyRecord.error_code || "");
  if (status === 401) return new TRPCError({ code: "UNAUTHORIZED", message: "Your workspace session could not be verified." });
  if (status === 403 || code === "42501") return new TRPCError({ code: "FORBIDDEN", message: "Your workspace role is not permitted to perform this operation." });
  if (status === 409 || code === "23505") return new TRPCError({ code: "CONFLICT", message: "The operation conflicts with an existing workspace record or idempotency request." });
  if (status === 422 || code === "22023") return new TRPCError({ code: "BAD_REQUEST", message: "The operation failed server-side validation." });
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The workspace operation could not be completed." });
}

async function callRpc<T>(token: string, functionName: string, payload: JsonObject): Promise<T> {
  const { url, anonKey } = requireSupabase();
  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw rpcError(response.status, body);
  return body as T;
}

async function verifiedRequest(req: Request) {
  const { profile, token } = await resolveVerifiedProfile(req);
  if (!profile.company_id || !getBearerToken(req)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "A current workspace session is required." });
  }
  return { profile, token };
}

export async function openPosShift(req: Request, input: z.infer<typeof posOpenShiftInput>) {
  const { token } = await verifiedRequest(req);
  return callRpc<Record<string, unknown>>(token, "pos_open_shift", {
    p_register_id: input.registerId,
    p_terminal_id: input.terminalId ?? null,
    p_cashier_id: input.cashierId ?? null,
    p_business_date: input.businessDate,
    p_opening_float: input.openingFloat,
    p_open_idempotency_key: input.openIdempotencyKey,
    p_open_request_hash: input.openRequestHash,
    p_shift_number: input.shiftNumber ?? null,
  });
}

export async function recordPosCashMovement(req: Request, input: z.infer<typeof posCashMovementInput>) {
  const { token } = await verifiedRequest(req);
  return callRpc<Record<string, unknown>>(token, "pos_record_cash_movement", {
    p_shift_id: input.shiftId,
    p_movement_type: input.movementType,
    p_amount: input.amount,
    p_reason: input.reason,
    p_reference: input.reference ?? null,
    p_idempotency_key: input.idempotencyKey,
    p_request_hash: input.requestHash,
    p_approval_request_id: input.approvalRequestId,
  });
}

export async function acceptPosSyncSequence(req: Request, input: z.infer<typeof posSyncSequenceInput>) {
  const { token } = await verifiedRequest(req);
  return callRpc<Record<string, unknown>>(token, "pos_accept_sync_device_sequence", {
    p_device_id: input.deviceId,
    p_sequence: input.sequence,
    p_payload_hash: input.payloadHash,
  });
}

export async function completePosSale(req: Request, input: z.infer<typeof posCompleteSaleInput>) {
  const { token } = await verifiedRequest(req);
  const basePayload = {
    p_idempotency_key: input.idempotencyKey,
    p_doc_number: input.docNumber,
    p_items: input.items,
    p_payments: input.payments,
    p_subtotal: input.subtotal,
    p_tax: input.tax,
    p_total: input.total,
  };
  if (input.customerId) {
    return callRpc<Record<string, unknown>>(token, "complete_pos_sale", {
      ...basePayload,
      p_customer_id: input.customerId,
      p_customer_name: input.customerName ?? null,
    });
  }
  return callRpc<Record<string, unknown>>(token, "complete_pos_sale", basePayload);
}

export async function requestWorkforceRoleAssignment(req: Request, input: z.infer<typeof workforceRoleAssignmentInput>) {
  const { token } = await verifiedRequest(req);
  return callRpc<Record<string, unknown>>(token, "workforce_request_role_assignment", {
    p_target_profile_id: input.targetProfileId,
    p_role_id: input.roleId,
    p_idempotency_key: input.idempotencyKey,
    p_request_hash: input.requestHash,
    p_effective_from: input.effectiveFrom,
    p_effective_to: input.effectiveTo ?? null,
    p_employee_id: input.employeeId ?? null,
    p_reason: input.reason,
  });
}

export async function decideWorkforceRoleAssignment(req: Request, input: z.infer<typeof workforceRoleDecisionInput>) {
  const { token } = await verifiedRequest(req);
  return callRpc<Record<string, unknown>>(token, "workforce_decide_role_assignment", {
    p_assignment_id: input.assignmentId,
    p_decision: input.decision,
    p_idempotency_key: input.idempotencyKey,
    p_request_hash: input.requestHash,
    p_decision_note: input.decisionNote ?? null,
    p_expected_version: input.expectedVersion,
  });
}
