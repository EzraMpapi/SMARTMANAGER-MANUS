import fs from "node:fs";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync("supabase/migrations/20260916_003_sync_global_admin_lifecycle_access.sql", "utf8");
const precedenceMigration = fs.readFileSync("supabase/migrations/20260916_004_admin_permit_access_precedence.sql", "utf8");

describe("Global Admin lifecycle access synchronization", () => {
  it("updates the tenant access source when a sales subscription is changed", () => {
    expect(migration).toContain("public.sales_subscriptions");
    expect(migration).toContain("public.tenant_subscriptions");
    expect(migration).toContain("where ts.company_id = v_subscription.company_id");
    expect(migration).toContain("tenantSubscriptionId");
  });

  it("makes extend, resume, and change-plan actions active and unlimited", () => {
    expect(migration).toContain("v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN')");
    expect(migration).toContain("'unlimitedAccess', true");
    expect(migration).toContain("then 'Active'");
    expect(migration).toContain("notify pgrst, 'reload schema'");
  });

  it("keeps cancellation as the only lifecycle action that removes access", () => {
    expect(migration).toContain("when v_action = 'CANCEL_SUBSCRIPTION' then 'Cancelled'");
    expect(migration).toContain("when v_action in ('EXTEND_SUBSCRIPTION', 'RESUME_SUBSCRIPTION', 'CHANGE_PLAN') then 'Active'");
  });

  it("lets an explicit active admin permit override a stale expiry timestamp", () => {
    expect(precedenceMigration).toContain("v_unlimited_access and v_subscription.status in ('Active', 'Grace')");
    expect(precedenceMigration).toContain("Access is active under an explicit platform administrator permit.");
    expect(precedenceMigration).toContain("v_allowed := true");
  });
});
