import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

type JsonRecord = Record<string, unknown>;
type MoneyAgentAction =
  | "REGISTER_BRANCH"
  | "REGISTER_AGENT"
  | "REGISTER_CUSTOMER"
  | "REGISTER_SERVICE"
  | "CONFIGURE_FEE"
  | "CONFIGURE_COMMISSION"
  | "CONFIGURE_LIMIT"
  | "SET_AGENT_PIN"
  | "VERIFY_AGENT_KYC"
  | "VERIFY_CUSTOMER_KYC"
  | "CREATE_TRANSACTION"
  | "APPROVE_TRANSACTION"
  | "REJECT_TRANSACTION"
  | "REVERSE_TRANSACTION"
  | "REFUND_TRANSACTION"
  | "SETTLE_DAY"
  | "ACK_ALERT"
  | "REVIEW_RECONCILIATION";

const actionNames = [
  "REGISTER_BRANCH", "REGISTER_AGENT", "REGISTER_CUSTOMER", "REGISTER_SERVICE", "CONFIGURE_FEE", "CONFIGURE_COMMISSION", "CONFIGURE_LIMIT", "SET_AGENT_PIN", "VERIFY_AGENT_KYC", "VERIFY_CUSTOMER_KYC", "CREATE_TRANSACTION", "APPROVE_TRANSACTION", "REJECT_TRANSACTION", "REVERSE_TRANSACTION", "REFUND_TRANSACTION", "SETTLE_DAY", "ACK_ALERT", "REVIEW_RECONCILIATION",
] as const;

const money = z.number().finite().positive().max(1_000_000_000_000);
const nonNegativeMoney = z.number().finite().min(0).max(1_000_000_000_000);
const text = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(2_000).optional().default("");
const uuid = z.string().uuid();
const phone = z.string().trim().regex(/^(?:\+?255|0)(?:6|7|8)\d{8}$/, "Use a valid Tanzania mobile number.");
const transactionType = z.enum(["Cash In", "Cash Out", "Transfer", "Bill Payment", "Airtime", "Data", "Mobile Money", "Bank to Wallet", "Wallet to Bank"]);

const payloadSchemas: Record<MoneyAgentAction, z.ZodType<JsonRecord>> = {
  REGISTER_BRANCH: z.object({ branchCode: text.max(30), name: text, region: optionalText, district: optionalText, ward: optionalText, address: optionalText, phone: z.string().trim().max(32).optional().default("") }),
  REGISTER_AGENT: z.object({ agentCode: text.max(30), fullName: text.max(180), phone, nationalId: text.max(80), profileId: uuid.nullable().optional().default(null), branchId: uuid.nullable().optional().default(null), supervisorId: uuid.nullable().optional().default(null), kycStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]).optional().default("Pending"), kybStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]).optional().default("Pending"), dailyLimit: nonNegativeMoney.optional().default(5_000_000), monthlyLimit: nonNegativeMoney.optional().default(100_000_000), notes: optionalText, metadata: z.record(z.string(), z.unknown()).optional().default({}) }),
  REGISTER_CUSTOMER: z.object({ fullName: text.max(180), phone, profileId: uuid.nullable().optional().default(null), nationalId: z.string().trim().max(80).optional().default(""), kycStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]).optional().default("Pending"), address: optionalText, metadata: z.record(z.string(), z.unknown()).optional().default({}) }),
  REGISTER_SERVICE: z.object({ serviceCode: text.max(40), name: text.max(180), serviceType: z.enum(["Cash In", "Cash Out", "Transfer", "Bill Payment", "Airtime", "Data", "Mobile Money", "Bank to Wallet", "Wallet to Bank"]), providerCode: z.string().trim().max(80).optional().default(""), requiresProvider: z.boolean().optional().default(true), active: z.boolean().optional().default(true), metadata: z.record(z.string(), z.unknown()).optional().default({}) }),
  CONFIGURE_FEE: z.object({ serviceCode: text.max(40), minAmount: nonNegativeMoney.optional().default(0), maxAmount: nonNegativeMoney.nullable().optional().default(null), feeType: z.enum(["Flat", "Percentage"]), feeValue: nonNegativeMoney }),
  CONFIGURE_COMMISSION: z.object({ serviceCode: text.max(40), commissionType: z.enum(["Flat", "Percentage"]), commissionValue: nonNegativeMoney, active: z.boolean().optional().default(true) }),
  CONFIGURE_LIMIT: z.object({ agentId: uuid.nullable().optional().default(null), transactionType, maxSingleAmount: money, dailyAmount: money, monthlyAmount: money, velocityWindowMinutes: z.number().int().min(1).max(1440).optional().default(10), velocityCount: z.number().int().min(1).max(1000).optional().default(10), active: z.boolean().optional().default(true) }),
  SET_AGENT_PIN: z.object({ agentId: uuid, pin: z.string().regex(/^\d{4,6}$/, "PIN must contain 4 to 6 digits.") }),
  VERIFY_AGENT_KYC: z.object({ agentId: uuid, kycStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]), kybStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]), note: optionalText }),
  VERIFY_CUSTOMER_KYC: z.object({ customerId: uuid, kycStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]), note: optionalText }),
  CREATE_TRANSACTION: z.object({ agentId: uuid.nullable().optional().default(null), branchId: uuid.nullable().optional().default(null), customerId: uuid.nullable().optional().default(null), serviceId: uuid.nullable().optional().default(null), transactionType, amount: money, idempotencyKey: uuid, authorizationMethod: z.enum(["agent_pin", "customer_otp", "supervisor_approval"]).optional().default("supervisor_approval"), authorizationReference: text.max(200), metadata: z.record(z.string(), z.unknown()).optional().default({}) }),
  APPROVE_TRANSACTION: z.object({ transactionId: uuid, note: optionalText }),
  REJECT_TRANSACTION: z.object({ transactionId: uuid, note: text.max(500) }),
  REVERSE_TRANSACTION: z.object({ transactionId: uuid, note: text.max(500) }),
  REFUND_TRANSACTION: z.object({ transactionId: uuid, note: text.max(500) }),
  SETTLE_DAY: z.object({ agentId: uuid, businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), openingFloat: nonNegativeMoney.optional().default(0), closingFloat: nonNegativeMoney.optional(), notes: optionalText }),
  ACK_ALERT: z.object({ alertId: uuid }),
  REVIEW_RECONCILIATION: z.object({ reconciliationId: uuid, status: z.enum(["Approved", "Variance"]), notes: optionalText }),
};

