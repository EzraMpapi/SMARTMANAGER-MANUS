import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runScheduledSchemaDriftCheck } from "./schemaDriftMonitor";

export async function scheduledSchemaDriftMonitorHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    return res.json(await runScheduledSchemaDriftCheck(user.taskUid));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid: req.headers["x-task-uid"] ?? null },
      timestamp: new Date().toISOString(),
    });
  }
}
