import { describe, expect, it } from "vitest";
import { clearUsdPriceQuoteCache, getUsdPriceQuotes, normalizeExchangeAsset, valueBalancesInUsd } from "./exchangeBalanceValuationService";

describe("read-only exchange balance USD valuation", () => {
  it("normalizes exchange-specific balance symbols without guessing unknown assets", () => {
    expect(normalizeExchangeAsset("XXBT")).toBe("BTC");
    expect(normalizeExchangeAsset("zusd")).toBe("USD");
    expect(normalizeExchangeAsset("mystery")).toBe("MYSTERY");
  });

  it("assigns explicit USD stable assets a parity quote and leaves unknown assets unpriced", async () => {
    clearUsdPriceQuoteCache();
    const result = await getUsdPriceQuotes(["USD", "USDT", "MYSTERY"]);
    expect(result.quotes.USD).toMatchObject({ usdPrice: 1, source: "stablecoin_parity" });
    expect(result.quotes.USDT).toMatchObject({ usdPrice: 1, source: "stablecoin_parity" });
    expect(result.unpricedAssets).toEqual(["MYSTERY"]);
  });

  it("values available plus held amount only when a valid quote exists", () => {
    const valued = valueBalancesInUsd([{ asset: "BTC", available: "1.25", held: "0.25" }, { asset: "MYSTERY", available: "3", held: "0" }, { asset: "BAD", available: "not-a-number", held: "0" }], {
      BTC: { asset: "BTC", usdPrice: 100, source: "coingecko", quotedAt: new Date("2026-01-01T00:00:00.000Z") },
      BAD: { asset: "BAD", usdPrice: 5, source: "coingecko", quotedAt: new Date("2026-01-01T00:00:00.000Z") },
    });
    expect(valued[0]).toMatchObject({ normalizedAsset: "BTC", usdValue: 150, priceSource: "coingecko" });
    expect(valued[1]).toMatchObject({ normalizedAsset: "MYSTERY", usdValue: null, usdPrice: null });
    expect(valued[2]).toMatchObject({ normalizedAsset: "BAD", usdValue: null, usdPrice: 5 });
  });
});
