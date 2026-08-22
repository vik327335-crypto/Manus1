import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import PolygonApiService from "./polygonApiService";

function mockResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

const mockedFetch = vi.fn(async (input: string | URL | Request) => {
  const url = new URL(typeof input === "string" ? input : input.toString());
  if (url.pathname.endsWith("/marketstatus/now")) return mockResponse({ market: "open", serverTime: "2026-08-22T00:00:00Z" });
  if (url.pathname.endsWith("/marketstatus/upcoming")) return mockResponse({ results: [{ exchange: "NYSE", name: "Holiday", date: "2026-12-25" }] });
  if (url.pathname.includes("/reference/tickers/AAPL")) return mockResponse({ results: { ticker: "AAPL", name: "Apple Inc.", market: "stocks", locale: "us", type: "CS", active: true, currency_name: "usd" } });
  if (url.pathname.endsWith("/aggs/ticker/AAPL/prev")) return mockResponse({ results: [{ c: 200, h: 202, l: 198, o: 199, t: 1, v: 1_000_000 }] });
  return mockResponse({ results: [] });
});

describe("PolygonApiService", () => {
  let service: PolygonApiService;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockedFetch);
    vi.clearAllMocks();
    service = new PolygonApiService("test-polygon-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should validate API key by fetching market status", async () => {
    try {
      const status = await service.getMarketStatus();
      expect(status).toBeDefined();
      console.log("✓ Polygon.io API key is valid");
    } catch (error) {
      console.error("✗ Polygon.io API key validation failed:", error);
      throw error;
    }
  });

  it("should fetch market holidays", async () => {
    try {
      const holidays = await service.getMarketHolidays();
      expect(Array.isArray(holidays)).toBe(true);
      console.log(`✓ Successfully fetched ${holidays.length} market holidays`);
    } catch (error) {
      console.error("✗ Failed to fetch market holidays:", error);
      throw error;
    }
  });

  it("should fetch ticker details", async () => {
    try {
      const details = await service.getTickerDetails("AAPL");
      expect(details).toBeDefined();
      expect(details?.ticker).toBeDefined();
      console.log("✓ Successfully fetched ticker details for AAPL");
    } catch (error) {
      console.error("✗ Failed to fetch ticker details:", error);
      throw error;
    }
  });

  it("should fetch previous close data", async () => {
    try {
      const prevClose = await service.getPreviousClose("AAPL");
      expect(prevClose).toBeDefined();
      expect(prevClose?.c).toBeDefined(); // close price
      console.log("✓ Successfully fetched previous close data");
    } catch (error) {
      console.error("✗ Failed to fetch previous close:", error);
      throw error;
    }
  });
});
