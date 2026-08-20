import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const dashboardSource = readFileSync(
  resolve(projectRoot, "client/src/BusinessSphereDashboard.jsx"),
  "utf8",
);
const contractManifest = JSON.parse(
  readFileSync(resolve(projectRoot, "server/schemaContracts.json"), "utf8"),
);

const referencedTables = [...new Set(
  [...dashboardSource.matchAll(/(?:sb|useCompanyTable|runCompanyTableQuery|runCompanyTableMutation)\("([^\"]+)"/g)].map((match) => match[1]),
)].sort();

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Supabase schema verification requires SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const requestOpenApi = async () => {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      if (response.ok || attempt === 3) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 400));
  }

  throw lastError;
};

let response;
try {
  response = await requestOpenApi();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Unable to retrieve the Supabase OpenAPI schema after three attempts: ${message}`);
  process.exit(1);
}

if (!response.ok) {
  console.error(`Unable to retrieve the Supabase OpenAPI schema: HTTP ${response.status}.`);
  process.exit(1);
}

const openApi = await response.json();
const deployedTables = Object.keys(openApi.paths ?? {})
  .filter((path) => path.startsWith("/") && !path.startsWith("/rpc/"))
  .map((path) => path.slice(1))
  .sort();
const missingTables = referencedTables.filter((table) => !deployedTables.includes(table));

const tableColumns = (table) => {
  const operations = Object.values(openApi.paths?.[`/${table}`] ?? {});
  const references = operations.flatMap((operation) => operation?.parameters ?? []);
  const pattern = new RegExp(`^#/parameters/rowFilter\\.${table}\\.([^/]+)$`);
  return [...new Set(references
    .map((parameter) => parameter?.$ref?.match(pattern)?.[1])
    .filter(Boolean))]
    .sort();
};

const globalTables = new Set(["companies", "profiles", "workspaces"]);
const stableAuditExemptions = new Set(["user_table_preferences"]);
const tenantTableIssues = referencedTables
  .filter((table) => !globalTables.has(table) && !stableAuditExemptions.has(table) && deployedTables.includes(table))
  .map((table) => ({ table, columns: tableColumns(table) }))
  .filter(({ columns }) => !["id", "company_id", "created_at", "updated_at"].every((column) => columns.includes(column)));

const criticalTableIssues = Object.values(contractManifest).map((contract) => {
  const columns = tableColumns(contract.tableName);
  const missingRequired = contract.requiredColumns.filter((column) => !columns.includes(column));
  const presentForbidden = contract.forbiddenColumns.filter((column) => columns.includes(column));
  const additiveColumns = columns.filter((column) => !contract.expectedColumns.includes(column));
  return {
    table: contract.tableName,
    missingRequired,
    presentForbidden,
    additiveColumns,
  };
}).filter(({ missingRequired, presentForbidden, additiveColumns }) => (
  missingRequired.length > 0 || presentForbidden.length > 0 || additiveColumns.length > 0
));

const report = {
  verifiedAt: new Date().toISOString(),
  source: "BusinessSphereDashboard.jsx complete persistence-table contract",
  referencedTableCount: referencedTables.length,
  deployedTableCount: deployedTables.length,
  missingTables,
  tenantTableIssues: tenantTableIssues.map(({ table, columns }) => ({
    table,
    missingColumns: ["id", "company_id", "created_at", "updated_at"].filter((column) => !columns.includes(column)),
  })),
  criticalTableIssues,
};

console.log(JSON.stringify(report, null, 2));

if (missingTables.length || tenantTableIssues.length || criticalTableIssues.length) {
  process.exit(2);
}
