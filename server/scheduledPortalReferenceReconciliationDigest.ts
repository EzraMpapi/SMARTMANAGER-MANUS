import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { webhookDeliveries } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { getPortalReferenceDailySummaryForCompany, getPortalReferenceDigestSettingsByTaskUid, resolvePortalReferenceDigestRecipients } from "./healthcarePortalReconciliationWorkflow";
import { sendTransactionalEmail, workspaceEmailHtml } from "./transactionalEmail";

const ACTION = "PORTAL_REFERENCE_RECONCILIATION_DIGEST_EMAIL";

function digestDate(timezone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function emailCopy(summary: Awaited<ReturnType<typeof getPortalReferenceDailySummaryForCompany>>, date: string) {
  const { totals } = summary;
  const text = [
    `Daily clinic portal-reference reconciliation summary — ${date}`,
    "",
    `Unlinked patient records: ${totals.unlinkedPatients}`,
    `Pending replacement approvals: ${totals.pendingApprovals}`,
    `Ready-to-apply import rows: ${totals.readyToApply}`,
    `Applied today: ${totals.appliedToday}`,
    `Rejected today: ${totals.rejectedToday}`,
    `Invalid today: ${totals.invalidToday}`,
    "",
    "This operational summary intentionally excludes patient names, phone numbers, portal references, clinical information, and other identifying details.",
    "Open the Healthcare workspace to review and resolve reconciliation items securely.",
  ].join("\n");
  return { text, html: workspaceEmailHtml({ title: "Daily portal-reference reconciliation summary", preheader: "Privacy-safe clinic operational counts", body: text }) };
}

export async function scheduledPortalReferenceReconciliationDigestHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "Unauthorized cron access." });
    taskUid = user.taskUid;
    const settings = await getPortalReferenceDigestSettingsByTaskUid(taskUid);
    if (!settings) return res.json({ ok: true, skipped: "orphaned, inactive, or unconfigured schedule" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable." });
    const date = digestDate(settings.timezone);
    const deliveryId = `portal-reference-digest-${settings.companyId}-${date}`;
    const existingRows = await db.select().from(webhookDeliveries).where(and(eq(webhookDeliveries.companyId, settings.companyId), eq(webhookDeliveries.deliveryId, deliveryId))).limit(1);
    const existing = existingRows[0];
    if (existing?.status === "success") return res.json({ ok: true, skipped: "already delivered", deliveryId });
    if (!existing) {
      try {
        await db.insert(webhookDeliveries).values({ deliveryId, companyId: settings.companyId, action: ACTION, module: "Healthcare", severity: "INFO", status: "retrying", attempts: 1, responseCode: null, error: null, eventSummary: JSON.stringify({ date, recipientCount: 0, privacySafe: true }) });
      } catch {
        return res.json({ ok: true, skipped: "delivery already reserved", deliveryId });
      }
    } else {
      await db.update(webhookDeliveries).set({ status: "retrying", attempts: existing.attempts + 1, responseCode: null, error: null }).where(eq(webhookDeliveries.deliveryId, deliveryId));
    }

    const [summary, recipients] = await Promise.all([
      getPortalReferenceDailySummaryForCompany(settings.companyId),
      resolvePortalReferenceDigestRecipients(settings.companyId, settings),
    ]);
    if (!recipients.length) {
      await db.update(webhookDeliveries).set({ status: "failed", severity: "WARNING", responseCode: 422, error: "No approved active recipient was available.", eventSummary: JSON.stringify({ date, recipientCount: 0, privacySafe: true }) }).where(eq(webhookDeliveries.deliveryId, deliveryId));
      return res.json({ ok: true, skipped: "no approved active recipients", deliveryId });
    }

    const copy = emailCopy(summary, date);
    let succeeded = 0;
    for (const recipient of recipients) {
      try {
        await sendTransactionalEmail({
          to: [recipient],
          subject: `[Smart Manager] Daily portal-reference reconciliation summary — ${date}`,
          text: copy.text,
          html: copy.html,
          category: "report",
          idempotencyKey: `${deliveryId}-${Buffer.from(recipient).toString("base64url").slice(0, 24)}`,
          providerDeliveryPurpose: "portal_reference_reconciliation_digest",
        });
        succeeded += 1;
      } catch {
        // Individual recipient addresses and provider responses never enter telemetry or HTTP output.
      }
    }
    const failed = recipients.length - succeeded;
    const status = failed ? "failed" : "success";
    await db.update(webhookDeliveries).set({
      status,
      severity: failed ? "WARNING" : "INFO",
      responseCode: failed ? 503 : 200,
      error: failed ? "One or more approved recipients did not accept the scheduled digest." : null,
      eventSummary: JSON.stringify({ date, recipientCount: recipients.length, successCount: succeeded, failedCount: failed, privacySafe: true }),
    }).where(eq(webhookDeliveries.deliveryId, deliveryId));
    if (failed) throw new Error("Scheduled reconciliation digest delivery did not complete.");
    return res.json({ ok: true, deliveryId, attempted: recipients.length, succeeded });
  } catch {
    return res.status(500).json({ error: "Scheduled reconciliation digest failed.", context: { taskUid: taskUid || null }, timestamp: new Date().toISOString() });
  }
}
