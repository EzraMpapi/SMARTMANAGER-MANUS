import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const migration = read("supabase/migrations/20260823_040_property_management_core.sql");
const operations = read("server/propertyManagementOperations.ts");
const router = read("server/routers.ts");
const dashboard = read("client/src/BusinessSphereDashboard.jsx");
const workspace = read("client/src/components/PropertyManagementWorkspace.jsx");
const scheduled = read("server/propertyManagement.ts");

const tables = [
  "property_portfolios", "property_owners", "property_buildings", "property_plots", "property_units", "property_listings", "property_agents", "property_tenants", "property_tenant_documents", "property_applications", "property_leases", "property_inspections", "property_handover_records", "property_rent_schedules", "property_tax_fee_rules", "property_service_charges", "property_utility_meters", "property_meter_readings", "property_invoices", "property_invoice_lines", "property_payments", "property_receipts", "property_contractors", "property_maintenance_requests", "property_work_orders", "property_expenses", "property_budgets", "property_insurances", "property_documents", "property_notices", "property_approvals", "property_ledger_entries", "property_reconciliations", "property_notifications", "property_integration_events", "property_audit_log",
];

describe("Property Management contracts", () => {
  it("creates the additive tenant-scoped property schema", () => {
    tables.forEach((table) => expect(migration).toContain(`public.${table}`));
    expect(migration).toContain("company_id uuid NOT NULL DEFAULT public.current_company_id()");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("current_company_id()");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS property_units_status_idx");
  });

  it("is Tanzania-ready and server-calculated", () => {
    expect(migration).toContain("currency text NOT NULL DEFAULT 'TZS'");
    expect(migration).toContain("Africa/Dar_es_Salaam");
    expect(migration).toContain("numeric(18,0)");
    expect(operations).toContain("Use a valid Tanzania mobile number.");
    expect(workspace).toContain("en-TZ");
    expect(workspace).toContain("Africa/Dar_es_Salaam");
  });

  it("keeps all property writes behind protected typed server operations", () => {
    expect(router).toContain("propertyManagement: router({");
    expect(router).toContain(".input(propertyListInput)");
    expect(router).toContain(".input(propertyActionInput)");
    expect(router).toContain("uploadDocument");
    expect(operations).toContain("resolveVerifiedProfile");
    expect(operations).toContain('authorization: `Bearer ${token}`');
    expect(operations).toContain("z.enum(propertyActionNames)");
    expect(workspace).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("enforces roles, tenant scoping, and isolated tenant snapshots", () => {
    ["property_has_role", "property_can_view", "property_can_manage", "property_can_finance", "property_can_approve", "property_can_audit", "property_require"].forEach((marker) => expect(migration).toContain(marker));
    expect(migration).toContain("property_tenant_snapshot");
    expect(migration).toContain("profile_id=auth.uid()");
    expect(migration).toContain("No active Property Management tenant profile is linked to this account.");
    expect(operations).toContain("normalized.includes(\"tenant\")");
    ["Property Administrator", "Property Manager", "Landlord / Owner", "Property Agent", "Tenant", "Maintenance Staff", "Property Finance Officer"].forEach((role) => expect(dashboard).toContain(`id: \"${role}\"`));
  });

  it("covers the complete persisted workflow family", () => {
    ["REGISTER_PORTFOLIO", "REGISTER_OWNER", "REGISTER_BUILDING", "REGISTER_PLOT", "REGISTER_UNIT", "REGISTER_TENANT", "SUBMIT_APPLICATION", "APPROVE_APPLICATION", "CREATE_LEASE", "APPROVE_LEASE", "RECORD_INSPECTION", "GENERATE_INVOICE", "RECORD_PAYMENT", "CREATE_MAINTENANCE_REQUEST", "ASSIGN_WORK_ORDER", "COMPLETE_WORK_ORDER", "CREATE_EXPENSE", "APPROVE_EXPENSE", "RECORD_METER_READING", "ISSUE_NOTICE", "TERMINATE_LEASE", "CREATE_DOCUMENT", "RECONCILE_PAYMENT", "RUN_PROPERTY_CONTROLS"].forEach((action) => expect(operations).toContain(action));
    ["property_leases", "property_invoices", "property_payments", "property_receipts", "property_ledger_entries", "property_maintenance_requests", "property_work_orders", "property_reconciliations"].forEach((table) => expect(migration).toContain(`public.${table}`));
    expect(workspace).toContain("Portfolio control board");
    expect(workspace).toContain("Applications and leases");
    expect(workspace).toContain("Rent, utilities, deposits, and payment evidence");
    expect(workspace).toContain("Maintenance request queue");
  });

  it("protects financial integrity with idempotency, locks, immutable history, and balanced ledger entries", () => {
    expect(migration).toContain("UNIQUE(company_id,idempotency_key)");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("property_immutable_guard");
    expect(migration).toContain("Property financial and audit history is immutable.");
    expect(migration).toContain("property_ledger_post");
    expect(migration).toContain("debit_total<>credit_total");
    expect(migration).toContain("PROPERTY_RECEIVABLE");
    expect(migration).toContain("PROPERTY_DEPOSIT_LIABILITY");
    expect(migration).toContain("Payment amount exceeds the invoice balance.");
    expect(migration).toContain("Payment awaiting provider confirmation");
  });

  it("keeps maker-checker and approval records real", () => {
    expect(migration).toContain("property_approvals");
    expect(migration).toContain("The application maker cannot approve their own application.");
    expect(migration).toContain("The lease maker cannot approve their own lease.");
    expect(migration).toContain("The expense maker cannot approve their own expense.");
    expect(migration).toContain("INSERT INTO public.property_approvals");
    expect(workspace).toContain("Review approvals");
  });

  it("records finance, CRM, procurement, employee, maintenance, notification, and audit evidence", () => {
    ["'Finance'", "'Accounting'", "'CRM'", "'Procurement'", "'Employee'", "'Maintenance'", "property_notifications", "property_audit_log"].forEach((marker) => expect(migration).toContain(marker));
    expect(migration).toContain("LEASE_CREATED");
    expect(migration).toContain("INVOICE_ISSUED");
    expect(migration).toContain("PAYMENT_POSTED");
    expect(migration).toContain("MAINTENANCE_REQUEST_CREATED");
    expect(migration).toContain("WORK_ORDER_ASSIGNED");
  });

  it("uses the configured storage boundary and scheduled controls without exposing secrets", () => {
    expect(operations).toContain("storagePut");
    expect(operations).toContain("dataBase64");
    expect(operations).toContain("property/${companyId}");
    expect(scheduled).toContain("user.isCron");
    expect(scheduled).toContain("property_run_controls_for_company");
    expect(scheduled).toContain("ENV.supabaseSecretKey");
    expect(workspace).toContain("browser never receives a storage credential");
    expect(migration).toContain("property_run_controls_for_company");
    expect(migration).toContain("TO service_role");
  });

  it("keeps production failure states actionable and recovers stale workspace chunks", () => {
    expect(workspace).toContain("Property Management data is temporarily unavailable.");
    expect(workspace).toContain("Property Management access is restricted.");
    expect(workspace).not.toContain("Apply the controlled migration");
    expect(dashboard).toContain("lazyWorkspaceWithRecovery");
    expect(dashboard).toContain("smart-manager-workspace-lazy-retry:${key}");
    expect(dashboard).toContain('"property-management"');
  });

  it("exposes the module through navigation and a responsive workspace", () => {
    expect(dashboard).toContain('id: "property-management"');
    expect(dashboard).toContain("LazyPropertyManagementWorkspace");
    expect(dashboard).toContain('active === "property-management"');
    expect(dashboard).toContain('primaryModules: ["property-management"');
    expect(workspace).toContain('aria-label="Property Management module"');
    expect(workspace).toContain("grid gap-4 lg:grid-cols");
    expect(workspace).toContain("No external call is made here.");
  });
});
