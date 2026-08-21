import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

export const HEALTHCARE_TABLES = [
  "hc_patients",
  "hc_doctors",
  "hc_appointments",
  "hc_visits",
  "hc_vitals",
  "hc_prescriptions",
  "hc_lab_orders",
  "hc_radiology",
  "hc_invoices",
  "hc_insurance_claims",
  "hc_notifications",
  "hc_reports",
  "hc_reminder_settings",
  "hc_reminder_deliveries",
  "hc_portal_reference_imports",
  "hc_portal_reference_approvals",
  "hc_portal_reference_summary_settings",
] as const;

export type HealthcareTable = (typeof HEALTHCARE_TABLES)[number];

const healthcareTableSchema = z.enum(HEALTHCARE_TABLES);
const healthcareIdSchema = z.string().uuid();
const textValue = z.string().trim().max(4_000);
const shortTextValue = z.string().trim().max(240);

const tableDataKeys: Record<HealthcareTable, readonly string[]> = {
  hc_patients: ["mrn", "firstName", "lastName", "dateOfBirth", "gender", "bloodType", "phone", "email", "nationalId", "nationality", "occupation", "maritalStatus", "allergies", "chronicConditions", "insuranceProvider", "insuranceMemberId", "emergencyContactName", "emergencyContactPhone", "address", "clinicalNotes", "patientPortalReference", "smsConsentStatus", "smsConsentCapturedAt", "smsConsentMethod", "smsConsentRevokedAt", "archivedAt"],
  hc_doctors: ["firstName", "lastName", "specialty", "department", "license", "qualifications", "phone", "email", "experienceYears", "consultationFee", "bio", "availability", "archivedAt"],
  hc_appointments: ["patientId", "patientName", "doctorId", "doctorName", "appointmentType", "startsAt", "endsAt", "reason", "checkedInAt", "cancelReason", "archivedAt"],
  hc_visits: ["patientId", "patientName", "doctorId", "doctorName", "appointmentId", "openedAt", "closedAt", "chiefComplaint", "diagnosis", "clinicalNotes", "followUpDate", "archivedAt"],
  hc_vitals: ["patientId", "patientName", "visitId", "recordedAt", "recordedBy", "bloodPressure", "pulse", "temperature", "weightKg", "heightCm", "spo2", "respiratoryRate", "painScore", "bmi", "clinicalNotes", "archivedAt"],
  hc_prescriptions: ["patientId", "patientName", "doctorId", "doctorName", "visitId", "issuedAt", "medications", "instructions", "dispensedAt", "dispensedBy", "archivedAt"],
  hc_lab_orders: ["patientId", "patientName", "doctorId", "doctorName", "visitId", "orderedAt", "tests", "priority", "results", "reportedAt", "reportedBy", "archivedAt"],
  hc_radiology: ["patientId", "patientName", "doctorId", "doctorName", "visitId", "orderedAt", "scanType", "bodyRegion", "priority", "findings", "reportedAt", "reportedBy", "archivedAt"],
  hc_invoices: ["patientId", "patientName", "appointmentId", "visitId", "issuedAt", "services", "subtotal", "discountPercent", "discountAmount", "balance", "paymentMethod", "insuranceProvider", "insuranceClaimStatus", "paidAt", "archivedAt"],
  hc_insurance_claims: ["patientId", "patientName", "invoiceId", "invoiceName", "provider", "memberId", "claimNumber", "submittedAt", "reviewedAt", "decisionAt", "approvedAmount", "requestedAmount", "decisionNotes", "archivedAt"],
  hc_notifications: ["eventType", "severity", "patientId", "patientName", "claimId", "invoiceId", "relatedTable", "relatedRecordId", "actionLabel", "readAt", "acknowledgedBy", "archivedAt"],
  hc_reports: ["patientId", "patientName", "doctorId", "doctorName", "visitId", "reportType", "createdAt", "signedAt", "signedBy", "content", "archivedAt"],
  hc_reminder_settings: ["provider", "senderId", "timezone", "leadMinutes", "consentRequired", "enabled", "scheduleEnabled", "scheduleTaskUid", "lastDispatchAt", "archivedAt"],
  hc_reminder_deliveries: ["appointmentId", "patientId", "scheduledFor", "leadMinutes", "channel", "provider", "providerMessageId", "attemptCount", "errorCategory", "consentCapturedAt", "idempotencyKey", "providerEventId", "providerEventStatus", "providerStatusAt", "providerEventReceivedAt", "archivedAt"],
  hc_portal_reference_imports: ["batchId", "rowNumber", "patientId", "mrn", "proposedReference", "previousReference", "validationReason", "approvalId", "requestedAt", "requestedById", "requestedByName", "appliedAt", "archivedAt"],
  hc_portal_reference_approvals: ["patientId", "importId", "previousReference", "proposedReference", "reason", "requestedAt", "requestedById", "requestedByName", "decidedAt", "decidedById", "decidedByName", "decisionNote", "archivedAt"],
  hc_portal_reference_summary_settings: ["recipientMode", "roleRecipients", "managedRecipients", "timezone", "deliveryEnabled", "scheduleCronTaskUid", "updatedById", "updatedByName", "archivedAt"],
};

