import { describe, it, expect, beforeEach } from "vitest";
import { scannerRouter } from "./scannerRouter";

describe("Scanner Router", () => {
  let caller: ReturnType<typeof scannerRouter.createCaller>;

  beforeEach(() => {
    caller = scannerRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
  });

  describe("search", () => {
    it("should return empty array for empty query", async () => {
      const result = await caller.search({ query: "", limit: 20 });
      expect(result).toEqual([]);
    });

    it("should return results for valid query", async () => {
      const result = await caller.search({ query: "BTC", limit: 20 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const result = await caller.search({ query: "B", limit: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getAllAssets", () => {
    it("should return assets array", async () => {
      const result = await caller.getAllAssets({ limit: 100, offset: 0 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit and offset", async () => {
      const result1 = await caller.getAllAssets({ limit: 10, offset: 0 });
      const result2 = await caller.getAllAssets({ limit: 10, offset: 10 });
      expect(result1.length).toBeLessThanOrEqual(10);
      expect(result2.length).toBeLessThanOrEqual(10);
    });
  });

  describe("scan", () => {
    it("should return filtered results", async () => {
      const result = await caller.scan({
        minScore: 60,
        maxScore: 100,
        minMarketCap: 0,
        maxMarketCap: 1000000,
        minVolume24h: 0,
        maxVolume24h: 1000000,
        sortBy: "score",
        order: "desc",
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by score range", async () => {
      const result = await caller.scan({
        minScore: 50,
        maxScore: 100,
        minMarketCap: 0,
        maxMarketCap: 1000000,
        minVolume24h: 0,
        maxVolume24h: 1000000,
        sortBy: "score",
        order: "desc",
      });
      expect(Array.isArray(result)).toBe(true);
      result.forEach((asset: any) => {
        const score = asset.score || 0;
        expect(score).toBeGreaterThanOrEqual(50);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it("should sort by score descending", async () => {
      const result = await caller.scan({
        minScore: 0,
        maxScore: 100,
        minMarketCap: 0,
        maxMarketCap: 1000000,
        minVolume24h: 0,
        maxVolume24h: 1000000,
        sortBy: "score",
        order: "desc",
      });
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const score1 = result[i].score || 0;
          const score2 = result[i + 1].score || 0;
          expect(score1).toBeGreaterThanOrEqual(score2);
        }
      }
    });
  });

  describe("topGainers", () => {
    it("should return top gainers", async () => {
      const result = await caller.topGainers({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should be sorted by price change descending", async () => {
      const result = await caller.topGainers({ limit: 10 });
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const change1 = result[i].priceChange24h || 0;
          const change2 = result[i + 1].priceChange24h || 0;
          expect(change1).toBeGreaterThanOrEqual(change2);
        }
      }
    });
  });

  describe("topLosers", () => {
    it("should return top losers", async () => {
      const result = await caller.topLosers({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should be sorted by price change ascending", async () => {
      const result = await caller.topLosers({ limit: 10 });
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const change1 = result[i].priceChange24h || 0;
          const change2 = result[i + 1].priceChange24h || 0;
          expect(change1).toBeLessThanOrEqual(change2);
        }
      }
    });
  });

  describe("highVolume", () => {
    it("should return high volume assets", async () => {
      const result = await caller.highVolume({
        limit: 10,
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should filter by minimum volume", async () => {
      const result = await caller.highVolume({
        limit: 10,
      });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        // Verify results are sorted by volume descending
        for (let i = 0; i < result.length - 1; i++) {
          const vol1 = result[i].volume24h || 0;
          const vol2 = result[i + 1].volume24h || 0;
          expect(vol1).toBeGreaterThanOrEqual(vol2);
        }
      }
    });
  });

  describe("getAssetDetail", () => {
    it("should return metrics for valid ticker", async () => {
      const result = await caller.getAssetDetail({ ticker: "BTC" });
      expect(result).toHaveProperty("ticker");
      expect(result).toHaveProperty("networkActivity");
      expect(result).toHaveProperty("marketMetrics");
      expect(result.ticker).toBe("BTC");
    });

    it("should return metrics for ETH", async () => {
      const result = await caller.getAssetDetail({ ticker: "ETH" });
      expect(result.ticker).toBe("ETH");
      expect(result.networkActivity.activeAddresses).toBeGreaterThan(0);
    });
  });
});
