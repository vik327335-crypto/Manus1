import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("./StrategyDashboard.tsx", import.meta.url), "utf8");

describe("StrategyDashboard accuracy safeguards", () => {
  it("does not restore random or source-ambiguous strategy analytics", () => {
    expect(dashboardSource).toContain("Аналитика стратегий недоступна без проверяемого historical run");
    expect(dashboardSource).toContain("показатели стратегий, ранжирование и экспорт результатов");
    expect(dashboardSource).not.toContain("Math.random");
    expect(dashboardSource).not.toContain("LineChart");
    expect(dashboardSource).not.toContain("BarChart");
    expect(dashboardSource).not.toContain("strategyHistory.getAllSnapshots");
    expect(dashboardSource).not.toContain("compareStrategyByPeriods");
  });
});
