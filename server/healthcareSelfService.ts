import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { evaluatePatientSmsConsent, getHealthcareSmsProviderReadiness } from "./healthcareReminders";

const PATIENT_TABLE = "hc_patients";
const PATIENT_PORTAL_ROLES = new Set(["External Client", "Patient"]);

export const patientSmsConsentUpdateInput = z.object({
  preference: z.enum(["Granted", "Declined", "Revoked"]),
  method: z.enum(["Verified digital confirmation", "In-person registration", "Signed form", "Recorded verbal confirmation"]).default("Verified digital confirmation"),
});

type PatientRecord = { id: string; company_id: string; status: string; data?: unknown };

function patientData(record: PatientRecord) {
  return record.data && typeof record.data === "object" && !Array.isArray(record.data) ? record.data as Record<string, unknown> : {};
}

function preferenceView(record: PatientRecord) {
  const data = patientData(record);
  const status = String(data.smsConsentStatus || "Not recorded");
  const readiness = getHealthcareSmsProviderReadiness();
  return {
    preference: status === "Granted" || status === "Declined" || status === "Revoked" ? status : "Not recorded",
    capturedAt: typeof data.smsConsentCapturedAt === "string" ? data.smsConsentCapturedAt : null,
    method: typeof data.smsConsentMethod === "string" ? data.smsConsentMethod : null,
    revokedAt: typeof data.smsConsentRevokedAt === "string" ? data.smsConsentRevokedAt : null,
    eligibleWhenProviderEnabled: evaluatePatientSmsConsent(data, true).eligible,
    providerStatus: readiness.providerStatus,
    providerMessage: readiness.configured ? "The provider connection is configured; your preference controls whether eligible reminders may be considered." : "SMS delivery is not active. Your preference will be applied before any future eligible reminder is considered.",
  };
}

function healthcarePatientUrl(params: URLSearchParams) {
  return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${PATIENT_TABLE}?${params.toString()}`;
}

function patientPreferenceServiceHeaders() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Patient preference services are not configured." });
  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
}

async function linkedPatient(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  if (!PATIENT_PORTAL_ROLES.has(profile.role) || !profile.customer_ref?.trim()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "A verified patient portal account is required to manage SMS preferences." });
  }
  const params = new URLSearchParams({ select: "id,company_id,status,data", limit: "2" });
  params.set("data->>patientPortalReference", `eq.${profile.customer_ref.trim()}`);
  params.set("status", "neq.Archived");
  const response = await fetch(healthcarePatientUrl(params), { headers: patientPreferenceServiceHeaders() });
  if (!response.ok) throw new TRPCError({ code: "FORBIDDEN", message: "Your patient preferences are not available to this portal account." });
  const rows = await response.json().catch(() => []) as PatientRecord[];
  if (rows.length !== 1 || rows[0]?.company_id !== profile.company_id) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No linked patient record is available for this portal account. Ask your clinic to link your patient portal reference." });
  }
  return { profile, token, patient: rows[0] };
}

export async function getPatientSmsConsentPreferences(req: CreateExpressContextOptions["req"]) {
  const { patient } = await linkedPatient(req);
  return preferenceView(patient);
}

export async function updatePatientSmsConsentPreferences(req: CreateExpressContextOptions["req"], input: z.infer<typeof patientSmsConsentUpdateInput>) {
  const { profile, token, patient } = await linkedPatient(req);
  const current = patientData(patient);
  const now = new Date().toISOString();
  const nextData = {
    ...current,
    smsConsentStatus: input.preference,
    smsConsentCapturedAt: input.preference === "Revoked" ? current.smsConsentCapturedAt || null : now,
    smsConsentMethod: input.preference === "Revoked" ? current.smsConsentMethod || null : input.method,
    smsConsentRevokedAt: input.preference === "Revoked" ? now : null,
  };
  const patch = new URLSearchParams({ id: `eq.${patient.id}`, company_id: `eq.${profile.company_id}`, "data->>patientPortalReference": `eq.${profile.customer_ref?.trim() || ""}` });
  const response = await fetch(healthcarePatientUrl(patch), {
    method: "PATCH",
    headers: { ...patientPreferenceServiceHeaders(), Prefer: "return=representation" },
    body: JSON.stringify({ data: nextData }),
  });
  const rows = await response.json().catch(() => []) as PatientRecord[];
  if (!response.ok || rows.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "Your SMS preference could not be updated. Refresh and try again." });
  return preferenceView(rows[0]);
}
