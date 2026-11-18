import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20261118_001_warehouse_scope_rls.sql"),
  "utf8",
);
const dashboard = readFileSync(
  path.join(process.cwd(), "client/src/BusinessSphereDashboard.jsx"),
  "utf8",
);

describe("warehouse scope security contract", () => {
  it("stores an active warehouse per authenticated company user and exposes a guarded switch RPC", () => {
    expect(migration).toContain("create table if not exists public.warehouse_memberships");
    expect(migration).toContain("create table if not exists public.warehouse_user_context");
    expect(migration).toContain("create or replace function public.current_warehouse_id()");
    expect(migration).toContain("create or replace function public.warehouse_set_active(p_warehouse_id uuid)");
    expect(migration).toContain("if not public.warehouse_can_access(p_warehouse_id)");
    expect(migration).toContain("grant execute on function public.warehouse_set_active(uuid) to authenticated");
  });

  it("keeps inventory rows inside the active warehouse instead of company-only scope", () => {
    expect(migration).toContain("data->>'warehouse_id' = public.current_warehouse_id()::text");
    expect(migration).toContain("inventory_items_active_warehouse");
    expect(migration).toContain("inventory_stock_movements_active_warehouse");
    expect(migration).toContain("inventory_transfers_active_warehouse");
    expect(migration).toContain("data->>'from_warehouse'");
    expect(migration).toContain("data->>'to_warehouse'");
  });

  it("limits membership writes to owners and keeps context rows user-owned", () => {
    expect(migration).toContain("public.warehouse_is_owner()");
    expect(migration).toContain("warehouse_memberships_owner_write");
    expect(migration).toContain("warehouse_user_context_own_write");
    expect(migration).toContain("user_id = auth.uid()");
  });

  it("reloads live company tables after a server-confirmed warehouse switch", () => {
    expect(dashboard).toContain("warehouse_set_active");
    expect(dashboard).toContain("smart-manager:warehouse-updated");
    expect(dashboard).toContain("WarehouseScopeSwitcher");
    expect(dashboard).toContain("window.localStorage.setItem(storageKey, confirmedId)");
  });
});
