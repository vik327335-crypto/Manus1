import { afterEach, describe, it, expect, beforeEach, vi } from "vitest";
import * as coingeckoModule from "../services/coingecko";

function mockResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const priceById: Record<string, { usd: number; usd_market_cap: number; usd_24h_vol: number; usd_24h_change: number }> = {
  bitcoin: { usd: 65_000, usd_market_cap: 1_250_000_000_000, usd_24h_vol: 30_000_000_000, usd_24h_change: 2.5 },
  ethereum: { usd: 3_500, usd_market_cap: 420_000_000_000, usd_24h_vol: 15_000_000_000, usd_24h_change: 1.25 },
  solana: { usd: 150, usd_market_cap: 70_000_000_000, usd_24h_vol: 3_000_000_000, usd_24h_change: -1.5 },
};

const mockedFetch = vi.fn(async (input: string | URL | Request) => {
  const url = new URL(typeof input === "string" ? input : input.toString());
  if (url.pathname.endsWith("/simple/price")) {
    const coinIds = (url.searchParams.get("ids") ?? "").split(",").filter(Boolean);
    const prices = Object.fromEntries(coinIds.flatMap((coinId) => priceById[coinId] ? [[coinId, priceById[coinId]]] : []));
    return Object.keys(prices).length === coinIds.length ? mockResponse(prices) : mockResponse({ error: "coin not found" }, 404);
  }
  if (url.pathname.includes("/market_chart")) {
    const coinId = url.pathname.split("/")[4];
    if (!priceById[coinId]) return mockResponse({ error: "coin not found" }, 404);
    return mockResponse({ prices: [[1_704_067_200_000, priceById[coinId].usd - 5], [1_704_153_600_000, priceById[coinId].usd]] });
  }
  return mockResponse({ error: "unexpected request" }, 500);
});

describe("CoinGecko Service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockedFetch);
    vi.clearAllMocks();
    coingeckoModule.clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getCurrentPrice", () => {
    it("should return price data structure for BTC", async () => {
      const result = await coingeckoModule.getCurrentPrice("BTC");
      expect(result).not.toBeNull();
      expect(result).toMatchObject({ source: "coingecko", price: 65_000, marketCap: 1_250_000_000_000 });
      expect(result?.cacheAgeMs).toBeGreaterThanOrEqual(0);
    });

    it("should not fabricate zero-valued quote data for an invalid ticker", async () => {
      const result = await coingeckoModule.getCurrentPrice("INVALID");
      expect(result).toBeNull();
    });

    it("should return consistent data types", async () => {
      const result = await coingeckoModule.getCurrentPrice("ETH");
      expect(typeof result?.price).toBe("number");
      expect(typeof result?.marketCap).toBe("number");
      expect(typeof result?.volume24h).toBe("number");
      expect(typeof result?.priceChange24h).toBe("number");
      expect(typeof result?.priceChangePercent24h).toBe("number");
    });

    it("rejects malformed provider metrics instead of replacing them with zeros", async () => {
      mockedFetch.mockResolvedValueOnce(mockResponse({ bitcoin: { usd: 65_000, usd_market_cap: "bad", usd_24h_vol: 1, usd_24h_change: 1 } }));
      const result = await coingeckoModule.getCurrentPrice("BTC");
      expect(result).toBeNull();
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
      expect(result).toHaveLength(0);
    });

    it("filters malformed or non-positive history points", async () => {
      mockedFetch.mockResolvedValueOnce(mockResponse({ prices: [[1_704_153_600_000, 65_000], ["bad", 64_000], [1_704_240_000_000, 0]] }));
      const result = await coingeckoModule.getPriceHistory("BTC", 2);
      expect(result).toEqual([{ date: "2024-01-02", price: 65_000 }]);
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
      expect(result.map((quote) => quote.ticker)).toEqual(["BTC", "ETH"]);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
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
        expect(result[0]).toHaveProperty("fetchedAt");
        expect(result[0]).toHaveProperty("cacheAgeMs");
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
