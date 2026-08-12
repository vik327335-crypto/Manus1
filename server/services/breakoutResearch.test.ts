import { describe, expect, it } from "vitest";
import { selectCandidate } from "../../scripts/volatility-compression-breakout-research.mjs";

describe("breakout research selection", () => {
  it("requires trade count, multi-fold stability, positive profitability and diversification together", () => {
    const sparse = {
      parameters: { breakoutLookback: 20 },
      metrics: { completedTrades: 17, positiveFolds: 3, profitFactor: 3, meanAssetReturn: 0.5, maxHhi: 0.3 },
    };
    const concentrated = {
      parameters: { breakoutLookback: 40 },
      metrics: { completedTrades: 25, positiveFolds: 3, profitFactor: 2, meanAssetReturn: 0.4, maxHhi: 0.71 },
    };
    const accepted = {
      parameters: { breakoutLookback: 20, compressionThreshold: 0.12 },
      metrics: { completedTrades: 20, positiveFolds: 2, profitFactor: 1.6, meanAssetReturn: 0.1, maxHhi: 0.4 },
    };

    expect(selectCandidate([sparse, concentrated, accepted])).toBe(accepted);
    expect(selectCandidate([sparse, concentrated])).toBeNull();
  });
});
