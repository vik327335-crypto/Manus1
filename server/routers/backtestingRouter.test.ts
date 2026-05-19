import { describe, it, expect, beforeEach, vi } from "vitest";
import { BacktestingEngine, HistoricalData } from "../services/backtesting";

describe("BacktestingEngine", () => {
  describe("calculateSharpeRatio", () => {
    it("should calculate Sharpe ratio correctly", () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.02];
      const sharpeRatio = BacktestingEngine.calculateSharpeRatio(returns);
      expect(sharpeRatio).toBeGreaterThan(0);
      expect(typeof sharpeRatio).toBe("number");
    });

    it("should return 0 for empty returns", () => {
      const sharpeRatio = BacktestingEngine.calculateSharpeRatio([]);
      expect(sharpeRatio).toBe(0);
    });

    it("should return 0 for zero standard deviation", () => {
      const returns = [0.02, 0.02, 0.02];
      const sharpeRatio = BacktestingEngine.calculateSharpeRatio(returns);
      expect(sharpeRatio).toBe(0);
    });
  });

  describe("calculateMaxDrawdown", () => {
    it("should calculate max drawdown correctly", () => {
      const prices = [100, 110, 105, 95, 100, 120];
      const maxDrawdown = BacktestingEngine.calculateMaxDrawdown(prices);
      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdown).toBeLessThanOrEqual(1);
    });

    it("should return 0 for empty prices", () => {
      const maxDrawdown = BacktestingEngine.calculateMaxDrawdown([]);
      expect(maxDrawdown).toBe(0);
    });

    it("should return 0 for monotonically increasing prices", () => {
      const prices = [100, 110, 120, 130];
      const maxDrawdown = BacktestingEngine.calculateMaxDrawdown(prices);
      expect(maxDrawdown).toBe(0);
    });
  });

  describe("calculateMetrics", () => {
    it("should calculate metrics correctly", () => {
      const trades = [
        {
          entryDate: new Date("2026-01-01"),
          exitDate: new Date("2026-01-05"),
          entryPrice: 100,
          exitPrice: 110,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          type: "BUY" as const,
        },
        {
          entryDate: new Date("2026-01-06"),
          exitDate: new Date("2026-01-10"),
          entryPrice: 110,
          exitPrice: 105,
          quantity: 10,
          pnl: -50,
          pnlPercent: -4.55,
          type: "BUY" as const,
        },
      ];

      const result = BacktestingEngine.calculateMetrics(trades, 10000);

      expect(result.totalTrades).toBe(2);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(1);
      expect(result.winRate).toBe(0.5);
      expect(result.totalReturn).toBeGreaterThan(0);
      expect(result.sharpeRatio).toBeGreaterThanOrEqual(0);
      expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    });

    it("should calculate win rate correctly", () => {
      const trades = [
        {
          entryDate: new Date(),
          exitDate: new Date(),
          entryPrice: 100,
          exitPrice: 120,
          quantity: 1,
          pnl: 20,
          pnlPercent: 20,
          type: "BUY" as const,
        },
        {
          entryDate: new Date(),
          exitDate: new Date(),
          entryPrice: 120,
          exitPrice: 110,
          quantity: 1,
          pnl: -10,
          pnlPercent: -8.33,
          type: "BUY" as const,
        },
        {
          entryDate: new Date(),
          exitDate: new Date(),
          entryPrice: 110,
          exitPrice: 130,
          quantity: 1,
          pnl: 20,
          pnlPercent: 18.18,
          type: "BUY" as const,
        },
      ];

      const result = BacktestingEngine.calculateMetrics(trades, 10000);

      expect(result.winRate).toBe(2 / 3);
      expect(result.profitFactor).toBeGreaterThan(1);
    });
  });

  describe("calculateCanSlimScore", () => {
    it("should calculate CAN SLIM score", () => {
      const data: HistoricalData[] = [];
      const basePrice = 100;

      // Генерируем 260 дней данных
      for (let i = 0; i < 260; i++) {
        const change = (Math.random() - 0.48) * 2;
        const price = basePrice * Math.pow(1 + change / 100, i / 260);

        data.push({
          date: new Date(2025, 0, 1 + i),
          open: price * 0.99,
          high: price * 1.02,
          low: price * 0.98,
          close: price,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }

      const score = BacktestingEngine.calculateCanSlimScore(data);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(7);
      expect(typeof score).toBe("number");
    });

    it("should return 0 for insufficient data", () => {
      const data: HistoricalData[] = [
        {
          date: new Date(),
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000000,
        },
      ];

      const score = BacktestingEngine.calculateCanSlimScore(data);

      expect(score).toBe(0);
    });
  });

  describe("runBacktest", () => {
    it("should run backtest and return results", async () => {
      const data: HistoricalData[] = [];
      let price = 100;

      for (let i = 0; i < 100; i++) {
        const change = (Math.random() - 0.45) * 2;
        price = price * (1 + change / 100);

        data.push({
          date: new Date(2026, 0, 1 + i),
          open: price * 0.99,
          high: price * 1.02,
          low: price * 0.98,
          close: price,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }

      const strategy = (data: HistoricalData[], index: number) => {
        if (index < 50) return "HOLD";
        const sma50 = data
          .slice(index - 50, index)
          .reduce((sum, d) => sum + d.close, 0) / 50;
        const sma200 =
          index >= 200
            ? data
                .slice(index - 200, index)
                .reduce((sum, d) => sum + d.close, 0) / 200
            : sma50;

        if (data[index].close > sma50 && sma50 > sma200) return "BUY";
        if (data[index].close < sma50) return "SELL";
        return "HOLD";
      };

      const result = await BacktestingEngine.runBacktest(data, strategy, 10000);

      expect(result.totalTrades).toBeGreaterThanOrEqual(0);
      expect(result.winningTrades).toBeGreaterThanOrEqual(0);
      expect(result.losingTrades).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
      expect(result.sharpeRatio).toBeGreaterThanOrEqual(0);
      expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    });
  });
});
