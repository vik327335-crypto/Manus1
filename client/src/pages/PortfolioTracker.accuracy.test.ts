import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const trackerSource = readFileSync(new URL("./PortfolioTracker.tsx", import.meta.url), "utf8");

describe("PortfolioTracker accuracy safeguards", () => {
  it("does not present seeded positions or client-supplied valuation as verified analytics", () => {
    expect(trackerSource).toContain("No verified owner-scoped holdings or fresh price source is attached");
    expect(trackerSource).toContain("Manual Research Positions");
    expect(trackerSource).not.toContain("currentPrice");
    expect(trackerSource).not.toContain("calculatePortfolioMetrics");
    expect(trackerSource).not.toContain("calculateRiskMetrics");
    expect(trackerSource).not.toContain("generateRebalancingRecommendations");
  });
});
