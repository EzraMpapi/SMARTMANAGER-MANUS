import { and, desc, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { schemaDriftMonitors, schemaDriftRuns, type SchemaDriftMonitor } from "../drizzle/schema";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";

export type SchemaDriftStatus = "healthy" | "drift" | "error";
export type SchemaDriftReport = {
  verifiedAt: string;
  source: string;
  referencedTableCount: number;
  deployedTableCount: number;
  missingTables: string[];
  tenantTableIssues: Array<{ table: string; missingColumns: string[] }>;
};

const MONITOR_KEY = "primary";
const DAILY_SCHEMA_DRIFT_CRON = "0 0 7 * * *";
const GLOBAL_TABLES = new Set(["companies", "profiles", "workspaces"]);

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Schema-drift monitor database is unavailable.");
  return db;
}

function summarizeReport(status: SchemaDriftStatus, report: SchemaDriftReport | null, error?: string): string {
  if (status === "healthy" && report) {
    return `Healthy: ${report.referencedTableCount}/${report.referencedTableCount} dashboard tables available; no tenant-column exceptions.`;
  }
  if (status === "drift" && report) {
    return `Drift detected: ${report.missingTables.length} missing tables and ${report.tenantTableIssues.length} tenant-column exceptions.`;
  }
  return `Verification error: ${error || "unknown failure"}`;
}

async function requestOpenApi(supabaseUrl: string, serviceKey: string): Promise<Record<string, unknown>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (response.ok) return await response.json() as Record<string, unknown>;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((delay) => setTimeout(delay, attempt * 400));
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError || "Unknown schema request failure"));
}

