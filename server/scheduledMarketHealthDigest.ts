import { Request, Response } from "express";
import { jsPDF } from "jspdf";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { marketProviderSettings, webhookDeliveries } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getMarketIntelligenceSnapshot } from "./marketIntelligence";
import { sendTransactionalEmail } from "./transactionalEmail";

function buildProviderHealthPdf(snapshot: Awaited<ReturnType<typeof getMarketIntelligenceSnapshot>>) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 42;
  let y = 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Smart Manager Enterprise", left, y);
  y += 22;
  doc.setFontSize(12);
  doc.text("Weekly Market Provider Health Digest", left, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(snapshot.asOf).toUTCString()}`, left, y);
  y += 26;

  const lines = [
    `BOT / Bank Rates: ${snapshot.bankRates.uiStatus} | Latency ${snapshot.bankRates.latencyMs}ms | 24h uptime ${snapshot.bankRates.uptimePercent}%`,
    `DSE Market: ${snapshot.dse.uiStatus} | Latency ${snapshot.dse.latencyMs}ms | 24h uptime ${snapshot.dse.uptimePercent}%`,
    "",
    "Regional East African benchmark comparison",
    ...(snapshot.regionalPeers || []).map((peer) => `${peer.country} — ${peer.centralBank} — ${peer.currencyPair} — Policy ${peer.policyRateAnnual}% — Lending ${peer.benchmarkLending}% — ${peer.status}`),
    "",
    "Source note: Provider values are shown only when returned by approved integrations. Configure CBK, BOU, and BNR credentials before treating regional peer rows as live data.",
  ];

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, 510);
    doc.text(wrapped, left, y);
    y += Math.max(14, wrapped.length * 12);
    if (y > 760) {
      doc.addPage();
      y = 46;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function scheduledMarketHealthDigestHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "Unauthorized cron access." });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable." });
    }

    const settingsRows = await db.select().from(marketProviderSettings).where(eq(marketProviderSettings.scheduleCronTaskUid, user.taskUid)).limit(1);
    const settings = settingsRows[0];
    if (!settings || !settings.scheduleWeeklyEmail || !settings.outageEmailRecipients) {
      return res.json({ ok: true, skipped: "not configured or disabled" });
    }

    const snapshot = await getMarketIntelligenceSnapshot(settings.companyId);
    const recipients = settings.outageEmailRecipients.split(",").map(s => s.trim()).filter(Boolean);
    const pdf = buildProviderHealthPdf(snapshot);
    const subject = `[Smart Manager] Weekly Market Provider Health Digest (${new Date().toLocaleDateString()})`;
    const emailBody = `Smart Manager Enterprise — Weekly Market Intelligence & Provider Health Digest\n\nGenerated: ${new Date(snapshot.asOf).toUTCString()}\n\nBOT / Bank Rates: ${snapshot.bankRates.uiStatus} (${snapshot.bankRates.latencyMs}ms latency, ${snapshot.bankRates.uptimePercent}% 24h uptime)\nDSE Market: ${snapshot.dse.uiStatus} (${snapshot.dse.latencyMs}ms latency, ${snapshot.dse.uptimePercent}% 24h uptime)\n\nThe attached PDF contains the provider health summary and regional comparison context.`;

    let successCount = 0;
    const failures: string[] = [];
    for (const email of recipients) {
      try {
        await sendTransactionalEmail({
          to: [email],
          subject,
          text: emailBody,
          html: `<p>${emailBody.replace(/\n/g, "<br />")}</p>`,
          attachments: [{ filename: "market-provider-health-digest.pdf", content: pdf, contentType: "application/pdf" }],
          category: "report",
        });
        successCount += 1;
      } catch (error: any) {
        failures.push(`${email}: ${error?.message || "delivery failed"}`);
      }
    }

    await db.insert(webhookDeliveries).values({
      deliveryId: `market-health-${settings.companyId}-${Date.now()}`,
      companyId: settings.companyId,
      action: "MARKET_HEALTH_DIGEST_EMAIL",
      module: "Market Intelligence",
      severity: failures.length ? "WARNING" : "INFO",
      status: failures.length ? "failed" : "success",
      attempts: 1,
      responseCode: failures.length ? 503 : 200,
      error: failures.length ? failures.join("; ") : null,
      eventSummary: JSON.stringify({ recipientCount: recipients.length, successCount, attachment: "market-provider-health-digest.pdf" }),
    });

    res.json({ ok: failures.length === 0, attempted: recipients.length, succeeded: successCount, failed: failures.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
