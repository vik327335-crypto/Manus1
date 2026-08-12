import { describe, expect, it } from "vitest";
import { aggregateFoldMetrics, selectCandidate } from "../../scripts/profit-factor-research.mjs";

function fold({ grossProfit, grossLoss, trades, returnValue, drawdown }: { grossProfit: number; grossLoss: number; trades: number; returnValue: number; drawdown: number }) {
  return {
    metrics: {
      grossProfit,
      grossLoss,
      completedTrades: trades,
      totalReturn: returnValue,
      maxDrawdown: drawdown,
    },
  };
}

describe("profit factor walk-forward research", () => {
  it("aggregates gross profit and loss across independently evaluated folds", () => {
    const metrics = aggregateFoldMetrics([
      fold({ grossProfit: 300, grossLoss: 100, trades: 4, returnValue: 0.1, drawdown: 0.08 }),
      fold({ grossProfit: 100, grossLoss: 200, trades: 5, returnValue: -0.05, drawdown: 0.15 }),
      fold({ grossProfit: 50, grossLoss: 50, trades: 3, returnValue: 0.03, drawdown: 0.1 }),
    ]);

    expect(metrics).toMatchObject({ completedTrades: 12, positiveFolds: 2, grossProfit: 450, grossLoss: 350, totalReturn: 0.08, maxDrawdown: 0.15 });
    expect(metrics.profitFactor).toBeCloseTo(450 / 350, 12);
  });

  it("rejects unstable candidates even if a single fold has an attractive profit factor", () => {
    const stable = {
      parameters: { fastPeriod: 10 },
      metrics: { completedTrades: 10, positiveFolds: 3, profitFactor: 2.1, totalReturn: 0.3 },
    };
    const unstable = {
      parameters: { fastPeriod: 5 },
      metrics: { completedTrades: 12, positiveFolds: 1, profitFactor: 9, totalReturn: 0.4 },
    };

    expect(selectCandidate([unstable, stable])).toBe(stable);
  });
});
