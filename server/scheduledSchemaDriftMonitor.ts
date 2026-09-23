import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { httpStatusFromError } from "./_core/httpError";
import { runScheduledSchemaDriftCheck } from "./schemaDriftMonitor";

export async function scheduledSchemaDriftMonitorHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    return res.json(await runScheduledSchemaDriftCheck(user.taskUid));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = httpStatusFromError(error);
    return res.status(status).json({ error: status < 500 ? message : "Scheduled schema drift monitor failed." });
  }
}
