import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runScheduledTraZReportArchive } from "./traZReportArchive";

export async function scheduledTraZReportArchiveHandler(req: Request, res: Response) {
  let taskUid: string | null = null;
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    taskUid = user.taskUid;
    return res.json(await runScheduledTraZReportArchive(taskUid));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: message,
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
