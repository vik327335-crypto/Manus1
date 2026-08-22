import { describe, it, expect, beforeEach, vi } from "vitest";
import { strategyDataRouter } from "./strategyDataRouter";
import { getDb } from "../db";
import { cacheService } from "../cache";

// Mock getDb
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("strategyDataRouter", () => {
  const mockDb = {
    select: vi.fn(),
  };

  const mockUser = {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.clear();
    (getDb as any).mockResolvedValue(mockDb);
  });

  describe("getStrategySignals", () => {
    it("должен получить сигналы для стратегии", async () => {
      const mockSignals = [
        {
          id: 1,
          userId: 1,
          strategyName: "RSI Strategy",
          symbol: "BTC",
          type: "BUY",
          price: 50000,
          confidence: 85,
          reasons: '["price_above_sma", "rsi_oversold"]',
          timestamp: Date.now(),
          createdAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockSignals),
          }),
        }),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategySignals({
        strategyName: "RSI Strategy",
        limit: 100,
      });

      expect(result).toEqual(mockSignals);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("должен фильтровать сигналы по датам", async () => {
      const mockSignals = [];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockSignals),
          }),
        }),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategySignals({
        strategyName: "RSI Strategy",
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
        limit: 100,
      });

      expect(result).toEqual(mockSignals);
    });
  });

  describe("getStrategyPositions", () => {
    it("должен получить позиции для стратегии", async () => {
      const mockPositions = [
        {
          id: 1,
          userId: 1,
          strategyName: "MACD Strategy",
          symbol: "ETH",
          type: "BUY",
          quantity: 10,
          openPrice: 2000,
          closePrice: 2100,
          stopLoss: 1900,
          takeProfit: 2200,
          openTime: Date.now() - 3600000,
          closeTime: Date.now(),
          pnl: 1000,
          pnlPercent: 500,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockPositions),
          }),
        }),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategyPositions({
        strategyName: "MACD Strategy",
        limit: 100,
      });

      expect(result).toEqual(mockPositions);
    });

    it("должен возвращать пустой массив если нет позиций", async () => {
      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategyPositions({
        strategyName: "NonExistent Strategy",
        limit: 100,
      });

      expect(result).toEqual([]);
    });
  });

  describe("getStrategyMetrics", () => {
    it("должен рассчитать метрики для прибыльных сделок", async () => {
      const mockPositions = [
        {
          id: 1,
          userId: 1,
          strategyName: "BB Strategy",
          symbol: "SOL",
          type: "BUY",
          quantity: 100,
          openPrice: 100,
          closePrice: 110,
          stopLoss: 90,
          takeProfit: 120,
          openTime: Date.now() - 3600000,
          closeTime: Date.now(),
          pnl: 1000,
          pnlPercent: 1000,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          strategyName: "BB Strategy",
          symbol: "SOL",
          type: "BUY",
          quantity: 100,
          openPrice: 100,
          closePrice: 95,
          stopLoss: 90,
          takeProfit: 120,
          openTime: Date.now() - 7200000,
          closeTime: Date.now() - 3600000,
          pnl: -500,
          pnlPercent: -500,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockPositions),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategyMetrics({
        strategyName: "BB Strategy",
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
      });

      expect(result.totalTrades).toBe(2);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(1);
      expect(result.winRate).toBe(50);
      expect(result.totalProfit).toBe(10);
      expect(result.totalLoss).toBe(5);
      expect(result.profitFactor).toBe(2);
    });

    it("должен возвращать нулевые метрики если нет позиций", async () => {
      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategyMetrics({
        strategyName: "Empty Strategy",
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
      });

      expect(result.totalTrades).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.totalProfit).toBe(0);
      expect(result.profitFactor).toBe(0);
    });

    it("должен рассчитать Sharpe Ratio", async () => {
      const mockPositions = [
        {
          id: 1,
          userId: 1,
          strategyName: "RSI Strategy",
          symbol: "BTC",
          type: "BUY",
          quantity: 1,
          openPrice: 50000,
          closePrice: 51000,
          stopLoss: 49000,
          takeProfit: 52000,
          openTime: Date.now() - 3600000,
          closeTime: Date.now(),
          pnl: 1000,
          pnlPercent: 200,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          strategyName: "RSI Strategy",
          symbol: "BTC",
          type: "BUY",
          quantity: 1,
          openPrice: 50000,
          closePrice: 50500,
          stopLoss: 49000,
          takeProfit: 52000,
          openTime: Date.now() - 7200000,
          closeTime: Date.now() - 3600000,
          pnl: 500,
          pnlPercent: 100,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockPositions),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getStrategyMetrics({
        strategyName: "RSI Strategy",
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
      });

      expect(result.sharpeRatio).toBeGreaterThan(0);
      expect(result.roi).toBeGreaterThan(0);
    });
  });

  describe("getUserStrategies", () => {
    it("должен получить список всех стратегий пользователя", async () => {
      const mockPositions = [
        {
          id: 1,
          userId: 1,
          strategyName: "RSI Strategy",
          symbol: "BTC",
          type: "BUY",
          quantity: 1,
          openPrice: 50000,
          closePrice: 51000,
          stopLoss: 49000,
          takeProfit: 52000,
          openTime: Date.now(),
          closeTime: null,
          pnl: null,
          pnlPercent: null,
          status: "OPEN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          strategyName: "MACD Strategy",
          symbol: "ETH",
          type: "BUY",
          quantity: 10,
          openPrice: 2000,
          closePrice: null,
          stopLoss: 1900,
          takeProfit: 2200,
          openTime: Date.now(),
          closeTime: null,
          pnl: null,
          pnlPercent: null,
          status: "OPEN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockPositions),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getUserStrategies();

      expect(result).toContain("RSI Strategy");
      expect(result).toContain("MACD Strategy");
      expect(result.length).toBe(2);
    });

    it("должен возвращать пустой массив если нет стратегий", async () => {
      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getUserStrategies();

      expect(result).toEqual([]);
    });
  });

  describe("getAllStrategiesMetrics", () => {
    it("должен получить метрики всех стратегий", async () => {
      const mockPositions = [
        {
          id: 1,
          userId: 1,
          strategyName: "RSI Strategy",
          symbol: "BTC",
          type: "BUY",
          quantity: 1,
          openPrice: 50000,
          closePrice: 51000,
          stopLoss: 49000,
          takeProfit: 52000,
          openTime: Date.now() - 3600000,
          closeTime: Date.now(),
          pnl: 1000,
          pnlPercent: 200,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          strategyName: "MACD Strategy",
          symbol: "ETH",
          type: "BUY",
          quantity: 10,
          openPrice: 2000,
          closePrice: 2100,
          stopLoss: 1900,
          takeProfit: 2200,
          openTime: Date.now() - 7200000,
          closeTime: Date.now() - 3600000,
          pnl: 1000,
          pnlPercent: 500,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockPositions),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getAllStrategiesMetrics({
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
      });

      expect(result.length).toBe(2);
      expect(result[0].strategyName).toBe("RSI Strategy");
      expect(result[1].strategyName).toBe("MACD Strategy");
      expect(result[0].totalTrades).toBe(1);
      expect(result[1].totalTrades).toBe(1);
    });

    it("должен рассчитать метрики для каждой стратегии независимо", async () => {
      const mockPositions = [
        {
          id: 1,
          userId: 1,
          strategyName: "Strategy A",
          symbol: "BTC",
          type: "BUY",
          quantity: 1,
          openPrice: 50000,
          closePrice: 51000,
          stopLoss: 49000,
          takeProfit: 52000,
          openTime: Date.now() - 3600000,
          closeTime: Date.now(),
          pnl: 1000,
          pnlPercent: 200,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          strategyName: "Strategy A",
          symbol: "ETH",
          type: "BUY",
          quantity: 1,
          openPrice: 2000,
          closePrice: 1900,
          stopLoss: 1800,
          takeProfit: 2200,
          openTime: Date.now() - 7200000,
          closeTime: Date.now() - 3600000,
          pnl: -100,
          pnlPercent: -500,
          status: "CLOSED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockPositions),
      });

      mockDb.select.mockReturnValue({
        from: fromMock,
      });

      const caller = strategyDataRouter.createCaller({ user: mockUser });
      const result = await caller.getAllStrategiesMetrics({
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
      });

      expect(result.length).toBe(1);
      expect(result[0].strategyName).toBe("Strategy A");
      expect(result[0].totalTrades).toBe(2);
      expect(result[0].winningTrades).toBe(1);
      expect(result[0].losingTrades).toBe(1);
      expect(result[0].winRate).toBe(50);
    });
  });
});
