import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("./Dashboard.tsx", import.meta.url), "utf8");

describe("Dashboard accuracy safeguards", () => {
  it("does not restore synthetic market previews, score cards, or export", () => {
    expect(dashboardSource).toContain("No market or score values are inferred, simulated, or exported from this screen.");
    expect(dashboardSource).toContain("No verified dashboard asset universe is currently available.");
    expect(dashboardSource).not.toContain("mockAssets");
    expect(dashboardSource).not.toContain("mockMarketTrend");
    expect(dashboardSource).not.toContain("DashboardExportButton");
    expect(dashboardSource).not.toContain("MarketTrendIndicator");
    expect(dashboardSource).not.toContain("ScoreIndicator");
  });
});
