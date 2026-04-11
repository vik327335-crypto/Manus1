import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getAssetsWithScores, searchAssets, getAssetById } from "../db";
import { TRPCError } from "@trpc/server";
import * as glassnode from "../services/glassnode";

/**
 * Scanner Router - Provides procedures for scanning and filtering crypto assets
 */
export const scannerRouter = router({
  /**
   * Search cryptocurrencies by query (name or ticker)
   */
  search: publicProcedure
    .input((val: any) => ({
      query: val.query as string,
      limit: (val.limit as number) || 20,
    }))
    .query(async ({ input }) => {
      if (!input.query || input.query.length < 1) {
        return [];
      }
      try {
        const results = await searchAssets(input.query);
        return results.slice(0, input.limit);
      } catch (error) {
        console.error("Search error:", error);
        return [];
      }
    }),

  /**
   * Get all assets with CAN SLIM scores for scanning
   */
  getAllAssets: publicProcedure
    .input((val: any) => ({
      limit: (val.limit as number) || 100,
      offset: (val.offset as number) || 0,
    }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets.slice(input.offset, input.offset + input.limit);
      } catch (error) {
        console.error("Get assets error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch assets",
        });
      }
    }),

  /**
   * Scan assets based on CAN SLIM criteria using Glassnode metrics
   */
  scan: publicProcedure
    .input((val: any) => ({
      minScore: (val.minScore as number) || 60,
      maxScore: (val.maxScore as number) || 100,
      minMarketCap: (val.minMarketCap as number) || 0,
      maxMarketCap: (val.maxMarketCap as number) || 1000000,
      minVolume24h: (val.minVolume24h as number) || 0,
      maxVolume24h: (val.maxVolume24h as number) || 1000000,
      sortBy: (val.sortBy as string) || "score",
      order: (val.order as string) || "desc",
    }))
    .query(async ({ input }) => {
      try {
        const tickers = ["BTC", "ETH", "SOL", "ADA", "XRP"];
        const assets = [];

        for (const ticker of tickers) {
          try {
            // Get Glassnode metrics
            const networkActivity = await glassnode.getNetworkActivity(ticker);
            const marketMetrics = await glassnode.getMarketMetrics(ticker);

            // Calculate CAN SLIM score based on metrics
            let score = 50; // Base score

            // Network activity scoring
            if (networkActivity.activeAddresses > 10000000) score += 15;
            if (networkActivity.transactionCount > 100000) score += 10;
            if (networkActivity.totalVolume > 500000) score += 10;

            // Market metrics scoring
            if (marketMetrics.marketCap > 50000) score += 10;
            if (marketMetrics.difficulty > 1000000000000) score += 10;
            if (marketMetrics.supply > 0) score += 5;

            const finalScore = Math.min(100, score);

            // Apply filters
            if (
              finalScore >= input.minScore &&
              finalScore <= input.maxScore &&
              marketMetrics.marketCap >= input.minMarketCap &&
              marketMetrics.marketCap <= input.minMarketCap &&
              networkActivity.totalVolume >= input.minVolume24h &&
              networkActivity.totalVolume <= input.maxVolume24h
            ) {
              assets.push({
                ticker,
                name:
                  ticker === "BTC"
                    ? "Bitcoin"
                    : ticker === "ETH"
                      ? "Ethereum"
                      : ticker === "SOL"
                        ? "Solana"
                        : ticker === "ADA"
                          ? "Cardano"
                          : "Ripple",
                score: finalScore,
                marketCap: marketMetrics.marketCap,
                volume24h: networkActivity.totalVolume,
                price:
                  ticker === "BTC"
                    ? 45230
                    : ticker === "ETH"
                      ? 2850
                      : ticker === "SOL"
                        ? 195
                        : ticker === "ADA"
                          ? 1.2
                          : 2.5,
                priceChange24h: Math.random() * 10 - 5,
                activeAddresses: networkActivity.activeAddresses,
                transactionCount: networkActivity.transactionCount,
              });
            }
          } catch (error) {
            console.error(`Error fetching metrics for ${ticker}:`, error);
          }
        }

        // Sort results
        assets.sort((a: any, b: any) => {
          let aVal = a[input.sortBy] || 0;
          let bVal = b[input.sortBy] || 0;
          return input.order === "asc" ? aVal - bVal : bVal - aVal;
        });

        return assets;
      } catch (error) {
        console.error("Scan error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to scan assets",
        });
      }
    }),

  /**
   * Get top gainers
   */
  topGainers: publicProcedure
    .input((val: any) => ({ limit: (val.limit as number) || 10 }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets
          .sort((a: any, b: any) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
          .slice(0, input.limit);
      } catch (error) {
        console.error("Top gainers error:", error);
        return [];
      }
    }),

  /**
   * Get top losers
   */
  topLosers: publicProcedure
    .input((val: any) => ({ limit: (val.limit as number) || 10 }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets
          .sort((a: any, b: any) => (a.priceChange24h || 0) - (b.priceChange24h || 0))
          .slice(0, input.limit);
      } catch (error) {
        console.error("Top losers error:", error);
        return [];
      }
    }),

  /**
   * Get high volume assets
   */
  highVolume: publicProcedure
    .input((val: any) => ({ limit: (val.limit as number) || 10 }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets
          .sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0))
          .slice(0, input.limit);
      } catch (error) {
        console.error("High volume error:", error);
        return [];
      }
    }),

  /**
   * Get asset details by ticker
   */
  getAssetDetail: publicProcedure
    .input((val: any) => ({ ticker: val.ticker as string }))
    .query(async ({ input }) => {
      try {
        if (!input.ticker) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ticker is required",
          });
        }

        // Get Glassnode metrics
        const networkActivity = await glassnode.getNetworkActivity(input.ticker);
        const marketMetrics = await glassnode.getMarketMetrics(input.ticker);

        return {
          ticker: input.ticker,
          networkActivity,
          marketMetrics,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error("Get asset detail error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch asset details",
        });
      }
    }),
});
