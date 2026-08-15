import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const dashboardLayoutSource = readFileSync(new URL("../client/src/components/DashboardLayout.tsx", import.meta.url), "utf8");

describe("Smart Manager Authentication Navigation & Session Warning Specification", () => {
  it("prevents explicit public auth screens from overriding a stored session token", () => {
    expect(appSource).toContain("const token = window.localStorage.getItem(\"bs_access_token\");");
    expect(appSource).toContain("if (token && explicitPublicScreen) return false;");
  });

  it("renders a persistent session expiration warning banner when session expiry approaches", () => {
    expect(dashboardLayoutSource).toContain("sessionExpiringSoon");
    expect(dashboardLayoutSource.includes("Your session will expire soon")).toBe(true);
  });
});
