import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { ENV } from "./_core/env";
import { createHealthcareRecord, healthcareCreateInput, healthcareListInput, healthcareUpdateInput, listHealthcareRecords, updateHealthcareRecord } from "./healthcareOperations";

const REMINDER_SETTINGS_TABLE = "hc_reminder_settings" as const;
const REMINDER_DELIVERIES_TABLE = "hc_reminder_deliveries" as const;
const REMINDER_PROVIDER_STATUS = "Provider credentials required";

export const reminderSettingsInput = z.object({
  leadMinutes: z.number().int().min(15).max(10_080).default(1_440),
  consentRequired: z.boolean().default(true),
  timezone: z.string().trim().min(1).max(80).default("Africa/Dar_es_Salaam"),
  senderId: z.string().trim().max(32).optional(),
  enabled: z.boolean().default(false),
});

export const reminderDeliveryListInput = z.object({
  limit: z.number().int().min(1).max(100).default(30),
});

export type ReminderSettingsView = {
  id: string | null;
  enabled: boolean;
  leadMinutes: number;
  consentRequired: boolean;
  timezone: string;
  senderId: string;
  providerStatus: "unconfigured" | "configured";
  providerMessage: string;
  scheduleEnabled: false;
  updatedAt: string | null;
};

const defaultReminderSettings = (): ReminderSettingsView => ({
  id: null,
  enabled: false,
  leadMinutes: 1_440,
  consentRequired: true,
  timezone: "Africa/Dar_es_Salaam",
  senderId: "",
  providerStatus: "unconfigured",
  providerMessage: REMINDER_PROVIDER_STATUS,
  scheduleEnabled: false,
  updatedAt: null,
});

export function getHealthcareSmsProviderReadiness() {
  const configured = Boolean(ENV.healthcareSmsProvider && ENV.healthcareSmsProviderUrl && ENV.healthcareSmsProviderApiKey && ENV.healthcareSmsWebhookSecret);
  return {
    configured,
    providerStatus: configured ? "configured" as const : "unconfigured" as const,
    message: configured ? "Provider connection is configured. Delivery remains paused until the provider adapter is approved." : REMINDER_PROVIDER_STATUS,
  };
}

export function evaluatePatientSmsConsent(patientData: Record<string, unknown>, consentRequired: boolean) {
  if (!String(patientData.phone ?? "").trim()) return { eligible: false, reason: "phone_missing" as const, consentCapturedAt: null };
  const consentStatus = String(patientData.smsConsentStatus ?? "Not recorded");
  const consentCapturedAt = typeof patientData.smsConsentCapturedAt === "string" ? patientData.smsConsentCapturedAt : null;
  if (consentRequired && consentStatus !== "Granted") return { eligible: false, reason: "consent_not_granted" as const, consentCapturedAt };
  return { eligible: true, reason: null, consentCapturedAt };
}

function toReminderSettingsView(record: Record<string, unknown> | undefined): ReminderSettingsView {
  if (!record) return defaultReminderSettings();
  const data = record.data && typeof record.data === "object" && !Array.isArray(record.data) ? record.data as Record<string, unknown> : {};
  const readiness = getHealthcareSmsProviderReadiness();
  return {
    id: typeof record.id === "string" ? record.id : null,
    enabled: Boolean(data.enabled),
    leadMinutes: typeof data.leadMinutes === "number" ? data.leadMinutes : 1_440,
    consentRequired: data.consentRequired !== false,
    timezone: typeof data.timezone === "string" && data.timezone ? data.timezone : "Africa/Dar_es_Salaam",
    senderId: typeof data.senderId === "string" ? data.senderId : "",
    providerStatus: readiness.providerStatus,
    providerMessage: readiness.message,
    scheduleEnabled: false,
    updatedAt: typeof record.updated_at === "string" ? record.updated_at : null,
  };
}

export function createReminderIdempotencyKey(input: { appointmentId: string; scheduledFor: string; leadMinutes: number }) {
  return `appointment-reminder:${input.appointmentId}:${input.scheduledFor}:${input.leadMinutes}`;
}

export function buildReminderDeliveryRecord(input: { appointmentId: string; patientId: string; scheduledFor: string; leadMinutes: number; consentCapturedAt?: string | null }) {
  const idempotencyKey = createReminderIdempotencyKey(input);
  return {
    name: "Appointment reminder awaiting provider configuration",
    status: "Provider unconfigured",
    amount: null,
    notes: "No SMS was sent because an approved provider connection is not configured.",
    data: {
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      scheduledFor: input.scheduledFor,
      leadMinutes: input.leadMinutes,
      channel: "SMS",
      provider: "Unconfigured",
      providerMessageId: "",
      attemptCount: 0,
      errorCategory: "provider_unconfigured",
      consentCapturedAt: input.consentCapturedAt ?? null,
      idempotencyKey,
    },
  };
}

export async function getReminderSettings(req: CreateExpressContextOptions["req"]) {
  const result = await listHealthcareRecords(req, healthcareListInput.parse({ table: REMINDER_SETTINGS_TABLE, limit: 1 }));
  return { settings: toReminderSettingsView(result.records[0]), access: result.access };
}