const fullHealthcareAccessRoles = new Set([
  "Super Administrator",
  "Organization Owner",
  "CEO",
  "Clinic Administrator",
]);

const tablePermissions: Record<HealthcareTable, { read: string[]; create: string[]; update: string[]; archive: string[] }> = {
  hc_patients: {
    read: ["front_desk", "clinician", "billing"],
    create: ["front_desk", "clinician"],
    update: ["front_desk", "clinician"],
    archive: ["front_desk"],
  },
  hc_doctors: {
    read: ["front_desk", "clinician"],
    create: ["admin"],
    update: ["admin"],
    archive: ["admin"],
  },
  hc_appointments: {
    read: ["front_desk", "clinician", "billing"],
    create: ["front_desk", "clinician"],
    update: ["front_desk", "clinician"],
    archive: ["front_desk"],
  },
  hc_visits: {
    read: ["clinician"],
    create: ["clinician"],
    update: ["clinician"],
    archive: ["admin"],
  },
  hc_vitals: {
    read: ["clinician"],
    create: ["clinician"],
    update: ["clinician"],
    archive: ["admin"],
  },
  hc_prescriptions: {
    read: ["clinician", "pharmacy"],
    create: ["clinician"],
    update: ["clinician", "pharmacy"],
    archive: ["admin", "clinician"],
  },
  hc_lab_orders: {
    read: ["clinician", "laboratory"],
    create: ["clinician"],
    update: ["clinician", "laboratory"],
    archive: ["admin"],
  },
  hc_radiology: {
    read: ["clinician", "laboratory"],
    create: ["clinician"],
    update: ["clinician", "laboratory"],
    archive: ["admin"],
  },
  hc_invoices: {
    read: ["front_desk", "billing"],
    create: ["front_desk", "billing"],
    update: ["billing"],
    archive: ["admin", "billing"],
  },
  hc_insurance_claims: {
    read: ["front_desk", "billing"],
    create: ["billing"],
    update: ["billing"],
    archive: ["admin", "billing"],
  },
  hc_notifications: {
    read: ["front_desk", "clinician", "laboratory", "pharmacy", "billing"],
    create: ["front_desk", "clinician", "laboratory", "pharmacy", "billing"],
    update: ["front_desk", "clinician", "laboratory", "pharmacy", "billing"],
    archive: ["admin"],
  },
  hc_reports: {
    read: ["clinician", "billing"],
    create: ["clinician"],
    update: ["clinician"],
    archive: ["admin", "clinician"],
  },
  hc_reminder_settings: {
    read: ["admin"],
    create: ["admin"],
    update: ["admin"],
    archive: ["admin"],
  },
  hc_reminder_deliveries: {
    read: ["admin", "front_desk"],
    create: ["admin"],
    update: ["admin"],
    archive: ["admin"],
  },
  hc_portal_reference_imports: {
    read: ["admin", "front_desk"],
    create: ["admin", "front_desk"],
    update: ["admin", "front_desk"],
    archive: ["admin"],
  },
  hc_portal_reference_approvals: {
    read: ["admin"],
    create: ["admin"],
    update: ["admin"],
    archive: ["admin"],
  },
  hc_portal_reference_summary_settings: {
    read: ["admin"],
    create: ["admin"],
    update: ["admin"],
    archive: ["admin"],
  },
};

const roleGroups: Record<string, readonly string[]> = {
  "Super Administrator": ["admin", "front_desk", "clinician", "laboratory", "pharmacy", "billing"],
  "Organization Owner": ["admin", "front_desk", "clinician", "laboratory", "pharmacy", "billing"],
  CEO: ["admin", "front_desk", "clinician", "laboratory", "pharmacy", "billing"],
  "Clinic Administrator": ["admin", "front_desk", "clinician", "laboratory", "pharmacy", "billing"],
  Doctor: ["clinician"],
  Nurse: ["clinician"],
  "Laboratory Technician": ["laboratory"],
  Pharmacist: ["pharmacy"],
  Receptionist: ["front_desk"],
  "Billing Officer": ["billing"],
  "Finance Manager": ["billing"],
  CFO: ["billing"],
};

