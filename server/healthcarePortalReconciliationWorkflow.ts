import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { healthcareAccessForRole } from "./healthcareOperations";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import { getDb } from "./db";
import { webhookDeliveries } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";

const PATIENT_TABLE = "hc_patients";
const IMPORT_TABLE = "hc_portal_reference_imports";
const APPROVAL_TABLE = "hc_portal_reference_approvals";
const SUMMARY_SETTINGS_TABLE = "hc_portal_reference_summary_settings";
const PORTAL_ROLES = new Set(["External Client", "Patient"]);
const SUPERVISOR_ROLES = new Set(["Super Administrator", "Organization Owner", "CEO", "Clinic Administrator"]);
const DEFAULT_ROLE_RECIPIENTS = ["Clinic Administrator", "Organization Owner", "CEO"];
const referenceSchema = z.string().trim().min(2).max(120).regex(/^[A-Za-z0-9 ._\-/'()]+$/, "Use letters, numbers, spaces, and basic reference punctuation only.");

export const portalReferenceCsvInput = z.object({ csvText: z.string().min(8).max(60_000) });
export const portalReferenceImportApplyInput = z.object({ importId: z.string().uuid() });
export const portalReferenceApprovalRequestInput = z.object({ patientId: z.string().uuid(), reference: referenceSchema, reason: z.string().trim().max(240).optional().default("Clinic portal-reference replacement") });
export const portalReferenceApprovalDecisionInput = z.object({ approvalId: z.string().uuid(), decision: z.enum(["Approved", "Rejected"]), note: z.string().trim().max(400).optional().default("") });
export const portalReferenceWorkflowListInput = z.object({ limit: z.number().int().min(1).max(100).optional().default(50) });
export const portalReferenceAuditSearchInput = z.object({ query: z.string().trim().max(120).optional().default(""), status: z.enum(["all", "Pending", "Approved", "Rejected", "Invalid", "Applied", "No change"]).optional().default("all"), limit: z.number().int().min(1).max(100).optional().default(50) });
export const portalReferenceErrorExportInput = z.object({ limit: z.number().int().min(1).max(200).optional().default(200) });
export const portalReferenceSummarySettingsInput = z.object({ recipientMode: z.enum(["roles", "managed", "both"]), managedRecipients: z.array(z.string().trim().email().max(254)).max(25), timezone: z.string().trim().min(3).max(80).default("Africa/Dar_es_Salaam"), deliveryEnabled: z.boolean().optional() });
export const portalReferenceDeliveryHistoryInput = z.object({ limit: z.number().int().min(1).max(50).optional().default(20) });

type Row = { id: string; company_id: string; name: string; status: string; created_at?: string; updated_at?: string; data?: unknown };
type ProfileRow = { id: string; full_name?: string | null; customer_ref?: string | null; role?: string | null; email?: string | null; is_active?: boolean | null };
type Profile = { id: string; company_id: string; full_name: string | null; role: string };
export type PortalReferenceDigestSettings = { id: string; companyId: string; recipientMode: "roles" | "managed" | "both"; roleRecipients: string[]; managedRecipients: string[]; timezone: string; deliveryEnabled: boolean; scheduleCronTaskUid: string | null };

function dataOf(row: Row) { return row.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data as Record<string, unknown> : {}; }
function headers() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Portal-reference reconciliation is not configured." });
  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
}
function url(table: string, params: URLSearchParams) { return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`; }
async function request<T>(table: string, params: URLSearchParams, init: RequestInit = {}) {
  const response = await fetch(url(table, params), { ...init, headers: { ...headers(), ...(init.headers || {}) } });
  const body = await response.json().catch(() => []) as T;
  if (!response.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "The portal-reference workflow could not be completed." });
  return body;
}
async function staff(req: CreateExpressContextOptions["req"]): Promise<Profile> {
  const { profile } = await resolveVerifiedProfile(req);
  if (PORTAL_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Patient portal accounts cannot manage clinic portal references." });
  const access = healthcareAccessForRole(profile.role);
  if (!access.canRead.hc_patients || !access.canUpdate.hc_patients) throw new TRPCError({ code: "FORBIDDEN", message: "Your clinic role cannot reconcile patient portal references." });
  return profile;
}
async function supervisor(req: CreateExpressContextOptions["req"]) {
  const profile = await staff(req);
  if (!SUPERVISOR_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "A clinic supervisor must decide portal-reference replacements." });
  return profile;
}
async function patients(companyId: string) { return request<Row[]>(PATIENT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${companyId}`, status: "neq.Archived", limit: "500", order: "created_at.desc" })); }
async function portalProfiles(companyId: string) {
  const params = new URLSearchParams({ select: "id,full_name,customer_ref,role", company_id: `eq.${companyId}`, limit: "500", order: "full_name.asc" });
  params.set("role", "in.(External Client,Patient)"); params.set("customer_ref", "not.is.null");
  const rows = await request<ProfileRow[]>("profiles", params);
  return rows.filter((row) => PORTAL_ROLES.has(String(row.role || "")) && typeof row.customer_ref === "string" && row.customer_ref.trim());
}

