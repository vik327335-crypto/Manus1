# Reliability UI Visual Check

## 2026-08-25

The routed `/performance-monitoring` desktop view was checked at 1280 × 720 after provider health integration. The screen renders a compact horizontal section with distinct cards for Polygon OHLCV primary, CoinGecko quote primary, Coinbase Exchange read-only reserve, and the immutable OHLCV audit trail. The BTC cross-check is shown separately beneath the cards.

When a provider response has not yet been verified, the UI renders em dashes and an explicit unavailable/loading disclosure rather than a synthetic quote, fabricated freshness value, or inferred health state. The card labels remain source-specific during initial loading.
