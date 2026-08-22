import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

describe("routed accuracy boundary", () => {
  it("keeps known static/mock financial and social pages outside the route map", () => {
    for (const staticPage of [
      "AdminDashboard",
      "AlertManager",
      "AssetDetail",
      "HistoricalDataAnalysis",
      "PortfolioComparison",
      "ReportGenerator",
      "SocialTradingHub",
      "Strategies",
    ]) {
      expect(appSource).not.toContain(`pages/${staticPage}`);
    }

    expect(appSource).toContain('const Scanner = lazy(() => import("./pages/Scanner"))');
    expect(appSource).toContain('<Route path="/scanner" component={Scanner} />');
  });
});
