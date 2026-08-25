import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCoinbasePublicQuote, getCoinbasePublicQuoteHealth, resetCoinbasePublicQuoteStateForTesting } from "./coinbasePublicQuoteService";

const fetchMock = vi.fn();

describe("coinbase public quote service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    resetCoinbasePublicQuoteStateForTesting();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a validated public read-only quote with provenance", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ price: "60000.5", bid: "60000", ask: "60001", time: "2024-09-01T00:00:00.000Z" }), { status: 200 }));

    const quote = await getCoinbasePublicQuote("btc");

    expect(quote).toMatchObject({ ticker: "BTC", source: "coinbase_exchange", availability: "available", priceUsd: 60000.5, cacheAgeMs: 0 });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/products/BTC-USD/ticker"), expect.any(Object));
  });

  it("uses one retry for HTTP 429 and reports an explicit unavailable result", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "0" } }));
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "2" } }));

    const quote = await getCoinbasePublicQuote("BTC");
    const health = getCoinbasePublicQuoteHealth();

    expect(quote).toMatchObject({ availability: "unavailable", priceUsd: null, error: { code: "rate_limited", retryAfterMs: 2000 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(health.rateLimitEvents).toBe(2);
    expect(health.lastRetryAfterMs).toBe(2000);
  });

  it("rejects malformed prices instead of returning a zero quote", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ price: "0", bid: "0", ask: "0", time: "bad-time" }), { status: 200 }));

    const quote = await getCoinbasePublicQuote("BTC");

    expect(quote).toMatchObject({ availability: "unavailable", priceUsd: null, error: { code: "invalid_response" } });
  });
});
