import { describe, expect, it } from "vitest";
import { runBacktest } from "../../scripts/run-btcusdt-year-backtest.mjs";

const DAY_MS = 86_400_000;

function candle(index, close) {
  return {
    openTime: Date.UTC(2025, 0, 1) + index * DAY_MS,
    open: 100,
    high: Math.max(100, close),
    low: Math.min(100, close),
    close,
    volume: 1,
  };
}

describe("yearly SMA backtest", () => {
  it("uses the next daily open, applies both-side fees, and reports completed-trade metrics", () => {
    const candles = Array.from({ length: 390 }, (_, index) => {
      if (index < 30) return candle(index, 100);
      if (index < 60) return candle(index, 120);
      return candle(index, 80);
    });

    const result = runBacktest(candles);

    expect(result.execution).toBe("next daily open after a signal computed only from prior completed daily closes");
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]).toMatchObject({ entryPrice: 100.1, exitPrice: 99.9, exitReason: "death_cross" });
    expect(result.metrics).toMatchObject({ completedTrades: 1, winningTrades: 0, losingTrades: 1, winRate: 0, profitFactor: 0 });
    expect(result.metrics.endingCapital).toBeCloseTo(99_800.1998001998, 6);
    expect(result.metrics.buyAndHoldReturn).toBeCloseTo((80 * 0.999) / (100 * 1.001) - 1, 12);
  });
});
