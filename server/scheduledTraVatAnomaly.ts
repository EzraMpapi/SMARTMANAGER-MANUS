import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runScheduledVatAnomalyCheck } from "./traVatAnomaly";

export async function scheduledTraVatAnomalyHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    return res.json(await runScheduledVatAnomalyCheck(user.taskUid));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
  }
}
