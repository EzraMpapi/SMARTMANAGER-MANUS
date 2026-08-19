import { and, desc, eq } from "drizzle-orm";
import { bankMarketRates, dseMarketTickers } from "../drizzle/schema";
import { getDb } from "./db";

export type MarketDataStatus = "LIVE" | "CACHED" | "DELAYED" | "UNAVAILABLE" | "AWAITING_CONFIGURATION";
export type MarketProviderUiStatus = "LIVE" | "STALE" | "OUTAGE" | "AWAITING_CONFIGURATION";

export function deriveMarketProviderUiStatus(input: { status: MarketDataStatus; providerConfigured: boolean; hasRows: boolean; hasOutage: boolean }): MarketProviderUiStatus {
  if (!input.providerConfigured) return "AWAITING_CONFIGURATION";
  if (input.hasOutage || input.status === "UNAVAILABLE") return "OUTAGE";
  if (input.status === "DELAYED" || input.status === "CACHED") return "STALE";
  return input.hasRows ? "LIVE" : "OUTAGE";
}

type BankRateRow = {
  bankName: string;
  currencyPair: string;
  buyRate: number;
  sellRate: number;
  lendingRateAnnual: number;
  status: MarketDataStatus;
  source: string;
  updatedAt: Date;
};

type DseTickerRow = {
  symbol: string;
  companyName: string;
  priceTzs: number;
  changeTzs: number;
  changePercent: number;
  volume: number;
  status: MarketDataStatus;
  source: string;
  updatedAt: Date;
};

const providerConfig = {
  bankUrl: process.env.MARKET_BANK_RATES_API_URL?.trim() || "",
  bankKey: process.env.MARKET_BANK_RATES_API_KEY?.trim() || "",
  dseUrl: process.env.MARKET_DSE_API_URL?.trim() || "",
  dseKey: process.env.MARKET_DSE_API_KEY?.trim() || "",
};

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["data", "results", "rates", "tickers", "quotes", "items"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

async function fetchProviderJson(url: string, apiKey: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {}),
      },
    });
    if (!response.ok) throw new Error(`Provider responded with HTTP ${response.status}.`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeBankRows(payload: unknown, source: string): BankRateRow[] {
  return parseRows(payload).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const buyRate = parseFiniteNumber(row.buyRate ?? row.buy ?? row.buying ?? row.bid);
    const sellRate = parseFiniteNumber(row.sellRate ?? row.sell ?? row.selling ?? row.ask);
    const lendingRateAnnual = parseFiniteNumber(row.lendingRateAnnual ?? row.lendingRate ?? row.interestRate ?? row.rate);
    const bankName = String(row.bankName ?? row.bank ?? row.institution ?? "").trim();
    if (!bankName || buyRate === null || sellRate === null || lendingRateAnnual === null) return [];
    return [{
      bankName,
      currencyPair: String(row.currencyPair ?? row.pair ?? "USD/TZS").trim() || "USD/TZS",
      buyRate,
      sellRate,
      lendingRateAnnual,
      status: row.status === "DELAYED" ? "DELAYED" : "LIVE",
      source,
      updatedAt: new Date(String(row.updatedAt ?? row.timestamp ?? Date.now())),
    }];
  });
}

export function normalizeDseRows(payload: unknown, source: string): DseTickerRow[] {
  return parseRows(payload).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const symbol = String(row.symbol ?? row.ticker ?? row.code ?? "").trim();
    const companyName = String(row.companyName ?? row.company ?? row.name ?? symbol).trim();
    const priceTzs = parseFiniteNumber(row.priceTzs ?? row.price ?? row.lastPrice ?? row.ltp);
    const changeTzs = parseFiniteNumber(row.changeTzs ?? row.change ?? row.priceChange) ?? 0;
    const changePercent = parseFiniteNumber(row.changePercent ?? row.percentChange ?? row.changePct) ?? 0;
    const volume = parseFiniteNumber(row.volume ?? row.quantity) ?? 0;
    if (!symbol || priceTzs === null || priceTzs < 0 || !Number.isFinite(changeTzs) || !Number.isFinite(changePercent)) return [];
    return [{
      symbol,
      companyName,
      priceTzs,
      changeTzs,
      changePercent,
      volume: Math.max(0, Math.round(volume)),
      status: row.status === "DELAYED" ? "DELAYED" : "LIVE",
      source,
      updatedAt: new Date(String(row.updatedAt ?? row.timestamp ?? Date.now())),
    }];
  });
}

