import { and, desc, eq } from "drizzle-orm";
import { marketProviderIncidents, marketProviderSettings, marketProviderUptimeLogs } from "../drizzle/schema";
import { getDb } from "./db";
import { sendTransactionalEmail } from "./transactionalEmail";

export async function getMarketProviderSettings(companyId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(marketProviderSettings).where(eq(marketProviderSettings.companyId, companyId)).limit(1);
  return rows[0] || null;
}

export async function upsertMarketProviderSettings(companyId: string, input: {
  bankProviderUrl?: string;
  bankProviderApiKey?: string;
  dseProviderUrl?: string;
  dseProviderApiKey?: string;
  slackWebhookUrl?: string;
  outageEmailRecipients?: string;
  alertOnOutage?: boolean;
  refreshIntervalSeconds?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");
  const refreshInterval = Math.max(15, Math.min(3600, input.refreshIntervalSeconds ?? 60));
  const existing = await getMarketProviderSettings(companyId);
  if (existing) {
    await db.update(marketProviderSettings).set({
      bankProviderUrl: input.bankProviderUrl ?? existing.bankProviderUrl,
      bankProviderApiKey: input.bankProviderApiKey ?? existing.bankProviderApiKey,
      dseProviderUrl: input.dseProviderUrl ?? existing.dseProviderUrl,
      dseProviderApiKey: input.dseProviderApiKey ?? existing.dseProviderApiKey,
      slackWebhookUrl: input.slackWebhookUrl ?? existing.slackWebhookUrl,
      outageEmailRecipients: input.outageEmailRecipients ?? existing.outageEmailRecipients,
      alertOnOutage: input.alertOnOutage ?? existing.alertOnOutage,
      refreshIntervalSeconds: input.refreshIntervalSeconds !== undefined ? refreshInterval : existing.refreshIntervalSeconds,
      updatedAt: new Date(),
    }).where(eq(marketProviderSettings.companyId, companyId));
  } else {
    await db.insert(marketProviderSettings).values({
      companyId,
      bankProviderUrl: input.bankProviderUrl || null,
      bankProviderApiKey: input.bankProviderApiKey || null,
      dseProviderUrl: input.dseProviderUrl || null,
      dseProviderApiKey: input.dseProviderApiKey || null,
      slackWebhookUrl: input.slackWebhookUrl || null,
      outageEmailRecipients: input.outageEmailRecipients || null,
      alertOnOutage: input.alertOnOutage ?? true,
      refreshIntervalSeconds: refreshInterval,
    });
  }
  return getMarketProviderSettings(companyId);
}

export async function recordMarketUptimeAndIncidents(companyId: string, providerType: "bank" | "dse", status: string, latencyMs: number, statusCode?: number, errorMessage?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(marketProviderUptimeLogs).values({
    companyId,
    providerType,
    status,
    latencyMs,
    statusCode: statusCode || null,
    errorMessage: errorMessage || null,
    checkedAt: new Date(),
  });

  const isOutage = status === "OUTAGE" || status === "UNAVAILABLE";
  const openIncidents = await db.select().from(marketProviderIncidents).where(and(eq(marketProviderIncidents.companyId, companyId), eq(marketProviderIncidents.providerType, providerType), eq(marketProviderIncidents.status, "OPEN"))).limit(1);

  if (isOutage) {
    const summary = errorMessage ? `${providerType.toUpperCase()} provider error: ${errorMessage}` : `${providerType.toUpperCase()} market provider unreachable or returned empty data.`;
    if (!openIncidents.length) {
      await db.insert(marketProviderIncidents).values({
        companyId,
        providerType,
        issueSummary: summary,
        severity: "OUTAGE",
        status: "OPEN",
        openedAt: new Date(),
      });
      await dispatchMarketOutageNotification(companyId, providerType, summary);
    }
  } else if (openIncidents.length) {
    await db.update(marketProviderIncidents).set({
      status: "RESOLVED",
      resolutionNotes: `Provider feed recovered successfully on check at ${new Date().toISOString()}`,
      resolvedAt: new Date(),
    }).where(eq(marketProviderIncidents.id, openIncidents[0].id));
  }
}

async function dispatchMarketOutageNotification(companyId: string, providerType: string, summary: string) {
  try {
    const settings = await getMarketProviderSettings(companyId);
    if (!settings || !settings.alertOnOutage) return;

    if (settings.slackWebhookUrl) {
      await fetch(settings.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 *Smart Manager Market Outage Alert*\nProvider: *${providerType.toUpperCase()}*\nDetails: ${summary}\nTime: ${new Date().toUTCString()}`,
        }),
      }).catch(() => {});
    }

    if (settings.outageEmailRecipients) {
      const recipients = settings.outageEmailRecipients.split(",").map((s) => s.trim()).filter(Boolean);
      for (const email of recipients) {
        await sendTransactionalEmail({
          to: email,
          subject: `[Smart Manager] Market Outage Alert: ${providerType.toUpperCase()}`,
          text: `Smart Manager ERP detected a provider outage.\n\nProvider: ${providerType.toUpperCase()}\nSummary: ${summary}\nTimestamp: ${new Date().toUTCString()}\n\nPlease check integration settings or provider uptime history in the enterprise dashboard.`,
        }).catch(() => {});
      }
    }
  } catch (error) {
    // Fail safely without disrupting the calling request
  }
}

export async function getMarketGovernanceData(companyId: string) {
  const db = await getDb();
  if (!db) return { settings: null, uptimeLogs: [], incidents: [] };

  const [settingsRows, uptimeLogs, incidents] = await Promise.all([
    db.select().from(marketProviderSettings).where(eq(marketProviderSettings.companyId, companyId)).limit(1),
    db.select().from(marketProviderUptimeLogs).where(eq(marketProviderUptimeLogs.companyId, companyId)).orderBy(desc(marketProviderUptimeLogs.checkedAt)).limit(50),
    db.select().from(marketProviderIncidents).where(eq(marketProviderIncidents.companyId, companyId)).orderBy(desc(marketProviderIncidents.openedAt)).limit(20),
  ]);

  return {
    settings: settingsRows[0] ? {
      ...settingsRows[0],
      bankProviderApiKey: settingsRows[0].bankProviderApiKey ? "••••••••" : "",
      dseProviderApiKey: settingsRows[0].dseProviderApiKey ? "••••••••" : "",
    } : null,
    uptimeLogs,
    incidents,
  };
}