const DIGEST_CRON = "0 38 7 * * *";
const DIGEST_TIMEZONE = "Africa/Dar_es_Salaam";
const DIGEST_TIME_LABEL = "10:38 Africa/Dar_es_Salaam";
const roleAliases = new Map<string, string[]>([
  ["Clinic Administrator", ["clinic administrator", "admin"]],
  ["Organization Owner", ["organization owner", "owner"]],
  ["CEO", ["ceo"]],
]);

function settingsFromRow(row?: Row): PortalReferenceDigestSettings & { updatedAt: string | null; scheduleState: string; nextRunAt: string | null } {
  const data = row ? dataOf(row) : {};
  const recipientMode = data.recipientMode === "roles" || data.recipientMode === "managed" || data.recipientMode === "both" ? data.recipientMode : "both";
  const roleRecipients = Array.isArray(data.roleRecipients) ? data.roleRecipients.filter((value): value is string => typeof value === "string") : DEFAULT_ROLE_RECIPIENTS;
  const managedRecipients = Array.isArray(data.managedRecipients) ? normalizedRecipients(data.managedRecipients.filter((value): value is string => typeof value === "string")) : [];
  const scheduleCronTaskUid = typeof data.scheduleCronTaskUid === "string" && data.scheduleCronTaskUid.trim() ? data.scheduleCronTaskUid : null;
  const deliveryEnabled = data.deliveryEnabled === true && Boolean(scheduleCronTaskUid);
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 38, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return {
    id: row?.id || "",
    companyId: row?.company_id || "",
    recipientMode,
    roleRecipients,
    managedRecipients,
    timezone: typeof data.timezone === "string" ? data.timezone : DIGEST_TIMEZONE,
    deliveryEnabled,
    scheduleCronTaskUid,
    updatedAt: row?.updated_at || row?.created_at || null,
    scheduleState: deliveryEnabled ? `Active — daily at ${DIGEST_TIME_LABEL}` : "Inactive pending explicit time and activation confirmation",
    nextRunAt: deliveryEnabled ? next.toISOString() : null,
  };
}

export async function getPortalReferenceDailySummaryForCompany(companyId: string) {
  const [allPatients, imports, approvals] = await Promise.all([
    patients(companyId),
    request<Row[]>(IMPORT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${companyId}`, limit: "500", order: "created_at.desc" })),
    request<Row[]>(APPROVAL_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${companyId}`, limit: "500", order: "created_at.desc" })),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const todayRows = imports.filter((item) => String(item.created_at || "").slice(0, 10) === today);
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      unlinkedPatients: allPatients.filter((patient) => !String(dataOf(patient).patientPortalReference || "").trim()).length,
      pendingApprovals: approvals.filter((item) => item.status === "Pending").length,
      readyToApply: imports.filter((item) => item.status === "Ready to apply").length,
      appliedToday: todayRows.filter((item) => item.status === "Applied").length,
      rejectedToday: todayRows.filter((item) => item.status === "Rejected").length,
      invalidToday: todayRows.filter((item) => item.status === "Invalid").length,
    },
  };
}

