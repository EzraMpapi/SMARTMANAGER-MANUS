import { and, asc, desc, eq, gte } from "drizzle-orm";
import { bankMarketRates, dseMarketTickers, marketProviderUptimeLogs } from "../drizzle/schema";
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
  lendingRateAnnual: number | null;
  status: MarketDataStatus;
  source: string;
  updatedAt: Date;
};

type DseTickerRow = {
  symbol: string;
  companyName: string;
  priceTzs: number;
  changeTzs: number | null;
  changePercent: number | null;
  volume: number | null;
  status: MarketDataStatus;
  source: string;
  updatedAt: Date;
};

const OFFICIAL_BOT_EXCHANGE_URL = "https://www.bot.go.tz/ExchangeRate/excRates";
const OFFICIAL_DSE_MARKET_URL = "https://dse.co.tz/get/gainers/losers";

const providerConfig = {
  bankUrl: process.env.MARKET_BANK_RATES_API_URL?.trim() || OFFICIAL_BOT_EXCHANGE_URL,
  bankKey: process.env.MARKET_BANK_RATES_API_KEY?.trim() || "",
  dseUrl: process.env.MARKET_DSE_API_URL?.trim() || OFFICIAL_DSE_MARKET_URL,
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

function parseUpdatedAt(value: unknown): Date {
  if (value === undefined || value === null || String(value).trim() === "") return new Date();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["data", "results", "rates", "tickers", "quotes", "items", "gainers_and_losers"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}

function htmlCellText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseHtmlTables(html: string): string[][][] {
  return Array.from(html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)).map((tableMatch) =>
    Array.from(tableMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((rowMatch) =>
      Array.from(rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cellMatch) => htmlCellText(cellMatch[1])),
    ).filter((cells) => cells.length > 0),
  );
}

export function normalizeBotExchangeHtml(html: string, source: string): BankRateRow[] {
  const table = parseHtmlTables(html).find((rows) => rows.some((row) => row.some((cell) => cell.toLowerCase() === "currency") && row.some((cell) => cell.toLowerCase() === "buying") && row.some((cell) => cell.toLowerCase() === "selling")));
  if (!table) return [];
  return table.flatMap((cells) => {
    if (cells.length < 6 || !/^[A-Z]{3}$/.test(cells[1])) return [];
    const buyRate = parseFiniteNumber(cells[2]);
    const sellRate = parseFiniteNumber(cells[3]);
    if (buyRate === null || sellRate === null) return [];
    const parsedDate = new Date(cells[5]);
    return [{ bankName: "Bank of Tanzania", currencyPair: `${cells[1]}/TZS`, buyRate, sellRate, lendingRateAnnual: null, status: "LIVE", source, updatedAt: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate }];
  });
}

export function normalizeDseMarketHtml(html: string, source: string): DseTickerRow[] {
  const table = parseHtmlTables(html).find((rows) => rows.some((row) => row.some((cell) => cell.toUpperCase() === "SYMBOL") && row.some((cell) => cell.toUpperCase().includes("LTP")) && row.some((cell) => cell.toUpperCase().includes("CHANGE"))));
  if (!table) return [];
  return table.flatMap((cells) => {
    if (cells.length < 3 || !/^[A-Z0-9][A-Z0-9-]*$/.test(cells[0])) return [];
    const priceTzs = parseFiniteNumber(cells[1]);
    const changePercent = parseFiniteNumber(cells[2]);
    if (priceTzs === null || priceTzs < 0) return [];
    return [{ symbol: cells[0], companyName: cells[0], priceTzs, changeTzs: null, changePercent, volume: null, status: "LIVE", source, updatedAt: new Date() }];
  });
}

async function fetchProviderText(url: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {}),
      },
    });
    if (!response.ok) throw new Error(`Provider responded with HTTP ${response.status}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
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
    if (!bankName || buyRate === null || sellRate === null) return [];
    return [{
      bankName,
      currencyPair: String(row.currencyPair ?? row.pair ?? "USD/TZS").trim() || "USD/TZS",
      buyRate,
      sellRate,
      lendingRateAnnual,
      status: row.status === "DELAYED" ? "DELAYED" : "LIVE",
      source,
      updatedAt: parseUpdatedAt(row.updatedAt ?? row.timestamp),
    }];
  });
}

export function normalizeDseRows(payload: unknown, source: string): DseTickerRow[] {
  return parseRows(payload).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const symbol = String(row.symbol ?? row.ticker ?? row.code ?? row.company ?? "").trim();
    const companyName = String(row.companyName ?? row.company ?? row.name ?? symbol).trim();
    const priceTzs = parseFiniteNumber(row.priceTzs ?? row.price ?? row.lastPrice ?? row.ltp);
    const explicitPercent = row.changePercent ?? row.percentChange ?? row.changePct;
    const changeTzs = parseFiniteNumber(row.changeTzs ?? row.priceChange ?? (explicitPercent !== undefined ? row.change : null));
    const changePercent = parseFiniteNumber(explicitPercent ?? row.change);
    const volume = parseFiniteNumber(row.volume ?? row.quantity);
    if (!symbol || priceTzs === null || priceTzs < 0) return [];
    return [{
      symbol,
      companyName,
      priceTzs,
      changeTzs,
      changePercent,
      volume: volume === null ? null : Math.max(0, Math.round(volume)),
      status: row.status === "DELAYED" ? "DELAYED" : "LIVE",
      source,
      updatedAt: parseUpdatedAt(row.updatedAt ?? row.timestamp),
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

  const bankUrl = providerSettings?.bankProviderUrl?.trim() || process.env.MARKET_BANK_RATES_API_URL?.trim() || OFFICIAL_BOT_EXCHANGE_URL;
  const bankKey = providerSettings?.bankProviderApiKey?.trim() || process.env.MARKET_BANK_RATES_API_KEY?.trim() || "";
  const dseUrl = providerSettings?.dseProviderUrl?.trim() || process.env.MARKET_DSE_API_URL?.trim() || OFFICIAL_DSE_MARKET_URL;
  const dseKey = providerSettings?.dseProviderApiKey?.trim() || process.env.MARKET_DSE_API_KEY?.trim() || "";

  const cachedBankRows = latestUnique(storedBankRows.map((row) => ({
    bankName: row.bankName,
    currencyPair: row.currencyPair,
    buyRate: Number(row.buyRate),
    sellRate: Number(row.sellRate),
    lendingRateAnnual: Number.isFinite(Number(row.lendingRateAnnual)) ? Number(row.lendingRateAnnual) : null,
    status: "CACHED" as const,
    source: row.source,
    updatedAt: row.updatedAt,
  })), (row) => `${row.bankName}:${row.currencyPair}`);
  const cachedDseRows = latestUnique(storedDseRows.map((row) => ({
    symbol: row.symbol,
    companyName: row.companyName,
    priceTzs: Number(row.priceTzs),
    changeTzs: Number.isFinite(Number(row.changeTzs)) ? Number(row.changeTzs) : null,
    changePercent: Number.isFinite(Number(row.changePercent)) ? Number(row.changePercent) : null,
    volume: row.volume === null ? null : Number(row.volume),
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
      const normalized = bankUrl === OFFICIAL_BOT_EXCHANGE_URL
        ? normalizeBotExchangeHtml(await fetchProviderText(bankUrl, bankKey), "Bank of Tanzania official exchange-rate table")
        : normalizeBankRows(await fetchProviderJson(bankUrl, bankKey), bankUrl);
      const latencyBank = Date.now() - t0Bank;
      if (normalized.length) {
        await db.insert(bankMarketRates).values(normalized.map((row) => ({ companyId, bankName: row.bankName, currencyPair: row.currencyPair, buyRate: String(row.buyRate), sellRate: String(row.sellRate), lendingRateAnnual: row.lendingRateAnnual === null ? "N/A" : String(row.lendingRateAnnual), status: row.status, source: row.source, updatedAt: row.updatedAt })));
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
      const normalized = normalizeDseRows(await fetchProviderJson(dseUrl, dseKey), dseUrl === OFFICIAL_DSE_MARKET_URL ? "DSE official public daily market summary" : dseUrl);
      const latencyDse = Date.now() - t0Dse;
      if (normalized.length) {
        await db.insert(dseMarketTickers).values(normalized.map((row) => ({ companyId, symbol: row.symbol, companyName: row.companyName, priceTzs: String(row.priceTzs), changeTzs: row.changeTzs === null ? null : String(row.changeTzs), changePercent: row.changePercent === null ? null : String(row.changePercent), volume: row.volume, status: row.status, updatedAt: row.updatedAt })));
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
