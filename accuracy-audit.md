# Accuracy Safeguards Audit

The verified market-data path now accepts only finite provider values with a positive price. It publishes the provider, original fetch time, and cache age; unavailable or malformed values are omitted rather than converted into zeroes.

The batch quote path makes one CoinGecko request for uncached symbols and uses a 60-second cache. The scanner skips assets without a verified quote. Market-trend API responses now use an explicit `available: false` contract instead of synthetic neutral values, and CoinGecko's unavailable Fear & Greed value remains `null`.

The main ticker is labelled as verified provider-backed data. Dashboard and asset-detail research previews explicitly state that static example values are not live market readings; the static asset-detail export action is disabled.
