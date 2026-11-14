import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({
  ENV: {
    supabaseUrl: "https://supabase.test",
    supabaseAnonKey: "anon-test",
    supabaseSecretKey: "service-test",
  },
}));

const { subscriptionBillingCatalogHandler } = await import("./subscriptionBilling");

describe("subscription billing API response handling", () => {
  it("preserves a successful top-level JSON array from billing_public_plan_catalog", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ code: "FREE_15", price: 0 }]), { status: 200 })));

    const json = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      json,
    } as any;

    await subscriptionBillingCatalogHandler({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ plans: [{ code: "FREE_15", price: 0 }] });
    vi.unstubAllGlobals();
  });
});
