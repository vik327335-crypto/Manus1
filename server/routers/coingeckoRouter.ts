import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getCurrentPrice,
  getPriceHistory,
  get24hTrend,
  getMarketData,
} from "../services/coingecko";

export const coingeckoRouter = router({
  /**
   * Get current price for a cryptocurrency
   */
  getCurrentPrice: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      return await getCurrentPrice(input.ticker);
    }),

  /**
   * Get price history for a cryptocurrency
   */
  getPriceHistory: publicProcedure
    .input(z.object({ ticker: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getPriceHistory(input.ticker, input.days);
    }),

  /**
   * Get 24h trend analysis
   */
  get24hTrend: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      return await get24hTrend(input.ticker);
    }),

  /**
   * Get market data for multiple cryptocurrencies
   */
  getMarketData: publicProcedure
    .input(z.object({ tickers: z.array(z.string()) }))
    .query(async ({ input }) => {
      return await getMarketData(input.tickers);
    }),
});
