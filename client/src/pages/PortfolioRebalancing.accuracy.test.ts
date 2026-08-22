import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rebalancingSource = readFileSync(new URL("./PortfolioRebalancing.tsx", import.meta.url), "utf8");

describe("PortfolioRebalancing accuracy safeguards", () => {
  it("does not restore advisory-like allocation, valuation, or trade-action output", () => {
    expect(rebalancingSource).toContain("Allocation and rebalancing output is unavailable until holdings are auditable");
    expect(rebalancingSource).toContain("No portfolio value, allocation recommendation, fee estimate, or transaction action is");
    expect(rebalancingSource).not.toContain("previewPlan");
    expect(rebalancingSource).not.toContain("currentPrice");
    expect(rebalancingSource).not.toContain("targetAllocation");
    expect(rebalancingSource).not.toContain('trade.action === "BUY"');
    expect(rebalancingSource).not.toContain('trade.action === "SELL"');
    expect(rebalancingSource).not.toContain("Suggested adjustments");
  });
});
