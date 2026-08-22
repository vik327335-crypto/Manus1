import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tradersSource = readFileSync(new URL("./Traders.tsx", import.meta.url), "utf8");

describe("Traders accuracy safeguards", () => {
  it("does not restore synthetic trader performance or copy-trading actions", () => {
    expect(tradersSource).toContain("Trader performance data is unavailable until it is auditable");
    expect(tradersSource).toContain("No trader-performance values are inferred, simulated, ranked, or used for copy-trading");
    expect(tradersSource).not.toContain("mockTraders");
    expect(tradersSource).not.toContain("filteredTraders");
    expect(tradersSource).not.toContain("renderStars");
    expect(tradersSource).not.toContain("winRate");
    expect(tradersSource).not.toContain("avgReturn");
    expect(tradersSource).not.toContain("maxDrawdown");
    expect(tradersSource).not.toContain("copiedTrades");
  });
});