function latestUnique<T extends { updatedAt: Date; status: MarketDataStatus }>(rows: T[], key: (row: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    const prior = byKey.get(key(row));
    if (!prior || row.updatedAt.getTime() > prior.updatedAt.getTime()) byKey.set(key(row), row);
  }
  return Array.from(byKey.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

function statusMessage(status: MarketDataStatus, providerConfigured: boolean, label: string) {
  if (status === "LIVE") return `${label} provider data validated and current.`;
  if (status === "DELAYED") return `${label} provider returned delayed market data.`;
  if (status === "CACHED") return `Showing the most recent validated ${label.toLowerCase()} data from storage.`;
  if (!providerConfigured) return `${label} provider is not configured. Add a server-side provider URL and credential to activate this feed.`;
  return `${label} provider is unavailable or returned no valid records.`;
}

import { getMarketProviderSettings, recordMarketUptimeAndIncidents } from "./marketGovernance";

export async function getMarketIntelligenceSnapshot(companyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Market intelligence database is unavailable.");

  const [storedBankRows, storedDseRows, providerSettings] = await Promise.all([
    db.select().from(bankMarketRates).where(eq(bankMarketRates.companyId, companyId)).orderBy(desc(bankMarketRates.updatedAt)).limit(500),
    db.select().from(dseMarketTickers).where(eq(dseMarketTickers.companyId, companyId)).orderBy(desc(dseMarketTickers.updatedAt)).limit(500),
    getMarketProviderSettings(companyId),
  ]);

  const bankUrl = providerSettings?.bankProviderUrl?.trim() || process.env.MARKET_BANK_RATES_API_URL?.trim() || "";
  const bankKey = providerSettings?.bankProviderApiKey?.trim() || process.env.MARKET_BANK_RATES_API_KEY?.trim() || "";
  const dseUrl = providerSettings?.dseProviderUrl?.trim() || process.env.MARKET_DSE_API_URL?.trim() || "";
  const dseKey = providerSettings?.dseProviderApiKey?.trim() || process.env.MARKET_DSE_API_KEY?.trim() || "";

  const cachedBankRows = latestUnique(storedBankRows.map((row) => ({
    bankName: row.bankName,
    currencyPair: row.currencyPair,
    buyRate: Number(row.buyRate),
    sellRate: Number(row.sellRate),
    lendingRateAnnual: Number(row.lendingRateAnnual),
    status: "CACHED" as const,
    source: row.source,
    updatedAt: row.updatedAt,
  })), (row) => `${row.bankName}:${row.currencyPair}`);
  const cachedDseRows = latestUnique(storedDseRows.map((row) => ({
    symbol: row.symbol,
    companyName: row.companyName,
    priceTzs: Number(row.priceTzs),
    changeTzs: Number(row.changeTzs),
    changePercent: Number(row.changePercent),
    volume: row.volume,
    status: "CACHED" as const,
    source: "DSE provider cache",
    updatedAt: row.updatedAt,
  })), (row) => row.symbol);

  let bankRows: BankRateRow[] = cachedBankRows;
  let dseRows: DseTickerRow[] = cachedDseRows;
  let bankStatus: MarketDataStatus = cachedBankRows.length ? "CACHED" : "UNAVAILABLE";
  let dseStatus: MarketDataStatus = cachedDseRows.length ? "CACHED" : "UNAVAILABLE";
  let bankMessage = statusMessage(bankStatus, Boolean(bankUrl), "Bank rates");
  let dseMessage = statusMessage(dseStatus, Boolean(dseUrl), "DSE market");
  let bankOutage: string | null = null;
  let dseOutage: string | null = null;
  const t0Bank = Date.now();

  if (bankUrl) {
    try {
      const normalized = normalizeBankRows(await fetchProviderJson(bankUrl, bankKey), bankUrl);
      const latencyBank = Date.now() - t0Bank;
      if (normalized.length) {
        await db.insert(bankMarketRates).values(normalized.map((row) => ({ companyId, bankName: row.bankName, currencyPair: row.currencyPair, buyRate: String(row.buyRate), sellRate: String(row.sellRate), lendingRateAnnual: String(row.lendingRateAnnual), status: row.status, source: row.source, updatedAt: row.updatedAt })));
        bankRows = latestUnique(normalized, (row) => `${row.bankName}:${row.currencyPair}`);
        bankStatus = normalized.some((row) => row.status === "DELAYED") ? "DELAYED" : "LIVE";
        bankMessage = statusMessage(bankStatus, true, "Bank rates");
        await recordMarketUptimeAndIncidents(companyId, "bank", bankStatus, latencyBank, 200);
      } else {
        bankOutage = "The configured bank-rate provider returned no validated records.";
        bankStatus = "UNAVAILABLE";
        bankMessage = `${statusMessage(bankStatus, true, "Bank rates")} Provider response was empty or invalid.`;
        await recordMarketUptimeAndIncidents(companyId, "bank", "OUTAGE", latencyBank, 200, "Empty or invalid response");
      }
    } catch (error) {
      const latencyBank = Date.now() - t0Bank;
      bankOutage = error instanceof Error ? error.message : "The configured bank-rate provider could not be reached.";
      bankStatus = "UNAVAILABLE";
      bankMessage = `${statusMessage(bankStatus, true, "Bank rates")} Provider request failed safely.`;
      await recordMarketUptimeAndIncidents(companyId, "bank", "OUTAGE", latencyBank, 502, bankOutage);
    }
  } else if (!cachedBankRows.length) {
    bankStatus = "AWAITING_CONFIGURATION";
    bankMessage = statusMessage(bankStatus, false, "Bank rates");
  }

  const t0Dse = Date.now();
  if (dseUrl) {
    try {
      const normalized = normalizeDseRows(await fetchProviderJson(dseUrl, dseKey), dseUrl);
      const latencyDse = Date.now() - t0Dse;
      if (normalized.length) {
        await db.insert(dseMarketTickers).values(normalized.map((row) => ({ companyId, symbol: row.symbol, companyName: row.companyName, priceTzs: String(row.priceTzs), changeTzs: String(row.changeTzs), changePercent: String(row.changePercent), volume: row.volume, status: row.status, updatedAt: row.updatedAt })));
        dseRows = latestUnique(normalized, (row) => row.symbol);
        dseStatus = normalized.some((row) => row.status === "DELAYED") ? "DELAYED" : "LIVE";
        dseMessage = statusMessage(dseStatus, true, "DSE market");
        await recordMarketUptimeAndIncidents(companyId, "dse", dseStatus, latencyDse, 200);
      } else {
        dseOutage = "The configured DSE provider returned no validated records.";
        dseStatus = "UNAVAILABLE";
        dseMessage = `${statusMessage(dseStatus, true, "DSE market")} Provider response was empty or invalid.`;
        await recordMarketUptimeAndIncidents(companyId, "dse", "OUTAGE", latencyDse, 200, "Empty or invalid response");
      }
    } catch (error) {
      const latencyDse = Date.now() - t0Dse;
      dseOutage = error instanceof Error ? error.message : "The configured DSE provider could not be reached.";
      dseStatus = "UNAVAILABLE";
      dseMessage = `${statusMessage(dseStatus, true, "DSE market")} Provider request failed safely.`;
      await recordMarketUptimeAndIncidents(companyId, "dse", "OUTAGE", latencyDse, 502, dseOutage);
    }
  } else if (!cachedDseRows.length) {
    dseStatus = "AWAITING_CONFIGURATION";
    dseMessage = statusMessage(dseStatus, false, "DSE market");
  }

  const latencyBank = Date.now() - t0Bank;
  const latencyDse = Date.now() - t0Dse;

  const now = Date.now();
  const dayAgo = new Date(now - 24 * 3600_000);
  const recentLogs = await db.select().from(marketProviderUptimeLogs).where(and(eq(marketProviderUptimeLogs.companyId, companyId), gte(marketProviderUptimeLogs.checkedAt, dayAgo))).orderBy(asc(marketProviderUptimeLogs.checkedAt));

  const bankLogs = recentLogs.filter((l) => l.providerType === "bank");
  const dseLogs = recentLogs.filter((l) => l.providerType === "dse");

  const calcUptime = (logs: typeof recentLogs) => {
    if (!logs.length) return 100;
    const successes = logs.filter((l) => l.status === "LIVE" || l.status === "CACHED" || l.status === "DELAYED");
    return Math.round((successes.length / logs.length) * 100);
  };

  const bankSparkline = bankLogs.map((l) => ({ time: new Date(l.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), latency: l.latencyMs, status: l.status }));
  const dseSparkline = dseLogs.map((l) => ({ time: new Date(l.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), latency: l.latencyMs, status: l.status }));

  const regionalPeers = [
    {
      country: "Tanzania",
      centralBank: "Bank of Tanzania (BOT)",
      currencyPair: "USD/TZS",
      policyRateAnnual: null,
      benchmarkLending: null,
      status: bankUrl && bankKey ? bankStatus : "AWAITING_CONFIGURATION",
      source: bankUrl && bankKey ? "BOT provider configured; benchmark mapping pending validation" : "Approved BOT credentials required",
      providerConfigured: Boolean(bankUrl && bankKey),
    },
    {
      country: "Kenya",
      centralBank: "Central Bank of Kenya (CBK)",
      currencyPair: "USD/KES",
      policyRateAnnual: null,
      benchmarkLending: null,
      status: providerSettings?.cbkProviderUrl && providerSettings?.cbkProviderApiKey ? "AWAITING_VALIDATION" : "AWAITING_CONFIGURATION",
      source: providerSettings?.cbkProviderUrl ? "CBK endpoint configured (https://www.centralbank.go.ke/rates/)" : "Awaiting official CBK endpoint / credentials",
      providerConfigured: Boolean(providerSettings?.cbkProviderUrl && providerSettings?.cbkProviderApiKey),
    },
    {
      country: "Uganda",
      centralBank: "Bank of Uganda (BOU)",
      currencyPair: "USD/UGX",
      policyRateAnnual: null,
      benchmarkLending: null,
      status: providerSettings?.bouProviderUrl && providerSettings?.bouProviderApiKey ? "AWAITING_VALIDATION" : "AWAITING_CONFIGURATION",
      source: "Approved BOU provider credentials required",
      providerConfigured: Boolean(providerSettings?.bouProviderUrl && providerSettings?.bouProviderApiKey),
    },
    {
      country: "Rwanda",
      centralBank: "National Bank of Rwanda (BNR)",
      currencyPair: "USD/RWF",
      policyRateAnnual: null,
      benchmarkLending: null,
      status: providerSettings?.bnrProviderUrl && providerSettings?.bnrProviderApiKey ? "AWAITING_VALIDATION" : "AWAITING_CONFIGURATION",
      source: providerSettings?.bnrProviderUrl ? "BNR endpoint configured (https://fxrates.bnr.rw/)" : "Awaiting official BNR endpoint / credentials",
      providerConfigured: Boolean(providerSettings?.bnrProviderUrl && providerSettings?.bnrProviderApiKey),
    },
  ];

  return {
    asOf: new Date().toISOString(),
    refreshIntervalSeconds: providerSettings?.refreshIntervalSeconds ?? 60,
    scheduleWeeklyEmail: providerSettings?.scheduleWeeklyEmail ?? false,
    latencyThresholdMs: providerSettings?.latencyThresholdMs ?? 1500,
    regionalPeers,
    bankRates: {
      status: bankStatus,
      uiStatus: deriveMarketProviderUiStatus({ status: bankStatus, providerConfigured: Boolean(bankUrl), hasRows: bankRows.length > 0, hasOutage: Boolean(bankOutage) }),
      message: bankMessage,
      providerConfigured: Boolean(bankUrl),
      latencyMs: latencyBank,
      uptimePercent: calcUptime(bankLogs),
      latencySparkline: bankSparkline,
      outage: bankOutage ? { severity: "OUTAGE" as const, message: bankOutage } : null,
      rows: bankRows,
    },
    dse: {
      status: dseStatus,
      uiStatus: deriveMarketProviderUiStatus({ status: dseStatus, providerConfigured: Boolean(dseUrl), hasRows: dseRows.length > 0, hasOutage: Boolean(dseOutage) }),
      message: dseMessage,
      providerConfigured: Boolean(dseUrl),
      latencyMs: latencyDse,
      uptimePercent: calcUptime(dseLogs),
      latencySparkline: dseSparkline,
      outage: dseOutage ? { severity: "OUTAGE" as const, message: dseOutage } : null,
      rows: dseRows,
    },
  };
}

export const marketIntelligenceConfig = {
  bankProviderConfigured: Boolean(providerConfig.bankUrl),
  dseProviderConfigured: Boolean(providerConfig.dseUrl),
};
