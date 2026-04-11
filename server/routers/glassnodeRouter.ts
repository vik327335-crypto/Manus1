/**
 * Glassnode tRPC Router
 * Provides on-chain metrics for CAN SLIM analysis
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as glassnode from "../services/glassnode";

export const glassnodeRouter = router({
  /**
   * Get a single metric for a cryptocurrency
   */
  getMetric: publicProcedure
    .input(
      z.object({
        ticker: z.string().toUpperCase(),
        metric: z.string().toUpperCase(),
      })
    )
    .query(async ({ input }) => {
      const value = await glassnode.getMetric(input.ticker, input.metric);
      return {
        ticker: input.ticker,
        metric: input.metric,
        value,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get multiple metrics for a cryptocurrency
   */
  getMetrics: publicProcedure
    .input(
      z.object({
        ticker: z.string().toUpperCase(),
        metrics: z.array(z.string().toUpperCase()),
      })
    )
    .query(async ({ input }) => {
      const metrics = await glassnode.getMetrics(input.ticker, input.metrics);
      return {
        ticker: input.ticker,
        metrics,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get network activity metrics
   */
  getNetworkActivity: publicProcedure
    .input(z.object({ ticker: z.string().toUpperCase() }))
    .query(async ({ input }) => {
      const metrics = await glassnode.getMetrics(input.ticker, [
        "ACTIVEADDRESSES",
        "NEWADDRESSES",
        "TXS",
        "TOTALVOLUME",
      ]);

      return {
        ticker: input.ticker,
        activeAddresses: metrics.ACTIVEADDRESSES,
        newAddresses: metrics.NEWADDRESSES,
        transactionCount: metrics.TXS,
        totalVolume: metrics.TOTALVOLUME,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get market metrics
   */
  getMarketMetrics: publicProcedure
    .input(z.object({ ticker: z.string().toUpperCase() }))
    .query(async ({ input }) => {
      const metrics = await glassnode.getMetrics(input.ticker, [
        "MARKETCAP",
        "SUPPLY",
        "DIFFICULTY",
        "HASHRATE",
      ]);

      return {
        ticker: input.ticker,
        marketCap: metrics.MARKETCAP,
        supply: metrics.SUPPLY,
        difficulty: metrics.DIFFICULTY,
        hashRate: metrics.HASHRATE,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get staking metrics (for PoS chains)
   */
  getStakingMetrics: publicProcedure
    .input(z.object({ ticker: z.string().toUpperCase() }))
    .query(async ({ input }) => {
      const { staked, validators } = await glassnode.getStakingMetrics(input.ticker);

      return {
        ticker: input.ticker,
        staked,
        validators,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get active addresses for multiple cryptocurrencies
   */
  getMultipleActiveAddresses: publicProcedure
    .input(z.object({ tickers: z.array(z.string().toUpperCase()) }))
    .query(async ({ input }) => {
      const results: Record<string, number> = {};

      for (const ticker of input.tickers) {
        results[ticker] = await glassnode.getActiveAddresses(ticker);
      }

      return {
        metrics: results,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get cache statistics
   */
  getCacheStats: publicProcedure.query(() => {
    return glassnode.getCacheStats();
  }),

  /**
   * Clear cache (for testing/admin)
   */
  clearCache: publicProcedure.mutation(() => {
    glassnode.clearCache();
    return { success: true, message: "Cache cleared" };
  }),
});
