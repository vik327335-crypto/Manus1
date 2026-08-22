import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const positionsSource = readFileSync(new URL("./DayTradingPositions.tsx", import.meta.url), "utf8");
const backtestingSource = readFileSync(new URL("./Backtesting.tsx", import.meta.url), "utf8");

describe("positions and backtesting accuracy safeguards", () => {
  it("does not manufacture positions, P&L, or price updates", () => {
    expect(positionsSource).toContain("не создаёт тестовые позиции");
    expect(positionsSource).toContain("Открытие позиции недоступно");
    expect(positionsSource).not.toContain("Math.random");
    expect(positionsSource).not.toContain("mockPositions");
  });

  it("does not present hardcoded backtest performance as a calculated result", () => {
    expect(backtestingSource).toContain("no verified historical-data run attached");
    expect(backtestingSource).toContain("Verified historical data required");
    expect(backtestingSource).not.toContain("const backtestResults");
    expect(backtestingSource).not.toContain("handleExportPDF");
  });
});