export async function getPortalReferenceDigestSettingsByTaskUid(taskUid: string): Promise<PortalReferenceDigestSettings | null> {
  if (!taskUid.trim()) return null;
  const rows = await request<Row[]>(SUMMARY_SETTINGS_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at,updated_at", "data->>scheduleCronTaskUid": `eq.${taskUid}`, limit: "1" }));
  const settings = settingsFromRow(rows[0]);
  if (!settings.id || !settings.deliveryEnabled || settings.scheduleCronTaskUid !== taskUid) return null;
  return settings;
}

export async function resolvePortalReferenceDigestRecipients(companyId: string, settings: Pick<PortalReferenceDigestSettings, "recipientMode" | "roleRecipients" | "managedRecipients">) {
  const recipients = new Set<string>();
  if (settings.recipientMode === "managed" || settings.recipientMode === "both") normalizedRecipients(settings.managedRecipients).forEach((email) => recipients.add(email));
  if (settings.recipientMode === "roles" || settings.recipientMode === "both") {
    const permitted = new Set(settings.roleRecipients.flatMap((role) => roleAliases.get(role) || [role.toLowerCase()]));
    const rows = await request<ProfileRow[]>("profiles", new URLSearchParams({ select: "email,role,is_active", company_id: `eq.${companyId}`, is_active: "eq.true", email: "not.is.null", limit: "200" }));
    rows.forEach((profile) => {
      const email = profile.email?.trim().toLowerCase();
      if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && permitted.has(String(profile.role || "").trim().toLowerCase())) recipients.add(email);
    });
  }
  return Array.from(recipients).sort();
}
function parseCsv(csv: string) {
  const cells: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) { const char = csv[index]; const next = csv[index + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) cells.push(row); row = []; cell = ""; } else cell += char; }
  row.push(cell.trim()); if (row.some(Boolean)) cells.push(row); if (quoted) throw new TRPCError({ code: "BAD_REQUEST", message: "The CSV contains an unmatched quote." });
  if (cells.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "Add a header and at least one portal-reference row." });
  const header = cells.shift()!.map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, "")); const mrnIndex = header.findIndex((value) => value === "mrn" || value === "patientmrn"); const referenceIndex = header.findIndex((value) => value === "portalreference" || value === "patientportalreference" || value === "reference");
  if (mrnIndex < 0 || referenceIndex < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV headers must include MRN and Portal Reference." });
  if (cells.length > 200) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Import up to 200 rows at a time." });
  return cells.map((values, index) => ({ rowNumber: index + 2, mrn: String(values[mrnIndex] || "").trim(), reference: String(values[referenceIndex] || "").trim() }));
}
async function insertRows(table: string, rows: Array<Record<string, unknown>>) { return request<Row[]>(table, new URLSearchParams(), { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(rows) }); }
async function patchRow(table: string, companyId: string, id: string, patch: Record<string, unknown>) { const rows = await request<Row[]>(table, new URLSearchParams({ id: `eq.${id}`, company_id: `eq.${companyId}` }), { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) }); if (rows.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "The reconciliation record changed before the update completed." }); return rows[0]; }
async function patientById(companyId: string, patientId: string) { const rows = await request<Row[]>(PATIENT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data", id: `eq.${patientId}`, company_id: `eq.${companyId}`, limit: "1" })); if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "The patient record is no longer available in this clinic." }); return rows[0]; }
async function validateCandidate(companyId: string, patient: Row, reference: string) {
  const [profiles, allPatients] = await Promise.all([portalProfiles(companyId), patients(companyId)]); const matches = profiles.filter((profile) => profile.customer_ref!.trim() === reference); if (matches.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "This portal reference is unavailable or needs review before it can be used." });
  const duplicate = allPatients.some((row) => row.id !== patient.id && String(dataOf(row).patientPortalReference || "").trim() === reference); if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "This portal reference is already linked to another patient record." });
}
async function replaceReference(companyId: string, patientId: string, reference: string) { const patient = await patientById(companyId, patientId); await validateCandidate(companyId, patient, reference); const updated = await patchRow(PATIENT_TABLE, companyId, patient.id, { data: { ...dataOf(patient), patientPortalReference: reference } }); return updated; }

