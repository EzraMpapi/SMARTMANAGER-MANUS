# Smart Manager ERP — Market Intelligence & Bank Rates Architecture Specification

**Author:** Principal ERP Architecture & Integration Team  
**Date:** August 19, 2026  
**Target:** Production Autoscale / Managed Preview  

---

## 1. Overview & Objectives

In accordance with product requirements, this specification establishes the secure backend architecture, database schema, caching strategy, and dashboard UI for Dar es Salaam Stock Exchange (DSE) market data and commercial bank lending/exchange rates within Smart Manager ERP.

Strict adherence to anti-fabrication rules requires that when live API keys (e.g., BOT / DSE provider endpoints) are not configured, the system displays truthful status indicators (`UNAVAILABLE` / `AWAITING CONFIGURATION`) with complete configuration management, rather than fabricating fake financial rates or stock prices.

---

## 2. Database Schema (`drizzle/schema.ts`)

We introduce two dedicated tenant-scoped tables:
1. `bank_market_rates`: Stores commercial bank lending, buying, and selling exchange rates with freshness timestamps and source metadata.
2. `dse_market_tickers`: Stores DSE equity symbols, prices, price changes, percentage shifts, and market status.

---

## 3. Data Flow & Security

- **Backend Service:** Server-side fetchers query external exchange/DSE endpoints through secured server environments (`server/marketIntelligence.ts`).
- **tRPC Router:** Exposed via tenant-scoped protected procedures (`marketIntelligenceRouter.ts`).
- **UI Widgets:** Rendered in the main executive dashboard with freshness badges (`LIVE`, `CACHED`, `UNAVAILABLE`) and interactive detail modals.
