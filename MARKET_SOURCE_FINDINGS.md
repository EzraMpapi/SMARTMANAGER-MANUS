# Verified Market Data Source Findings

**Date:** August 19, 2026

## Bank of Tanzania

The official Bank of Tanzania website exposes an Indicative Exchange Rates section with a transaction date and buying/selling tables for USD, EUR, GBP, KES, UGX, RWF, ZAR, and other currencies. The same homepage exposes selected economic indicators, including the central bank rate and re-discount rate. The source is public and official, but no documented public JSON API was identified in the page content; the production integration therefore needs a server-side adapter configured to the approved BOT endpoint or a licensed provider, with HTML scraping prohibited unless explicitly approved and robustly validated.

Verified source: https://www.bot.go.tz/  
Verified sections: Indicative Exchange Rates, Selected Economic Indicators, Financial Markets.

## Dar es Salaam Stock Exchange

The official DSE Market Data page states that live, intra-day, delayed, end-of-day, historical, reference, index, equity, and bond data products exist. It identifies a 15-minute delayed classification for delayed feeds and describes direct data-center and distributor delivery channels. The page includes an official summary table for the trading date shown on the page, including symbols, last traded prices, and percentage changes. The source presents market data products rather than an openly documented public API in the page content, so production use requires an approved DSE distributor/feed or an authorized endpoint configured server-side.

Verified source: https://dse.co.tz/market/data/overview  
Verified sections: Market Data, Equities, Bond, Summary of Aug 18th 26, Gainers and Losers.

## Implementation Decision

The ERP will expose provider configuration and truthful `UNAVAILABLE` / `AWAITING CONFIGURATION` states by default. It will not seed or hardcode financial rows from the public HTML pages. The database tables will store provider-fetched records only after a server-side adapter validates the response and records source and freshness metadata.
