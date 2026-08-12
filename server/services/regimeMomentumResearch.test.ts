import { describe, expect, it } from "vitest";
import { calculateRsi, chooseCandidate } from "../../scripts/regime-momentum-research.mjs";

function candles(closes: number[]) {
  return closes.map((close, index) => ({
    openTime: Date.UTC(2020, 0, 1) + index * 86_400_000,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  }));
}

describe("regime and momentum research", () => {
  it("calculates RSI only from bars closed before the requested index", () => {
    const ascending = candles(Array.from({ length: 20 }, (_, index) => 100 + index));
    const descending = candles(Array.from({ length: 20 }, (_, index) => 120 - index));

    expect(calculateRsi(ascending, 15, 14)).toBe(100);
    expect(calculateRsi(descending, 15, 14)).toBe(0);
  });

  it("requires sufficient activity and multi-fold stability when selecting parameters", () => {
    const unstable = {
      parameters: { signalType: "momentum" },
      metrics: { completedTrades: 12, positiveFolds: 1, profitFactor: 9, totalReturn: 0.4 },
    };
    const stable = {
      parameters: { signalType: "sma_cross" },
      metrics: { completedTrades: 11, positiveFolds: 3, profitFactor: 1.8, totalReturn: 0.25 },
    };

    expect(chooseCandidate([unstable, stable])).toBe(stable);
  });
});
