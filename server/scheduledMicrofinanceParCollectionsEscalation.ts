import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { webhookDeliveries } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { getMicrofinanceEscalationSettingsByTaskUid, getMicrofinanceParCollectionsSummaryForCompany, resolveMicrofinanceEscalationRecipients } from "./microfinanceOperations";
import { sendTransactionalEmail, workspaceEmailHtml } from "./transactionalEmail";

const ACTION = "MICROFINANCE_PAR_COLLECTIONS_ESCALATION_EMAIL";

function localDate(timezone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function money(value: number) { return `TZS ${Math.round(value).toLocaleString("en-US")}`; }

function escalationCopy(summary: Awaited<ReturnType<typeof getMicrofinanceParCollectionsSummaryForCompany>>, date: string) {
  const totals = summary.totals;
  const text = [
    `Daily portfolio-at-risk and collections escalation — ${date}`,
    "",
    `Active loans: ${totals.activeLoans}`,
    `Outstanding portfolio: ${money(totals.portfolioOutstanding)}`,
    `Overdue amount: ${money(totals.overdueAmount)}`,
    `PAR 30: ${totals.par30Ratio.toFixed(2)}% (${money(totals.par30Amount)})`,
    `Overdue installments: ${totals.overdueInstallments}`,
    `Open collection actions: ${totals.openCollectionActions}`,
    "",
    "This escalation intentionally excludes borrower names, account numbers, phone numbers, national IDs, payment references, and other personal or transaction-level details.",
    "Open the Microfinance workspace to review affected loans and assign collections follow-up securely.",
  ].join("\n");
  return { text, html: workspaceEmailHtml({ title: "Daily PAR and collections escalation", preheader: "Privacy-safe microfinance portfolio risk summary", body: text }) };
}

export async function scheduledMicrofinanceParCollectionsEscalationHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "Unauthorized cron access." });
    taskUid = user.taskUid;
    const settings = await getMicrofinanceEscalationSettingsByTaskUid(taskUid);
    if (!settings) return res.json({ ok: true, skipped: "orphaned, inactive, or unconfigured schedule" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable." });
    const date = localDate(settings.timezone);
    const deliveryId = `mfi-par-collections-escalation-${settings.companyId}-${date}`;
    const existing = (await db.select().from(webhookDeliveries).where(and(eq(webhookDeliveries.companyId, settings.companyId), eq(webhookDeliveries.deliveryId, deliveryId))).limit(1))[0];
    if (existing?.status === "success") return res.json({ ok: true, skipped: "already evaluated", deliveryId });
    if (!existing) {
      try { await db.insert(webhookDeliveries).values({ deliveryId, companyId: settings.companyId, action: ACTION, module: "Microfinance", severity: "INFO", status: "retrying", attempts: 1, responseCode: null, error: null, eventSummary: JSON.stringify({ date, privacySafe: true }) }); }
      catch { return res.json({ ok: true, skipped: "delivery already reserved", deliveryId }); }
    } else await db.update(webhookDeliveries).set({ status: "retrying", attempts: existing.attempts + 1, responseCode: null, error: null }).where(eq(webhookDeliveries.deliveryId, deliveryId));

    const summary = await getMicrofinanceParCollectionsSummaryForCompany(settings.companyId);
    const totals = summary.totals;
    const escalated = totals.par30Ratio >= settings.par30AlertThreshold || totals.overdueAmount >= settings.overdueAmountAlertThreshold;
    const baseSummary = { date, par30Ratio: totals.par30Ratio, overdueAmount: totals.overdueAmount, openCollectionActions: totals.openCollectionActions, privacySafe: true };
    if (!escalated) {
      await db.update(webhookDeliveries).set({ status: "success", severity: "INFO", responseCode: 204, error: null, eventSummary: JSON.stringify({ ...baseSummary, recipientCount: 0, escalationNeeded: false }) }).where(eq(webhookDeliveries.deliveryId, deliveryId));
      return res.json({ ok: true, deliveryId, escalated: false });
    }
    const recipients = await resolveMicrofinanceEscalationRecipients(settings.companyId, settings);
    if (!recipients.length) {
      await db.update(webhookDeliveries).set({ status: "failed", severity: "WARNING", responseCode: 422, error: "No approved active escalation recipient was available.", eventSummary: JSON.stringify({ ...baseSummary, recipientCount: 0, escalationNeeded: true }) }).where(eq(webhookDeliveries.deliveryId, deliveryId));
      return res.json({ ok: true, deliveryId, skipped: "no approved active recipients" });
    }
    const copy = escalationCopy(summary, date); let succeeded = 0;
    for (const recipient of recipients) {
      try {
        await sendTransactionalEmail({ to: [recipient], subject: `[Smart Manager] PAR and collections escalation — ${date}`, text: copy.text, html: copy.html, category: "report", idempotencyKey: `${deliveryId}-${Buffer.from(recipient).toString("base64url").slice(0, 24)}`, providerDeliveryPurpose: "microfinance_par_collections_escalation" });
        succeeded += 1;
      } catch { /* Never expose recipient or provider details in telemetry or callback output. */ }
    }
    const failed = recipients.length - succeeded;
    await db.update(webhookDeliveries).set({ status: failed ? "failed" : "success", severity: failed ? "WARNING" : "CRITICAL", responseCode: failed ? 503 : 200, error: failed ? "One or more approved recipients did not accept the scheduled escalation." : null, eventSummary: JSON.stringify({ ...baseSummary, escalationNeeded: true, recipientCount: recipients.length, successCount: succeeded, failedCount: failed }) }).where(eq(webhookDeliveries.deliveryId, deliveryId));
    if (failed) throw new Error("Scheduled microfinance escalation delivery did not complete.");
    return res.json({ ok: true, deliveryId, escalated: true, attempted: recipients.length, succeeded });
  } catch {
    return res.status(500).json({ error: "Scheduled microfinance PAR escalation failed.", context: { taskUid: taskUid || null }, timestamp: new Date().toISOString() });
  }
}
