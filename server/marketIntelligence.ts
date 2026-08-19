import { and, desc, eq } from "drizzle-orm";
import { bankMarketRates, dseMarketTickers } from "../drizzle/schema";
import { getDb } from "./db";

export type MarketDataStatus = "LIVE" | "CACHED" | "DELAYED" | "UNAVAILABLE" | "AWAITING_CONFIGURATION";

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

export async function getMarketIntelligenceSnapshot(companyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Market intelligence database is unavailable.");

  const [storedBankRows, storedDseRows] = await Promise.all([
    db.select().from(bankMarketRates).where(eq(bankMarketRates.companyId, companyId)).orderBy(desc(bankMarketRates.updatedAt)).limit(500),
    db.select().from(dseMarketTickers).where(eq(dseMarketTickers.companyId, companyId)).orderBy(desc(dseMarketTickers.updatedAt)).limit(500),
  ]);

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
  let bankMessage = statusMessage(bankStatus, Boolean(providerConfig.bankUrl), "Bank rates");
  let dseMessage = statusMessage(dseStatus, Boolean(providerConfig.dseUrl), "DSE market");

  if (providerConfig.bankUrl) {
    try {
      const normalized = normalizeBankRows(await fetchProviderJson(providerConfig.bankUrl, providerConfig.bankKey), providerConfig.bankUrl);
      if (normalized.length) {
        await db.insert(bankMarketRates).values(normalized.map((row) => ({ companyId, bankName: row.bankName, currencyPair: row.currencyPair, buyRate: String(row.buyRate), sellRate: String(row.sellRate), lendingRateAnnual: String(row.lendingRateAnnual), status: row.status, source: row.source, updatedAt: row.updatedAt })));
        bankRows = latestUnique(normalized, (row) => `${row.bankName}:${row.currencyPair}`);
        bankStatus = normalized.some((row) => row.status === "DELAYED") ? "DELAYED" : "LIVE";
        bankMessage = statusMessage(bankStatus, true, "Bank rates");
      }
    } catch (error) {
      bankMessage = `${statusMessage(bankStatus, true, "Bank rates")} Provider request failed safely.`;
    }
  } else if (!cachedBankRows.length) {
    bankStatus = "AWAITING_CONFIGURATION";
    bankMessage = statusMessage(bankStatus, false, "Bank rates");
  }

  if (providerConfig.dseUrl) {
    try {
      const normalized = normalizeDseRows(await fetchProviderJson(providerConfig.dseUrl, providerConfig.dseKey), providerConfig.dseUrl);
      if (normalized.length) {
        await db.insert(dseMarketTickers).values(normalized.map((row) => ({ companyId, symbol: row.symbol, companyName: row.companyName, priceTzs: String(row.priceTzs), changeTzs: String(row.changeTzs), changePercent: String(row.changePercent), volume: row.volume, status: row.status, updatedAt: row.updatedAt })));
        dseRows = latestUnique(normalized, (row) => row.symbol);
        dseStatus = normalized.some((row) => row.status === "DELAYED") ? "DELAYED" : "LIVE";
        dseMessage = statusMessage(dseStatus, true, "DSE market");
      }
    } catch (error) {
      dseMessage = `${statusMessage(dseStatus, true, "DSE market")} Provider request failed safely.`;
    }
  } else if (!cachedDseRows.length) {
    dseStatus = "AWAITING_CONFIGURATION";
    dseMessage = statusMessage(dseStatus, false, "DSE market");
  }

  return {
    asOf: new Date().toISOString(),
    bankRates: { status: bankStatus, message: bankMessage, providerConfigured: Boolean(providerConfig.bankUrl), rows: bankRows },
    dse: { status: dseStatus, message: dseMessage, providerConfigured: Boolean(providerConfig.dseUrl), rows: dseRows },
  };
}

export const marketIntelligenceConfig = {
  bankProviderConfigured: Boolean(providerConfig.bankUrl),
  dseProviderConfigured: Boolean(providerConfig.dseUrl),
};
