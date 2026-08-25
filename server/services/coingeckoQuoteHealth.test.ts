import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache, getCoinGeckoQuoteHealth, getCurrentPrice } from "./coingecko";

const fetchMock = vi.fn();

describe("CoinGecko quote health telemetry", () => {
  beforeEach(() => {
    clearCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records a 429 as an unavailable quote without synthesizing a price", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "3" } }));

    const quote = await getCurrentPrice("BTC");
    const health = getCoinGeckoQuoteHealth();

    expect(quote).toBeNull();
    expect(health).toMatchObject({ source: "coingecko", lastStatus: 429, rateLimitEvents: 1, consecutiveFailures: 1, lastRetryAfterMs: 3000 });
  });
});