export async function stagePortalReferenceCsvImport(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceCsvInput>) {
  const profile = await staff(req); const parsed = parseCsv(input.csvText); const [allPatients, profiles] = await Promise.all([patients(profile.company_id), portalProfiles(profile.company_id)]); const batchId = crypto.randomUUID(); const byMrn = new Map<string, Row[]>(); const profileCount = new Map<string, number>(); const linked = new Map<string, string>(); const seen = new Set<string>();
  allPatients.forEach((patient) => { const mrn = String(dataOf(patient).mrn || "").trim().toLowerCase(); if (mrn) byMrn.set(mrn, [...(byMrn.get(mrn) || []), patient]); const reference = String(dataOf(patient).patientPortalReference || "").trim(); if (reference) linked.set(reference, patient.id); }); profiles.forEach((portal) => { const reference = portal.customer_ref!.trim(); profileCount.set(reference, (profileCount.get(reference) || 0) + 1); });
  const staged = parsed.map((line) => { const patientMatches = byMrn.get(line.mrn.toLowerCase()) || []; let status = "Ready to apply"; let reason = ""; let patient: Row | undefined; try { referenceSchema.parse(line.reference); } catch { status = "Invalid"; reason = "Portal reference format is invalid."; } if (status !== "Invalid" && patientMatches.length !== 1) { status = "Invalid"; reason = patientMatches.length ? "MRN matches more than one patient record." : "No active patient matches this MRN."; } patient = patientMatches[0]; if (status !== "Invalid" && profileCount.get(line.reference) !== 1) { status = "Invalid"; reason = "Portal reference is unavailable or ambiguous."; } if (status !== "Invalid" && (seen.has(line.reference) || linked.has(line.reference) && linked.get(line.reference) !== patient!.id)) { status = "Invalid"; reason = "Portal reference is duplicated in this import or already linked."; } seen.add(line.reference); const previousReference = patient ? String(dataOf(patient).patientPortalReference || "").trim() : ""; if (status === "Ready to apply" && previousReference && previousReference !== line.reference) { status = "Approval required"; reason = "Replacing an existing portal reference requires supervisor approval."; } if (previousReference === line.reference) { status = "No change"; reason = "The verified reference is already linked to this patient."; } return { name: `Portal reference import · row ${line.rowNumber}`, company_id: profile.company_id, status, amount: null, notes: null, data: { batchId, rowNumber: line.rowNumber, patientId: patient?.id || null, mrn: line.mrn, proposedReference: line.reference, previousReference: previousReference || null, validationReason: reason || null, requestedAt: new Date().toISOString(), requestedById: profile.id, requestedByName: profile.full_name } }; });
  const imports = await insertRows(IMPORT_TABLE, staged); const approvalImports = imports.filter((row) => row.status === "Approval required");
  for (const item of approvalImports) { const data = dataOf(item); const approval = (await insertRows(APPROVAL_TABLE, [{ name: "Portal-reference replacement approval", company_id: profile.company_id, status: "Pending", amount: null, notes: null, data: { patientId: data.patientId, importId: item.id, previousReference: data.previousReference, proposedReference: data.proposedReference, reason: data.validationReason, requestedAt: new Date().toISOString(), requestedById: profile.id, requestedByName: profile.full_name } }]))[0]; await patchRow(IMPORT_TABLE, profile.company_id, item.id, { data: { ...data, approvalId: approval.id } }); }
  return { batchId, staged: imports.length, ready: imports.filter((row) => row.status === "Ready to apply").length, approvalRequired: approvalImports.length, invalid: imports.filter((row) => row.status === "Invalid").length };
}

