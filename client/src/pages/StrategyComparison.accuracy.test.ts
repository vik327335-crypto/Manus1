import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const comparisonSource = readFileSync(new URL("./StrategyComparison.tsx", import.meta.url), "utf8");

describe("StrategyComparison accuracy safeguards", () => {
  it("does not restore source-ambiguous performance analytics, rankings, or exports", () => {
    expect(comparisonSource).toContain("Сравнение стратегий недоступно без проверяемых historical runs");
    expect(comparisonSource).toContain("показатели, ранжирование и экспорт результатов");
    expect(comparisonSource).not.toContain("getAllStrategiesMetrics");
    expect(comparisonSource).not.toContain("exportToCSV");
    expect(comparisonSource).not.toContain("exportToHTML");
    expect(comparisonSource).not.toContain("StrategyComparisonTable");
    expect(comparisonSource).not.toContain("StrategyMetricsCard");
    expect(comparisonSource).not.toContain("BarChart");
  });
});
