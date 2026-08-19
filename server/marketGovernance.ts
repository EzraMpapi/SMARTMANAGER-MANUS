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
  cbkProviderUrl?: string;
  cbkProviderApiKey?: string;
  bouProviderUrl?: string;
  bouProviderApiKey?: string;
  bnrProviderUrl?: string;
  bnrProviderApiKey?: string;
  slackWebhookUrl?: string;
  outageEmailRecipients?: string;
  alertOnOutage?: boolean;
  refreshIntervalSeconds?: number;
  scheduleWeeklyEmail?: boolean;
  latencyThresholdMs?: number;
  alertCooldownMinutes?: number;
}, userSession?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");
  const refreshInterval = Math.max(15, Math.min(3600, input.refreshIntervalSeconds ?? 60));
  const threshold = Math.max(200, Math.min(30000, input.latencyThresholdMs ?? 1500));
  const cooldownMinutes = Math.max(5, Math.min(1440, input.alertCooldownMinutes ?? 15));
  const existing = await getMarketProviderSettings(companyId);
  const nextWeeklyEmail = input.scheduleWeeklyEmail ?? existing?.scheduleWeeklyEmail ?? false;
  let taskUid = existing?.scheduleCronTaskUid;

  // Manage Heartbeat cron job for weekly digest if requested
  try {
    const { createHeartbeatJob, deleteHeartbeatJob } = await import("./_core/heartbeat");
    if (nextWeeklyEmail && !taskUid) {
      if (!userSession) throw new Error("Authenticated session required to create the weekly digest schedule.");
      const job = await createHeartbeatJob({
        name: `market-health-digest-${companyId}`,
        cron: "0 0 8 * * 1", // Every Monday at 08:00 UTC
        path: "/api/scheduled/marketHealthDigest",
        payload: { companyId },
        description: `Weekly market health email digest for ${companyId}`,
      }, userSession);
      taskUid = job.taskUid;
    } else if (!nextWeeklyEmail && taskUid) {
      if (userSession) {
        await deleteHeartbeatJob(taskUid, userSession).catch(() => {});
        taskUid = null;
      }
    }
  } catch (err) {
    // Enabling a digest without a durable callback would be misleading; fail closed.
    if (nextWeeklyEmail && !taskUid) throw err;
  }

  if (existing) {
    await db.update(marketProviderSettings).set({
      bankProviderUrl: input.bankProviderUrl ?? existing.bankProviderUrl,
      bankProviderApiKey: input.bankProviderApiKey ?? existing.bankProviderApiKey,
      dseProviderUrl: input.dseProviderUrl ?? existing.dseProviderUrl,
      dseProviderApiKey: input.dseProviderApiKey ?? existing.dseProviderApiKey,
      cbkProviderUrl: input.cbkProviderUrl ?? existing.cbkProviderUrl,
      cbkProviderApiKey: input.cbkProviderApiKey ?? existing.cbkProviderApiKey,
      bouProviderUrl: input.bouProviderUrl ?? existing.bouProviderUrl,
      bouProviderApiKey: input.bouProviderApiKey ?? existing.bouProviderApiKey,
      bnrProviderUrl: input.bnrProviderUrl ?? existing.bnrProviderUrl,
      bnrProviderApiKey: input.bnrProviderApiKey ?? existing.bnrProviderApiKey,
      slackWebhookUrl: input.slackWebhookUrl ?? existing.slackWebhookUrl,
      outageEmailRecipients: input.outageEmailRecipients ?? existing.outageEmailRecipients,
      alertOnOutage: input.alertOnOutage ?? existing.alertOnOutage,
      refreshIntervalSeconds: input.refreshIntervalSeconds !== undefined ? refreshInterval : existing.refreshIntervalSeconds,
      scheduleWeeklyEmail: nextWeeklyEmail,
      latencyThresholdMs: input.latencyThresholdMs !== undefined ? threshold : existing.latencyThresholdMs,
      alertCooldownMinutes: input.alertCooldownMinutes !== undefined ? cooldownMinutes : existing.alertCooldownMinutes,
      scheduleCronTaskUid: taskUid,
      updatedAt: new Date(),
    }).where(eq(marketProviderSettings.companyId, companyId));
  } else {
    await db.insert(marketProviderSettings).values({
      companyId,
      bankProviderUrl: input.bankProviderUrl || null,
      bankProviderApiKey: input.bankProviderApiKey || null,
      dseProviderUrl: input.dseProviderUrl || null,
      dseProviderApiKey: input.dseProviderApiKey || null,
      cbkProviderUrl: input.cbkProviderUrl || null,
      cbkProviderApiKey: input.cbkProviderApiKey || null,
      bouProviderUrl: input.bouProviderUrl || null,
      bouProviderApiKey: input.bouProviderApiKey || null,
      bnrProviderUrl: input.bnrProviderUrl || null,
      bnrProviderApiKey: input.bnrProviderApiKey || null,
      slackWebhookUrl: input.slackWebhookUrl || null,
      outageEmailRecipients: input.outageEmailRecipients || null,
      alertOnOutage: input.alertOnOutage ?? true,
      refreshIntervalSeconds: refreshInterval,
      scheduleWeeklyEmail: nextWeeklyEmail,
      latencyThresholdMs: threshold,
      alertCooldownMinutes: cooldownMinutes,
      scheduleCronTaskUid: taskUid || null,
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

  const settings = await getMarketProviderSettings(companyId);
  const threshold = settings?.latencyThresholdMs ?? 1500;
  const isOutage = status === "OUTAGE" || status === "UNAVAILABLE";
  const isSpike = !isOutage && latencyMs >= threshold;
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
  } else if (isSpike) {
    const spikeSummary = `${providerType.toUpperCase()} latency spike detected: ${latencyMs}ms (threshold: ${threshold}ms)`;
    await dispatchMarketOutageNotification(companyId, providerType, spikeSummary);
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

    // Cooldown check: prevent duplicate alerts within 15 minutes
    const now = Date.now();
    const cooldownMs = Math.max(5, Math.min(1440, settings.alertCooldownMinutes ?? 15)) * 60 * 1000;
    if (settings.lastAlertDispatchedAt && now - new Date(settings.lastAlertDispatchedAt).getTime() < cooldownMs) {
      return;
    }

    const db = await getDb();
    if (db) {
      await db.update(marketProviderSettings).set({
        lastAlertDispatchedAt: new Date(),
      }).where(eq(marketProviderSettings.companyId, companyId));
    }

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
          to: [email],
          subject: `[Smart Manager] Market Outage Alert: ${providerType.toUpperCase()}`,
          html: `<p>Smart Manager ERP detected a provider outage.</p><p><strong>Provider:</strong> ${providerType.toUpperCase()}<br /><strong>Summary:</strong> ${summary}<br /><strong>Timestamp:</strong> ${new Date().toUTCString()}</p><p>Please check integration settings or provider uptime history in the enterprise dashboard.</p>`,
          text: `Smart Manager ERP detected a provider outage.\n\nProvider: ${providerType.toUpperCase()}\nSummary: ${summary}\nTimestamp: ${new Date().toUTCString()}\n\nPlease check integration settings or provider uptime history in the enterprise dashboard.`,
          category: "notification",
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
      cbkProviderApiKey: settingsRows[0].cbkProviderApiKey ? "••••••••" : "",
      bouProviderApiKey: settingsRows[0].bouProviderApiKey ? "••••••••" : "",
      bnrProviderApiKey: settingsRows[0].bnrProviderApiKey ? "••••••••" : "",
    } : null,
    uptimeLogs,
    incidents,
  };
}
