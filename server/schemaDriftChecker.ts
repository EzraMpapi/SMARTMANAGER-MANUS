export interface SchemaTableContract {
  tableName: string;
  expectedColumns: string[];
  requiredColumns: string[];
  forbiddenColumns: string[];
}

const contractManifest: Record<string, SchemaTableContract> = {
  finance_expenses: {
    tableName: "finance_expenses",
    expectedColumns: ["id", "company_id", "amount", "category", "due_date", "expense_date", "method", "status", "vendor", "created_at", "updated_at"],
    requiredColumns: ["company_id", "vendor", "category", "amount", "expense_date", "status", "method"],
    forbiddenColumns: ["data", "cost_center", "department"],
  },
  sales_invoices: {
    tableName: "sales_invoices",
    expectedColumns: ["id", "company_id", "name", "status", "amount", "notes", "created_at", "updated_at", "data", "doc_number", "customer", "issue_date", "due_date", "order_id", "amount_paid"],
    requiredColumns: ["company_id", "status", "amount", "doc_number", "customer", "issue_date", "due_date"],
    forbiddenColumns: [],
  },
  inventory_items: {
    tableName: "inventory_items",
    expectedColumns: ["id", "company_id", "name", "status", "amount", "notes", "created_at", "updated_at", "data"],
    requiredColumns: ["company_id", "name", "status", "amount", "data"],
    forbiddenColumns: [],
  },
  crm_leads: {
    tableName: "crm_leads",
    expectedColumns: ["id", "company_id", "name", "status", "amount", "notes", "created_at", "updated_at", "data"],
    requiredColumns: ["company_id", "name", "status", "data"],
    forbiddenColumns: [],
  },
  ...Object.fromEntries([
    "hc_patients", "hc_doctors", "hc_appointments", "hc_visits", "hc_vitals",
    "hc_prescriptions", "hc_lab_orders", "hc_radiology", "hc_invoices", "hc_insurance_claims", "hc_notifications", "hc_reports", "hc_reminder_settings", "hc_reminder_deliveries", "hc_portal_reference_imports", "hc_portal_reference_approvals",
  ].map((tableName) => [tableName, {
    tableName,
    expectedColumns: ["id", "company_id", "name", "status", "amount", "notes", "created_at", "updated_at", "data"],
    requiredColumns: ["company_id", "name", "status", "data"],
    forbiddenColumns: [],
  }])),
};

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
