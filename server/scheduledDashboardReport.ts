import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { httpStatusFromError } from "./_core/httpError";
import { runScheduledDashboardReport } from "./dashboardReports";

export async function scheduledDashboardReportHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await runScheduledDashboardReport(user.taskUid);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = httpStatusFromError(error);
    if (status < 500) return res.status(status).json({ error: message });
    return res.status(500).json({
      error: "Scheduled dashboard report failed.",
    });
  }
}
