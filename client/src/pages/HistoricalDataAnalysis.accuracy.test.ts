import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("HistoricalDataAnalysis accuracy guard", () => {
  it("does not restore demo OHLCV fallback or demo source labeling", () => {
    const pageSource = readFileSync(new URL("./HistoricalDataAnalysis.tsx", import.meta.url), "utf8");
    const clientSource = readFileSync(new URL("../lib/polygonClient.ts", import.meta.url), "utf8");

    expect(pageSource).not.toContain("generateFallbackOHLCV");
    expect(pageSource).not.toContain("Demo Data");
    expect(clientSource).not.toContain("generateFallbackOHLCV");
    expect(clientSource).not.toContain("Math.random");
  });
});
