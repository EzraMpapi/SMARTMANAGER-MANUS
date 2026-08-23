import { describe, expect, it } from "vitest";
import { normalizeSubscriptionAccess, subscriptionAllowsModule, subscriptionStateLabel } from "../client/src/lib/subscriptionAccess.js";

describe("subscription access adapter", () => {
  it("accepts an explicitly server-allowed trial and its module entitlements", () => {
    const access = normalizeSubscriptionAccess({ access: { state: "Trial", status: "Trial", allowed: true, moduleEntitlements: ["finance", "hospitality"] } });
    expect(access.state).toBe("trial");
    expect(access.allowed).toBe(true);
    expect(subscriptionAllowsModule(access, "finance")).toBe(true);
    expect(subscriptionAllowsModule(access, "hotel")).toBe(true);
    expect(subscriptionStateLabel(access)).toBe("Trial");
  });

  it("does not turn a pending or expired browser response into access", () => {
    for (const state of ["Pending", "Expired", "Required", "unknown"]) {
      const access = normalizeSubscriptionAccess({ access: { state, allowed: true, moduleEntitlements: ["finance"] } });
      expect(access.allowed).toBe(false);
      expect(subscriptionAllowsModule(access, "finance")).toBe(false);
    }
  });

  it("requires both a server allow decision and an entitlement for operational modules", () => {
    const access = normalizeSubscriptionAccess({ access: { state: "Active", allowed: true, moduleEntitlements: ["finance"] } });
    expect(subscriptionAllowsModule(access, "dashboard")).toBe(true);
    expect(subscriptionAllowsModule(access, "finance")).toBe(true);
    expect(subscriptionAllowsModule(access, "inventory")).toBe(false);
    expect(subscriptionAllowsModule({ ...access, allowed: false }, "finance")).toBe(false);
  });
});