export async function applyPortalReferenceImport(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceImportApplyInput>) {
  const profile = await staff(req); const rows = await request<Row[]>(IMPORT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data", id: `eq.${input.importId}`, company_id: `eq.${profile.company_id}`, limit: "1" })); const item = rows[0]; if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "The staged import row is no longer available." }); if (item.status !== "Ready to apply") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only validated unlinked rows can be applied directly." }); const data = dataOf(item); await replaceReference(profile.company_id, String(data.patientId || ""), String(data.proposedReference || "")); await patchRow(IMPORT_TABLE, profile.company_id, item.id, { status: "Applied", data: { ...data, appliedAt: new Date().toISOString() } }); return { id: item.id, status: "Applied" };
}

export async function requestPortalReferenceReplacement(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceApprovalRequestInput>) {
  const profile = await staff(req); const patient = await patientById(profile.company_id, input.patientId); const previousReference = String(dataOf(patient).patientPortalReference || "").trim(); if (!previousReference || previousReference === input.reference) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Choose a different existing portal reference to request replacement." }); await validateCandidate(profile.company_id, patient, input.reference); const duplicate = await request<Row[]>(APPROVAL_TABLE, new URLSearchParams({ select: "id", company_id: `eq.${profile.company_id}`, status: "eq.Pending", limit: "1", "data->>patientId": `eq.${patient.id}` })); if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "A replacement approval is already pending for this patient." }); const approval = (await insertRows(APPROVAL_TABLE, [{ name: "Portal-reference replacement approval", company_id: profile.company_id, status: "Pending", amount: null, notes: null, data: { patientId: patient.id, importId: null, previousReference, proposedReference: input.reference, reason: input.reason, requestedAt: new Date().toISOString(), requestedById: profile.id, requestedByName: profile.full_name } }]))[0]; return { id: approval.id, status: approval.status };
}

