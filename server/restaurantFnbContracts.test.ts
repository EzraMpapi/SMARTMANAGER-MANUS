import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(root, "supabase/migrations/20260822_032_restaurant_fnb_management_core.sql"), "utf8");
const operationsMigration = readFileSync(resolve(root, "supabase/migrations/20260822_033_restaurant_fnb_operations_extension.sql"), "utf8");
const hardeningMigration = readFileSync(resolve(root, "supabase/migrations/20260822_034_harden_restaurant_helper_privileges.sql"), "utf8");
const tanzaniaMigration = readFileSync(resolve(root, "supabase/migrations/20260823_035_restaurant_tanzania_fiscal_configuration.sql"), "utf8");
const tanzaniaTriggerHardening = readFileSync(resolve(root, "supabase/migrations/20260823_037_remove_restaurant_fiscal_trigger_rpc_access.sql"), "utf8");
const routeFile = existsSync(resolve(root, "server/_core/apiApp.ts")) ? "server/_core/apiApp.ts" : "server/_core/index.ts";
const serverRoutes = readFileSync(resolve(root, routeFile), "utf8");
const restaurantServer = readFileSync(resolve(root, "server/restaurantManagement.ts"), "utf8");
const dashboard = readFileSync(resolve(root, "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const workspace = readFileSync(resolve(root, "client/src/components/RestaurantWorkspace.jsx"), "utf8");
const tanzaniaPanel = readFileSync(resolve(root, "client/src/components/RestaurantTanzaniaFiscalPanel.jsx"), "utf8");

describe("Restaurant and F&B contracts", () => {
  it("persists a typed tenant-scoped Restaurant and F&B domain instead of legacy seed state", () => {
    for (const table of ["restaurant_outlets", "restaurant_tables", "restaurant_menu_items", "restaurant_recipe_ingredients", "restaurant_orders", "restaurant_order_lines", "restaurant_kitchen_tickets", "restaurant_payments", "restaurant_reservations", "restaurant_wastage", "restaurant_alerts", "restaurant_audit_events"]) {
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).toContain("company_id uuid NOT NULL");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
  });

  it("protects action and snapshot procedures while deriving tenant context server-side", () => {
    expect(migration).toContain("public.restaurant_snapshot()");
    expect(migration).toContain("public.restaurant_action(p_action text,p_payload jsonb");
    expect(migration).toContain("public.current_company_id()");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.restaurant_action(text,jsonb) FROM PUBLIC,anon");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.restaurant_action(text,jsonb) TO authenticated");
    expect(migration).toContain("public.restaurant_can_operate");
    expect(migration).toContain("p.is_active");
  });

  it("enforces table, reservation, kitchen, stock, and settlement lifecycle invariants", () => {
    for (const action of ["RESERVATION_CREATE", "ORDER_OPEN", "ORDER_ADD_LINE", "ORDER_SEND_KITCHEN", "KITCHEN_TRANSITION", "ORDER_SETTLE", "TABLE_RELEASE", "WASTAGE_LOG"]) expect(migration).toContain(`p_action='${action}'`);
    expect(migration).toContain("The selected table is not available.");
    expect(migration).toContain("The selected table is already reserved for this time.");
    expect(migration).toContain("Insufficient recipe stock");
    expect(migration).toContain("Payment allocations do not cover the final total.");
    expect(migration).toContain("Restaurant recipe consumption");
  });

  it("posts shared inventory, hospitality, POS, finance, payment, and audit references", () => {
    for (const record of ["public.inventory_items", "public.inventory_stock_movements", "public.hospitality_folio_lines", "public.pos_transactions", "public.journal_entries", "public.restaurant_payments", "public.restaurant_audit_events"]) expect(migration).toContain(record);
    expect(migration).toContain("Room Charge");
    expect(migration).toContain("Mobile Money");
    expect(migration).toContain("TZS");
  });

  it("persists advanced F&B operations for shifts, modifiers, purchasing, bill splits, promotions, and refunds", () => {
    for (const table of ["restaurant_shifts", "restaurant_modifier_groups", "restaurant_combo_items", "restaurant_promotions", "restaurant_purchase_requests", "restaurant_purchase_lines", "restaurant_bill_splits", "restaurant_refunds"]) expect(operationsMigration).toContain(`public.${table}`);
    for (const action of ["STAFF_ROLE_ASSIGN", "SHIFT_OPEN", "SHIFT_CLOSE", "MODIFIER_GROUP_SAVE", "MODIFIER_OPTION_SAVE", "COMBO_ITEM_SAVE", "PROMOTION_SAVE", "SUPPLIER_SAVE", "PURCHASE_REQUEST_CREATE", "PURCHASE_RECEIVE", "BILL_SPLIT_CREATE", "REFUND_PROCESS"]) expect(operationsMigration).toContain(`p_action='${action}'`);
    expect(operationsMigration).toContain("Restaurant purchase receipt");
    expect(operationsMigration).toContain("Restaurant refund");
    expect(workspace).toContain('rpc("restaurant_operations_snapshot", {})');
    expect(workspace).toContain('rpc("restaurant_operations_action"');
  });

  it("uses an authenticated scheduled endpoint for idempotent low-stock alert reconciliation and keeps helper roles non-callable", () => {
    expect(restaurantServer).toContain("scheduledRestaurantAlertsHandler");
    expect(restaurantServer).toContain("if (!user.isCron)");
    expect(restaurantServer).toContain("restaurant_reconcile_alerts");
    expect(restaurantServer).toContain("const companies = Array.isArray(raw)");
    expect(serverRoutes).toContain('app.post("/api/scheduled/restaurantAlerts", scheduledRestaurantAlertsHandler);');
    expect(hardeningMigration).toContain("REVOKE ALL ON FUNCTION public.restaurant_is_manager() FROM PUBLIC,anon,authenticated");
    expect(hardeningMigration).toContain("REVOKE ALL ON FUNCTION public.restaurant_can_operate(text[]) FROM PUBLIC,anon,authenticated");
  });

  it("persists Tanzania tax profiles, fiscal queue records, and mobile-money configuration without inventing official receipt identifiers", () => {
    for (const table of ["restaurant_tax_profiles", "restaurant_fiscal_profiles", "restaurant_fiscal_receipts", "restaurant_mobile_money_profiles", "restaurant_mobile_money_intents"]) expect(tanzaniaMigration).toContain(`public.${table}`);
    for (const action of ["TAX_PROFILE_SAVE", "FISCAL_PROFILE_SAVE", "MOBILE_MONEY_PROFILE_SAVE", "MOBILE_MONEY_INTENT_CREATE"]) expect(tanzaniaMigration).toContain(`p_action='${action}'`);
    expect(tanzaniaMigration).toContain("official_receipt_number text");
    expect(tanzaniaMigration).toContain("Official TRA/VFD receipt numbers are never synthesized locally");
    expect(tanzaniaMigration).toContain("A taxable Tanzania standard VAT profile must use 18%%");
    expect(tanzaniaMigration).toContain("A valid Tanzanian mobile number is required.");
    expect(tanzaniaMigration).toContain("restaurant_enqueue_fiscal_receipt_trigger");
    expect(tanzaniaMigration).toContain("GRANT EXECUTE ON FUNCTION public.restaurant_tanzania_action(text,jsonb) TO authenticated");
    expect(tanzaniaTriggerHardening).toContain("REVOKE ALL ON FUNCTION public.restaurant_enqueue_fiscal_receipt() FROM PUBLIC,anon,authenticated,service_role");
    expect(workspace).toContain("Tanzania fiscal");
    expect(tanzaniaPanel).toContain('rpc("restaurant_tanzania_snapshot", {})');
    expect(tanzaniaPanel).toContain('rpc("restaurant_tanzania_action"');
    expect(tanzaniaPanel).toContain("Official TRA receipt numbers are never generated locally");
  });

  it("replaces the live legacy Restaurant route with the authenticated persistent command center", () => {
    expect(dashboard).toContain('import { RestaurantWorkspace } from "./components/RestaurantWorkspace";');
    expect(dashboard).toContain("function RestaurantManagementModule");
    expect(dashboard).toContain('<RestaurantWorkspace rpc={rpc} configured={IS_CONFIGURED && !DEMO_OVERRIDE} currentUser={currentUser} />');
    expect(dashboard).toMatch(/\{active === "restaurant"\s+&& <RestaurantManagementModule\s+currentUser=\{currentUser\} \/>\}/);
    expect(workspace).toContain('rpc("restaurant_snapshot", {})');
    expect(workspace).toContain('rpc("restaurant_action"');
    expect(workspace).toContain("Kitchen display system");
    expect(workspace).toContain("Recipe ingredients are atomically deducted");
  });
});
