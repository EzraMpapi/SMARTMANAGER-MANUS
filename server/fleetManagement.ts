import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { httpStatusFromError } from "./_core/httpError";

type JsonRecord = Record<string, unknown>;

const FLEET_MANAGER_ROLES = new Set([
  "super administrator", "platform administrator", "organization owner", "owner", "ceo", "cfo",
  "finance manager", "operations manager", "fleet manager", "admin",
]);

function isRecord(value: unknown): value is JsonRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function asString(value: unknown, limit = 500) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
function sendError(res: Response, status: number, message: string) { return res.status(status).json({ error: message }); }
function ensureFleetManager(role: string) {
  if (!FLEET_MANAGER_ROLES.has(role.toLowerCase())) {
    const error = new Error("Your workspace role is not authorized to manage Fleet operations.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

async function parseResponse(response: globalThis.Response): Promise<JsonRecord> {
  const text = await response.text();
  try { const parsed = text ? JSON.parse(text) : {}; return isRecord(parsed) ? parsed : { result: parsed }; } catch { return { message: text.slice(0, 500) }; }
}

async function userRpc<T>(functionName: string, token: string, body: JsonRecord): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new Error("Fleet workspace verification is not configured.");
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST", headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  if (!response.ok) { const error = new Error(asString(payload.message) || "The Fleet request could not be completed."); (error as Error & { status?: number }).status = response.status; throw error; }
  return payload as T;
}

async function serviceRpc<T>(functionName: string, body: JsonRecord): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Fleet server reconciliation is not configured.");
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST", headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  if (!response.ok) throw new Error(asString(payload.message) || "Fleet reconciliation could not be completed.");
  return payload as T;
}

export async function fleetSnapshotHandler(req: Request, res: Response) {
  try {
    const { profile, token } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureFleetManager(profile.role);
    if (typeof profile.company_id === "string" && profile.company_id) await serviceRpc("fleet_reconcile_alerts", { p_company_id: profile.company_id });
    return res.status(200).json(await userRpc("fleet_snapshot", token, {}));
  } catch (error) { return sendError(res, httpStatusFromError(error), (error as Error).message || "Fleet could not be loaded."); }
}

export async function fleetActionHandler(req: Request, res: Response) {
  try {
    const { profile, token } = await resolveVerifiedProfile(req as unknown as CreateExpressContextOptions["req"]);
    ensureFleetManager(profile.role);
    const body = isRecord(req.body) ? req.body : {};
    const action = asString(body.action, 80);
    const payload = isRecord(body.payload) ? body.payload : {};
    if (!action) return sendError(res, 400, "A Fleet action is required.");
    return res.status(200).json(await userRpc("fleet_action", token, { p_action: action, p_payload: payload }));
  } catch (error) { return sendError(res, httpStatusFromError(error), (error as Error).message || "Fleet action could not be completed."); }
}

/** Provider-agnostic normalized GPS/IoT ingress. A connector-specific adapter can post this shape. */
export async function fleetTelematicsWebhookHandler(req: Request, res: Response) {
  try {
    const configuredSecret = ENV.fleetTelematicsWebhookSecret;
    if (!configuredSecret || req.header("x-fleet-webhook-secret") !== configuredSecret) return sendError(res, 401, "Unauthorized telematics webhook.");
    if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Fleet telematics ingestion is not configured.");
    const body = isRecord(req.body) ? req.body : {};
    const companyId = asString(body.companyId, 80); const vehicleId = asString(body.vehicleId, 80); const provider = asString(body.provider, 100); const eventId = asString(body.eventId, 200);
    if (!companyId || !vehicleId || !provider || !eventId) return sendError(res, 400, "companyId, vehicleId, provider, and eventId are required.");
    const response = await fetch(`${ENV.supabaseUrl}/rest/v1/fleet_telematics_events`, {
      method: "POST", headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ company_id: companyId, vehicle_id: vehicleId, provider, external_event_id: eventId, captured_at: asString(body.capturedAt, 80) || new Date().toISOString(), latitude: body.latitude ?? null, longitude: body.longitude ?? null, speed_kph: body.speedKph ?? null, odometer_km: body.odometerKm ?? null, ignition_on: typeof body.ignitionOn === "boolean" ? body.ignitionOn : null, payload: isRecord(body.payload) ? body.payload : {} }),
    });
    if (!response.ok) throw new Error("Fleet telematics event could not be persisted.");
    return res.status(202).json({ accepted: true });
  } catch (error) { return sendError(res, 500, (error as Error).message || "Fleet telematics ingestion failed."); }
}

export async function scheduledFleetAlertsHandler(req: Request, res: Response) {
  try {
    const { sdk } = await import("./_core/sdk");
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return sendError(res, 403, "Unauthorized cron access.");
    if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Fleet compliance alert reconciliation is not configured.");
    const response = await fetch(`${ENV.supabaseUrl}/rest/v1/fleet_vehicles?select=company_id&limit=500`, { headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` } });
    const raw: unknown = await response.json().catch(() => []);
    if (!response.ok) throw new Error("Fleet tenants could not be enumerated for compliance reconciliation.");
    const companyIds = Array.isArray(raw) ? Array.from(new Set(raw.map((row: unknown) => isRecord(row) ? asString(row.company_id, 80) : "").filter(Boolean))) : [];
    const results = await Promise.all(companyIds.map(companyId => serviceRpc("fleet_reconcile_alerts", { p_company_id: companyId })));
    return res.status(200).json({ ok: true, companiesProcessed: companyIds.length, results });
  } catch (error) { return sendError(res, 500, (error as Error).message || "Fleet compliance alert reconciliation failed."); }
}
