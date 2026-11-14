import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { storagePut } from "./storage";

type PropertyRequest = CreateExpressContextOptions["req"];
type JsonRecord = Record<string, unknown>;

export const propertyActionNames = [
  "CREATE_TAX_RULE", "REGISTER_METER", "REGISTER_CONTRACTOR", "REGISTER_PORTFOLIO", "REGISTER_OWNER", "REGISTER_BUILDING", "REGISTER_PLOT", "REGISTER_UNIT", "REGISTER_LISTING", "REGISTER_AGENT", "REGISTER_TENANT", "SUBMIT_APPLICATION", "APPROVE_APPLICATION", "CREATE_LEASE", "APPROVE_LEASE", "RECORD_HANDOVER", "RECORD_INSPECTION", "REGISTER_INSURANCE", "CREATE_BUDGET", "REGISTER_SERVICE_CHARGE", "GENERATE_INVOICE", "RECORD_PAYMENT", "CREATE_MAINTENANCE_REQUEST", "ASSIGN_WORK_ORDER", "COMPLETE_WORK_ORDER", "CREATE_EXPENSE", "APPROVE_EXPENSE", "RECORD_METER_READING", "ISSUE_NOTICE", "TERMINATE_LEASE", "CREATE_DOCUMENT", "RECONCILE_PAYMENT", "RUN_PROPERTY_CONTROLS",
] as const;
export type PropertyAction = typeof propertyActionNames[number];

const text = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(2_000).optional().default("");
const uuid = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO business date.");
const money = z.number().finite().min(0).max(1_000_000_000_000);
const phone = z.string().trim().regex(/^(?:\+?255|0)(?:6|7|8)\d{8}$/, "Use a valid Tanzania mobile number.");
const status = z.string().trim().min(1).max(80);

