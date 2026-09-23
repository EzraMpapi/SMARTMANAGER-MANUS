import fs from "node:fs";
import { describe, expect, it } from "vitest";

const accessSource = fs.readFileSync("client/src/lib/subscriptionAccess.js", "utf8");
const dashboardSource = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("subscription loading and offline access contracts", () => {
  it("stores and restores the last confirmed subscription decision", () => {
    expect(accessSource).toContain("smart-manager:subscription-access");
    expect(accessSource).toContain("readCachedAccess");
    expect(accessSource).toContain("writeCachedAccess(body)");
    expect(accessSource).toContain("if (cached) setRequest({ status: \"ready\", payload: cached, error: \"\" })");
  });

  it("does not render a confirmation boundary while access is still loading", () => {
    expect(dashboardSource).toContain("Do not put a confirmation wall in front of every app load");
    expect(dashboardSource).not.toContain("!subscriptionAccess.ready && !canUseSubscriptionEscape");
    expect(dashboardSource).toContain("subscriptionAccess.ready && !subscriptionAccess.access.allowed");
  });
});
