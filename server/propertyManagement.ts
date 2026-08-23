import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { httpStatusFromError } from "./_core/httpError";

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Property Management controls failed."; }
function sendError(res: Response, status: number, message: string) { return res.status(status).json({ error: message }); }

async function serviceRpc(functionName: string, body: Record<string, unknown>) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Property Management scheduled controls are not configured.");
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(isRecord(payload) && typeof payload.message === "string" ? payload.message : "Property Management scheduled RPC failed.");
  return payload;
}

export async function scheduledPropertyControlsHandler(req: Request, res: Response) {
  try {
    const { sdk } = await import("./_core/sdk");
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return sendError(res, 403, "Unauthorized cron access.");
    if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) return sendError(res, 503, "Property Management scheduled controls are not configured.");
    const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/property_portfolios?select=company_id&limit=5000`, { headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, accept: "application/json" } });
    const payload = await response.json().catch(() => []);
    if (!response.ok) return sendError(res, 502, "Property Management tenants could not be enumerated for scheduled controls.");
    const companyIds = Array.isArray(payload) ? Array.from(new Set(payload.map((row) => isRecord(row) && typeof row.company_id === "string" ? row.company_id : "").filter(Boolean))) : [];
    const results = [];
    for (const companyId of companyIds) results.push(await serviceRpc("property_run_controls_for_company", { p_company_id: companyId, p_limit: 500 }));
    return res.status(200).json({ ok: true, companiesProcessed: companyIds.length, results });
  } catch (error) {
    return sendError(res, httpStatusFromError(error), errorMessage(error));
  }
}
