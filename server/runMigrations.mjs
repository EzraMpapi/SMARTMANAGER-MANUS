import "dotenv/config";
import { access } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const apply = process.argv.includes("--apply") || process.env.APPLY_MIGRATIONS === "true";

async function runMigrations() {
  await access("drizzle.config.ts");
  await access("drizzle");

  if (!apply) {
    console.log("Migration preflight passed. No database changes were applied.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when applying migrations.");
  }

  execFileSync("pnpm", ["exec", "drizzle-kit", "migrate"], { stdio: "inherit", env: process.env });
  console.log("Database migrations applied successfully.");
}

runMigrations().catch((error) => {
  console.error("Migration runner failed:", error.message || error);
  process.exit(1);
});
