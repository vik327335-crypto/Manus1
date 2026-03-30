import { publicProcedure, router } from "../_core/trpc";
import {
  getBitcoin200EMA,
  getGlobalData,
  getCoinData,
} from "../services/coingeckoService";

export const marketRouter = router({
  trend: publicProcedure.query(async () => {
    try {
      const [btcData, globalData, emaData] = await Promise.all([
        getCoinData("bitcoin"),
        getGlobalData(),
        getBitcoin200EMA(),
      ]);

      if (!btcData || !globalData || !emaData) {
        return {
          status: "neutral" as const,
          btcPrice: 0,
          btc200EMA: 0,
          btcAbove200EMA: 0,
          dominance: 0,
          fearGreedIndex: 50,
          error: "Failed to fetch market data",
        };
      }

      const btcAbove200EMA = btcData.current_price > emaData.ema200 ? 1 : -1;

      // Determine market status based on BTC position and dominance
      let status: "bullish" | "neutral" | "bearish" = "neutral";
      if (btcAbove200EMA > 0 && globalData.btc_dominance > 40) {
        status = "bullish";
      } else if (btcAbove200EMA < 0 && globalData.btc_dominance < 35) {
        status = "bearish";
      }

      return {
        status,
        btcPrice: btcData.current_price,
        btc200EMA: emaData.ema200,
        btcAbove200EMA,
        dominance: globalData.btc_dominance,
        fearGreedIndex: globalData.fear_greed_index,
      };
    } catch (error) {
      console.error("[Market] Error fetching trend:", error);
      return {
        status: "neutral" as const,
        btcPrice: 0,
        btc200EMA: 0,
        btcAbove200EMA: 0,
        dominance: 0,
        fearGreedIndex: 50,
        error: "Failed to fetch market data",
      };
    }
  }),

  btcPrice: publicProcedure.query(async () => {
    try {
      const data = await getCoinData("bitcoin");
      return {
        price: data?.current_price || 0,
        change24h: data?.price_change_percentage_24h || 0,
        marketCap: data?.market_cap || 0,
      };
    } catch (error) {
      console.error("[Market] Error fetching BTC price:", error);
      return { price: 0, change24h: 0, marketCap: 0 };
    }
  }),

  ethereum: publicProcedure.query(async () => {
    try {
      const data = await getCoinData("ethereum");
      return {
        price: data?.current_price || 0,
        change24h: data?.price_change_percentage_24h || 0,
        marketCap: data?.market_cap || 0,
      };
    } catch (error) {
      console.error("[Market] Error fetching ETH price:", error);
      return { price: 0, change24h: 0, marketCap: 0 };
    }
  }),

  global: publicProcedure.query(async () => {
    try {
      const data = await getGlobalData();
      return {
        btcDominance: data?.btc_dominance || 0,
        ethDominance: data?.eth_dominance || 0,
        marketCapChange24h: data?.market_cap_change_24h || 0,
        fearGreedIndex: data?.fear_greed_index || 50,
      };
    } catch (error) {
      console.error("[Market] Error fetching global data:", error);
      return {
        btcDominance: 0,
        ethDominance: 0,
        marketCapChange24h: 0,
        fearGreedIndex: 50,
      };
    }
  }),
});
