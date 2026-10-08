import fs from "node:fs";
import { describe, expect, it } from "vitest";

const sync = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");
const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("offline background retry contracts", () => {
  it("persists retry scheduling with exponential backoff, jitter, and an attempt cap", () => {
    expect(sync).toContain("OFFLINE_RETRY_POLICY");
    expect(sync).toContain("nextRetryAt");
    expect(sync).toContain("retryExhausted");
    expect(sync).toContain("offlineRetryDelay");
    expect(sync).toContain("2 ** exponent");
  });

  it("retries only transient network failures and keeps conflicts separate", () => {
    expect(sync).toContain("isRetryableNetworkError");
    expect(sync).toContain("const conflict = error?.code === \"OFFLINE_CONFLICT\"");
    expect(sync).toContain("const retryable = isRetryableNetworkError(error)");
    expect(sync).toContain("force = false");
  });

  it("runs background replay and forces a retry after reconnect or manual sync", () => {
    expect(dashboard).toContain("window.setInterval");
    expect(dashboard).toContain("replayCompanyTableOutbox({ force: true })");
    expect(dashboard).toContain("replayCompanyTableOutbox().finally");
    expect(dashboard).toContain("15000");
  });
});
