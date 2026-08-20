import { readFileSync } from "node:fs";

export interface SchemaTableContract {
  tableName: string;
  expectedColumns: string[];
  requiredColumns: string[];
  forbiddenColumns: string[];
}

const contractManifest = JSON.parse(
  readFileSync(new URL("./schemaContracts.json", import.meta.url), "utf8"),
) as Record<string, SchemaTableContract>;

export const ERP_SCHEMA_CONTRACTS = contractManifest;

export interface SchemaDriftValidationResult {
  valid: boolean;
  tableName: string;
  missingRequired: string[];
  presentForbidden: string[];
  unknownColumns: string[];
  errorMessage?: string;
}

function normalizeColumns(columns: string[]) {
  return Array.from(new Set(columns.map((column) => column.trim().toLowerCase()).filter(Boolean)));
}

/**
 * Validates a deployed table column list against the versioned ERP contract.
 * Unknown columns are reported as additive drift but do not fail the check;
 * required-column loss and explicitly forbidden columns are blocking failures.
 */
export function validateSchemaContract(tableName: string, providedColumns: string[]): SchemaDriftValidationResult {
  const contract = ERP_SCHEMA_CONTRACTS[tableName];
  if (!contract) {
    return {
      valid: false,
      tableName,
      missingRequired: [],
      presentForbidden: [],
      unknownColumns: normalizeColumns(providedColumns),
      errorMessage: `Unknown table contract for "${tableName}"`,
    };
  }

  const columns = normalizeColumns(providedColumns);
  const columnSet = new Set(columns);
  const required = normalizeColumns(contract.requiredColumns);
  const forbidden = normalizeColumns(contract.forbiddenColumns);
  const expected = new Set(normalizeColumns(contract.expectedColumns));

  const missingRequired = required.filter((column) => !columnSet.has(column));
  const presentForbidden = forbidden.filter((column) => columnSet.has(column));
  const unknownColumns = columns.filter((column) => !expected.has(column));
  const valid = missingRequired.length === 0 && presentForbidden.length === 0;

  const issues: string[] = [];
  if (missingRequired.length > 0) issues.push(`Missing required columns [${missingRequired.join(", ")}]`);
  if (presentForbidden.length > 0) issues.push(`Forbidden/unsupported drift columns detected [${presentForbidden.join(", ")}]`);
  if (unknownColumns.length > 0) issues.push(`Additive columns detected [${unknownColumns.join(", ")}]`);

  return {
    valid,
    tableName,
    missingRequired,
    presentForbidden,
    unknownColumns,
    errorMessage: issues.length > 0 ? `Schema contract report for "${tableName}": ${issues.join("; ")}` : undefined,
  };
}

/**
 * Validates an incoming insert or update payload object against required and forbidden columns.
 */
export function validatePayloadContract(tableName: string, payload: Record<string, unknown>): SchemaDriftValidationResult {
  return validateSchemaContract(tableName, Object.keys(payload));
}

export function assertPayloadContract(tableName: string, payload: Record<string, unknown>) {
  const result = validatePayloadContract(tableName, payload);
  if (!result.valid) {
    throw new Error(result.errorMessage ?? `Schema contract violation for "${tableName}"`);
  }
  return result;
}
