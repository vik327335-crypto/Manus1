const COINGECKO_SIMPLE_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const CACHE_TTL_MS = 60_000;

export type UsdPriceQuote = {
  asset: string;
  usdPrice: number;
  source: "coingecko" | "stablecoin_parity";
  quotedAt: Date;
};

export type UsdQuoteResult = {
  quotes: Record<string, UsdPriceQuote>;
  unpricedAssets: string[];
  retrievedAt: Date;
};

export type NativeBalanceForValuation = { asset: string; available: string; held: string };
export type UsdValuedBalance = NativeBalanceForValuation & {
  normalizedAsset: string;
  usdPrice: number | null;
  usdValue: number | null;
  priceSource: UsdPriceQuote["source"] | null;
  priceQuotedAt: Date | null;
};

type CachedQuoteResult = { expiresAt: number; result: UsdQuoteResult };
type SimplePricePayload = Record<string, { usd?: number; last_updated_at?: number }>;

const cachedQuoteResults = new Map<string, CachedQuoteResult>();

const ASSET_ALIASES: Record<string, string> = {
  XBT: "BTC",
  XXBT: "BTC",
  XETH: "ETH",
  ZUSD: "USD",
  ZEUR: "EUR",
};

const STABLE_USD_ASSETS = new Set(["USD", "USDT", "USDC", "DAI"]);

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  POL: "polygon-ecosystem-token",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  BNB: "binancecoin",
  ATOM: "cosmos",
  UNI: "uniswap",
  AAVE: "aave",
  NEAR: "near",
};

export function normalizeExchangeAsset(asset: string) {
  const upper = asset.trim().toUpperCase();
  return ASSET_ALIASES[upper] ?? upper;
}

function createStableQuote(asset: string, retrievedAt: Date): UsdPriceQuote {
  return { asset, usdPrice: 1, source: "stablecoin_parity", quotedAt: retrievedAt };
}

async function fetchCoinGeckoQuotes(ids: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const query = new URLSearchParams({ ids: ids.join(","), vs_currencies: "usd", include_last_updated_at: "true", precision: "full" });
    const response = await fetch(`${COINGECKO_SIMPLE_PRICE_URL}?${query.toString()}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`CoinGecko price request failed with HTTP ${response.status}`);
    return response.json() as Promise<SimplePricePayload>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getUsdPriceQuotes(assets: string[]): Promise<UsdQuoteResult> {
  const normalizedAssets = Array.from(new Set(assets.map(normalizeExchangeAsset).filter(Boolean))).sort();
  const cacheKey = normalizedAssets.join(",");
  const cached = cachedQuoteResults.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const retrievedAt = new Date();
  const quotes: Record<string, UsdPriceQuote> = {};
  const assetsForCoinGecko = normalizedAssets.filter((asset) => !STABLE_USD_ASSETS.has(asset) && COINGECKO_IDS[asset]);
  const idToAssets = new Map<string, string[]>();
  for (const asset of assetsForCoinGecko) {
    const id = COINGECKO_IDS[asset];
    idToAssets.set(id, [...(idToAssets.get(id) ?? []), asset]);
  }

  for (const asset of normalizedAssets.filter((value) => STABLE_USD_ASSETS.has(value))) {
    quotes[asset] = createStableQuote(asset, retrievedAt);
  }

  let payload: SimplePricePayload = {};
  if (idToAssets.size > 0) {
    try {
      payload = await fetchCoinGeckoQuotes(Array.from(idToAssets.keys()));
    } catch {
      payload = {};
    }
  }

  for (const [coinId, mappedAssets] of Array.from(idToAssets.entries())) {
    const response = payload[coinId];
    const usdPrice = response?.usd;
    if (typeof usdPrice !== "number" || !Number.isFinite(usdPrice) || usdPrice <= 0) continue;
    const lastUpdatedAt = typeof response.last_updated_at === "number" ? new Date(response.last_updated_at * 1000) : retrievedAt;
    for (const asset of mappedAssets) {
      quotes[asset] = { asset, usdPrice, source: "coingecko", quotedAt: lastUpdatedAt };
    }
  }

  const result = { quotes, unpricedAssets: normalizedAssets.filter((asset) => !quotes[asset]), retrievedAt };
  cachedQuoteResults.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export function valueBalancesInUsd<T extends NativeBalanceForValuation>(balances: T[], quotes: Record<string, UsdPriceQuote>): Array<T & Omit<UsdValuedBalance, keyof NativeBalanceForValuation>> {
  return balances.map((balance) => {
    const normalizedAsset = normalizeExchangeAsset(balance.asset);
    const quote = quotes[normalizedAsset];
    const available = Number(balance.available);
    const held = Number(balance.held);
    const nativeTotal = available + held;
    const canValue = Boolean(quote) && Number.isFinite(nativeTotal) && nativeTotal >= 0;
    return {
      ...balance,
      normalizedAsset,
      usdPrice: quote?.usdPrice ?? null,
      usdValue: canValue ? nativeTotal * quote.usdPrice : null,
      priceSource: quote?.source ?? null,
      priceQuotedAt: quote?.quotedAt ?? null,
    };
  });
}

export function clearUsdPriceQuoteCache() {
  cachedQuoteResults.clear();
}
