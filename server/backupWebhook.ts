import { Request, Response } from "express";
import { dispatchWebhookEvent, getWebhookConfig } from "./webhooks";
import crypto from "crypto";

export async function handleBackupCompletionWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-supabase-signature"] || req.headers["x-webhook-signature"] || "";
    const config = getWebhookConfig();

    if (config.secret && signature) {
      const computedSig = crypto
        .createHmac("sha256", config.secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (signature !== computedSig && signature !== `sha256=${computedSig}`) {
        return res.status(401).json({ error: "Invalid webhook HMAC signature" });
      }
    }

    const payload = req.body;
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
