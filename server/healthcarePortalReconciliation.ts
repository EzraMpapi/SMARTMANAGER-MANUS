import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { healthcareAccessForRole } from "./healthcareOperations";

const PATIENT_TABLE = "hc_patients";
const PORTAL_ROLES = new Set(["External Client", "Patient"]);
const referenceSchema = z.string().trim().min(2).max(120).regex(/^[A-Za-z0-9 ._\-/'()]+$/, "Use letters, numbers, spaces, and basic reference punctuation only.");

export const portalReferenceListInput = z.object({
  query: z.string().trim().max(80).optional().default(""),
  status: z.enum(["all", "unlinked", "linked"]).optional().default("unlinked"),
  limit: z.number().int().min(1).max(100).optional().default(50),
});
export const linkPatientPortalReferenceInput = z.object({
  patientId: z.string().uuid(),
  reference: referenceSchema,
  replaceExisting: z.boolean().optional().default(false),
});
export const clearPatientPortalReferenceInput = z.object({ patientId: z.string().uuid(), confirmed: z.literal(true) });

type PatientRow = { id: string; company_id: string; name: string; status: string; data?: unknown };
type PortalProfile = { id: string; full_name?: string | null; customer_ref?: string | null; role?: string | null };

function patientData(patient: PatientRow) {
  return patient.data && typeof patient.data === "object" && !Array.isArray(patient.data) ? patient.data as Record<string, unknown> : {};
}

function serviceHeaders() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Patient portal reconciliation is not configured." });
  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
}

function tableUrl(table: string, params: URLSearchParams) {
  return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`;
}

async function serviceRequest<T>(table: string, params: URLSearchParams, init: RequestInit = {}) {
  const response = await fetch(tableUrl(table, params), { ...init, headers: { ...serviceHeaders(), ...(init.headers || {}) } });
  const body = await response.json().catch(() => []) as T;
  if (!response.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "The portal-reference request could not be completed." });
  return body;
}

async function verifiedStaff(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  if (PORTAL_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Patient portal accounts cannot manage clinic portal references." });
  const access = healthcareAccessForRole(profile.role);
  if (!access.canRead.hc_patients || !access.canUpdate.hc_patients) throw new TRPCError({ code: "FORBIDDEN", message: "Your clinic role cannot reconcile patient portal references." });
  return profile;
}

function patientView(patient: PatientRow, profileCountByReference: Map<string, number>) {
  const data = patientData(patient);
  const portalReference = typeof data.patientPortalReference === "string" ? data.patientPortalReference.trim() : "";
  return {
    id: patient.id,
    name: patient.name,
    status: patient.status,
    mrn: typeof data.mrn === "string" ? data.mrn : "",
    portalReference: portalReference || null,
    linkState: !portalReference ? "unlinked" : profileCountByReference.get(portalReference) === 1 ? "linked" : "needs-review",
  };
}

async function activePortalProfiles(companyId: string, limit: number) {
  const params = new URLSearchParams({ select: "id,full_name,customer_ref,role", company_id: `eq.${companyId}`, limit: String(limit), order: "full_name.asc" });
  params.set("role", "in.(External Client,Patient)");
  params.set("customer_ref", "not.is.null");
  const rows = await serviceRequest<PortalProfile[]>("profiles", params);
  return rows.filter((row) => PORTAL_ROLES.has(String(row.role || "")) && typeof row.customer_ref === "string" && row.customer_ref.trim());
}

async function patientById(companyId: string, patientId: string) {
  const params = new URLSearchParams({ select: "id,company_id,name,status,data", id: `eq.${patientId}`, company_id: `eq.${companyId}`, limit: "1" });
  const rows = await serviceRequest<PatientRow[]>(PATIENT_TABLE, params);
  const patient = rows[0];
  if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "The patient record is no longer available in this clinic." });
  return patient;
}

export async function listPortalReferenceReconciliation(req: CreateExpressContextOptions["req"], input: z.infer<typeof portalReferenceListInput>) {
  const staff = await verifiedStaff(req);
  const [profiles, patients] = await Promise.all([
    activePortalProfiles(staff.company_id, 200),
    serviceRequest<PatientRow[]>(PATIENT_TABLE, new URLSearchParams({ select: "id,company_id,name,status,data", company_id: `eq.${staff.company_id}`, status: "neq.Archived", order: "created_at.desc", limit: String(Math.min(200, input.limit * 4)) })),
  ]);
  const profileCount = new Map<string, number>();
  profiles.forEach((profile) => { const reference = profile.customer_ref?.trim(); if (reference) profileCount.set(reference, (profileCount.get(reference) || 0) + 1); });
  const normalized = input.query.toLocaleLowerCase();
  const matches = (values: Array<string | null | undefined>) => !normalized || values.some((value) => String(value || "").toLocaleLowerCase().includes(normalized));
  const patientRows = patients.map((patient) => patientView(patient, profileCount)).filter((patient) => (input.status === "all" || patient.linkState === input.status) && matches([patient.name, patient.mrn, patient.portalReference])).slice(0, input.limit);
  const linkedReferences = new Set(patients.map((patient) => String(patientData(patient).patientPortalReference || "").trim()).filter(Boolean));
  const candidates = profiles.map((profile) => ({ reference: profile.customer_ref!.trim(), displayName: profile.full_name || "Portal account", availability: profileCount.get(profile.customer_ref!.trim()) === 1 && !linkedReferences.has(profile.customer_ref!.trim()) ? "available" : profileCount.get(profile.customer_ref!.trim()) === 1 ? "linked" : "ambiguous" })).filter((candidate) => matches([candidate.reference, candidate.displayName])).slice(0, input.limit);
  return { patients: patientRows, candidates, summary: { unlinkedPatients: patients.filter((patient) => !String(patientData(patient).patientPortalReference || "").trim()).length, availableReferences: candidates.filter((candidate) => candidate.availability === "available").length } };
}

export async function linkPatientPortalReference(req: CreateExpressContextOptions["req"], input: z.infer<typeof linkPatientPortalReferenceInput>) {
  const staff = await verifiedStaff(req);
  const [patient, profiles] = await Promise.all([patientById(staff.company_id, input.patientId), activePortalProfiles(staff.company_id, 200)]);
  const exactProfiles = profiles.filter((profile) => profile.customer_ref?.trim() === input.reference);
  if (exactProfiles.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "This portal reference is unavailable or needs review before it can be linked." });
  const currentReference = String(patientData(patient).patientPortalReference || "").trim();
  if (currentReference && currentReference !== input.reference && !input.replaceExisting) throw new TRPCError({ code: "CONFLICT", message: "This patient already has a portal reference. Confirm replacement before changing it." });
  const duplicateParams = new URLSearchParams({ select: "id", company_id: `eq.${staff.company_id}`, limit: "2" });
  duplicateParams.set("data->>patientPortalReference", `eq.${input.reference}`);
  const duplicates = await serviceRequest<Array<{ id: string }>>(PATIENT_TABLE, duplicateParams);
  if (duplicates.some((row) => row.id !== patient.id)) throw new TRPCError({ code: "CONFLICT", message: "This portal reference is already linked to another patient record." });
  const nextData = { ...patientData(patient), patientPortalReference: input.reference };
  const patchParams = new URLSearchParams({ id: `eq.${patient.id}`, company_id: `eq.${staff.company_id}` });
  const updated = await serviceRequest<PatientRow[]>(PATIENT_TABLE, patchParams, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ data: nextData }) });
  if (updated.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "The patient portal reference could not be linked. Refresh and try again." });
  return patientView(updated[0], new Map([[input.reference, 1]]));
}

export async function clearPatientPortalReference(req: CreateExpressContextOptions["req"], input: z.infer<typeof clearPatientPortalReferenceInput>) {
  const staff = await verifiedStaff(req);
  const patient = await patientById(staff.company_id, input.patientId);
  const { patientPortalReference: _removed, ...nextData } = patientData(patient);
  const patchParams = new URLSearchParams({ id: `eq.${patient.id}`, company_id: `eq.${staff.company_id}` });
  const updated = await serviceRequest<PatientRow[]>(PATIENT_TABLE, patchParams, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ data: nextData }) });
  if (updated.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "The patient portal reference could not be cleared. Refresh and try again." });
  return patientView(updated[0], new Map());
}
