# Read-only exchange balance implementation notes

This feature is limited to authenticated account-read calls. It does not call endpoints that place or cancel orders, transfer funds, or withdraw assets.

| Provider | Read-only account endpoint | Required scope / authentication | Implementation note |
| --- | --- | --- | --- |
| Binance Spot | `GET /api/v3/account` | `USER_DATA`, signed HMAC-SHA-256 request and API-key header | Extract only non-zero `free` and `locked` currency amounts. |
| Coinbase Advanced Trade | `GET /api/v3/brokerage/accounts` | `view` permission and request-specific JWT | Coinbase key secret is a private key; preserve newlines during decrypt/JWT handling. Tokens expire after two minutes. |
| Kraken Spot | `POST /0/private/Balance` | `Funds: Query`, `API-Key` and `API-Sign` headers | The endpoint returns balances net of pending withdrawals. No funding endpoints are needed. |

References: [Binance Spot REST API](https://developers.binance.com/en/docs/products/spot/rest-api), [Coinbase Advanced Trade endpoints](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/rest-api), [Coinbase JWT authentication](https://docs.cdp.coinbase.com/get-started/authentication/jwt-authentication), [Kraken Get Account Balance](https://docs.kraken.com/api/docs/rest-api/get-account-balance/).

## Read-only USD valuation

USD valuation is a descriptive account-data enhancement, not a signal, recommendation, execution rule, or portfolio instruction. It uses a server-side CoinGecko Simple Price batch request with explicit `last_updated_at` metadata and does not pass exchange credentials to the price source. Stable assets explicitly mapped to USD (such as USD, USDT, USDC, and DAI) are assigned a 1.00 USD reference; all other unsupported or ambiguous asset identifiers remain unpriced rather than receiving a guessed value. The response must retain the priced asset count, unpriced asset identifiers, price-source label, quote timestamp, and retrieval timestamp so that the UI can distinguish a missing price from a zero balance.

The balance endpoint remains read-only: it may retrieve balances and public market prices, but it must not place or cancel orders, transfer funds, or withdraw assets. CoinGecko documents `include_last_updated_at=true` for price freshness and reports the value as a UNIX timestamp; its batch endpoint supports up to 515 IDs per request. Source: [CoinGecko Simple Price API](https://docs.coingecko.com/reference/simple-price).
