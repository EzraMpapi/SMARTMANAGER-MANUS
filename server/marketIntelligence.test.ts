import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveMarketProviderUiStatus, normalizeBankRows, normalizeBotExchangeHtml, normalizeDseRows, normalizeDseMarketHtml } from "./marketIntelligence";

const marketSource = readFileSync(new URL("./marketIntelligence.ts", import.meta.url), "utf8");
const governanceSource = readFileSync(new URL("./marketGovernance.ts", import.meta.url), "utf8");
const scheduledDigestSource = readFileSync(new URL("./scheduledMarketHealthDigest.ts", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("market intelligence response validation", () => {
  it("normalizes validated bank-rate records and rejects incomplete rows", () => {
    const rows = normalizeBankRows({ data: [
      { bank: "Example Bank", pair: "USD/TZS", buying: "2,600.10", selling: 2640.2, lendingRate: "15.4", timestamp: "2026-08-19T00:00:00.000Z" },
      { bank: "Incomplete Bank", buying: "" },
    ] }, "approved-bank-provider");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bankName: "Example Bank", currencyPair: "USD/TZS", buyRate: 2600.1, sellRate: 2640.2, lendingRateAnnual: 15.4, status: "LIVE", source: "approved-bank-provider" });
  });

  it("normalizes the official BOT HTML exchange-rate table without inventing lending rates", () => {
    const rows = normalizeBotExchangeHtml(`<!doctype html><table><thead><tr><th>S/NO</th><th>Currency</th><th>Buying</th><th>Selling</th><th>Mean</th><th>Transaction Date</th></tr></thead><tbody><tr><td>1</td><td>USD</td><td>2,598.42</td><td>2,624.40</td><td>2,611.41</td><td>19-Aug-26</td></tr></tbody></table>`, "Bank of Tanzania official exchange-rate table");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bankName: "Bank of Tanzania", currencyPair: "USD/TZS", buyRate: 2598.42, sellRate: 2624.4, lendingRateAnnual: null, source: "Bank of Tanzania official exchange-rate table" });
  });

  it("normalizes the official DSE public daily summary without inventing volume or absolute change", () => {
    const rows = normalizeDseMarketHtml(`<!doctype html><table><thead><tr><th>Symbol</th><th>LTP</th><th>CHANGE(%)</th></tr></thead><tbody><tr><td>CRDB</td><td>2680</td><td>-0.37</td></tr></tbody></table>`, "DSE official public daily market summary");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ symbol: "CRDB", companyName: "CRDB", priceTzs: 2680, changeTzs: null, changePercent: -0.37, volume: null, source: "DSE official public daily market summary" });
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

  it("uses official BOT and DSE public pages when tenant credentials are absent", () => {
    expect(marketSource).toContain("OFFICIAL_BOT_EXCHANGE_URL");
    expect(marketSource).toContain("OFFICIAL_DSE_MARKET_URL");
    expect(marketSource).toContain("normalizeBotExchangeHtml");
    expect(marketSource).toContain("normalizeDseMarketHtml");
    expect(marketSource).toContain("lendingRateAnnual: null");
    expect(marketSource).toContain("volume: null");
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
