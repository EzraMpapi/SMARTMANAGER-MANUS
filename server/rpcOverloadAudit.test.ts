import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readMigration = (name: string) => fs.readFileSync(path.join(process.cwd(), "supabase/migrations", name), "utf8");
const platformAdminMigration = readMigration("20260915_001_resolve_platform_admin_control_action_overload.sql");
const standingOrderMigration = readMigration("20260915_002_resolve_bank_run_standing_orders_overload.sql");

describe("RPC overload audit repairs", () => {
  it("keeps platform-admin ten-argument callers unambiguous", () => {
    expect(platformAdminMigration).toContain("RENAME TO platform_admin_tenant_control_action");
    expect(platformAdminMigration).not.toMatch(/CREATE(?: OR REPLACE)? FUNCTION/i);
  });

  it("keeps the zero-argument standing-order entry point and removes defaults from the compatibility overload", () => {
    expect(standingOrderMigration).toContain("RENAME TO bank_run_standing_orders_for_date");
    expect(standingOrderMigration).toContain("CREATE OR REPLACE FUNCTION public.bank_run_standing_orders()");
    expect(standingOrderMigration).toContain("p_run_date date,");
    expect(standingOrderMigration).toContain("p_order_id uuid,");
    expect(standingOrderMigration).toContain("p_max_orders integer");
    expect(standingOrderMigration).not.toContain("p_run_date date DEFAULT");
    expect(standingOrderMigration).toContain("bank_run_standing_orders_for_date(p_run_date, p_order_id, p_max_orders)");
  });
});
