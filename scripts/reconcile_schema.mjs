import fs from "node:fs";

const schemaPath = new URL("../drizzle/schema.ts", import.meta.url);
const remotePath = "/home/ubuntu/.mcp/tool-results/2026-08-26_13-41-58.750619404_supabase_list_tables_72e42b94.json";

const schema = fs.readFileSync(schemaPath, "utf8");
const remote = JSON.parse(fs.readFileSync(remotePath, "utf8"));
const local = [...schema.matchAll(/mysqlTable\("([^"]+)"/g)].map((m) => m[1]);
const deployed = remote.tables
  .map((table) => table.name)
  .filter((name) => name.startsWith("public."))
  .map((name) => name.slice("public.".length));

const uniqueLocal = [...new Set(local)].sort();
const uniqueRemote = [...new Set(deployed)].sort();
const missing = uniqueLocal.filter((table) => !uniqueRemote.includes(table));
const present = uniqueLocal.filter((table) => uniqueRemote.includes(table));

console.log(JSON.stringify({
  localTableCount: uniqueLocal.length,
  deployedPublicTableCount: uniqueRemote.length,
  missingTables: missing,
  presentTables: present,
}, null, 2));
