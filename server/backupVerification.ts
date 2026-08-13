import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { ENV } from "./_core/env";

export async function verifyDatabaseBackupStatus() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    return { status: "degraded", message: "Supabase server credentials are unavailable for database health verification.", timestamp: new Date() };
  }
  try {
    const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` },
    });
    if (!response.ok) {
      return { status: "degraded", message: `Supabase database API returned HTTP ${response.status}.`, timestamp: new Date() };
    }
    return {
      status: "healthy",
      provider: "Supabase Managed PostgreSQL",
      pitrEnabled: null,
      dailySnapshotAvailable: null,
      message: "Supabase database API is reachable. Confirm backup retention and PITR policy in the Supabase dashboard.",
      lastVerifiedAt: new Date(),
    };
  } catch (error) {
    return { status: "degraded", message: "Supabase database API could not be reached for health verification.", timestamp: new Date() };
  }
}
