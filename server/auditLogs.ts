import { TRPCError } from "@trpc/server";
import { auditLogs, type AuditLog, type User } from "../drizzle/schema";
import { getDb, withDatabaseRetry } from "./db";
import { desc, eq, and } from "drizzle-orm";

export type AuditLogInput = {
  companyId: string;
  action: string;
  module: string;
  details?: string;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Audit logs database is unavailable." });
  return db;
}

export async function recordAuditLog(user: User, input: AuditLogInput): Promise<AuditLog> {
  const db = await requireDb();
  const [insertResult] = await withDatabaseRetry(
    () => db.insert(auditLogs).values({
      actorOpenId: user.openId,
      actorName: user.name || "System User",
      companyId: input.companyId,
      action: input.action,
      module: input.module,
      details: input.details || null,
    }),
    "Audit-log write",
  );
  const logId = Number((insertResult as { insertId?: number }).insertId);
  const rows = await withDatabaseRetry(
    () => db.select().from(auditLogs).where(eq(auditLogs.id, logId)).limit(1),
    "Audit-log read-after-write",
  );
  return rows[0] || {
    id: logId,
    actorOpenId: user.openId,
    actorName: user.name || "System User",
    companyId: input.companyId,
    action: input.action,
    module: input.module,
    details: input.details || null,
    createdAt: new Date(),
  };
}

export async function listAuditLogs(companyId: string, limit = 50): Promise<AuditLog[]> {
  const db = await requireDb();
  const rows = await withDatabaseRetry(
    () => db.select().from(auditLogs)
      .where(eq(auditLogs.companyId, companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit),
    "Audit-log list",
  );
  return rows;
}
