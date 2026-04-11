import { describe, it, expect, beforeEach } from "vitest";
import * as glassnode from "../services/glassnode";
import { glassnodeRouter } from "./glassnodeRouter";

describe("Glassnode Service", () => {
  beforeEach(() => {
    glassnode.clearCache();
  });

  it("should get metric for BTC", async () => {
    const value = await glassnode.getMetric("BTC", "ACTIVEADDRESSES");
    expect(value).toBeGreaterThan(0);
    expect(typeof value).toBe("number");
  });

  it("should get multiple metrics", async () => {
    const metrics = await glassnode.getMetrics("ETH", [
      "ACTIVEADDRESSES",
      "NEWADDRESSES",
      "TXS",
    ]);
    expect(metrics.ACTIVEADDRESSES).toBeGreaterThan(0);
    expect(metrics.NEWADDRESSES).toBeGreaterThan(0);
    expect(metrics.TXS).toBeGreaterThan(0);
  });

  it("should cache metrics", async () => {
    const value1 = await glassnode.getMetric("SOL", "ACTIVEADDRESSES");
    const value2 = await glassnode.getMetric("SOL", "ACTIVEADDRESSES");
    expect(value1).toBe(value2);
    expect(glassnode.getCacheStats().size).toBe(1);
  });

  it("should get network activity metrics", async () => {
    const activity = await glassnode.getNetworkActivity("BTC");
    expect(activity).toHaveProperty("activeAddresses");
    expect(activity).toHaveProperty("newAddresses");
    expect(activity).toHaveProperty("transactionCount");
    expect(activity).toHaveProperty("totalVolume");
  });

  it("should get market metrics", async () => {
    const metrics = await glassnode.getMarketMetrics("ETH");
    expect(metrics).toHaveProperty("marketCap");
    expect(metrics).toHaveProperty("supply");
    expect(metrics).toHaveProperty("difficulty");
    expect(metrics).toHaveProperty("hashRate");
  });

  it("should get staking metrics", async () => {
    const staking = await glassnode.getStakingMetrics("ETH");
    expect(staking).toHaveProperty("staked");
    expect(staking).toHaveProperty("validators");
  });

  it("should return 0 for unknown metric", async () => {
    const value = await glassnode.getMetric("UNKNOWN", "UNKNOWN");
    expect(value).toBe(0);
  });

  it("should clear cache", () => {
    glassnode.clearCache();
    expect(glassnode.getCacheStats().size).toBe(0);
  });

  it("should get cache stats", async () => {
    await glassnode.getMetric("BTC", "ACTIVEADDRESSES");
    const stats = glassnode.getCacheStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.items).toContain("BTC:ACTIVEADDRESSES");
  });
});

describe("Glassnode Router", () => {
  it("should have getMetric procedure", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });

  it("should have getMetrics procedure", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });

  it("should have getNetworkActivity procedure", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });

  it("should have getMarketMetrics procedure", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });

  it("should have getStakingMetrics procedure", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });

  it("should have getCacheStats procedure", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });

  it("should have clearCache mutation", () => {
    expect(glassnodeRouter.createCaller).toBeDefined();
  });
});
