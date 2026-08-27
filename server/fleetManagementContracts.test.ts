import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.resolve(root, file), "utf8");
const migration = read("supabase/migrations/20260822_031_fleet_management_core.sql");
const server = read("server/fleetManagement.ts");
const routes = read("server/_core/apiApp.ts");
const workspace = read("client/src/components/FleetWorkspace.jsx");
const dashboard = read("client/src/BusinessSphereDashboardCore.jsx");
const environment = read("server/_core/env.ts");

describe("Fleet Management contracts", () => {
  it("persists typed tenant-scoped Fleet operations instead of relying on legacy JSON Fleet seeds", () => {
    ["fleet_vehicles", "fleet_drivers", "fleet_driver_assignments", "fleet_trips", "fleet_fuel_transactions", "fleet_maintenance_jobs", "fleet_service_records", "fleet_vehicle_documents", "fleet_incidents", "fleet_telematics_events", "fleet_alerts", "fleet_audit_events"].forEach(marker => expect(migration).toContain(marker));
    expect(workspace).not.toContain("FLT_VEHICLES_SEED");
    expect(workspace).toContain("/api/fleet/snapshot");
  });

  it("enforces company scoping, active profile roles, RLS reads, and non-anonymous action procedures", () => {
    ["public.current_company_id()", "coalesce(p.is_active, true)", "fleet_is_manager", "fleet_require_manager", "ENABLE ROW LEVEL SECURITY", "company_id=public.current_company_id()", "REVOKE ALL ON FUNCTION public.fleet_action(text,jsonb) FROM PUBLIC, anon", "GRANT EXECUTE ON FUNCTION public.fleet_action(text,jsonb) TO authenticated"].forEach(marker => expect(migration).toContain(marker));
  });

  it("validates driver assignment, dispatch, mileage, fuel consumption, maintenance approval, accounting references, and audit events", () => {
    ["ASSIGN_DRIVER", "Driver does not have a valid active licence.", "DISPATCH_TRIP", "Driver must be actively assigned", "COMPLETE_TRIP", "LOG_FUEL", "REQUEST_MAINTENANCE", "APPROVE_MAINTENANCE", "COMPLETE_MAINTENANCE", "public.journal_entries", "fleet_audit"].forEach(marker => expect(migration).toContain(marker));
  });

  it("creates deterministic expiry and maintenance alerts without browser-only state", () => {
    ["fleet_reconcile_alerts", "DocumentExpiry", "LicenceExpiry", "MaintenanceDue", "ON CONFLICT(company_id,alert_key) DO NOTHING", "auth.role() <> 'service_role'"].forEach(marker => expect(migration).toContain(marker));
    expect(routes).toContain('app.post("/api/scheduled/fleetAlerts", scheduledFleetAlertsHandler)');
    ["fleet_vehicles?select=company_id", "companiesProcessed", "p_company_id: companyId"].forEach(marker => expect(server).toContain(marker));
  });

  it("keeps GPS and telematics ingestion server-only and webhook-authenticated", () => {
    ["x-fleet-webhook-secret", "fleet_telematics_events", "resolution=ignore-duplicates"].forEach(marker => expect(server).toContain(marker));
    expect(environment).toContain("FLEET_TELEMATICS_WEBHOOK_SECRET");
    expect(routes).toContain('app.post("/api/webhooks/fleet-telematics", fleetTelematicsWebhookHandler)');
  });

  it("routes the live Fleet dashboard to the authenticated persistent workspace", () => {
    ["FleetWorkspace", "/api/fleet/action", "Fleet Command Center", "Register vehicle", "Dispatch trip", "Log fuel", "Request maintenance", "Log vehicle document or inspection", "Log accident, fine, toll, parking or incident", "Export real CSV"].forEach(marker => expect(workspace).toContain(marker));
    expect(dashboard).toContain("return <FleetWorkspace api={api} currentUser={currentUser} />");
  });
});