const payloadSchemas: Record<PropertyAction, z.ZodType<JsonRecord>> = {
  CREATE_TAX_RULE: z.object({ code: text.max(40), name: text.max(160), appliesTo: z.enum(["Rent", "Service Charge", "Utility", "Late Fee", "Sale", "All"]).default("Rent"), rate: money.default(0), flatAmount: money.default(0), status: z.enum(["Active", "Inactive"]).default("Active") }),
  REGISTER_METER: z.object({ unitId: uuid, utilityType: z.enum(["Electricity", "Water", "Gas", "Internet", "Other"]).default("Electricity"), meterNumber: optionalText, unitOfMeasure: text.max(40).default("unit"), rate: money.default(0), status: z.enum(["Active", "Inactive"]).default("Active") }),
  REGISTER_CONTRACTOR: z.object({ contractorCode: text.max(40), name: text.max(180), phone: phone.optional(), email: z.string().trim().email().max(180).optional(), trade: optionalText, taxNumber: optionalText, status: z.enum(["Active", "Inactive", "Blocked"]).default("Active") }),
  REGISTER_PORTFOLIO: z.object({ portfolioCode: text.max(40), name: text.max(180), description: optionalText }),
  REGISTER_OWNER: z.object({ profileId: uuid.nullable().optional().default(null), ownerType: z.enum(["Individual", "Company", "Trust", "Institution"]).default("Individual"), legalName: text.max(180), phone: phone.optional(), email: z.string().trim().email().max(180).optional(), nationalId: optionalText, tin: optionalText, kycStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected"]).default("Pending"), notes: optionalText }),
  REGISTER_BUILDING: z.object({ portfolioId: uuid, propertyCode: text.max(40), name: text.max(180), propertyType: z.enum(["Building", "Apartment Block", "House", "Commercial Centre", "Office Block", "Warehouse", "Mixed Use"]).default("Building"), address: optionalText, region: optionalText, district: optionalText, ward: optionalText, village: optionalText, latitude: z.number().finite().min(-90).max(90).nullable().optional().default(null), longitude: z.number().finite().min(-180).max(180).nullable().optional().default(null), yearBuilt: z.number().int().min(1800).max(2200).nullable().optional().default(null), floors: z.number().int().min(1).max(300).nullable().optional().default(null), status: z.enum(["Draft", "Active", "Maintenance", "Archived"]).default("Active") }),
  REGISTER_PLOT: z.object({ portfolioId: uuid, plotCode: text.max(40), titleNumber: optionalText, landUse: optionalText, areaSqm: money.default(0), address: optionalText, region: optionalText, district: optionalText, ward: optionalText, latitude: z.number().finite().min(-90).max(90).nullable().optional().default(null), longitude: z.number().finite().min(-180).max(180).nullable().optional().default(null), ownerId: uuid.nullable().optional().default(null), status: z.enum(["Available", "Leased", "Sold", "Disputed", "Archived"]).default("Available") }),
  REGISTER_UNIT: z.object({ buildingId: uuid.nullable().optional().default(null), plotId: uuid.nullable().optional().default(null), ownerId: uuid.nullable().optional().default(null), unitCode: text.max(40), unitType: z.enum(["Apartment", "House", "Commercial Space", "Office", "Shop", "Warehouse", "Parking", "Plot", "Room"]).default("Apartment"), floorLabel: optionalText, bedrooms: z.number().int().min(0).max(100).nullable().optional().default(null), bathrooms: z.number().int().min(0).max(100).nullable().optional().default(null), areaSqm: money.default(0), rentAmount: money.default(0), serviceChargeAmount: money.default(0), depositAmount: money.default(0), status: z.enum(["Draft", "Available", "Reserved", "Occupied", "Maintenance", "Sold", "Off Market"]).default("Available"), furnishing: optionalText, notes: optionalText }).refine((value) => Boolean(value.buildingId || value.plotId), "A unit must belong to a building or plot."),
  REGISTER_LISTING: z.object({ unitId: uuid, agentId: uuid.nullable().optional().default(null), listingType: z.enum(["Rent", "Sale", "Leasehold"]).default("Rent"), askingAmount: money, commissionRate: money.default(0), availableFrom: date.nullable().optional().default(null), expiresAt: date.nullable().optional().default(null), description: optionalText, status: z.enum(["Draft", "Published", "Reserved", "Closed", "Withdrawn"]).default("Draft") }),
  REGISTER_AGENT: z.object({ profileId: uuid.nullable().optional().default(null), agentCode: text.max(40), fullName: text.max(180), phone, email: z.string().trim().email().max(180).optional(), licenceNumber: optionalText, commissionRate: money.default(0), status: z.enum(["Active", "Suspended", "Inactive"]).default("Active"), branchLabel: optionalText }),
  REGISTER_TENANT: z.object({ profileId: uuid.nullable().optional().default(null), tenantCode: text.max(40), fullName: text.max(180), phone, email: z.string().trim().email().max(180).optional(), nationalId: optionalText, tin: optionalText, kycStatus: z.enum(["Pending", "Verified", "Needs Review", "Rejected", "Expired"]).default("Pending"), status: z.enum(["Active", "Blocked", "Inactive"]).default("Active"), address: optionalText, emergencyContact: optionalText }),
  SUBMIT_APPLICATION: z.object({ unitId: uuid, tenantId: uuid, agentId: uuid.nullable().optional().default(null), requestedStartDate: date.nullable().optional().default(null), proposedRent: money.default(0), idempotencyKey: uuid }),
  APPROVE_APPLICATION: z.object({ applicationId: uuid, note: optionalText }),
  CREATE_LEASE: z.object({ unitId: uuid, tenantId: uuid, applicationId: uuid.nullable().optional().default(null), startDate: date, endDate: date, rentAmount: money, serviceChargeAmount: money.default(0), depositAmount: money.default(0), rentFrequency: z.enum(["Monthly", "Quarterly", "Biannual", "Annual"]).default("Monthly"), noticeDays: z.number().int().min(0).max(365).default(30), status: z.enum(["Active", "Pending Approval"]).default("Pending Approval"), terms: z.record(z.string(), z.unknown()).default({}) }),
  APPROVE_LEASE: z.object({ leaseId: uuid, note: optionalText }),
  RECORD_HANDOVER: z.object({ leaseId: uuid, handoverType: z.enum(["Move In", "Move Out"]).default("Move In"), handoverDate: date.optional(), keysCount: z.number().int().min(0).max(1_000).default(0), meterSnapshot: z.record(z.string(), z.unknown()).default({}), signedByTenant: z.boolean().default(false), signedByManager: z.boolean().default(false), notes: optionalText }),
  RECORD_INSPECTION: z.object({ leaseId: uuid, inspectionType: z.enum(["Move In", "Routine", "Move Out", "Handover"]).default("Move In"), inspectionDate: date.optional(), conditionSummary: optionalText, status: z.enum(["Draft", "Completed", "Disputed"]).default("Completed") }),
  REGISTER_INSURANCE: z.object({ propertyId: uuid.nullable().optional().default(null), unitId: uuid.nullable().optional().default(null), insurer: text.max(180), policyNumber: text.max(100), coverType: text.max(120), premium: money.default(0), startDate: date, endDate: date, status: z.enum(["Draft", "Active", "Expired", "Cancelled"]).default("Active"), notes: optionalText }).refine((value) => Boolean(value.propertyId || value.unitId), "Insurance must be linked to a property or unit."),
  CREATE_BUDGET: z.object({ portfolioId: uuid.nullable().optional().default(null), fiscalYear: z.number().int().min(2000).max(2200), category: text.max(120), budgetAmount: money, status: z.enum(["Draft", "Approved", "Closed"]).default("Draft") }),
  REGISTER_SERVICE_CHARGE: z.object({ unitId: uuid, name: text.max(180), amount: money, frequency: z.enum(["Monthly", "Quarterly", "Annual", "One Time"]).default("Monthly"), status: z.enum(["Active", "Inactive"]).default("Active") }),
  GENERATE_INVOICE: z.object({ leaseId: uuid, invoiceType: z.enum(["Rent", "Service Charge", "Deposit", "Utility", "Late Fee", "Other"]).default("Rent"), periodStart: date.optional(), periodEnd: date.optional(), dueDate: date.optional(), description: optionalText }),
  RECORD_PAYMENT: z.object({ invoiceId: uuid, amount: money.refine((value) => value > 0, "Payment amount must be positive."), paymentMethod: z.enum(["Cash", "Bank Transfer", "Mobile Money", "Card", "Cheque", "Provider"]), providerCode: z.string().trim().max(80).optional(), providerReference: z.string().trim().max(200).optional(), idempotencyKey: uuid }),
  CREATE_MAINTENANCE_REQUEST: z.object({ unitId: uuid.nullable().optional().default(null), leaseId: uuid.nullable().optional().default(null), tenantId: uuid.nullable().optional().default(null), category: text.max(80).default("General"), priority: z.enum(["Low", "Medium", "High", "Emergency"]).default("Medium"), title: text.max(180), description: text.max(2_000) }),
  ASSIGN_WORK_ORDER: z.object({ requestId: uuid, contractorId: uuid.nullable().optional().default(null), assignedProfileId: uuid.nullable().optional().default(null), estimatedCost: money.default(0), dueDate: date.optional() }),
  COMPLETE_WORK_ORDER: z.object({ workOrderId: uuid, actualCost: money.default(0), completionNote: optionalText }),
  CREATE_EXPENSE: z.object({ propertyId: uuid.nullable().optional().default(null), unitId: uuid.nullable().optional().default(null), workOrderId: uuid.nullable().optional().default(null), category: text.max(120), description: text.max(500), amount: money.refine((value) => value > 0, "Expense amount must be positive."), expenseDate: date.optional(), paymentMethod: optionalText, paymentReference: optionalText }),
  APPROVE_EXPENSE: z.object({ expenseId: uuid, note: optionalText }),
  RECORD_METER_READING: z.object({ meterId: uuid, readingDate: date.optional(), readingValue: money, source: z.enum(["Manual", "Import", "Provider Pending"]).default("Manual"), notes: optionalText }),
  ISSUE_NOTICE: z.object({ leaseId: uuid.nullable().optional().default(null), tenantId: uuid.nullable().optional().default(null), noticeType: z.enum(["Rent Due", "Overdue", "Lease Expiry", "Termination", "General", "Maintenance"]).default("General"), title: text.max(180), body: text.max(2_000), noticeDate: date.optional(), effectiveDate: date.optional() }),
  TERMINATE_LEASE: z.object({ leaseId: uuid, note: optionalText }),
  CREATE_DOCUMENT: z.object({ entityType: z.enum(["Portfolio", "Owner", "Building", "Plot", "Unit", "Agent", "Tenant", "Application", "Lease", "Inspection", "Maintenance", "Expense"]), entityId: uuid, documentType: text.max(80), title: text.max(180), storageKey: optionalText, fileUrl: z.string().trim().max(1_000).optional(), documentDate: date.optional(), expiresAt: date.optional(), verificationStatus: z.enum(["Pending", "Verified", "Rejected", "Expired"]).default("Pending"), metadata: z.record(z.string(), z.unknown()).default({}) }),
  RECONCILE_PAYMENT: z.object({ paymentId: uuid, actualAmount: money.optional(), notes: optionalText }),
  RUN_PROPERTY_CONTROLS: z.object({ limit: z.number().int().min(1).max(500).default(500) }),
};

export const propertyListInput = z.object({ limit: z.number().int().min(1).max(200).optional().default(100) });
export const propertyActionInput = z.object({ action: z.enum(propertyActionNames), payload: z.record(z.string(), z.unknown()).default({}) });
export const propertyDocumentUploadInput = z.object({ entityType: z.enum(["Portfolio", "Owner", "Building", "Plot", "Unit", "Agent", "Tenant", "Application", "Lease", "Inspection", "Maintenance", "Expense"]), entityId: uuid, documentType: text.max(80), title: text.max(180), fileName: text.max(180), contentType: z.string().trim().max(120).default("application/octet-stream"), dataBase64: z.string().min(1).max(12_000_000), documentDate: date.optional(), expiresAt: date.optional(), verificationStatus: z.enum(["Pending", "Verified", "Rejected", "Expired"]).default("Pending") });

function sessionToken(req: PropertyRequest): string {
  const custom = req.headers["x-supabase-authorization"];
  if (typeof custom === "string" && custom.startsWith("Bearer ")) return custom.slice(7);
  const authorization = req.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) return authorization.slice(7);
  return parseCookie(req.headers.cookie || "")[COOKIE_NAME] || "";
}

async function authenticatedRequest(req: PropertyRequest) {
  const token = sessionToken(req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated Property Management session is required." });
  const resolved = await resolveVerifiedProfile(req);
  if (!resolved.profile?.company_id) throw new TRPCError({ code: "FORBIDDEN", message: "A verified workspace assignment is required for Property Management operations." });
  return { token, role: String(resolved.profile.role || ""), companyId: resolved.profile.company_id };
}

async function parseBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { message: raw.slice(0, 500) }; }
}

