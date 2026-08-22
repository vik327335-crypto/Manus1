import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const defiSource = readFileSync(new URL("./DeFiIntegration.tsx", import.meta.url), "utf8");

describe("DeFiIntegration accuracy and safety safeguards", () => {
  it("does not restore source-ambiguous DeFi claims or execution actions", () => {
    expect(defiSource).toContain("DeFi market and yield data is unavailable until it is auditable");
    expect(defiSource).toContain("No DeFi market value, yield estimate, routing result, allocation suggestion, or");
    expect(defiSource).not.toContain("getUniswapPool");
    expect(defiSource).not.toContain("calculateSwapRoute");
    expect(defiSource).not.toContain("getAaveMarkets");
    expect(defiSource).not.toContain("getCurvePool");
    expect(defiSource).not.toContain("getYieldFarmingOpportunities");
    expect(defiSource).not.toContain("executeUniswapSwap");
    expect(defiSource).not.toContain("lendOnAave");
    expect(defiSource).not.toContain("borrowFromAave");
    expect(defiSource).not.toContain("provideLiquidityToCurve");
  });
});
