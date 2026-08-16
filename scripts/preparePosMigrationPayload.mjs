import { readFileSync, writeFileSync } from "node:fs";

const [migrationPath, name] = process.argv.slice(2);
if (!migrationPath || !name) throw new Error("Usage: node scripts/preparePosMigrationPayload.mjs <migration-path> <migration-name>");
const query = readFileSync(migrationPath, "utf8");
writeFileSync(
  "/tmp/smart-manager-pos-transaction-migration.json",
  JSON.stringify({
    project_id: "rlhngsrihahhyxnjxrxm",
    name,
    query,
  }),
);