export const moneyAgentListInput = z.object({ limit: z.number().int().min(1).max(200).optional().default(100) });
export const moneyAgentActionInput = z.object({ action: z.enum(actionNames), payload: z.record(z.string(), z.unknown()).default({}) });

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sessionToken(req: CreateExpressContextOptions["req"]): string {
  const custom = req.headers["x-supabase-authorization"];
  if (typeof custom === "string" && custom.startsWith("Bearer ")) return custom.slice(7);
  const authorization = req.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = parseCookie(req.headers.cookie || "")[COOKIE_NAME];
  return cookie || "";
}

async function authenticatedRequest(req: CreateExpressContextOptions["req"]) {
  const token = sessionToken(req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated Money Agent session is required." });
  const resolved = await resolveVerifiedProfile(req);
  if (!resolved.profile?.company_id) throw new TRPCError({ code: "FORBIDDEN", message: "A verified workspace assignment is required for Money Agent operations." });
  return token;
}

async function parseBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { message: raw.slice(0, 500) }; }
}

async function userRpc<T>(functionName: string, token: string, body: JsonRecord): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Money Agent persistence is not configured for this deployment." });
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseBody(response);
  if (!response.ok) {
    const providerMessage = isRecord(payload) && typeof payload.message === "string" ? payload.message : "";
    const code = response.status === 401 ? "UNAUTHORIZED" : response.status === 403 ? "FORBIDDEN" : response.status === 409 ? "CONFLICT" : response.status === 429 ? "TOO_MANY_REQUESTS" : response.status === 412 ? "PRECONDITION_FAILED" : "BAD_REQUEST";
    throw new TRPCError({ code, message: providerMessage || "The Money Agent operation could not be completed safely." });
  }
  return payload as T;
}

export async function getMoneyAgentSnapshot(req: CreateExpressContextOptions["req"], input: z.infer<typeof moneyAgentListInput>) {
  const token = await authenticatedRequest(req);
  return userRpc("money_agent_snapshot", token, { p_limit: input.limit });
}

export async function getMoneyAgentCustomerSnapshot(req: CreateExpressContextOptions["req"], input: z.infer<typeof moneyAgentListInput>) {
  const token = await authenticatedRequest(req);
  return userRpc("money_agent_customer_snapshot", token, { p_limit: input.limit });
}

export async function runMoneyAgentAction(req: CreateExpressContextOptions["req"], input: z.infer<typeof moneyAgentActionInput>) {
  const token = await authenticatedRequest(req);
  const parsedPayload = payloadSchemas[input.action].parse(input.payload);
  return userRpc("money_agent_action", token, { p_action: input.action, p_payload: parsedPayload });
}

export type MoneyAgentSnapshot = Awaited<ReturnType<typeof getMoneyAgentSnapshot>>;
