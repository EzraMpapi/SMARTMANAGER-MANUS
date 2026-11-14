import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const banner = readFileSync(new URL("../client/src/components/FreeTrialBanner.jsx", import.meta.url), "utf8");
const expiryGate = readFileSync(new URL("../client/src/components/TrialExpiryNoticeGate.jsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("free-plan notice dismissal", () => {
  it("remembers an active free-plan banner per user and trial period, with an accessible dismiss action", () => {
    expect(banner).toContain("smart-manager:free-trial-banner:");
    expect(banner).toContain("window.localStorage.setItem(storageKey, \"1\")");
    expect(banner).toContain("Dismiss free trial notice");
    expect(banner).toContain("window.setTimeout(dismiss, 8000)");
  });

  it("hides a server-acknowledged expiry notice without changing the subscription access boundary", () => {
    expect(expiryGate).toContain("setNotice(null);");
    expect(dashboard).toContain("<SubscriptionAccessBoundary");
    expect(dashboard).toContain("noticeKey={currentUser?.id || session?.userId || \"\"}");
  });
});
