import { publicProcedure, router } from "../_core/trpc";
import {
  getBitcoin200EMA,
  getGlobalData,
  getCoinData,
} from "../services/coingeckoService";

const source = "coingecko" as const;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isVerifiedPositive(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

export const marketRouter = router({
  trend: publicProcedure.query(async () => {
    try {
      const [btcData, globalData, emaData] = await Promise.all([
        getCoinData("bitcoin"),
        getGlobalData(),
        getBitcoin200EMA(),
      ]);

      if (!btcData || !globalData || !emaData || !isVerifiedPositive(btcData.current_price) || !isVerifiedPositive(emaData.ema200) || !isVerifiedPositive(globalData.btc_dominance)) {
        return { available: false as const, source, reason: "Verified market trend data is currently unavailable" };
      }

      const btcAbove200EMA = btcData.current_price > emaData.ema200 ? 1 : -1;
      const status = btcAbove200EMA > 0 && globalData.btc_dominance > 40
        ? "bullish" as const
        : btcAbove200EMA < 0 && globalData.btc_dominance < 35
          ? "bearish" as const
          : "neutral" as const;

      return {
        available: true as const,
        source,
        status,
        btcPrice: btcData.current_price,
        btc200EMA: emaData.ema200,
        btcAbove200EMA,
        dominance: globalData.btc_dominance,
        fearGreedIndex: globalData.fear_greed_index,
      };
    } catch (error) {
      console.warn("[Market] Verified trend data unavailable:", error);
      return { available: false as const, source, reason: "Verified market trend data is currently unavailable" };
    }
  }),

  btcPrice: publicProcedure.query(async () => {
    try {
      const data = await getCoinData("bitcoin");
      if (!data || !isVerifiedPositive(data.current_price) || !isFiniteNumber(data.price_change_percentage_24h) || !isFiniteNumber(data.market_cap)) {
        return { available: false as const, source, reason: "Verified BTC quote is currently unavailable" };
      }
      return { available: true as const, source, price: data.current_price, change24h: data.price_change_percentage_24h, marketCap: data.market_cap };
    } catch (error) {
      console.warn("[Market] Verified BTC quote unavailable:", error);
      return { available: false as const, source, reason: "Verified BTC quote is currently unavailable" };
    }
  }),

  ethereum: publicProcedure.query(async () => {
    try {
      const data = await getCoinData("ethereum");
      if (!data || !isVerifiedPositive(data.current_price) || !isFiniteNumber(data.price_change_percentage_24h) || !isFiniteNumber(data.market_cap)) {
        return { available: false as const, source, reason: "Verified ETH quote is currently unavailable" };
      }
      return { available: true as const, source, price: data.current_price, change24h: data.price_change_percentage_24h, marketCap: data.market_cap };
    } catch (error) {
      console.warn("[Market] Verified ETH quote unavailable:", error);
      return { available: false as const, source, reason: "Verified ETH quote is currently unavailable" };
    }
  }),

  global: publicProcedure.query(async () => {
    try {
      const data = await getGlobalData();
      if (!data || !isVerifiedPositive(data.btc_dominance) || !isVerifiedPositive(data.eth_dominance) || !isFiniteNumber(data.market_cap_change_24h)) {
        return { available: false as const, source, reason: "Verified global market data is currently unavailable" };
      }
      return {
        available: true as const,
        source,
        btcDominance: data.btc_dominance,
        ethDominance: data.eth_dominance,
        marketCapChange24h: data.market_cap_change_24h,
        fearGreedIndex: data.fear_greed_index,
      };
    } catch (error) {
      console.warn("[Market] Verified global market data unavailable:", error);
      return { available: false as const, source, reason: "Verified global market data is currently unavailable" };
    }
  }),
});
