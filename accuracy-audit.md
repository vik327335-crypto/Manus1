# Accuracy Safeguards Audit

The verified market-data path now accepts only finite provider values with a positive price. It publishes the provider, original fetch time, and cache age; unavailable or malformed values are omitted rather than converted into zeroes.

The batch quote path makes one CoinGecko request for uncached symbols and uses a 60-second cache. The scanner skips assets without a verified quote. Market-trend API responses now use an explicit `available: false` contract instead of synthetic neutral values, and CoinGecko's unavailable Fear & Greed value remains `null`.

The main ticker is labelled as verified provider-backed data. Dashboard and asset-detail research previews explicitly state that static example values are not live market readings; the static asset-detail export action is disabled.

## Routed residual audit

The routed financial, performance, portfolio, paper-trading, social-copying, DeFi, NFT, strategy-comparison, and allocation pages now either use an explicitly verified provider-backed contract with source and freshness information, or withhold the value behind a research-only unavailable state. The routed Scanner retains its provider-backed quote path; it suppresses assets without a verified quote rather than replacing them with a static value.

The remaining explicit `mock*` or random-data identifiers found in page source are intentionally outside the current financial-routing boundary: `AdminDashboard`, `AlertManager`, `AssetDetail`, `HistoricalDataAnalysis`, `PortfolioComparison`, `ReportGenerator`, `SocialTradingHub`, and `Strategies` are not imported by the route map. `LearningHub` is routed but its static tutorial and quest content is educational UI content, not market, portfolio, trade-performance, rating, or customer-review data. `DayTradingPositions` still contains domain-field names such as `currentPrice`, but its routed UI is already guarded by the unavailable-position policy and does not seed or update a synthetic position.

Any future route registration for a static/mock page must first replace synthetic financial, social-proof, portfolio, trade, rating, or performance claims with a source contract that declares provenance, timestamp, freshness, scope, methodology, and availability. The route-boundary test enforces that the known static/mock financial pages remain absent from `App.tsx` route imports while the verified Scanner route remains present.

## Historical OHLCV reliability

Historical crypto OHLCV is now provider-backed by Polygon/Massive custom crypto aggregate bars. The contract requests `X:{ticker}USD` bars over a declared UTC date window and returns the provider, fetched timestamp, cache age, requested timeframe, and actual coverage boundaries. Polygon documents the endpoint as `GET /v2/aggs/ticker/{cryptoTicker}/range/{multiplier}/{timespan}/{from}/{to}` and states that bars are UTC aggregates derived from qualifying trades; intervals without qualifying trades remain absent rather than being synthesized. Source: https://polygon.io/docs/rest/crypto/aggregates/custom-bars

The service permits at most one rate-limit retry and honours a numeric or date-form `Retry-After` value when supplied. It records last attempt, last success, last failure, HTTP status, consecutive failures, rate-limit event count, last rate-limit time, retry delay, and provider freshness age through `historicalData.getProviderHealth`. Provider errors, malformed bars, missing configuration, timeout, no-data, and persistent HTTP 429 return an explicit `unavailable` result with no generated candles, prices, indicators, or exports. The auditable provider history is presently bounded to two years, matching the documented two-year history of the Currencies Basic plan; requests outside that scope are not silently filled.

## Quote cross-check and audit trail

The primary CoinGecko USD quote is cross-checked, but never replaced, by the public Coinbase Exchange `GET /products/{product_id}/ticker` market-data endpoint. Coinbase documents that the endpoint returns the latest trade price, best bid and ask, and a provider timestamp; its OpenAPI contract declares the ticker endpoint as unauthenticated market data. The reserve adapter therefore makes no account, wallet, signing, transfer, order, cancellation, or execution request.[1]

The cross-check returns an explicit `matched`, `divergent`, or `unavailable` verdict together with both source labels, source timestamps, cache ages, and a divergence measurement in basis points. The configured monitoring threshold is 150 bps. A reserve result can raise a visible data-quality warning but is never a failover quote and cannot silently overwrite CoinGecko’s primary value. CoinGecko and Coinbase health telemetry separately records attempt/success/failure timestamps, HTTP status, consecutive failures, HTTP 429 count, retry-after metadata, and freshness age.

An administrator can invoke the protected `captureAuditSnapshot` procedure to persist a fresh available Polygon OHLCV response when it is non-cached and declares UTC request and coverage bounds. Public historical reads do not cause a database write. The stored metadata includes provider, requested interval, coverage interval, provider fetch time, number of bars, canonical bars, and a SHA-256 response hash. The hash is unique, so a repeated verified response is deduplicated without an update or delete path. If audit storage is unavailable, the verified provider response remains available while snapshot persistence is explicitly reported as unavailable; no historical bars are fabricated.

The protected audit listing exposes metadata and integrity hashes for review, while the administrative monitoring screen provides a compact status of primary/reserve health, current BTC USD cross-check verdict, rate-limit events, and audit snapshot storage/count. The data surface is research-only and contains no trading action.

## References

[1]: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker "Coinbase Exchange API: Get product ticker"
