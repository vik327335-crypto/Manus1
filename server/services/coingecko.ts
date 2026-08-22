/**
 * CoinGecko Service - Provides access to CoinGecko API for crypto price data
 * Includes caching to prevent API rate limiting
 */

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const CACHE_TTL = 3600000; // 1 hour in milliseconds

interface CachedData {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CachedData>();

/**
 * Get cached data if still valid
 */
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Set cached data
 */
function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get current price for a cryptocurrency
 */
export async function getCurrentPrice(ticker: string): Promise<{
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
}> {
  const cacheKey = `price_${ticker}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const coinId = mapTickerToCoinId(ticker);
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const coinData = data[coinId];

    const result = {
      price: coinData.usd || 0,
      marketCap: coinData.usd_market_cap || 0,
      volume24h: coinData.usd_24h_vol || 0,
      priceChange24h: coinData.usd_24h_change || 0,
      priceChangePercent24h: coinData.usd_24h_change || 0,
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return {
      price: 0,
      marketCap: 0,
      volume24h: 0,
      priceChange24h: 0,
      priceChangePercent24h: 0,
    };
  }
}

/**
 * Get price history for a cryptocurrency (last N days)
 */
export async function getPriceHistory(
  ticker: string,
  days: number = 30
): Promise<Array<{ date: string; price: number }>> {
  const cacheKey = `history_${ticker}_${days}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const coinId = mapTickerToCoinId(ticker);
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const prices = data.prices || [];

    const result = prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toISOString().split("T")[0],
      price: item[1],
    }));

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching price history for ${ticker}:`, error);
    return [];
  }
}

/**
 * Get 24h trend analysis
 */
export async function get24hTrend(ticker: string): Promise<{
  momentum: "strong_up" | "up" | "neutral" | "down" | "strong_down";
  volatility: number;
  trend: number;
}> {
  try {
    const _history = await getPriceHistory(ticker, 1);
    const price = await getCurrentPrice(ticker);

    // Calculate momentum based on 24h change
    let momentum: "strong_up" | "up" | "neutral" | "down" | "strong_down" = "neutral";
    const change = price.priceChangePercent24h;

    if (change > 5) momentum = "strong_up";
    else if (change > 1) momentum = "up";
    else if (change < -5) momentum = "strong_down";
    else if (change < -1) momentum = "down";

    // Calculate volatility (simplified)
    const volatility = Math.abs(change);

    // Calculate trend (positive = uptrend, negative = downtrend)
    const trend = change;

    return { momentum, volatility, trend };
  } catch (error) {
    console.error(`Error calculating 24h trend for ${ticker}:`, error);
    return {
      momentum: "neutral",
      volatility: 0,
      trend: 0,
    };
  }
}

/**
 * Get market data for multiple cryptocurrencies
 */
export async function getMarketData(tickers: string[]): Promise<
  Array<{
    ticker: string;
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
  }>
> {
  const results = [];

  for (const ticker of tickers) {
    try {
      const data = await getCurrentPrice(ticker);
      results.push({
        ticker,
        price: data.price,
        marketCap: data.marketCap,
        volume24h: data.volume24h,
        priceChange24h: data.priceChange24h,
      });
    } catch (error) {
      console.error(`Error fetching market data for ${ticker}:`, error);
    }
  }

  return results;
}

/**
 * Map ticker symbol to CoinGecko coin ID
 */
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

/**
 * Clear cache (for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
}
