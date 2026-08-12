import "dotenv/config";
import { getDb } from "./db.js";
import { sql } from "drizzle-orm";

async function runMigrations() {
  console.log("Starting CI/CD database migration check...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection unavailable.");
    process.exit(1);
  }
  try {
    // Ensure audit_logs table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id SERIAL PRIMARY KEY,
        company_id TEXT NOT NULL,
        actor_open_id TEXT NOT NULL,
        actor_name TEXT,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Database migrations verified and applied successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration execution failed:", err);
    process.exit(1);
  }
}

runMigrations();