export type HealthcareAction = "read" | "create" | "update" | "archive";

export function healthcareAccessForRole(role: string) {
  const groups = roleGroups[role] || [];
  const can = (table: HealthcareTable, action: HealthcareAction) => {
    if (fullHealthcareAccessRoles.has(role)) return true;
    return tablePermissions[table][action].some((group) => groups.includes(group));
  };
  return {
    role,
    canRead: Object.fromEntries(HEALTHCARE_TABLES.map((table) => [table, can(table, "read")])),
    canCreate: Object.fromEntries(HEALTHCARE_TABLES.map((table) => [table, can(table, "create")])),
    canUpdate: Object.fromEntries(HEALTHCARE_TABLES.map((table) => [table, can(table, "update")])),
    canArchive: Object.fromEntries(HEALTHCARE_TABLES.map((table) => [table, can(table, "archive")])),
  };
}

function ensureHealthcarePermission(role: string, table: HealthcareTable, action: HealthcareAction) {
  const access = healthcareAccessForRole(role);
  const key = action === "read" ? "canRead" : action === "create" ? "canCreate" : action === "update" ? "canUpdate" : "canArchive";
  if (!access[key][table]) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your assigned healthcare role does not allow this action." });
  }
  return access;
}

function healthcareUrl(table: HealthcareTable, params: URLSearchParams) {
  const base = ENV.supabaseUrl.replace(/\/$/, "");
  return `${base}/rest/v1/${table}?${params.toString()}`;
}

async function healthcareRequest<T>(table: HealthcareTable, token: string, params: URLSearchParams, init: RequestInit = {}) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Healthcare data services are not configured." });
  }
  const response = await fetch(healthcareUrl(table, params), {
    ...init,
    headers: {
      apikey: ENV.supabaseAnonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) {
    if (response.status === 401) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your workspace session could not be verified." });
    if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "This healthcare record is not available to your workspace." });
    if (response.status === 409) throw new TRPCError({ code: "CONFLICT", message: "This healthcare record changed before your update completed. Refresh and try again." });
    throw new TRPCError({ code: "BAD_REQUEST", message: "The healthcare record could not be saved. Check the required fields and try again." });
  }
  return body as T;
}

function inflateHealthcareRecord(record: Record<string, unknown>) {
  const data = record.data && typeof record.data === "object" && !Array.isArray(record.data) ? record.data as Record<string, unknown> : {};
  return { ...data, ...record, data };
}

function sanitizeRecordData(table: HealthcareTable, data: Record<string, unknown>) {
  const allowed = new Set(tableDataKeys[table]);
  const invalidKeys = Object.keys(data).filter((key) => !allowed.has(key));
  if (invalidKeys.length > 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The healthcare form contains unsupported fields. Refresh the form and try again." });
  }
  const serialized = JSON.stringify(data);
  if (serialized.length > 24_000) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "The healthcare record is too large to save." });
  }
  return data;
}

const recordInputSchema = z.object({
  name: shortTextValue,
  status: shortTextValue,
  amount: z.number().finite().min(0).max(10_000_000_000).nullable().optional(),
  notes: textValue.nullable().optional(),
  data: z.record(z.string(), z.unknown()),
});

const patchInputSchema = z.object({
  name: shortTextValue.optional(),
  status: shortTextValue.optional(),
  amount: z.number().finite().min(0).max(10_000_000_000).nullable().optional(),
  notes: textValue.nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const healthcareListInput = z.object({
  table: healthcareTableSchema,
  includeArchived: z.boolean().optional().default(false),
  search: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(250).optional().default(100),
});

export const healthcareCreateInput = z.object({ table: healthcareTableSchema, record: recordInputSchema });
export const healthcareUpdateInput = z.object({ table: healthcareTableSchema, id: healthcareIdSchema, patch: patchInputSchema });
export const healthcareArchiveInput = z.object({ table: healthcareTableSchema, id: healthcareIdSchema });

export async function getHealthcareAccess(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  return healthcareAccessForRole(profile.role);
}

async function authenticatedHealthcareContext(req: CreateExpressContextOptions["req"], table: HealthcareTable, action: HealthcareAction) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const access = ensureHealthcarePermission(profile.role, table, action);
  return { profile, token, access };
}

function recordParams(companyId: string, id?: string) {
  const params = new URLSearchParams({ select: "*", company_id: `eq.${companyId}` });
  if (id) params.set("id", `eq.${id}`);
  return params;
}

async function getRecord(table: HealthcareTable, token: string, companyId: string, id: string) {
  const params = recordParams(companyId, id);
  params.set("limit", "1");
  const rows = await healthcareRequest<Record<string, unknown>[]>(table, token, params);
  const row = rows[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "The requested healthcare record is no longer available." });
  return row;
}