export async function saveReminderSettings(req: CreateExpressContextOptions["req"], input: z.infer<typeof reminderSettingsInput>) {
  const current = await listHealthcareRecords(req, healthcareListInput.parse({ table: REMINDER_SETTINGS_TABLE, limit: 1 }));
  const data = {
    provider: "Unconfigured",
    senderId: input.senderId ?? "",
    timezone: input.timezone,
    leadMinutes: input.leadMinutes,
    consentRequired: input.consentRequired,
    enabled: input.enabled,
    scheduleEnabled: false,
    scheduleTaskUid: "",
    lastDispatchAt: "",
    archivedAt: "",
  };
  const record = current.records[0] as Record<string, unknown> | undefined;
  const existingId = typeof record?.id === "string" ? record.id : undefined;
  const saved = existingId
    ? await updateHealthcareRecord(req, healthcareUpdateInput.parse({ table: REMINDER_SETTINGS_TABLE, id: existingId, patch: { name: "Appointment SMS reminders", status: input.enabled ? "Awaiting provider configuration" : "Inactive", data } }))
    : await createHealthcareRecord(req, healthcareCreateInput.parse({ table: REMINDER_SETTINGS_TABLE, record: { name: "Appointment SMS reminders", status: input.enabled ? "Awaiting provider configuration" : "Inactive", amount: null, notes: "SMS delivery is inactive until approved provider credentials are configured server-side.", data } }));
  return {
    settings: toReminderSettingsView(saved.record),
    activation: "provider_unconfigured" as const,
    message: "Settings saved. SMS delivery remains inactive until an approved provider connection is configured.",
  };
}

export async function listReminderDeliveries(req: CreateExpressContextOptions["req"], input: z.infer<typeof reminderDeliveryListInput>) {
  const result = await listHealthcareRecords(req, healthcareListInput.parse({ table: REMINDER_DELIVERIES_TABLE, limit: input.limit }));
  return { deliveries: result.records, access: result.access };
}

export async function requestReminderTest(req: CreateExpressContextOptions["req"]) {
  await getReminderSettings(req);
  const readiness = getHealthcareSmsProviderReadiness();
  if (readiness.configured) {
    return { status: "blocked" as const, reason: "provider_adapter_pending" as const, message: "The provider connection is configured, but its delivery adapter is awaiting approval before any test SMS can be sent." };
  }
  return {
    status: "blocked" as const,
    reason: "provider_unconfigured" as const,
    message: "A test SMS cannot be sent until an approved provider connection is configured.",
  };
}

/**
 * The Heartbeat callback calls this boundary only after a provider adapter is approved.
 * It is intentionally fail-closed: no patient data is read, no SMS is attempted, and no
 * delivery record is created while the provider remains unconfigured.
 */
export async function processAppointmentReminders(taskUid: string) {
  if (!taskUid) throw new TRPCError({ code: "BAD_REQUEST", message: "Reminder task identity is required." });
  const readiness = getHealthcareSmsProviderReadiness();
  if (readiness.configured) return { ok: true, skipped: "provider_adapter_pending" as const, attempted: 0, delivered: 0, failed: 0 };
  return {
    ok: true,
    skipped: "provider_unconfigured" as const,
    attempted: 0,
    delivered: 0,
    failed: 0,
  };
}

export const providerDeliveryStatusInput = z.object({
  eventId: z.string().trim().min(8).max(160),
  idempotencyKey: z.string().trim().min(8).max(300),
  status: z.enum(["queued", "sent", "delivered", "failed"]),
  occurredAt: z.string().datetime(),
  providerMessageId: z.string().trim().max(160).optional(),
});

type ProviderDeliveryStatus = z.infer<typeof providerDeliveryStatusInput>;

function providerDeliveryUrl(params: URLSearchParams) {
  return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${REMINDER_DELIVERIES_TABLE}?${params.toString()}`;
}

function providerStatusLabel(status: ProviderDeliveryStatus["status"]) {
  return ({ queued: "Queued", sent: "Sent", delivered: "Delivered", failed: "Delivery failed" } as const)[status];
}

/** Applies a signed provider event only to an existing idempotent delivery record; this route never sends an SMS. */
export async function recordProviderDeliveryStatus(input: ProviderDeliveryStatus) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Delivery status services are not configured." });
  const params = new URLSearchParams({ select: "id,company_id,status,data", limit: "1" });
  params.set("data->>idempotencyKey", `eq.${input.idempotencyKey}`);
  const headers = { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
  const readResponse = await fetch(providerDeliveryUrl(params), { headers });
  if (!readResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery status could not be recorded." });
  const rows = await readResponse.json().catch(() => []) as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row || typeof row.id !== "string" || typeof row.company_id !== "string") return { accepted: true, updated: false, duplicate: false, ignored: "unknown_delivery" as const };
  const existingData = row.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data as Record<string, unknown> : {};
  if (existingData.providerEventId === input.eventId) return { accepted: true, updated: false, duplicate: true, ignored: null };
  const patchParams = new URLSearchParams({ company_id: `eq.${row.company_id}`, id: `eq.${row.id}` });
  const patchResponse = await fetch(providerDeliveryUrl(patchParams), {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      status: providerStatusLabel(input.status),
      data: { ...existingData, providerEventId: input.eventId, providerEventStatus: input.status, providerStatusAt: input.occurredAt, providerEventReceivedAt: new Date().toISOString(), ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}) },
    }),
  });
  if (!patchResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery status could not be recorded." });
  return { accepted: true, updated: true, duplicate: false, ignored: null };
}
