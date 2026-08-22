import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./DayTradingChart.tsx", import.meta.url), "utf8");

describe("DayTradingChart accuracy disclosure", () => {
  it("does not generate random intraday prices or trade signals without a verified feed", () => {
    expect(source).toContain("не генерирует случайные цены, индикаторы или сигналы");
    expect(source).toContain("Нет верифицированных intraday данных");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("generateMockCandles");
  });
});
