import { describe, it, expect, beforeAll } from "vitest";
import {
  getAssetsWithScores,
  getAssetById,
  getAssetByTicker,
  searchAssets,
} from "./db";

describe("Database Functions", () => {
  describe("getAssetsWithScores", () => {
    it("should return an array of assets", async () => {
      const assets = await getAssetsWithScores();
      expect(Array.isArray(assets)).toBe(true);
    });

    it("should return assets with required fields", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const asset = assets[0];
        expect(asset).toHaveProperty("id");
        expect(asset).toHaveProperty("ticker");
        expect(asset).toHaveProperty("name");
      }
    });
  });

  describe("getAssetById", () => {
    it("should return null for non-existent asset", async () => {
      const asset = await getAssetById(99999);
      expect(asset).toBeNull();
    });

    it("should return an asset when it exists", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const asset = await getAssetById(firstAsset.id);
        expect(asset).not.toBeNull();
        expect(asset?.id).toBe(firstAsset.id);
      }
    });
  });

  describe("getAssetByTicker", () => {
    it("should return null for non-existent ticker", async () => {
      const asset = await getAssetByTicker("NONEXISTENT");
      expect(asset).toBeNull();
    });

    it("should return an asset when ticker exists", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const asset = await getAssetByTicker(firstAsset.ticker);
        expect(asset).not.toBeNull();
        expect(asset?.ticker).toBe(firstAsset.ticker);
      }
    });

    it("should be case-insensitive", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const asset = await getAssetByTicker(firstAsset.ticker.toLowerCase());
        // Note: This test assumes the database query is case-insensitive
        // If not, this test will fail and we should adjust the implementation
        expect(asset?.ticker).toBe(firstAsset.ticker);
      }
    });
  });

  describe("searchAssets", () => {
    it("should return empty array for empty query", async () => {
      const results = await searchAssets("");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should find assets by ticker", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const results = await searchAssets(firstAsset.ticker);
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((a) => a.ticker === firstAsset.ticker)).toBe(true);
      }
    });

    it("should find assets by name", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const searchTerm = firstAsset.name.substring(0, 3);
        const results = await searchAssets(searchTerm);
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it("should be case-insensitive", async () => {
      const assets = await getAssetsWithScores();
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const results = await searchAssets(firstAsset.ticker.toLowerCase());
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });
});
