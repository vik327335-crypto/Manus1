# Read-only exchange balance implementation notes

This feature is limited to authenticated account-read calls. It does not call endpoints that place or cancel orders, transfer funds, or withdraw assets.

| Provider | Read-only account endpoint | Required scope / authentication | Implementation note |
| --- | --- | --- | --- |
| Binance Spot | `GET /api/v3/account` | `USER_DATA`, signed HMAC-SHA-256 request and API-key header | Extract only non-zero `free` and `locked` currency amounts. |
| Coinbase Advanced Trade | `GET /api/v3/brokerage/accounts` | `view` permission and request-specific JWT | Coinbase key secret is a private key; preserve newlines during decrypt/JWT handling. Tokens expire after two minutes. |
| Kraken Spot | `POST /0/private/Balance` | `Funds: Query`, `API-Key` and `API-Sign` headers | The endpoint returns balances net of pending withdrawals. No funding endpoints are needed. |

References: [Binance Spot REST API](https://developers.binance.com/en/docs/products/spot/rest-api), [Coinbase Advanced Trade endpoints](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/rest-api), [Coinbase JWT authentication](https://docs.cdp.coinbase.com/get-started/authentication/jwt-authentication), [Kraken Get Account Balance](https://docs.kraken.com/api/docs/rest-api/get-account-balance/).
