import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mapNativeFiscalProfile, mapNativeFiscalReceipt } from "./traFiscalSupabase";

const root = resolve(import.meta.dirname, "..");
const router = readFileSync(resolve(root, "server/traFiscalRouter.ts"), "utf8");
const adapter = readFileSync(resolve(root, "server/traFiscalSupabase.ts"), "utf8");
const migration = readFileSync(resolve(root, "supabase/migrations/20260826_005_restaurant_tanzania_receipt_action.sql"), "utf8");
const migrationFix = readFileSync(resolve(root, "supabase/migrations/20260826_006_fix_restaurant_tanzania_receipt_action.sql"), "utf8");

function executableSql(source: string) {
  return source.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("TRA Supabase-native router contract", () => {
  it("uses native RPC and adapter boundaries instead of orphaned legacy Drizzle tables", () => {
    expect(router).toContain("./traFiscalSupabase");
    expect(router).toContain("getNativeFiscalProfile");
    expect(router).toContain("queueNativeReceipt");
    expect(router).toContain('sourceType: z.literal("restaurant_order")');
    expect(router).toContain('sourceId: z.string().uuid()');
    expect(router).not.toContain("from \"./db\"");
    expect(router).not.toContain("from \"./traFiscal\"");
    expect(router).not.toContain("getDb");
    expect(router).not.toContain("getFiscalProvider(");
    expect(adapter).toContain("restaurant_tanzania_snapshot");
    expect(adapter).toContain("restaurant_tanzania_action");
    expect(adapter).toContain("restaurant_tanzania_receipt_action");
    expect(adapter).toContain("authorization: `Bearer ${token}`");
    expect(adapter).toContain("accessToken ? userRpcHeaders(accessToken) : serviceHeaders()");
    expect(adapter).toContain("headers: serviceHeaders()");
  });

  it("keeps the receipt queue RPC tenant-scoped and idempotent without external provider calls", () => {
    const sql = executableSql(migrationFix);
    expect(sql).toContain("current_company_id()");
    expect(sql).toContain("restaurant_can_operate");
    expect(sql).toContain("order_id,internal_reference");
    expect(sql).toContain("v_profile_id,v_order_id");
    expect(sql).toContain("v_source_type <> 'restaurant_order'");
    expect(sql).toContain("restaurant_orders o");
    expect(sql).toContain("company_id=v_company_id AND idempotency_key=v_idempotency_key");
    expect(sql).toContain("'Queued'");
    expect(migration).toContain("does not call an external TRA provider");
    expect(migrationFix).toContain("does not call an external TRA provider");
    expect(sql).not.toMatch(/DROP\s+(TABLE|FUNCTION|POLICY)/i);
    expect(sql).not.toMatch(/TRUNCATE|DELETE\s+FROM/i);
    expect(sql).not.toMatch(/GRANT\s+EXECUTE[^;]+TO\s+(PUBLIC|anon)/i);
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.restaurant_tanzania_receipt_action(jsonb) TO authenticated");
  });

  it("maps native typed rows into the existing TRA UI contract", () => {
    expect(mapNativeFiscalProfile({ id: "profile-1", company_id: "company-1", outlet_id: "outlet-1", tin: "100-001", business_name: "Demo Ltd", status: "Awaiting Configuration", environment: "sandbox" })).toMatchObject({ id: "profile-1", companyId: "company-1", outletId: "outlet-1", tin: "100-001", businessName: "Demo Ltd", environment: "sandbox", status: "Awaiting Configuration" });
    expect(mapNativeFiscalReceipt({ id: "receipt-1", company_id: "company-1", outlet_id: "outlet-1", internal_reference: "invoice:1", status: "Queued", gross_amount: "118", vat_amount: "18", net_amount: "100", currency: "TZS", created_at: "2026-08-26T00:00:00Z" })).toMatchObject({ id: "receipt-1", receiptNumber: "invoice:1", status: "Queued", grossAmount: 118, vatAmount: 18, netAmount: 100, sourceType: "restaurant_order" });
  });
});
