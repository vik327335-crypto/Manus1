import axios from "axios";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  atl: number;
  market_cap_change_percentage_24h: number;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
}

// Cache для снижения количества API запросов
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Получить текущие данные для одной монеты
 */
export async function getCoinData(coinId: string): Promise<CoinGeckoData | null> {
  try {
    return await getCachedOrFetch(`coin_${coinId}`, async () => {
      const response = await axios.get(`${COINGECKO_API}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
      });

      const coin = response.data;
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image?.large || "",
        current_price: coin.market_data?.current_price?.usd || 0,
        market_cap: coin.market_data?.market_cap?.usd || 0,
        market_cap_rank: coin.market_cap_rank || 0,
        fully_diluted_valuation:
          coin.market_data?.fully_diluted_valuation?.usd || 0,
        total_volume: coin.market_data?.total_volume?.usd || 0,
        high_24h: coin.market_data?.high_24h?.usd || 0,
        low_24h: coin.market_data?.low_24h?.usd || 0,
        price_change_24h: coin.market_data?.price_change_24h || 0,
        price_change_percentage_24h:
          coin.market_data?.price_change_percentage_24h || 0,
        circulating_supply: coin.market_data?.circulating_supply || 0,
        total_supply: coin.market_data?.total_supply || 0,
        max_supply: coin.market_data?.max_supply || null,
        ath: coin.market_data?.ath?.usd || 0,
        atl: coin.market_data?.atl?.usd || 0,
        market_cap_change_percentage_24h:
          coin.market_data?.market_cap_change_percentage_24h || 0,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch data for ${coinId}:`, error);
    return null;
  }
}

/**
 * Получить данные для нескольких монет
 */
export async function getMultipleCoins(
  coinIds: string[]
): Promise<CoinGeckoData[]> {
  try {
    const results = await Promise.all(
      coinIds.map((id) => getCoinData(id))
    );
    return results.filter((r) => r !== null) as CoinGeckoData[];
  } catch (error) {
    console.error("Failed to fetch multiple coins:", error);
    return [];
  }
}

/**
 * Получить исторические данные цены
 */
export async function getPriceHistory(
  coinId: string,
  days: number = 30
): Promise<PriceHistory[]> {
  try {
    return await getCachedOrFetch(`price_history_${coinId}_${days}`, async () => {
      const response = await axios.get(
        `${COINGECKO_API}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days: days,
            interval: "daily",
          },
        }
      );

      return response.data.prices.map((price: [number, number]) => ({
        timestamp: price[0],
        price: price[1],
      }));
    });
  } catch (error) {
    console.error(`Failed to fetch price history for ${coinId}:`, error);
    return [];
  }
}

/**
 * Получить 200-дневную EMA для Bitcoin
 */
export async function getBitcoin200EMA(): Promise<{
  price: number;
  ema200: number;
  status: "above" | "below";
} | null> {
  try {
    const history = await getPriceHistory("bitcoin", 200);
    if (history.length < 200) {
      return null;
    }

    // Вычисляем 200-дневную EMA
    const prices = history.map((h) => h.price);
    const ema = calculateEMA(prices, 200);
    const currentPrice = prices[prices.length - 1];

    return {
      price: currentPrice,
      ema200: ema,
      status: currentPrice > ema ? "above" : "below",
    };
  } catch (error) {
    console.error("Failed to calculate Bitcoin 200 EMA:", error);
    return null;
  }
}

/**
 * Получить глобальные данные рынка
 */
export async function getGlobalData(): Promise<{
  btc_dominance: number;
  eth_dominance: number;
  market_cap_change_24h: number;
  fear_greed_index: number;
} | null> {
  try {
    return await getCachedOrFetch("global_data", async () => {
      const response = await axios.get(`${COINGECKO_API}/global`);
      const data = response.data.data;

      return {
        btc_dominance: data.btc_dominance || 0,
        eth_dominance: data.eth_dominance || 0,
        market_cap_change_24h: data.market_cap_change_percentage_24h_usd || 0,
        fear_greed_index: 50, // CoinGecko не предоставляет Fear & Greed, используем заглушку
      };
    });
  } catch (error) {
    console.error("Failed to fetch global data:", error);
    return null;
  }
}

/**
 * Вспомогательная функция для расчета EMA
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

/**
 * Получить относительную силу (performance) за период
 */
export async function getRelativeStrength(
  coinId: string,
  days: number = 30
): Promise<number> {
  try {
    const history = await getPriceHistory(coinId, days);
    if (history.length < 2) return 0;

    const startPrice = history[0].price;
    const endPrice = history[history.length - 1].price;

    return ((endPrice - startPrice) / startPrice) * 100;
  } catch (error) {
    console.error(`Failed to calculate relative strength for ${coinId}:`, error);
    return 0;
  }
}
