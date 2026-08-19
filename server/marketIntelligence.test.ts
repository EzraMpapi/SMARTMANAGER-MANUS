import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveMarketProviderUiStatus, normalizeBankRows, normalizeDseRows } from "./marketIntelligence";

const marketSource = readFileSync(new URL("./marketIntelligence.ts", import.meta.url), "utf8");
const governanceSource = readFileSync(new URL("./marketGovernance.ts", import.meta.url), "utf8");
const scheduledDigestSource = readFileSync(new URL("./scheduledMarketHealthDigest.ts", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("market intelligence response validation", () => {
  it("normalizes validated bank-rate records and rejects incomplete rows", () => {
    const rows = normalizeBankRows({ data: [
      { bank: "Example Bank", pair: "USD/TZS", buying: "2,600.10", selling: 2640.2, lendingRate: "15.4", timestamp: "2026-08-19T00:00:00.000Z" },
      { bank: "Incomplete Bank", buying: "" },
    ] }, "approved-bank-provider");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bankName: "Example Bank", currencyPair: "USD/TZS", buyRate: 2600.1, sellRate: 2640.2, lendingRateAnnual: 15.4, status: "LIVE", source: "approved-bank-provider" });
  });

  it("normalizes DSE records and retains only finite validated prices", () => {
    const rows = normalizeDseRows({ results: [
      { ticker: "TEST", name: "Example Listed Company", ltp: "1250", change: "12.5", percentChange: "1.01", volume: "300" },
      { ticker: "BROKEN", ltp: "not-a-number" },
    ] }, "approved-dse-provider");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ symbol: "TEST", companyName: "Example Listed Company", priceTzs: 1250, changeTzs: 12.5, changePercent: 1.01, volume: 300, status: "LIVE", source: "approved-dse-provider" });
  });

  it("does not turn missing arrays into synthetic financial records", () => {
    expect(normalizeBankRows({ message: "not configured" }, "provider")).toEqual([]);
    expect(normalizeDseRows({ message: "not configured" }, "provider")).toEqual([]);
  });

  it("derives truthful provider UI states without treating configuration gaps as outages", () => {
    expect(deriveMarketProviderUiStatus({ status: "LIVE", providerConfigured: true, hasRows: true, hasOutage: false })).toBe("LIVE");
    expect(deriveMarketProviderUiStatus({ status: "CACHED", providerConfigured: true, hasRows: true, hasOutage: false })).toBe("STALE");
    expect(deriveMarketProviderUiStatus({ status: "UNAVAILABLE", providerConfigured: true, hasRows: true, hasOutage: true })).toBe("OUTAGE");
    expect(deriveMarketProviderUiStatus({ status: "AWAITING_CONFIGURATION", providerConfigured: false, hasRows: false, hasOutage: false })).toBe("AWAITING_CONFIGURATION");
  });

  it("returns tenant-resolved provider configuration and response latency for live health reporting", () => {
    expect(marketSource).toContain("providerConfigured: Boolean(bankUrl)");
    expect(marketSource).toContain("providerConfigured: Boolean(dseUrl)");
    expect(marketSource).toContain("latencyMs: latencyBank");
    expect(marketSource).toContain("latencyMs: latencyDse");
  });

  it("wires a responsive one-minute dashboard health monitor without synthetic values", () => {
    expect(dashboardSource).toContain("refetchInterval: canViewMarketIntelligence ? 60_000 : false");
    expect(dashboardSource).toContain("refetchIntervalInBackground: false");
    expect(dashboardSource).toContain('aria-label="Live BOT and DSE feed health"');
    expect(dashboardSource).toContain("Provider latency");
    expect(dashboardSource).toContain("Auto-check every 60s");
  });

  it("supports 24-hour latency sparklines, uptime percentages, safe refresh interval bounds, and compliance health exports", () => {
    expect(marketSource).toContain("latencySparkline");
    expect(marketSource).toContain("uptimePercent");
    expect(dashboardSource).toContain("24h Uptime");
    expect(dashboardSource).toContain("24h Latency Trend");
    expect(dashboardSource).toContain("refreshIntervalSeconds");
    expect(dashboardSource).toContain("Export Health CSV");
  });

  it("supports regional East African peer comparison, weekly email digests, and latency threshold spike alerts", () => {
    expect(marketSource).toContain("regionalPeers");
    expect(marketSource).toContain("scheduleWeeklyEmail");
    expect(marketSource).toContain("latencyThresholdMs");
    expect(marketSource).toContain("AWAITING_VALIDATION");
    expect(dashboardSource).toContain("Regional East African Central Bank Comparison");
    expect(dashboardSource).toContain("cbkProviderUrl");
    expect(dashboardSource).toContain("bouProviderUrl");
    expect(dashboardSource).toContain("bnrProviderUrl");
  });

  it("connects weekly digest scheduling and delivery telemetry without exposing provider secrets", () => {
    expect(governanceSource).toContain("createHeartbeatJob");
    expect(governanceSource).toContain("/api/scheduled/marketHealthDigest");
    expect(governanceSource).toContain("scheduleCronTaskUid");
    expect(governanceSource).toContain("lastAlertDispatchedAt");
    expect(governanceSource).toContain("alertCooldownMinutes");
    expect(governanceSource).toContain("Math.max(5, Math.min(1440");
    expect(governanceSource).toContain("cooldownMs");
    expect(scheduledDigestSource).toContain("sdk.authenticateRequest");
    expect(scheduledDigestSource).toContain("user.taskUid");
    expect(scheduledDigestSource).toContain("scheduleCronTaskUid");
    expect(scheduledDigestSource).toContain("market-provider-health-digest.pdf");
    expect(scheduledDigestSource).toContain("webhookDeliveries");
    expect(scheduledDigestSource).toContain("sendTransactionalEmail");
    expect(governanceSource).toContain("cbkProviderApiKey: settingsRows[0].cbkProviderApiKey ? \"••••••••\" : \"\"");
    expect(dashboardSource).toContain("alertCooldownMinutes");
    expect(dashboardSource).toContain("Suppresses repeated alerts");
  });
});
