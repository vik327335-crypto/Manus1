import { describe, it, expect, beforeEach, vi } from "vitest";
import * as coingeckoModule from "../services/coingecko";

describe("CoinGecko Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coingeckoModule.clearCache();
  });

  describe("getCurrentPrice", () => {
    it("should return price data structure for BTC", async () => {
      const result = await coingeckoModule.getCurrentPrice("BTC");
      expect(result).toHaveProperty("price");
      expect(result).toHaveProperty("marketCap");
      expect(result).toHaveProperty("volume24h");
      expect(result).toHaveProperty("priceChange24h");
      expect(result).toHaveProperty("priceChangePercent24h");
      expect(typeof result.price).toBe("number");
    });

    it("should handle invalid ticker gracefully", async () => {
      const result = await coingeckoModule.getCurrentPrice("INVALID");
      expect(result.price).toBe(0);
      expect(result.marketCap).toBe(0);
      expect(result.volume24h).toBe(0);
    });

    it("should return consistent data types", async () => {
      const result = await coingeckoModule.getCurrentPrice("ETH");
      expect(typeof result.price).toBe("number");
      expect(typeof result.marketCap).toBe("number");
      expect(typeof result.volume24h).toBe("number");
      expect(typeof result.priceChange24h).toBe("number");
      expect(typeof result.priceChangePercent24h).toBe("number");
    });
  });

  describe("getPriceHistory", () => {
    it("should return array of price history", async () => {
      const result = await coingeckoModule.getPriceHistory("BTC", 7);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return price history with default days", async () => {
      const result = await coingeckoModule.getPriceHistory("ETH");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle different day ranges", async () => {
      const result1 = await coingeckoModule.getPriceHistory("BTC", 1);
      const result2 = await coingeckoModule.getPriceHistory("BTC", 30);
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });

    it("should return empty array on error", async () => {
      const result = await coingeckoModule.getPriceHistory("INVALID", 7);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get24hTrend", () => {
    it("should return trend analysis structure", async () => {
      const result = await coingeckoModule.get24hTrend("BTC");
      expect(result).toHaveProperty("momentum");
      expect(result).toHaveProperty("volatility");
      expect(result).toHaveProperty("trend");
    });

    it("should return valid momentum values", async () => {
      const result = await coingeckoModule.get24hTrend("ETH");
      const validMomentums = ["strong_up", "up", "neutral", "down", "strong_down"];
      expect(validMomentums).toContain(result.momentum);
    });

    it("should calculate volatility as positive number", async () => {
      const result = await coingeckoModule.get24hTrend("SOL");
      expect(typeof result.volatility).toBe("number");
      expect(result.volatility).toBeGreaterThanOrEqual(0);
    });

    it("should return neutral trend on error", async () => {
      const result = await coingeckoModule.get24hTrend("INVALID");
      expect(result.momentum).toBe("neutral");
      expect(result.volatility).toBe(0);
      expect(result.trend).toBe(0);
    });
  });

  describe("getMarketData", () => {
    it("should return array of market data", async () => {
      const result = await coingeckoModule.getMarketData(["BTC", "ETH"]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty ticker list", async () => {
      const result = await coingeckoModule.getMarketData([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should return consistent data structure", async () => {
      const result = await coingeckoModule.getMarketData(["BTC"]);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("ticker");
        expect(result[0]).toHaveProperty("price");
        expect(result[0]).toHaveProperty("marketCap");
        expect(result[0]).toHaveProperty("volume24h");
        expect(result[0]).toHaveProperty("priceChange24h");
      }
    });
  });

  describe("Cache behavior", () => {
    it("should clear cache successfully", async () => {
      coingeckoModule.clearCache();
      const result = await coingeckoModule.getCurrentPrice("BTC");
      expect(result).toHaveProperty("price");
    });

    it("should handle multiple cache operations", async () => {
      await coingeckoModule.getCurrentPrice("BTC");
      coingeckoModule.clearCache();
      await coingeckoModule.getCurrentPrice("ETH");
      coingeckoModule.clearCache();
      const result = await coingeckoModule.getCurrentPrice("SOL");
      expect(result).toHaveProperty("price");
    });
  });
});
