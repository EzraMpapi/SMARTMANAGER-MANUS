import { TRPCError } from "@trpc/server";
import { auditLogs, type AuditLog, type User } from "../drizzle/schema";
import { getDb } from "./db";
import { desc, eq } from "drizzle-orm";
import { insertSupabaseRow, selectSupabaseRows } from "./supabaseRest";

export type AuditLogInput = {
  companyId: string;
  action: string;
  module: string;
  details?: string;
};

type SupabaseAuditLog = {
  id: number;
  actor_open_id: string;
  actor_name: string | null;
  company_id: string;
  action: string;
  module: string;
  details: string | null;
  created_at: string;
};

function mapSupabaseAuditLog(row: SupabaseAuditLog): AuditLog {
  return {
    id: Number(row.id),
    actorOpenId: row.actor_open_id,
    actorName: row.actor_name,
    companyId: row.company_id,
    action: row.action,
    module: row.module,
    details: row.details,
    createdAt: new Date(row.created_at),
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Audit logs database is unavailable." });
  return db;
}

export async function recordAuditLog(user: Pick<User, "openId" | "name">, input: AuditLogInput, sessionToken?: string): Promise<AuditLog> {
  const db = await getDb();
  if (!db) {
    const rows = await insertSupabaseRow<SupabaseAuditLog>("audit_logs", {
      actor_open_id: user.openId,
      actor_name: user.name || "System User",
      company_id: input.companyId,
      action: input.action,
      module: input.module,
      details: input.details || null,
    }, sessionToken);
    if (!rows[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase did not return the recorded audit event." });
    return mapSupabaseAuditLog(rows[0]);
  }
  const [insertResult] = await db.insert(auditLogs).values({
    actorOpenId: user.openId,
    actorName: user.name || "System User",
    companyId: input.companyId,
    action: input.action,
    module: input.module,
    details: input.details || null,
  });
  const logId = Number((insertResult as { insertId?: number }).insertId);
  const rows = await db.select().from(auditLogs).where(eq(auditLogs.id, logId)).limit(1);
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

export async function listAuditLogs(companyId: string, limit = 50, sessionToken?: string): Promise<AuditLog[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const db = await getDb();
  if (!db) {
    const rows = await selectSupabaseRows<SupabaseAuditLog>("audit_logs", {
      select: "id,actor_open_id,actor_name,company_id,action,module,details,created_at",
      company_id: `eq.${companyId}`,
      order: "created_at.desc",
      limit: safeLimit,
    }, sessionToken);
    return rows.map(mapSupabaseAuditLog);
  }
  return db.select().from(auditLogs)
    .where(eq(auditLogs.companyId, companyId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(safeLimit);
}
