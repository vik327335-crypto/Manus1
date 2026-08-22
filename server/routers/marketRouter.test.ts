import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({
  getCoinData: vi.fn(),
  getGlobalData: vi.fn(),
  getBitcoin200EMA: vi.fn(),
}));

vi.mock("../services/coingeckoService", () => provider);

import { marketRouter } from "./marketRouter";

const caller = marketRouter.createCaller({} as never);

describe("marketRouter verified-data contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    provider.getCoinData.mockResolvedValue({ current_price: 65_000, price_change_percentage_24h: 2.5, market_cap: 1_250_000_000_000 });
    provider.getGlobalData.mockResolvedValue({ btc_dominance: 52, eth_dominance: 17, market_cap_change_24h: 1.4, fear_greed_index: null });
    provider.getBitcoin200EMA.mockResolvedValue({ ema200: 60_000, price: 65_000, status: "above" });
  });

  it("returns a verified trend with explicit absent Fear & Greed data", async () => {
    const result = await caller.trend();
    expect(result).toMatchObject({ available: true, source: "coingecko", btcPrice: 65_000, btc200EMA: 60_000, fearGreedIndex: null });
  });

  it("returns unavailable instead of synthetic neutral zeroes when a trend input is missing", async () => {
    provider.getGlobalData.mockResolvedValue(null);
    const result = await caller.trend();
    expect(result).toEqual({ available: false, source: "coingecko", reason: "Verified market trend data is currently unavailable" });
    expect(result).not.toHaveProperty("btcPrice");
  });

  it("returns unavailable instead of a zero-valued BTC quote", async () => {
    provider.getCoinData.mockResolvedValue(null);
    const result = await caller.btcPrice();
    expect(result).toEqual({ available: false, source: "coingecko", reason: "Verified BTC quote is currently unavailable" });
    expect(result).not.toHaveProperty("price");
  });
});
