import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { getFiscalProviderReadiness, officialTraLinks, type FiscalProviderReadiness } from "./traFiscal";

type JsonRecord = Record<string, unknown>;
type NativeSnapshot = {
  taxProfiles?: JsonRecord[];
  fiscalProfiles?: JsonRecord[];
  fiscalReceipts?: JsonRecord[];
  mobileMoneyProfiles?: JsonRecord[];
  mobileMoneyIntents?: JsonRecord[];
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nativeUrl(path: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TRA Supabase persistence is not configured." });
  }
  return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

function serviceHeaders(extra: Record<string, string> = {}) {
  if (!ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TRA Supabase persistence is not configured." });
  }
  return {
    apikey: ENV.supabaseSecretKey,
    authorization: `Bearer ${ENV.supabaseSecretKey}`,
    accept: "application/json",
    "content-type": "application/json",
    ...extra,
  };
}

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(body) && typeof body.message === "string" ? body.message : "TRA Supabase operation failed.";
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
  }
  return body;
}

function userRpcHeaders(token: string) {
  if (!ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TRA Supabase public configuration is not configured." });
  return { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, accept: "application/json", "content-type": "application/json" };
}

export async function callRestaurantTanzaniaRpc(functionName: "restaurant_tanzania_snapshot" | "restaurant_tanzania_action" | "restaurant_tanzania_receipt_action", body: JsonRecord = {}, accessToken?: string) {
  const response = await fetch(nativeUrl(`rpc/${functionName}`), {
    method: "POST",
    headers: accessToken ? userRpcHeaders(accessToken) : serviceHeaders(),
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}

async function selectRows(table: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const response = await fetch(nativeUrl(`${table}?${query.toString()}`), { headers: serviceHeaders() });
  const body = await parseResponse(response);
  return asArray(body);
}

async function mutateRows(table: string, method: "POST" | "PATCH", params: Record<string, string>, payload: JsonRecord) {
  const query = new URLSearchParams(params);
  const response = await fetch(nativeUrl(`${table}?${query.toString()}`), {
    method,
    headers: serviceHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  return asArray(await parseResponse(response));
}

export async function resolveRestaurantOutletId(companyId: string) {
  const outlets = await selectRows("restaurant_outlets", {
    select: "id,company_id",
    company_id: `eq.${companyId}`,
    order: "created_at.asc",
    limit: "1",
  });
  const outletId = text(outlets[0]?.id);
  if (!outletId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A Restaurant outlet is required before configuring the Tanzania fiscal profile." });
  return outletId;
}

export function mapNativeFiscalProfile(row: JsonRecord | undefined) {
  if (!row) return null;
  const status = text(row.status, "Awaiting Configuration");
  return {
    id: text(row.id),
    companyId: text(row.company_id),
    branchId: text(row.outlet_id, "MAIN"),
    outletId: text(row.outlet_id),
    taxProfileId: text(row.tax_profile_id) || null,
    tin: text(row.tin),
    vrn: text(row.vrn) || null,
    businessName: text(row.business_name),
    tradingName: text(row.trading_name) || null,
    physicalAddress: text(row.physical_address) || null,
    region: text(row.region),
    district: text(row.district) || null,
    deviceSerial: text(row.device_serial) || null,
    providerCode: text(row.provider_code, "UNCONFIGURED"),
    environment: text(row.environment, "sandbox"),
    fiscalStatus: status.toLowerCase().replaceAll(" ", "_"),
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNativeFiscalReceipt(row: JsonRecord) {
  const status = text(row.status, "Awaiting Configuration");
  return {
    id: text(row.id),
    companyId: text(row.company_id),
    branchId: text(row.outlet_id, "MAIN"),
    fiscalProfileId: text(row.fiscal_profile_id) || null,
    receiptNumber: text(row.official_receipt_number, text(row.internal_reference, "Internal fiscal record")),
    officialReceiptNumber: text(row.official_receipt_number) || null,
    fiscalSerial: text(row.fiscal_serial) || null,
    verificationNumber: text(row.verification_code) || null,
    receiptTimestamp: row.created_at,
    submissionTimestamp: row.submitted_at,
    sourceType: "restaurant_order",
    sourceId: text(row.order_id),
    idempotencyKey: text(row.idempotency_key),
    status,
    grossAmount: numberValue(row.gross_amount),
    vatAmount: numberValue(row.vat_amount),
    netAmount: numberValue(row.net_amount),
    responseMessage: text(row.failure_reason) || null,
    qrInformation: text(row.qr_payload) || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getNativeSnapshot(accessToken?: string): Promise<NativeSnapshot> {
  const snapshot = await callRestaurantTanzaniaRpc("restaurant_tanzania_snapshot", {}, accessToken);
  return isRecord(snapshot) ? snapshot as NativeSnapshot : {};
}

export async function getNativeFiscalProfile(accessToken?: string) {
  const snapshot = await getNativeSnapshot(accessToken);
  return mapNativeFiscalProfile(asArray(snapshot.fiscalProfiles)[0]);
}

export async function saveNativeFiscalProfile(input: {
  companyId: string;
  tin: string;
  vrn?: string;
  businessName: string;
  tradingName?: string;
  physicalAddress?: string;
  district?: string;
  branchId: string;
  region?: string;
  deviceSerial?: string;
  environment: "sandbox" | "production";
  accessToken?: string;
}) {
  const outletId = await resolveRestaurantOutletId(input.companyId);
  return callRestaurantTanzaniaRpc("restaurant_tanzania_action", {
    p_action: "FISCAL_PROFILE_SAVE",
    p_payload: {
      outletId,
      tin: input.tin,
      vrn: input.vrn || "",
      businessName: input.businessName,
      tradingName: input.tradingName || "",
      physicalAddress: input.physicalAddress || "",
      district: input.district || "",
      region: input.region || "",
      deviceSerial: input.deviceSerial || "",
      environment: input.environment,
      providerCode: "UNCONFIGURED",
      receiptPrefix: "RFS",
      data: { source: "tra_portal", branchId: input.branchId },
    },
  }, input.accessToken);
}

export async function queueNativeReceipt(input: {
  outletId: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  items: JsonRecord[];
  grossAmount: number;
  vatAmount: number;
  netAmount: number;
  currency?: string;
  accessToken?: string;
}) {
  const { accessToken, ...payload } = input;
  return callRestaurantTanzaniaRpc("restaurant_tanzania_receipt_action", { p_payload: payload }, accessToken);
}

export async function listNativeReceipts(companyId: string, limit: number) {
  const rows = await selectRows("restaurant_fiscal_receipts", {
    select: "id,company_id,outlet_id,fiscal_profile_id,order_id,internal_reference,official_receipt_number,fiscal_serial,verification_code,qr_payload,status,gross_amount,vat_amount,net_amount,currency,idempotency_key,failure_reason,queued_at,submitted_at,verified_at,created_at,updated_at",
    company_id: `eq.${companyId}`,
    order: "created_at.desc",
    limit: String(Math.min(Math.max(limit, 1), 100)),
  });
  return rows.map(mapNativeFiscalReceipt);
}

export async function nativeReceiptStats(companyId: string) {
  const rows = await listNativeReceipts(companyId, 100);
  return {
    total: rows.length,
    verified: rows.filter((row) => row.status === "Verified").length,
    failed: rows.filter((row) => row.status === "Rejected").length,
    pending: rows.filter((row) => ["Queued", "Submitting", "Submitted"].includes(row.status)).length,
  };
}

export function nativeReadiness(environment: "sandbox" | "production", profileConfigured: boolean): FiscalProviderReadiness {
  const readiness = getFiscalProviderReadiness(environment);
  return profileConfigured ? readiness : { ...readiness, status: "AWAITING_CONFIGURATION", reason: "Configure the Supabase-native restaurant fiscal profile before using TRA preparation workflows." };
}

export async function nativeAuxiliaryRows(table: string, companyId: string, limit = 100) {
  return selectRows(table, { select: "*", company_id: `eq.${companyId}`, order: "created_at.desc", limit: String(Math.min(Math.max(limit, 1), 100)) });
}

export async function getNativeAnomalySettings(companyId: string) {
  const rows = await selectRows("tra_vat_anomaly_settings", { select: "*", company_id: `eq.${companyId}`, limit: "1" });
  if (rows[0]) return rows[0];
  const created = await mutateRows("tra_vat_anomaly_settings", "POST", {}, { company_id: companyId, enabled: true, threshold_percent: 50, cooldown_minutes: 1440, cron_expression: "0 0 6 * * *" });
  return created[0] || { company_id: companyId, enabled: true, threshold_percent: 50, cooldown_minutes: 1440, cron_expression: "0 0 6 * * *" };
}

export async function saveNativeAnomalySettings(companyId: string, input: { enabled: boolean; thresholdPercent: number; cooldownMinutes: number }) {
  const existing = await getNativeAnomalySettings(companyId);
  const rows = await mutateRows("tra_vat_anomaly_settings", "PATCH", { id: `eq.${text(existing.id)}`, company_id: `eq.${companyId}` }, { enabled: input.enabled, threshold_percent: input.thresholdPercent, cooldown_minutes: input.cooldownMinutes, updated_at: new Date().toISOString() });
  return rows[0] || { ...existing, enabled: input.enabled, threshold_percent: input.thresholdPercent, cooldown_minutes: input.cooldownMinutes };
}

export async function nativeVatTrend(companyId: string, periods: number) {
  const safePeriods = Math.min(Math.max(Math.trunc(periods), 3), 24);
  const rows = await selectRows("restaurant_fiscal_receipts", { select: "status,vat_amount,created_at", company_id: `eq.${companyId}`, order: "created_at.asc", limit: "1000" });
  const anomalies = await selectRows("tra_vat_anomaly_events", { select: "period,status", company_id: `eq.${companyId}`, order: "created_at.asc", limit: "1000" });
  const end = new Date();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() - 1);
  const periodKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const periodAt = (index: number) => { const date = new Date(end); date.setUTCMonth(end.getUTCMonth() - (safePeriods - 1 - index)); return periodKey(date); };
  const totals = new Map<string, { vat: number; verified: number; failed: number; total: number }>();
  for (const row of rows) {
    const date = new Date(text(row.created_at));
    if (Number.isNaN(date.getTime())) continue;
    const period = periodKey(date);
    const current = totals.get(period) || { vat: 0, verified: 0, failed: 0, total: 0 };
    current.total += 1;
    if (text(row.status) === "Verified") { current.verified += 1; current.vat += numberValue(row.vat_amount); }
    if (text(row.status) === "Rejected") current.failed += 1;
    totals.set(period, current);
  }
  const anomalyCounts = new Map<string, { total: number; triggered: number; suppressed: number }>();
  for (const row of anomalies) {
    const period = text(row.period);
    if (!period) continue;
    const current = anomalyCounts.get(period) || { total: 0, triggered: 0, suppressed: 0 };
    current.total += 1;
    if (text(row.status) === "triggered") current.triggered += 1;
    if (text(row.status) === "suppressed") current.suppressed += 1;
    anomalyCounts.set(period, current);
  }
  return Array.from({ length: safePeriods }, (_, index) => {
    const period = periodAt(index);
    const current = totals.get(period) || { vat: 0, verified: 0, failed: 0, total: 0 };
    const anomaly = anomalyCounts.get(period) || { total: 0, triggered: 0, suppressed: 0 };
    return { period, vat: Number(current.vat.toFixed(2)), verifiedReceipts: current.verified, failedReceipts: current.failed, totalReceipts: current.total, serverConfirmedRate: current.total ? Number(((current.verified / current.total) * 100).toFixed(1)) : null, anomalyEvents: anomaly.total, triggeredAnomalies: anomaly.triggered, suppressedAnomalies: anomaly.suppressed };
  });
}

export function nativeOfficialLinks() {
  return officialTraLinks;
}

export { selectRows, mutateRows };