export async function verifyLiveSchemaContract(): Promise<SchemaDriftReport> {
  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase schema verification requires server-side Supabase configuration.");

  const dashboardPath = resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx");
  const dashboardSource = await readFile(dashboardPath, "utf8");
  const referencedTables = Array.from(new Set(Array.from(dashboardSource.matchAll(/sb\("([^\"]+)"/g)).map((match) => match[1]))).sort();
  const openApi = await requestOpenApi(supabaseUrl, serviceKey);
  const paths = (openApi.paths ?? {}) as Record<string, Record<string, { parameters?: Array<{ $ref?: string }> }>>;
  const deployedTables = Object.keys(paths)
    .filter((path) => path.startsWith("/") && !path.startsWith("/rpc/"))
    .map((path) => path.slice(1))
    .sort();
  const missingTables = referencedTables.filter((table) => !deployedTables.includes(table));

  const tableColumns = (table: string) => {
    const operations = Object.values(paths[`/${table}`] ?? {});
    const references = operations.flatMap((operation) => operation?.parameters ?? []);
    const pattern = new RegExp(`^#/parameters/rowFilter\\.${table}\\.([^/]+)$`);
    return Array.from(new Set(references.map((parameter) => parameter?.$ref?.match(pattern)?.[1]).filter(Boolean) as string[])).sort();
  };

  const tenantTableIssues = referencedTables
    .filter((table) => !GLOBAL_TABLES.has(table) && deployedTables.includes(table))
    .map((table) => ({ table, columns: tableColumns(table) }))
    .filter(({ columns }) => !["id", "company_id", "created_at", "updated_at"].every((column) => columns.includes(column)))
    .map(({ table, columns }) => ({
      table,
      missingColumns: ["id", "company_id", "created_at", "updated_at"].filter((column) => !columns.includes(column)),
    }));

  return {
    verifiedAt: new Date().toISOString(),
    source: "BusinessSphereDashboard.jsx sb() table contract",
    referencedTableCount: referencedTables.length,
    deployedTableCount: deployedTables.length,
    missingTables,
    tenantTableIssues,
  };
}

export async function ensureSchemaDriftMonitor() {
  const db = await requireDb();
  const existing = await db.select().from(schemaDriftMonitors)
    .where(eq(schemaDriftMonitors.monitorKey, MONITOR_KEY)).limit(1);
  if (existing[0]) return existing[0];

  const [insertResult] = await db.insert(schemaDriftMonitors).values({
    monitorKey: MONITOR_KEY,
    cronExpression: DAILY_SCHEMA_DRIFT_CRON,
    isActive: true,
  });
  const id = Number((insertResult as { insertId?: number }).insertId);
  const created = await db.select().from(schemaDriftMonitors).where(eq(schemaDriftMonitors.id, id)).limit(1);
  if (!created[0]) throw new Error("Schema-drift monitor could not be created.");
  return created[0];
}

export async function activateSchemaDriftMonitor() {
  const db = await requireDb();
  const monitor = await ensureSchemaDriftMonitor();
  if (monitor.scheduleCronTaskUid) {
    await updateHeartbeatJob(monitor.scheduleCronTaskUid, {
      cron: monitor.cronExpression,
      path: "/api/scheduled/schemaDriftMonitor",
      payload: { monitorKey: MONITOR_KEY },
      description: "Daily BusinessSphere Supabase schema-drift verification",
      enable: true,
    }, "");
    await db.update(schemaDriftMonitors).set({ isActive: true }).where(eq(schemaDriftMonitors.id, monitor.id));
    return { ...monitor, isActive: true };
  }

  const heartbeat = await createHeartbeatJob({
    name: `businesssphere-schema-drift-${monitor.id}`,
    cron: monitor.cronExpression,
    path: "/api/scheduled/schemaDriftMonitor",
    payload: { monitorKey: MONITOR_KEY },
    description: "Daily BusinessSphere Supabase schema-drift verification",
  }, "");
  await db.update(schemaDriftMonitors)
    .set({ scheduleCronTaskUid: heartbeat.taskUid, isActive: true })
    .where(eq(schemaDriftMonitors.id, monitor.id));
  const refreshed = await db.select().from(schemaDriftMonitors).where(eq(schemaDriftMonitors.id, monitor.id)).limit(1);
  return refreshed[0];
}

async function persistRun(monitor: SchemaDriftMonitor, status: SchemaDriftStatus, report: SchemaDriftReport | null, notificationDelivered: boolean, error?: string) {
  const db = await requireDb();
  const summary = summarizeReport(status, report, error);
  await db.insert(schemaDriftRuns).values({
    monitorId: monitor.id,
    status,
    referencedTableCount: report?.referencedTableCount ?? 0,
    deployedTableCount: report?.deployedTableCount ?? 0,
    missingTables: report?.missingTables ?? [],
    tenantTableIssues: report?.tenantTableIssues ?? [],
    notificationDelivered,
    error: error ?? null,
  });
  await db.update(schemaDriftMonitors).set({
    lastCheckedAt: new Date(),
    lastStatus: status,
    lastSummary: summary,
  }).where(eq(schemaDriftMonitors.id, monitor.id));
  return summary;
}

export async function runSchemaDriftCheck(monitor?: SchemaDriftMonitor) {
  const activeMonitor = monitor ?? await ensureSchemaDriftMonitor();
  let report: SchemaDriftReport | null = null;
  let status: SchemaDriftStatus = "error";
  let errorMessage: string | undefined;
  try {
    report = await verifyLiveSchemaContract();
    status = report.missingTables.length || report.tenantTableIssues.length ? "drift" : "healthy";
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  let notificationDelivered = false;
  if (status !== "healthy") {
    notificationDelivered = await notifyOwner({
      title: status === "drift" ? "BusinessSphere Supabase schema drift detected" : "BusinessSphere schema monitor failed",
      content: summarizeReport(status, report, errorMessage),
    }).catch(() => false);
  }
  const summary = await persistRun(activeMonitor, status, report, notificationDelivered, errorMessage);
  return { status, report, summary, notificationDelivered, error: errorMessage };
}

export async function runScheduledSchemaDriftCheck(taskUid: string) {
  const db = await requireDb();
  const rows = await db.select().from(schemaDriftMonitors)
    .where(and(eq(schemaDriftMonitors.scheduleCronTaskUid, taskUid), eq(schemaDriftMonitors.isActive, true))).limit(1);
  const monitor = rows[0];
  if (!monitor) return { ok: true as const, skipped: "orphan-or-paused" as const };
  const result = await runSchemaDriftCheck(monitor);
  return { ok: true as const, monitorId: monitor.id, ...result };
}

export async function getSchemaDriftMonitor() {
  return ensureSchemaDriftMonitor();
}

export async function listSchemaDriftRuns(limit = 30) {
  const db = await requireDb();
  const monitor = await ensureSchemaDriftMonitor();
  return db.select().from(schemaDriftRuns)
    .where(eq(schemaDriftRuns.monitorId, monitor.id))
    .orderBy(desc(schemaDriftRuns.checkedAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}
