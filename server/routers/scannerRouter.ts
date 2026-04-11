import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getAssetsWithScores, searchAssets, getAssetById } from "../db";
import { TRPCError } from "@trpc/server";

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
   * Scan assets based on CAN SLIM criteria
   */
  scan: publicProcedure
    .input((val: any) => ({
      minScore: (val.minScore as number) || 60,
      maxScore: (val.maxScore as number) || 100,
      minMarketCap: (val.minMarketCap as number) || 0,
      maxMarketCap: (val.maxMarketCap as number) || 1000000,
      minVolume24h: (val.minVolume24h as number) || 0,
      maxVolume24h: (val.maxVolume24h as number) || 1000000,
      sortBy: (val.sortBy as string) || "score", // score, marketCap, volume, price
      order: (val.order as string) || "desc", // asc, desc
    }))
    .query(async ({ input }) => {
      try {
        let assets = await getAssetsWithScores();

        // Filter by CAN SLIM score
        assets = assets.filter((asset: any) => {
          const score = asset.canslimScore?.totalScore || 0;
          return score >= input.minScore && score <= input.maxScore;
        });

        // Filter by market cap
        assets = assets.filter((asset: any) => {
          const marketCap = asset.marketCap || 0;
          return marketCap >= input.minMarketCap && marketCap <= input.maxMarketCap;
        });

        // Filter by volume
        assets = assets.filter((asset: any) => {
          const volume = asset.volume24h || 0;
          return volume >= input.minVolume24h && volume <= input.maxVolume24h;
        });

        // Sort
        assets.sort((a: any, b: any) => {
          let aVal: number;
          let bVal: number;

          switch (input.sortBy) {
            case "marketCap":
              aVal = a.marketCap || 0;
              bVal = b.marketCap || 0;
              break;
            case "volume":
              aVal = a.volume24h || 0;
              bVal = b.volume24h || 0;
              break;
            case "price":
              aVal = a.currentPrice || 0;
              bVal = b.currentPrice || 0;
              break;
            case "score":
            default:
              aVal = a.canslimScore?.totalScore || 0;
              bVal = b.canslimScore?.totalScore || 0;
          }

          return input.order === "desc" ? bVal - aVal : aVal - bVal;
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
   * Get top gainers (by 24h price change)
   */
  topGainers: publicProcedure
    .input((val: any) => ({
      limit: (val.limit as number) || 10,
    }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets
          .sort((a: any, b: any) => {
            const aChange = a.priceChange24h || 0;
            const bChange = b.priceChange24h || 0;
            return bChange - aChange;
          })
          .slice(0, input.limit);
      } catch (error) {
        console.error("Top gainers error:", error);
        return [];
      }
    }),

  /**
   * Get top losers (by 24h price change)
   */
  topLosers: publicProcedure
    .input((val: any) => ({
      limit: (val.limit as number) || 10,
    }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets
          .sort((a: any, b: any) => {
            const aChange = a.priceChange24h || 0;
            const bChange = b.priceChange24h || 0;
            return aChange - bChange;
          })
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
    .input((val: any) => ({
      limit: (val.limit as number) || 10,
      minVolume: (val.minVolume as number) || 1000000,
    }))
    .query(async ({ input }) => {
      try {
        const assets = await getAssetsWithScores();
        return assets
          .filter((asset: any) => (asset.volume24h || 0) >= input.minVolume)
          .sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0))
          .slice(0, input.limit);
      } catch (error) {
        console.error("High volume error:", error);
        return [];
      }
    }),

  /**
   * Get asset detail by ticker
   */
  getAssetDetail: publicProcedure
    .input((val: any) => ({
      ticker: val.ticker as string,
    }))
    .query(async ({ input }) => {
      try {
        const asset = await getAssetsWithScores();
        const found = asset.find(
          (a: any) => a.ticker?.toUpperCase() === input.ticker.toUpperCase()
        );
        if (!found) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Asset ${input.ticker} not found`,
          });
        }
        return found;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Get asset detail error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch asset detail",
        });
      }
    }),
});
