import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const nftPortfolioSource = readFileSync(new URL("./NFTPortfolio.tsx", import.meta.url), "utf8");

describe("NFTPortfolio accuracy safeguards", () => {
  it("does not restore source-ambiguous holdings, valuation, trend, or recommendation claims", () => {
    expect(nftPortfolioSource).toContain("NFT portfolio data is unavailable until holdings and valuation are auditable");
    expect(nftPortfolioSource).toContain("No NFT value, performance, rarity, trend, or recommendation is inferred");
    expect(nftPortfolioSource).not.toContain("getPortfolioOpenSea");
    expect(nftPortfolioSource).not.toContain("getMetrics");
    expect(nftPortfolioSource).not.toContain("getMarketTrends");
    expect(nftPortfolioSource).not.toContain("getRecommendations");
    expect(nftPortfolioSource).not.toContain("currentPrice");
    expect(nftPortfolioSource).not.toContain("floorPrice");
  });
});