async function userRpc<T>(functionName: string, token: string, body: JsonRecord): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Property Management persistence is not configured for this deployment." });
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, { method: "POST", headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
  const payload = await parseBody(response);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && !Array.isArray(payload) && typeof (payload as Record<string, unknown>).message === "string" ? String((payload as Record<string, unknown>).message) : "The Property Management operation could not be completed safely.";
    const code = response.status === 401 ? "UNAUTHORIZED" : response.status === 403 ? "FORBIDDEN" : response.status === 409 ? "CONFLICT" : response.status === 412 ? "PRECONDITION_FAILED" : "BAD_REQUEST";
    throw new TRPCError({ code, message });
  }
  return payload as T;
}

export async function getPropertySnapshot(req: PropertyRequest, input: z.infer<typeof propertyListInput>) {
  const { token, role } = await authenticatedRequest(req);
  const normalized = role.trim().toLowerCase();
  if (normalized.includes("tenant") || normalized === "customer") return userRpc("property_tenant_snapshot", token, { p_limit: input.limit });
  return userRpc("property_snapshot", token, { p_limit: input.limit });
}

export async function runPropertyAction(req: PropertyRequest, input: z.infer<typeof propertyActionInput>) {
  const { token } = await authenticatedRequest(req);
  const parsedPayload = payloadSchemas[input.action].parse(input.payload);
  return userRpc("property_action", token, { p_action: input.action, p_payload: parsedPayload });
}

export async function uploadPropertyDocument(req: PropertyRequest, input: z.infer<typeof propertyDocumentUploadInput>) {
  const { token, companyId } = await authenticatedRequest(req);
  const rawBase64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
  let bytes: Buffer;
  try { bytes = Buffer.from(rawBase64, "base64"); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "The document payload is not valid base64." }); }
  if (!bytes.length) throw new TRPCError({ code: "BAD_REQUEST", message: "The document is empty." });
  const uploaded = await storagePut(`property/${companyId}/${input.entityType.toLowerCase()}/${input.entityId}/${input.fileName}`, bytes, input.contentType);
  return userRpc("property_action", token, { p_action: "CREATE_DOCUMENT", p_payload: { entityType: input.entityType, entityId: input.entityId, documentType: input.documentType, title: input.title, storageKey: uploaded.key, fileUrl: uploaded.url, documentDate: input.documentDate, expiresAt: input.expiresAt, verificationStatus: input.verificationStatus } });
}

export type PropertySnapshot = Awaited<ReturnType<typeof getPropertySnapshot>>;
