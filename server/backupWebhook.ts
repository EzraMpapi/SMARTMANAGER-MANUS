import { Request, Response } from "express";
import { dispatchWebhookEvent } from "./webhooks";

export async function handleBackupCompletionWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    // Handle Supabase or scheduled backup completion notification
    await dispatchWebhookEvent({
      action: "BACKUP_SNAPSHOT_COMPLETE",
      module: "Admin",
      severity: "INFO",
      details: `Automated database snapshot completed successfully. Details: ${JSON.stringify(payload?.event || payload || "OK")}`,
      actor: "Supabase Backup Service",
    });
    res.json({ success: true, received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process backup webhook" });
  }
}
