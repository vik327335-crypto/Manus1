# Accuracy Safeguards Audit

The verified market-data path now accepts only finite provider values with a positive price. It publishes the provider, original fetch time, and cache age; unavailable or malformed values are omitted rather than converted into zeroes.

The batch quote path makes one CoinGecko request for uncached symbols and uses a 60-second cache. The scanner skips assets without a verified quote. Market-trend API responses now use an explicit `available: false` contract instead of synthetic neutral values, and CoinGecko's unavailable Fear & Greed value remains `null`.

The main ticker is labelled as verified provider-backed data. Dashboard and asset-detail research previews explicitly state that static example values are not live market readings; the static asset-detail export action is disabled.

## Routed residual audit

The routed financial, performance, portfolio, paper-trading, social-copying, DeFi, NFT, strategy-comparison, and allocation pages now either use an explicitly verified provider-backed contract with source and freshness information, or withhold the value behind a research-only unavailable state. The routed Scanner retains its provider-backed quote path; it suppresses assets without a verified quote rather than replacing them with a static value.

The remaining explicit `mock*` or random-data identifiers found in page source are intentionally outside the current financial-routing boundary: `AdminDashboard`, `AlertManager`, `AssetDetail`, `HistoricalDataAnalysis`, `PortfolioComparison`, `ReportGenerator`, `SocialTradingHub`, and `Strategies` are not imported by the route map. `LearningHub` is routed but its static tutorial and quest content is educational UI content, not market, portfolio, trade-performance, rating, or customer-review data. `DayTradingPositions` still contains domain-field names such as `currentPrice`, but its routed UI is already guarded by the unavailable-position policy and does not seed or update a synthetic position.

Any future route registration for a static/mock page must first replace synthetic financial, social-proof, portfolio, trade, rating, or performance claims with a source contract that declares provenance, timestamp, freshness, scope, methodology, and availability. The route-boundary test enforces that the known static/mock financial pages remain absent from `App.tsx` route imports while the verified Scanner route remains present.
