import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { traGatewayAlertEvents, traGatewayAlertSettings, type TraGatewayAlertSettings } from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";

export type GatewayConnectionSnapshot = {
  status: "connected" | "degraded" | "unavailable";
  latencyMs: number;
};

export type GatewayAlertSettingsInput = {
  companyId: string;
  enabled: boolean;
  timeoutThresholdMs: number;
  cooldownMinutes: number;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "TRA gateway alert database is unavailable." });
  return db;
}

function validateSettings(input: GatewayAlertSettingsInput) {
  if (input.timeoutThresholdMs < 250 || input.timeoutThresholdMs > 120000) throw new TRPCError({ code: "BAD_REQUEST", message: "Gateway timeout threshold must be between 250ms and 120000ms." });
  if (input.cooldownMinutes < 1 || input.cooldownMinutes > 1440) throw new TRPCError({ code: "BAD_REQUEST", message: "Gateway alert cooldown must be between 1 and 1440 minutes." });
}

export async function getGatewayAlertSettings(companyId: string): Promise<TraGatewayAlertSettings> {
  const db = await requireDb();
  const rows = await db.select().from(traGatewayAlertSettings).where(eq(traGatewayAlertSettings.companyId, companyId)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(traGatewayAlertSettings).values({ companyId, enabled: false, timeoutThresholdMs: 1500, cooldownMinutes: 30 });
  const created = await db.select().from(traGatewayAlertSettings).where(eq(traGatewayAlertSettings.companyId, companyId)).limit(1);
  if (!created[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "TRA gateway alert settings could not be initialized." });
  return created[0];
}

export async function saveGatewayAlertSettings(input: GatewayAlertSettingsInput) {
  validateSettings(input);
  const db = await requireDb();
  const existing = await getGatewayAlertSettings(input.companyId);
  await db.update(traGatewayAlertSettings).set({
    enabled: input.enabled,
    timeoutThresholdMs: input.timeoutThresholdMs,
    cooldownMinutes: input.cooldownMinutes,
    updatedAt: new Date(),
  }).where(eq(traGatewayAlertSettings.id, existing.id));
  const rows = await db.select().from(traGatewayAlertSettings).where(eq(traGatewayAlertSettings.id, existing.id)).limit(1);
  return rows[0];
}

export async function listGatewayAlertEvents(companyId: string, limit = 30) {
  const db = await requireDb();
  return db.select().from(traGatewayAlertEvents)
    .where(eq(traGatewayAlertEvents.companyId, companyId))
    .orderBy(desc(traGatewayAlertEvents.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

function isTimeout(snapshot: GatewayConnectionSnapshot, thresholdMs: number) {
  return snapshot.status === "unavailable" || snapshot.latencyMs >= thresholdMs;
}

export async function evaluateAndDispatchGatewayTimeoutAlert(companyId: string, branchId: string, snapshot: GatewayConnectionSnapshot) {
  const db = await requireDb();
  const settings = await getGatewayAlertSettings(companyId);
  const now = Date.now();
  const lastAlertAt = settings.lastAlertAt?.getTime() ?? 0;
  const cooldownMs = settings.cooldownMinutes * 60 * 1000;

  if (!settings.enabled || !isTimeout(snapshot, settings.timeoutThresholdMs)) {
    return { triggered: false as const, settings, snapshot };
  }

  const message = `TRA VFD gateway timeout/degraded state for ${companyId}/${branchId}: provider ${snapshot.status}, latency ${snapshot.latencyMs}ms, threshold ${settings.timeoutThresholdMs}ms.`;
  if (lastAlertAt && now - lastAlertAt < cooldownMs) {
    await db.insert(traGatewayAlertEvents).values({
      companyId,
      branchId,
      providerStatus: snapshot.status,
      latencyMs: snapshot.latencyMs,
      thresholdMs: settings.timeoutThresholdMs,
      deliveryStatus: "suppressed",
      message: `${message} Alert suppressed during the configured ${settings.cooldownMinutes}-minute cooldown.`,
    });
    return { triggered: true as const, suppressed: true as const, settings, snapshot, message };
  }

  const delivered = await notifyOwner({
    title: "TRA VFD gateway timeout alert",
    content: message,
  }).catch(() => false);
  const deliveryStatus = delivered ? "sent" : "failed";
  await db.insert(traGatewayAlertEvents).values({
    companyId,
    branchId,
    providerStatus: snapshot.status,
    latencyMs: snapshot.latencyMs,
    thresholdMs: settings.timeoutThresholdMs,
    deliveryStatus,
    message,
  });
  await db.update(traGatewayAlertSettings).set({
    lastAlertAt: new Date(),
    lastDeliveryStatus: deliveryStatus,
    lastMessage: message,
    updatedAt: new Date(),
  }).where(eq(traGatewayAlertSettings.id, settings.id));

  return { triggered: true as const, suppressed: false as const, delivered, deliveryStatus, settings, snapshot, message };
}
