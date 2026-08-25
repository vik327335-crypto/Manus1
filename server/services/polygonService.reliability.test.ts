import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  clearHistoricalOHLCVCache,
  getHistoricalOHLCV,
  getHistoricalOHLCVProviderHealth,
  resetHistoricalOHLCVProviderHealthForTesting,
} from "./polygonService";

const validPayload = {
  status: "OK",
  results: [
    { t: Date.UTC(2024, 8, 1), o: 60_000, h: 61_000, l: 59_500, c: 60_500, v: 100, vw: 60_200 },
    { t: Date.UTC(2024, 8, 2), o: 60_500, h: 62_000, l: 60_000, c: 61_500, v: 120, vw: 61_000 },
  ],
};

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe("polygonService historical OHLCV reliability", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("POLYGON_API_KEY", "test-polygon-key");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    clearHistoricalOHLCVCache();
    resetHistoricalOHLCVProviderHealthForTesting();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns validated UTC OHLCV with source, coverage and freshness metadata", async () => {
    fetchMock.mockResolvedValue(jsonResponse(validPayload));

    const response = await getHistoricalOHLCV("btc", "2024-09-01", "2024-09-02", "day");

    expect(response.availability).toBe("available");
    expect(response.source).toBe("polygon");
    expect(response.data).toHaveLength(2);
    expect(response.data[0]).toMatchObject({ date: "2024-09-01", open: 60_000, close: 60_500 });
    expect(response.coverageStartDate).toBe("2024-09-01");
    expect(response.coverageEndDate).toBe("2024-09-02");
    expect(response.fetchedAt).not.toBeNull();
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toContain("/X:BTCUSD/range/1/day/2024-09-01/2024-09-02");
  });

  it("retries once after 429 and records retry-after rate-limit telemetry", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ status: "ERROR" }, 429, { "retry-after": "0" }))
      .mockResolvedValueOnce(jsonResponse(validPayload));

    const response = await getHistoricalOHLCV("BTC", "2024-09-01", "2024-09-02", "day");
    const health = getHistoricalOHLCVProviderHealth();

    expect(response.availability).toBe("available");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(health.rateLimitEvents).toBe(1);
    expect(health.lastRetryAfterMs).toBe(0);
    expect(health.consecutiveFailures).toBe(0);
  });

  it("returns explicit unavailable data after a persistent 429 without inventing bars", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "ERROR" }, 429, { "retry-after": "0" }));

    const response = await getHistoricalOHLCV("BTC", "2024-09-01", "2024-09-02", "day");

    expect(response).toMatchObject({ availability: "unavailable", data: [], source: "polygon" });
    expect(response.error?.code).toBe("rate_limited");
    expect(response.error?.retryAfterMs).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed provider bars instead of replacing them with synthetic history", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "OK", results: [{ t: 1, o: 1, h: 0.5, l: 0.8, c: 1, v: 3 }] }));

    const response = await getHistoricalOHLCV("BTC", "2024-09-01", "2024-09-02", "day");

    expect(response).toMatchObject({ availability: "unavailable", data: [] });
    expect(response.error?.code).toBe("no_data");
  });

  it("reports unconfigured providers explicitly", async () => {
    vi.stubEnv("POLYGON_API_KEY", "");

    const response = await getHistoricalOHLCV("BTC", "2024-09-01", "2024-09-02", "day");

    expect(response).toMatchObject({ availability: "unavailable", data: [] });
    expect(response.error?.code).toBe("provider_not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps both Polygon service paths free from synthetic OHLCV fallback generation", () => {
    const serviceSource = readFileSync(new URL("./polygonService.ts", import.meta.url), "utf8");
    const integrationSource = readFileSync(new URL("./polygonIntegration.ts", import.meta.url), "utf8");

    expect(serviceSource).not.toContain("Math.random");
    expect(serviceSource).not.toContain("generateMockHistoricalData");
    expect(integrationSource).not.toContain("generateFallbackOHLCV");
    expect(integrationSource).not.toContain("Math.random");
  });
});
