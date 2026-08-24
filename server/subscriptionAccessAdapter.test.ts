import { describe, expect, it } from "vitest";
import { normalizeSubscriptionAccess, subscriptionAllowsModule, subscriptionStateLabel } from "../client/src/lib/subscriptionAccess.js";

describe("subscription access adapter", () => {
  it("accepts explicitly server-allowed Free access and its module entitlements", () => {
    const access = normalizeSubscriptionAccess({ access: { state: "Active", status: "Active", allowed: true, moduleEntitlements: ["finance", "hospitality"] } });
    expect(access.state).toBe("active");
    expect(access.allowed).toBe(true);
    expect(subscriptionAllowsModule(access, "finance")).toBe(true);
    expect(subscriptionAllowsModule(access, "hotel")).toBe(true);
    expect(subscriptionStateLabel(access)).toBe("Active");
  });

  it("does not turn a pending, expired, required, or unknown response into access", () => {
    for (const state of ["Pending", "Expired", "Required", "unknown"]) {
      const access = normalizeSubscriptionAccess({ access: { state, allowed: true, moduleEntitlements: ["finance"] } });
      expect(access.allowed).toBe(false);
      expect(subscriptionAllowsModule(access, "finance")).toBe(false);
    }
  });

  it("fails closed for an unrecognized legacy state", () => {
    const access = normalizeSubscriptionAccess({ access: { state: "legacy", allowed: true, moduleEntitlements: ["finance"] } });
    expect(access.state).toBe("unknown");
    expect(access.allowed).toBe(false);
    expect(subscriptionAllowsModule(access, "finance")).toBe(false);
  });

  it("requires both a server allow decision and an entitlement for operational modules", () => {
    const access = normalizeSubscriptionAccess({ access: { state: "Active", allowed: true, moduleEntitlements: ["finance"] } });
    expect(subscriptionAllowsModule(access, "dashboard")).toBe(true);
    expect(subscriptionAllowsModule(access, "finance")).toBe(true);
    expect(subscriptionAllowsModule(access, "inventory")).toBe(false);
    expect(subscriptionAllowsModule({ ...access, allowed: false }, "finance")).toBe(false);
  });
});
