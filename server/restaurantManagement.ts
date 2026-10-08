import type { Request, Response } from "express";
import { ENV } from "./_core/env";

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const asString = (value: unknown, limit = 100) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const sendError = (res: Response, status: number, error: string) => res.status(status).json({ error });

async function serviceRpc(functionName: string, body: JsonRecord) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Restaurant alert reconciliation is not configured.");
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(asString(isRecord(result) ? result.message : "") || "Restaurant alert reconciliation failed.");
  return result;
}

/** Daily heartbeat endpoint. It is cron-authenticated and idempotently reconciles low-stock alerts per tenant. */
export async function scheduledRestaurantAlertsHandler(req: Request, res: Response) {
  try {
    const { sdk } = await import("./_core/sdk");
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return sendError(res, 403, "Unauthorized cron access.");
    if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Restaurant alert reconciliation is not configured.");
    const response = await fetch(`${ENV.supabaseUrl}/rest/v1/restaurant_outlets?select=company_id&limit=500`, {
      headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` },
    });
    const raw: unknown = await response.json().catch(() => []);
    if (!response.ok) throw new Error("Restaurant tenants could not be enumerated for low-stock reconciliation.");
    const companies = Array.isArray(raw) ? Array.from(new Set(raw.map((row) => isRecord(row) ? asString(row.company_id, 80) : "").filter(Boolean))) : [];
    const results = await Promise.all(companies.map((companyId) => serviceRpc("restaurant_reconcile_alerts", { p_company_id: companyId })));
    return res.status(200).json({ ok: true, companiesProcessed: companies.length, results });
  } catch (error) {
    return sendError(res, 500, (error as Error).message || "Restaurant low-stock reconciliation failed.");
  }
}
