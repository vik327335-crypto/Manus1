import { describe, expect, it } from "vitest";
import { calculateRollingMetrics, classifyMonitorStatus } from "./paperTradingMonitorService";

describe("paperTradingMonitorService", () => {
  it("calculates profit factor, win rate, and drawdown from closed virtual trades", () => {
    const metrics = calculateRollingMetrics(
      [{ pnlCents: 1_000 }, { pnlCents: -500 }, { pnlCents: -500 }],
      [10_000, 12_000, 9_000]
    );

    expect(metrics).toEqual({
      trades: 3,
      profitFactorMilli: 1_000,
      winRateBps: 3_333,
      maxDrawdownBps: 2_500,
    });
  });

  it("marks an underperforming monitored model as degraded only after enough trade history", () => {
    const lowPfMetrics = { trades: 6, profitFactorMilli: 900, winRateBps: 3_333, maxDrawdownBps: 1_000 };
    const lowSampleMetrics = { trades: 2, profitFactorMilli: 900, winRateBps: 5_000, maxDrawdownBps: 500 };

    expect(classifyMonitorStatus(lowPfMetrics, 100, 200)).toBe("degraded");
    expect(classifyMonitorStatus(lowSampleMetrics, 100, 200)).toBe("watch");
  });

  it("marks a sufficiently sampled, profitable model with benchmark outperformance as healthy", () => {
    const metrics = { trades: 8, profitFactorMilli: 1_750, winRateBps: 6_250, maxDrawdownBps: 1_200 };

    expect(classifyMonitorStatus(metrics, 650, 100)).toBe("healthy");
  });
});
