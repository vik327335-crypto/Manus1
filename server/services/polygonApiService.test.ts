import { describe, it, expect, beforeAll } from "vitest";
import PolygonApiService from "./polygonApiService";

describe("PolygonApiService", () => {
  let service: PolygonApiService;

  beforeAll(() => {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error("POLYGON_API_KEY environment variable is not set");
    }
    service = new PolygonApiService(apiKey);
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
