import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("silent session refresh table reload", () => {
  it("signals when a refreshed session is persisted without exposing any token value", () => {
    expect(source).toContain('window.dispatchEvent(new Event("smart-manager:auth-session-updated"))');
    expect(source).not.toContain('auth-session-updated", authResult.access_token');
  });

  it("reloads each live tenant-scoped table after the safe session-update signal", () => {
    expect(source).toContain('window.addEventListener("smart-manager:auth-session-updated", reloadAfterSessionUpdate)');
    expect(source).toContain('window.removeEventListener("smart-manager:auth-session-updated", reloadAfterSessionUpdate)');
    expect(source).toContain("const reloadAfterSessionUpdate = () => { reload(); }");
  });
});