export async function listHealthcareRecords(req: CreateExpressContextOptions["req"], input: z.infer<typeof healthcareListInput>) {
  const { profile, token, access } = await authenticatedHealthcareContext(req, input.table, "read");
  const params = recordParams(profile.company_id);
  params.set("order", "created_at.desc");
  params.set("limit", String(input.limit));
  if (!input.includeArchived) params.append("status", "neq.Archived");
  const rows = await healthcareRequest<Record<string, unknown>[]>(input.table, token, params);
  const search = input.search?.toLocaleLowerCase();
  const records = rows.map(inflateHealthcareRecord).filter((record) => {
    if (!search) return true;
    const searchableRecord = record as Record<string, unknown> & { data: Record<string, unknown> };
    return [searchableRecord.name, searchableRecord.status, searchableRecord.notes, searchableRecord.data.mrn, searchableRecord.data.patientName, searchableRecord.data.doctorName]
      .some((value) => String(value ?? "").toLocaleLowerCase().includes(search));
  });
  return { records, access };
}

export async function createHealthcareRecord(req: CreateExpressContextOptions["req"], input: z.infer<typeof healthcareCreateInput>) {
  const { profile, token, access } = await authenticatedHealthcareContext(req, input.table, "create");
  const data = sanitizeRecordData(input.table, input.record.data);
  const payload = { company_id: profile.company_id, name: input.record.name, status: input.record.status, amount: input.record.amount ?? null, notes: input.record.notes ?? null, data };
  const rows = await healthcareRequest<Record<string, unknown>[]>(input.table, token, new URLSearchParams(), { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
  const record = rows[0];
  if (!record) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The healthcare record could not be confirmed after saving." });
  return { record: inflateHealthcareRecord(record), access, audit: { action: "created", table: input.table } };
}

export async function updateHealthcareRecord(req: CreateExpressContextOptions["req"], input: z.infer<typeof healthcareUpdateInput>) {
  const { profile, token, access } = await authenticatedHealthcareContext(req, input.table, "update");
  const current = await getRecord(input.table, token, profile.company_id, input.id);
  const existingData = current.data && typeof current.data === "object" && !Array.isArray(current.data) ? current.data as Record<string, unknown> : {};
  const patchData = input.patch.data ? sanitizeRecordData(input.table, input.patch.data) : {};
  const patch = {
    ...(input.patch.name !== undefined ? { name: input.patch.name } : {}),
    ...(input.patch.status !== undefined ? { status: input.patch.status } : {}),
    ...(input.patch.amount !== undefined ? { amount: input.patch.amount } : {}),
    ...(input.patch.notes !== undefined ? { notes: input.patch.notes } : {}),
    ...(input.patch.data !== undefined ? { data: { ...existingData, ...patchData } } : {}),
  };
  if (Object.keys(patch).length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose at least one healthcare field to update." });
  const params = recordParams(profile.company_id, input.id);
  const rows = await healthcareRequest<Record<string, unknown>[]>(input.table, token, params, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
  const record = rows[0];
  if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "The healthcare record is no longer available." });
  return { record: inflateHealthcareRecord(record), access, audit: { action: "updated", table: input.table } };
}

export async function archiveHealthcareRecord(req: CreateExpressContextOptions["req"], input: z.infer<typeof healthcareArchiveInput>) {
  const { profile, token, access } = await authenticatedHealthcareContext(req, input.table, "archive");
  const current = await getRecord(input.table, token, profile.company_id, input.id);
  const existingData = current.data && typeof current.data === "object" && !Array.isArray(current.data) ? current.data as Record<string, unknown> : {};
  const params = recordParams(profile.company_id, input.id);
  const rows = await healthcareRequest<Record<string, unknown>[]>(input.table, token, params, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "Archived", data: { ...existingData, archivedAt: new Date().toISOString() } }) });
  const record = rows[0];
  if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "The healthcare record is no longer available." });
  return { record: inflateHealthcareRecord(record), access, audit: { action: "archived", table: input.table } };
}
