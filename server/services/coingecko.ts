/**
 * CoinGecko market-data adapter.
 *
 * Values are exposed only when the provider supplied a complete, finite quote.
 * Provider failures and malformed payloads become explicit absence (`null`), never
 * fabricated zero-valued market data.
 */

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const CACHE_TTL_MS = 60_000;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface RawCoinGeckoQuote {
  usd?: unknown;
  usd_market_cap?: unknown;
  usd_24h_vol?: unknown;
  usd_24h_change?: unknown;
}

interface CachedMarketQuote {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
}

export interface MarketQuote extends CachedMarketQuote {
  source: "coingecko";
  fetchedAt: number;
  cacheAgeMs: number;
}

export interface MarketHistoryPoint {
  date: string;
  price: number;
}

const cache = new Map<string, CachedData<unknown>>();

function getCachedData<T>(key: string): CachedData<T> | null {
  const cached = cache.get(key) as CachedData<T> | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  cache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T): CachedData<T> {
  const cached = { data, timestamp: Date.now() };
  cache.set(key, cached);
  return cached;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function createQuote(
  ticker: string,
  payload: RawCoinGeckoQuote,
  timestamp: number
): MarketQuote | null {
  const values = [
    payload.usd,
    payload.usd_market_cap,
    payload.usd_24h_vol,
    payload.usd_24h_change,
  ];

  if (!values.every(isFiniteNumber) || !isFiniteNumber(payload.usd) || payload.usd <= 0) {
    console.warn(`[CoinGecko] Rejected incomplete or invalid quote for ${ticker}`);
    return null;
  }

  const quote: CachedMarketQuote = {
    price: payload.usd,
    marketCap: payload.usd_market_cap as number,
    volume24h: payload.usd_24h_vol as number,
    // CoinGecko's simple-price endpoint returns the 24h percentage change.
    priceChange24h: payload.usd_24h_change as number,
    priceChangePercent24h: payload.usd_24h_change as number,
  };

  return {
    ...quote,
    source: "coingecko",
    fetchedAt: timestamp,
    cacheAgeMs: Math.max(0, Date.now() - timestamp),
  };
}

/** Get one validated USD market quote, or null when the provider cannot verify it. */
export async function getCurrentPrice(ticker: string): Promise<MarketQuote | null> {
  const normalizedTicker = ticker.toUpperCase();
  const cacheKey = `price_${normalizedTicker}`;
  const cached = getCachedData<CachedMarketQuote>(cacheKey);

  if (cached) {
    return {
      ...cached.data,
      source: "coingecko",
      fetchedAt: cached.timestamp,
      cacheAgeMs: Math.max(0, Date.now() - cached.timestamp),
    };
  }

  try {
    const coinId = mapTickerToCoinId(normalizedTicker);
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const responseData = (await response.json()) as Record<string, RawCoinGeckoQuote>;
    const quote = createQuote(normalizedTicker, responseData[coinId] ?? {}, Date.now());
    if (!quote) return null;

    setCachedData(cacheKey, {
      price: quote.price,
      marketCap: quote.marketCap,
      volume24h: quote.volume24h,
      priceChange24h: quote.priceChange24h,
      priceChangePercent24h: quote.priceChangePercent24h,
    });
    return quote;
  } catch (error) {
    console.warn(`[CoinGecko] Quote unavailable for ${normalizedTicker}:`, error);
    return null;
  }
}

/** Get validated historical points only; malformed entries are rejected. */
export async function getPriceHistory(
  ticker: string,
  days: number = 30
): Promise<MarketHistoryPoint[]> {
  const normalizedTicker = ticker.toUpperCase();
  const cacheKey = `history_${normalizedTicker}_${days}`;
  const cached = getCachedData<MarketHistoryPoint[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const coinId = mapTickerToCoinId(normalizedTicker);
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const responseData = (await response.json()) as { prices?: unknown };
    const rawPrices = Array.isArray(responseData.prices) ? responseData.prices : [];
    const result = rawPrices
      .flatMap((item): Array<{ timestamp: number; price: number }> => {
        if (!Array.isArray(item) || !isFiniteNumber(item[0]) || !isFiniteNumber(item[1]) || item[1] <= 0) {
          return [];
        }
        return [{ timestamp: item[0], price: item[1] }];
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item) => ({
        date: new Date(item.timestamp).toISOString().split("T")[0],
        price: item.price,
      }));

    return setCachedData(cacheKey, result).data;
  } catch (error) {
    console.warn(`[CoinGecko] History unavailable for ${normalizedTicker}:`, error);
    return [];
  }
}

/** Get 24-hour trend only from a validated current quote. */
export async function get24hTrend(ticker: string): Promise<{
  momentum: "strong_up" | "up" | "neutral" | "down" | "strong_down";
  volatility: number;
  trend: number;
}> {
  const price = await getCurrentPrice(ticker);
  if (!price) {
    return { momentum: "neutral", volatility: 0, trend: 0 };
  }

  const change = price.priceChangePercent24h;
  let momentum: "strong_up" | "up" | "neutral" | "down" | "strong_down" = "neutral";
  if (change > 5) momentum = "strong_up";
  else if (change > 1) momentum = "up";
  else if (change < -5) momentum = "strong_down";
  else if (change < -1) momentum = "down";

  return { momentum, volatility: Math.abs(change), trend: change };
}

/** Return only verified quotes; failed assets are explicitly omitted instead of zero-filled. */
export async function getMarketData(tickers: string[]): Promise<Array<MarketQuote & { ticker: string }>> {
  const normalizedTickers = Array.from(new Set(tickers.map((ticker) => ticker.toUpperCase())));
  const quotesByTicker = new Map<string, MarketQuote>();
  const missingTickers: string[] = [];

  for (const ticker of normalizedTickers) {
    const cached = getCachedData<CachedMarketQuote>(`price_${ticker}`);
    if (cached) {
      quotesByTicker.set(ticker, {
        ...cached.data,
        source: "coingecko",
        fetchedAt: cached.timestamp,
        cacheAgeMs: Math.max(0, Date.now() - cached.timestamp),
      });
    } else {
      missingTickers.push(ticker);
    }
  }

  if (missingTickers.length > 0) {
    try {
      const idsByTicker = new Map(missingTickers.map((ticker) => [ticker, mapTickerToCoinId(ticker)]));
      const ids = Array.from(new Set(Array.from(idsByTicker.values())));
      const response = await fetch(
        `${COINGECKO_API_BASE}/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        { signal: AbortSignal.timeout(10_000) }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const responseData = (await response.json()) as Record<string, RawCoinGeckoQuote>;
      const timestamp = Date.now();
      for (const [ticker, coinId] of Array.from(idsByTicker.entries())) {
        const quote = createQuote(ticker, responseData[coinId] ?? {}, timestamp);
        if (!quote) continue;
        setCachedData(`price_${ticker}`, {
          price: quote.price,
          marketCap: quote.marketCap,
          volume24h: quote.volume24h,
          priceChange24h: quote.priceChange24h,
          priceChangePercent24h: quote.priceChangePercent24h,
        });
        quotesByTicker.set(ticker, quote);
      }
    } catch (error) {
      console.warn(`[CoinGecko] Batch quote request unavailable for ${missingTickers.join(", ")}:`, error);
    }
  }

  return normalizedTickers.flatMap((ticker) => {
    const quote = quotesByTicker.get(ticker);
    return quote ? [{ ...quote, ticker }] : [];
  });
}

function mapTickerToCoinId(ticker: string): string {
  const mapping: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    ADA: "cardano",
    XRP: "ripple",
    DOGE: "dogecoin",
    MATIC: "matic-network",
    LINK: "chainlink",
    AVAX: "avalanche-2",
    DOT: "polkadot",
  };

  return mapping[ticker.toUpperCase()] || ticker.toLowerCase();
}

export function clearCache(): void {
  cache.clear();
}
