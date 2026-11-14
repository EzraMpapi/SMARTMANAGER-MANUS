import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function verifyDatabaseBackupStatus() {
  const db = await getDb();
  if (!db) {
    return {
      status: "degraded" as const,
      provider: "Supabase Managed PostgreSQL",
      message: "Database connection unavailable. Managed backup and PITR settings were not verified.",
      timestamp: new Date(),
    };
  }
  try {
    const [result] = await db.execute(sql`SELECT NOW() as current_time`);
    return {
      status: "database_reachable" as const,
      provider: "Supabase Managed PostgreSQL",
      message: "Database connectivity verified. Managed backup and Point-in-Time Recovery settings require verification in the Supabase project dashboard.",
      backupConfiguration: "unverified" as const,
      lastCheckedAt: new Date(),
      dbTime: result,
    };
  } catch (error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Backup connectivity verification query failed." });
  }
}
