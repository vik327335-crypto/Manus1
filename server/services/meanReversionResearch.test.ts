import { describe, expect, it } from "vitest";
import { selectCandidate } from "../../scripts/regime-aware-mean-reversion-research.mjs";

describe("mean reversion research selection", () => {
  it("rejects candidates that fail diversification or multi-fold profitability gates", () => {
    const concentrated = {
      parameters: { rsiEntry: 30 },
      metrics: { completedTrades: 24, positiveFolds: 3, profitFactor: 2.1, meanAssetReturn: 0.3, maxHhi: 0.71 },
    };
    const oneGoodFold = {
      parameters: { rsiEntry: 35 },
      metrics: { completedTrades: 30, positiveFolds: 1, profitFactor: 4, meanAssetReturn: 0.6, maxHhi: 0.4 },
    };
    const acceptable = {
      parameters: { rsiEntry: 25, bandMultiplier: 2 },
      metrics: { completedTrades: 22, positiveFolds: 2, profitFactor: 1.7, meanAssetReturn: 0.1, maxHhi: 0.45 },
    };

    expect(selectCandidate([concentrated, oneGoodFold, acceptable])).toBe(acceptable);
  });

  it("returns no candidate when every proposed rule violates at least one preregistered gate", () => {
    const insufficientTrades = {
      parameters: { rsiEntry: 25 },
      metrics: { completedTrades: 17, positiveFolds: 3, profitFactor: 2, meanAssetReturn: 0.2, maxHhi: 0.4 },
    };
    const unprofitable = {
      parameters: { rsiEntry: 30 },
      metrics: { completedTrades: 24, positiveFolds: 2, profitFactor: 0.8, meanAssetReturn: -0.1, maxHhi: 0.4 },
    };

    expect(selectCandidate([insufficientTrades, unprofitable])).toBeNull();
  });
});
