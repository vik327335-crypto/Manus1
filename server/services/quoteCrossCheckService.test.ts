import { describe, expect, it, vi } from "vitest";

vi.mock("./coingecko", () => ({ getCurrentPrice: vi.fn() }));
vi.mock("./coinbasePublicQuoteService", () => ({ getCoinbasePublicQuote: vi.fn() }));

import { getCurrentPrice } from "./coingecko";
import { getCoinbasePublicQuote } from "./coinbasePublicQuoteService";
import { crossCheckUsdQuote } from "./quoteCrossCheckService";

const primaryMock = vi.mocked(getCurrentPrice);
const reserveMock = vi.mocked(getCoinbasePublicQuote);

describe("quote cross-check service", () => {
  it("reports matched quotes without replacing the primary source", async () => {
    primaryMock.mockResolvedValueOnce({ price: 60000, marketCap: 1, volume24h: 1, priceChange24h: 0, priceChangePercent24h: 0, source: "coingecko", fetchedAt: 100, cacheAgeMs: 0 });
    reserveMock.mockResolvedValueOnce({ ticker: "BTC", source: "coinbase_exchange", availability: "available", priceUsd: 60030, bidUsd: 60020, askUsd: 60040, providerTimestamp: 90, fetchedAt: 100, cacheAgeMs: 0 });

    const result = await crossCheckUsdQuote("btc");

    expect(result).toMatchObject({ availability: "available", verdict: "matched", thresholdBps: 150, primary: { source: "coingecko", priceUsd: 60000 }, secondary: { source: "coinbase_exchange", priceUsd: 60030 } });
  });

  it("marks divergence explicitly and never chooses a replacement quote", async () => {
    primaryMock.mockResolvedValueOnce({ price: 60000, marketCap: 1, volume24h: 1, priceChange24h: 0, priceChangePercent24h: 0, source: "coingecko", fetchedAt: 100, cacheAgeMs: 0 });
    reserveMock.mockResolvedValueOnce({ ticker: "BTC", source: "coinbase_exchange", availability: "available", priceUsd: 61500, bidUsd: 61490, askUsd: 61510, providerTimestamp: 90, fetchedAt: 100, cacheAgeMs: 0 });

    const result = await crossCheckUsdQuote("BTC");

    expect(result).toMatchObject({ availability: "available", verdict: "divergent", primary: { priceUsd: 60000 }, secondary: { priceUsd: 61500 } });
  });
});
