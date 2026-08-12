import { describe, expect, it } from "vitest";
import { selectCandidate } from "../../scripts/regime-aware-relative-momentum-research.mjs";

describe("relative momentum research selection", () => {
  it("requires both a sufficient sample and multi-fold profitability before ranking candidates", () => {
    const insufficientSample = {
      parameters: { momentumLookback: 20 },
      metrics: { completedTrades: 14, positiveFolds: 3, profitFactor: 9, meanAssetReturn: 1 },
    };
    const unstable = {
      parameters: { momentumLookback: 40 },
      metrics: { completedTrades: 20, positiveFolds: 1, profitFactor: 8, meanAssetReturn: 1 },
    };
    const accepted = {
      parameters: { momentumLookback: 20, topRank: 2 },
      metrics: { completedTrades: 18, positiveFolds: 2, profitFactor: 1.6, meanAssetReturn: 0.2 },
    };

    expect(selectCandidate([insufficientSample, unstable, accepted])).toBe(accepted);
  });
});
