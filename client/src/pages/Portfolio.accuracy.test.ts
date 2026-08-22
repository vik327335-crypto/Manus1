import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const portfolioSource = readFileSync(new URL("./Portfolio.tsx", import.meta.url), "utf8");

describe("portfolio accuracy safeguards", () => {
  it("does not present placeholder current prices or derived P&L as verified valuation", () => {
    expect(portfolioSource).toContain("no verified current-price or holdings source");
    expect(portfolioSource).toContain("Holdings and Valuation Unavailable");
    expect(portfolioSource).not.toContain("currentPrice.toFixed");
    expect(portfolioSource).not.toContain("totalGainPercent.toFixed");
    expect(portfolioSource).not.toContain("getNetworkActivity.useQuery");
  });
});
