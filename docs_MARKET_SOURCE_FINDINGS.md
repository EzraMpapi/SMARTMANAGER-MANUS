# Verified BOT and DSE public source findings

## Research date
2026-08-19 (user timezone context: GMT+3).

## Bank of Tanzania (BOT)

Official page: https://www.bot.go.tz/ExchangeRate/excRates

The official BOT Exchange Rates page is publicly reachable without an API key and renders a tabular dataset with columns `Currency`, `Buying`, `Selling`, `Mean`, and `Transaction Date`. The page currently reports a live transaction date of 19-Aug-26 in the retrieved page and exposes export controls for CSV, Excel, and PDF in the browser UI. The content is HTML, not a documented JSON API. The ERP bank-rate model requires bank names, buy rate, sell rate, and lending rate, so the BOT table can safely supply exchange-rate rows but cannot truthfully supply bank-specific lending rates without an additional approved source. Any adapter must therefore map BOT rows to a clearly labelled BOT exchange-rate source and never invent lending rates.

## Dar es Salaam Stock Exchange (DSE)

Official page: https://dse.co.tz/market/data/overview
Official public JSON endpoint used by that page: https://dse.co.tz/get/gainers/losers

The official DSE market-data overview is publicly reachable and renders a daily summary table with `Symbol`, `LTP`, and `CHANGE(%)` values. The page’s own client-side code calls `https://dse.co.tz/get/gainers/losers`, which returns a public JSON envelope containing `company`, `price`, `change`, and `volume`. The retrieved page states Current Trading Date 2026-08-19 and displays a summary for Aug 18th 26. The public endpoint can safely supply ticker, last traded price, percentage change, and volume, and is labelled as the DSE official public daily market summary. Live/intraday and historical products remain separate DSE data services and are not inferred from this endpoint.

## Implementation boundary

These official public pages can support server-side HTML table adapters with source-labelled, timestamped records. They cannot provide a private API key, and they do not expose all fields required by the current strict provider models. The implementation should add explicit HTML adapters and relaxed field mapping for public official rows, preserving `AWAITING_CONFIGURATION` only for fields that genuinely require an approved credential or unavailable provider capability.

## References

[1]: https://www.bot.go.tz/ExchangeRate/excRates "Bank of Tanzania — Exchange Rates"
[2]: https://dse.co.tz/market/data/overview "Dar es Salaam Stock Exchange — Market Data Overview"
[4]: https://dse.co.tz/get/gainers/losers "DSE public gainers and losers JSON endpoint"
[3]: https://dse.co.tz/storage/extras/Data%20Vending%20Policy%20EN%201.2.pdf "DSE Data Vending Policy"
