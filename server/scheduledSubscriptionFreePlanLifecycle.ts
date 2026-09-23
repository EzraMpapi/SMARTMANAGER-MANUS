import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { httpStatusFromError } from "./_core/httpError";

async function reconcileFreePlans() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    throw new Error("Free plan lifecycle reconciliation is not configured.");
  }
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/billing_reconcile_free_plan_expiry`, {
    method: "POST",
    headers: {
      apikey: ENV.supabaseSecretKey,
      authorization: `Bearer ${ENV.supabaseSecretKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_company_id: null }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Free plan lifecycle reconciliation failed.");
  return payload;
}

/**
 * Deterministic scheduled callback. The configured scheduler invokes this endpoint
 * daily; notification keys and status transitions remain database idempotency guards.
 */
export async function scheduledSubscriptionFreePlanLifecycleHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "Unauthorized cron access." });
    const result = await reconcileFreePlans();
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    const status = httpStatusFromError(error);
    return res.status(status).json({ error: status < 500 && error instanceof Error ? error.message : "Free plan lifecycle reconciliation failed." });
  }
}
