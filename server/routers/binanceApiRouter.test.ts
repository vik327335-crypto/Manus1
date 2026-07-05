import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { binanceApiRouter } from "./binanceApiRouter";
import BinanceApiService from "../services/binanceApiService";

// Mock the BinanceApiService
vi.mock("../services/binanceApiService", () => ({
  default: vi.fn(),
}));

describe("binanceApiRouter", () => {
  describe("getSymbolPrice", () => {
    it("should fetch symbol price successfully", async () => {
      const mockPrice = 45000;
      const mockService = {
        getSymbolPrice: vi.fn().mockResolvedValue(mockPrice),
      };

      vi.mocked(BinanceApiService).mockReturnValue(mockService as any);

      const caller = binanceApiRouter.createCaller({} as any);
      const result = await caller.getSymbolPrice({ symbol: "BTCUSDT" });

      expect(result.symbol).toBe("BTCUSDT");
      expect(result.price).toBe(mockPrice);
    });

    it("should handle price fetch errors", async () => {
      const mockService = {
        getSymbolPrice: vi.fn().mockRejectedValue(new Error("API Error")),
      };

      vi.mocked(BinanceApiService).mockReturnValue(mockService as any);

      const caller = binanceApiRouter.createCaller({} as any);

      await expect(
        caller.getSymbolPrice({ symbol: "INVALID" })
      ).rejects.toThrow("Failed to fetch symbol price");
    });
  });

  describe("getSymbolKlines", () => {
    it("should fetch klines data successfully", async () => {
      const mockKlines = [
        {
          openTime: 1234567890,
          open: "45000",
          high: "46000",
          low: "44000",
          close: "45500",
          volume: "100",
          closeTime: 1234567891,
          quoteAssetVolume: "4550000",
          numberOfTrades: 100,
          takerBuyBaseAssetVolume: "50",
          takerBuyQuoteAssetVolume: "2275000",
        },
      ];

      const mockService = {
        getSymbolKlines: vi.fn().mockResolvedValue(mockKlines),
      };

      vi.mocked(BinanceApiService).mockReturnValue(mockService as any);

      const caller = binanceApiRouter.createCaller({} as any);
      const result = await caller.getSymbolKlines({
        symbol: "BTCUSDT",
        interval: "1h",
        limit: 100,
      });

      expect(result.symbol).toBe("BTCUSDT");
      expect(result.klines).toHaveLength(1);
      expect(result.klines[0].close).toBe("45500");
    });

    it("should use default interval and limit", async () => {
      const mockKlines = [];
      const mockService = {
        getSymbolKlines: vi.fn().mockResolvedValue(mockKlines),
      };

      vi.mocked(BinanceApiService).mockReturnValue(mockService as any);

      const caller = binanceApiRouter.createCaller({} as any);
      await caller.getSymbolKlines({ symbol: "ETHUSDT" });

      expect(mockService.getSymbolKlines).toHaveBeenCalledWith(
        "ETHUSDT",
        "1h",
        100
      );
    });
  });

  describe("get24hTicker", () => {
    it("should fetch 24h ticker data", async () => {
      const mockTicker = {
        symbol: "BTCUSDT",
        priceChange: "1000",
        priceChangePercent: "2.22",
        weightedAvgPrice: "45500",
        prevClosePrice: "45000",
        lastPrice: "46000",
        lastQty: "0.5",
        bidPrice: "45999",
        bidQty: "1",
        askPrice: "46001",
        askQty: "1",
        openPrice: "45000",
        highPrice: "46500",
        lowPrice: "44500",
        volume: "1000",
        quoteVolume: "45500000",
        openTime: 1234567890,
        closeTime: 1234567891,
        firstId: 1,
        lastId: 100,
        count: 100,
      };

      const mockService = {
        get24hTicker: vi.fn().mockResolvedValue(mockTicker),
      };

      vi.mocked(BinanceApiService).mockReturnValue(mockService as any);

      const caller = binanceApiRouter.createCaller({} as any);
      const result = await caller.get24hTicker({ symbol: "BTCUSDT" });

      expect(result.symbol).toBe("BTCUSDT");
      expect(result.lastPrice).toBe("46000");
    });
  });

  describe("getExchangeInfo", () => {
    it("should fetch exchange info", async () => {
      const mockInfo = {
        timezone: "UTC",
        serverTime: 1234567890,
        symbols: [
          {
            symbol: "BTCUSDT",
            status: "TRADING",
            baseAsset: "BTC",
            quoteAsset: "USDT",
          },
        ],
      };

      const mockService = {
        getExchangeInfo: vi.fn().mockResolvedValue(mockInfo),
      };

      vi.mocked(BinanceApiService).mockReturnValue(mockService as any);

      const caller = binanceApiRouter.createCaller({} as any);
      const result = await caller.getExchangeInfo();

      expect(result.timezone).toBe("UTC");
      expect(result.symbols).toHaveLength(1);
    });
  });
});
