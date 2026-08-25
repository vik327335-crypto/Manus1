import { describe, expect, it, vi } from "vitest";

const valuesMock = vi.fn().mockResolvedValue(undefined);
const insertMock = vi.fn(() => ({ values: valuesMock }));

vi.mock("../db", () => ({ getDb: vi.fn(async () => ({ insert: insertMock })) }));

import { persistOHLCVAuditSnapshot } from "./ohlcvAuditSnapshotService";

describe("OHLCV audit snapshot persistence", () => {
  it("writes a content-addressed snapshot only for fresh verified provider data", async () => {
    const result = await persistOHLCVAuditSnapshot({
      ticker: "BTC",
      data: [{ timestamp: Date.UTC(2024, 8, 1), date: "2024-09-01", open: 60000, high: 61000, low: 59000, close: 60500, volume: 12 }],
      startDate: "2024-09-01",
      endDate: "2024-09-01",
      timeframe: "day",
      dataPoints: 1,
      availability: "available",
      source: "polygon",
      fetchedAt: Date.UTC(2024, 8, 2),
      cacheAgeMs: 0,
      coverageStartDate: "2024-09-01",
      coverageEndDate: "2024-09-01",
    });

    expect(result.persisted).toBe(true);
    expect(result.responseHash).toMatch(/^[a-f0-9]{64}$/);
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({ ticker: "BTC", responseHash: result.responseHash, dataPoints: 1 }));
  });

  it("refuses cached or unavailable provider data", async () => {
    const result = await persistOHLCVAuditSnapshot({
      ticker: "BTC", data: [], startDate: "2024-09-01", endDate: "2024-09-01", timeframe: "day", dataPoints: 0,
      availability: "unavailable", source: "polygon", fetchedAt: null, cacheAgeMs: null, coverageStartDate: null, coverageEndDate: null,
      error: { code: "no_data", message: "No verified data." },
    });

    expect(result).toEqual({ persisted: false, responseHash: null });
  });
});
