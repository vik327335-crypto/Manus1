import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const watchlistSource = readFileSync(new URL("./Watchlist.tsx", import.meta.url), "utf8");

describe("Watchlist accuracy safeguards", () => {
  it("does not present seeded watchlist prices or aggregate value as verified market data", () => {
    expect(watchlistSource).toContain("No verified owner-scoped watchlist and fresh market-data source is attached");
    expect(watchlistSource).toContain("Watchlist data unavailable");
    expect(watchlistSource).not.toContain("mockWatchlist");
    expect(watchlistSource).not.toContain("websocketService");
    expect(watchlistSource).not.toContain("currentPrice");
    expect(watchlistSource).not.toContain("priceChange24h");
  });
});