export async function decidePortalReferenceApproval(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceApprovalDecisionInput>) {
  const profile = await supervisor(req); const rows = await request<Row[]>(APPROVAL_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data", id: `eq.${input.approvalId}`, company_id: `eq.${profile.company_id}`, limit: "1" })); const approval = rows[0]; if (!approval) throw new TRPCError({ code: "NOT_FOUND", message: "The replacement request is no longer available." }); if (approval.status !== "Pending") throw new TRPCError({ code: "CONFLICT", message: "This replacement request has already been decided." }); const data = dataOf(approval); const decidedAt = new Date().toISOString(); if (input.decision === "Approved") await replaceReference(profile.company_id, String(data.patientId || ""), String(data.proposedReference || "")); await patchRow(APPROVAL_TABLE, profile.company_id, approval.id, { status: input.decision, data: { ...data, decidedAt, decidedById: profile.id, decidedByName: profile.full_name, decisionNote: input.note || null } }); if (typeof data.importId === "string") await patchRow(IMPORT_TABLE, profile.company_id, data.importId, { status: input.decision === "Approved" ? "Applied" : "Rejected", data: { ...data, decidedAt, decisionNote: input.note || null, appliedAt: input.decision === "Approved" ? decidedAt : null } }); return { id: approval.id, status: input.decision };
}

function safeWorkflowRow(row: Row) { const data = dataOf(row); return { id: row.id, name: row.name, status: row.status, createdAt: row.created_at || null, patientId: typeof data.patientId === "string" ? data.patientId : null, mrn: typeof data.mrn === "string" ? data.mrn : null, proposedReference: typeof data.proposedReference === "string" ? data.proposedReference : null, previousReference: typeof data.previousReference === "string" ? data.previousReference : null, reason: typeof data.validationReason === "string" ? data.validationReason : typeof data.reason === "string" ? data.reason : null, approvalId: typeof data.approvalId === "string" ? data.approvalId : null }; }
export async function listPortalReferenceWorkflow(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceWorkflowListInput>) { const profile = await staff(req); const [imports, approvals] = await Promise.all([request<Row[]>(IMPORT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${profile.company_id}`, limit: String(input.limit), order: "created_at.desc" })), request<Row[]>(APPROVAL_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${profile.company_id}`, limit: String(input.limit), order: "created_at.desc" }))]); const supervisorView = SUPERVISOR_ROLES.has(profile.role); return { imports: imports.map(safeWorkflowRow), approvals: supervisorView ? approvals.map(safeWorkflowRow) : [], canApprove: supervisorView }; }
export async function getPortalReferenceDailySummary(req: CreateExpressContextOptions["req"]) {
  const profile = await supervisor(req);
  const [summary, rows] = await Promise.all([
    getPortalReferenceDailySummaryForCompany(profile.company_id),
    request<Row[]>(SUMMARY_SETTINGS_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at,updated_at", company_id: `eq.${profile.company_id}`, limit: "1" })),
  ]);
  const settings = settingsFromRow(rows[0]);
  return { ...summary, delivery: settings.deliveryEnabled ? `Scheduled email delivery is active daily at ${DIGEST_TIME_LABEL}.` : "In-app only — scheduled outbound delivery is inactive." };
}

function normalizedRecipients(values: string[]) { return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))); }
function safeAuditRow(row: Row) { const data = dataOf(row); return { id: row.id, name: row.name, status: row.status, createdAt: row.created_at || null, mrn: typeof data.mrn === "string" ? data.mrn : null, reason: typeof data.validationReason === "string" ? data.validationReason : typeof data.reason === "string" ? data.reason : null, decisionNote: typeof data.decisionNote === "string" ? data.decisionNote : null, decidedAt: typeof data.decidedAt === "string" ? data.decidedAt : null, decisionMaker: typeof data.decidedByName === "string" ? data.decidedByName : null }; }
export async function exportPortalReferenceErrors(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceErrorExportInput>) {
  const profile = await staff(req);
  const rows = await request<Row[]>(IMPORT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${profile.company_id}`, status: "in.(Invalid,Rejected)", limit: String(input.limit), order: "created_at.desc" }));
  return { generatedAt: new Date().toISOString(), rows: rows.map((row) => { const data = dataOf(row); return { rowNumber: typeof data.rowNumber === "number" ? data.rowNumber : null, mrn: typeof data.mrn === "string" ? data.mrn : "", status: row.status, validationReason: typeof data.validationReason === "string" ? data.validationReason : typeof data.decisionNote === "string" ? data.decisionNote : "Needs staff review" }; }) };
}
export async function searchPortalReferenceAudit(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceAuditSearchInput>) {
  const profile = await supervisor(req);
  const [imports, approvals] = await Promise.all([request<Row[]>(IMPORT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${profile.company_id}`, limit: String(input.limit), order: "created_at.desc" })), request<Row[]>(APPROVAL_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at", company_id: `eq.${profile.company_id}`, limit: String(input.limit), order: "created_at.desc" }))]);
  const query = input.query.toLowerCase();
  const rows = [...imports, ...approvals].map(safeAuditRow).filter((row) => (input.status === "all" || row.status === input.status) && (!query || [row.name, row.status, row.mrn, row.reason, row.decisionNote, row.decisionMaker].some((value) => String(value || "").toLowerCase().includes(query))));
  return { rows: rows.slice(0, input.limit) };
}
export async function listPortalReferenceDeliveryHistory(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceDeliveryHistoryInput>) {
  const profile = await supervisor(req);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Reconciliation delivery history is temporarily unavailable." });
  const rows = await db.select({ createdAt: webhookDeliveries.createdAt, status: webhookDeliveries.status, severity: webhookDeliveries.severity, responseCode: webhookDeliveries.responseCode, eventSummary: webhookDeliveries.eventSummary }).from(webhookDeliveries).where(and(eq(webhookDeliveries.companyId, profile.company_id), eq(webhookDeliveries.action, "PORTAL_REFERENCE_RECONCILIATION_DIGEST_EMAIL"))).orderBy(desc(webhookDeliveries.createdAt)).limit(input.limit);
  return {
    rows: rows.map((row) => {
      let summary: Record<string, unknown> = {};
      try { summary = row.eventSummary ? JSON.parse(row.eventSummary) as Record<string, unknown> : {}; } catch { /* return a safe empty summary */ }
      return {
        createdAt: row.createdAt.toISOString(),
        status: row.status,
        severity: row.severity,
        responseCode: row.responseCode,
        date: typeof summary.date === "string" ? summary.date : null,
        recipientCount: typeof summary.recipientCount === "number" ? summary.recipientCount : 0,
        successCount: typeof summary.successCount === "number" ? summary.successCount : 0,
        failedCount: typeof summary.failedCount === "number" ? summary.failedCount : 0,
      };
    }),
  };
}
export async function getPortalReferenceSummarySettings(req: CreateExpressContextOptions["req"]) {
  const profile = await supervisor(req);
  const rows = await request<Row[]>(SUMMARY_SETTINGS_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at,updated_at", company_id: `eq.${profile.company_id}`, limit: "1" }));
  const settings = settingsFromRow(rows[0]);
  return { settings: { ...settings, id: settings.id || null } };
}
export async function savePortalReferenceSummarySettings(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceSummarySettingsInput>, options: { userSession?: string } = {}) {
  const profile = await supervisor(req);
  const existing = await request<Row[]>(SUMMARY_SETTINGS_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data,created_at,updated_at", company_id: `eq.${profile.company_id}`, limit: "1" }));
  const prior = settingsFromRow(existing[0]);
  const deliveryEnabled = input.deliveryEnabled ?? prior.deliveryEnabled;
  let scheduleCronTaskUid = prior.scheduleCronTaskUid;
  if (deliveryEnabled && !scheduleCronTaskUid) {
    if (!options.userSession) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated workspace session is required to activate daily reconciliation delivery." });
    const job = await createHeartbeatJob({
      name: `portal-reference-reconciliation-${profile.company_id}`,
      cron: DIGEST_CRON,
      path: "/api/scheduled/portalReferenceReconciliationDigest",
      description: `Daily ${DIGEST_TIME_LABEL} clinic portal-reference reconciliation email digest`,
    }, options.userSession);
    scheduleCronTaskUid = job.taskUid;
  } else if (!deliveryEnabled && scheduleCronTaskUid) {
    if (!options.userSession) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated workspace session is required to deactivate daily reconciliation delivery." });
    await deleteHeartbeatJob(scheduleCronTaskUid, options.userSession);
    scheduleCronTaskUid = null;
  }
  const data = { recipientMode: input.recipientMode, roleRecipients: DEFAULT_ROLE_RECIPIENTS, managedRecipients: normalizedRecipients(input.managedRecipients), timezone: DIGEST_TIMEZONE, deliveryEnabled: Boolean(deliveryEnabled && scheduleCronTaskUid), scheduleCronTaskUid, updatedById: profile.id, updatedByName: profile.full_name || "Clinic supervisor" };
  if (existing[0]) await patchRow(SUMMARY_SETTINGS_TABLE, profile.company_id, existing[0].id, { status: data.deliveryEnabled ? "Configured — active" : "Configured — inactive", data });
  else await insertRows(SUMMARY_SETTINGS_TABLE, [{ name: "Daily reconciliation email configuration", company_id: profile.company_id, status: data.deliveryEnabled ? "Configured — active" : "Configured — inactive", amount: null, notes: null, data }]);
  return { message: data.deliveryEnabled ? `Daily reconciliation email delivery is active at ${DIGEST_TIME_LABEL}.` : "Recipient configuration saved. Daily email delivery remains inactive until its local time and activation are explicitly approved.", settings: (await getPortalReferenceSummarySettings(req)).settings };
}
