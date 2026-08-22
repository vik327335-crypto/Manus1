import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const analyticsSource = readFileSync(new URL("./Analytics.tsx", import.meta.url), "utf8");

describe("Analytics accuracy safeguards", () => {
  it("does not calculate market analytics from static example data", () => {
    expect(analyticsSource).toContain("no verified analytical dataset with source, timestamp, freshness, and universe metadata");
    expect(analyticsSource).toContain("Топ активы по CAN SLIM Score");
    expect(analyticsSource).not.toContain("MOCK_DATA");
    expect(analyticsSource).not.toContain("priceChange24h");
    expect(analyticsSource).not.toContain("marketCap");
    expect(analyticsSource).not.toContain("avgScore");
  });
});
