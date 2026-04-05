import { describe, it, expect } from "vitest";

interface FilterCondition {
  field: string;
  operator: "equals" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "contains";
  value: any;
  value2?: any;
}

interface Asset {
  id: string;
  name: string;
  totalScore: number;
  priceChange24h: number;
  [key: string]: any;
}

function applyFilter(assets: Asset[], condition: FilterCondition): Asset[] {
  return assets.filter((asset) => {
    const value = asset[condition.field];
    if (value === undefined) return false;

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "gt":
        return value > condition.value;
      case "gte":
        return value >= condition.value;
      case "lt":
        return value < condition.value;
      case "lte":
        return value <= condition.value;
      case "between":
        return value >= condition.value && value <= condition.value2;
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      case "contains":
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return true;
    }
  });
}

describe("Filter Logic", () => {
  const testAssets: Asset[] = [
    { id: "BTC", name: "Bitcoin", totalScore: 90, priceChange24h: 5.5 },
    { id: "ETH", name: "Ethereum", totalScore: 75, priceChange24h: 3.2 },
    { id: "ADA", name: "Cardano", totalScore: 65, priceChange24h: -1.5 },
    { id: "SOL", name: "Solana", totalScore: 85, priceChange24h: 8.1 },
    { id: "XRP", name: "XRPcoin", totalScore: 55, priceChange24h: -2.3 },
  ];

  describe("Single filter conditions", () => {
    it("should filter by score threshold", () => {
      const condition: FilterCondition = {
        field: "totalScore",
        operator: "gte",
        value: 80,
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(["BTC", "SOL"]);
    });

    it("should filter by price change", () => {
      const condition: FilterCondition = {
        field: "priceChange24h",
        operator: "gt",
        value: 0,
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(3);
    });

    it("should filter using between operator", () => {
      const condition: FilterCondition = {
        field: "totalScore",
        operator: "between",
        value: 70,
        value2: 85,
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(["ETH", "SOL"]);
    });

    it("should filter using in operator", () => {
      const condition: FilterCondition = {
        field: "id",
        operator: "in",
        value: ["BTC", "ETH", "SOL"],
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(3);
    });

    it("should filter using contains operator", () => {
      const condition: FilterCondition = {
        field: "name",
        operator: "contains",
        value: "coin",
      };
      const result = applyFilter(testAssets, condition);
      // "Bitcoin" and "XRPcoin" contain "coin" (case-insensitive)
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(["BTC", "XRP"]);
    });
  });

  describe("Multiple filter combinations", () => {
    it("should apply multiple filters (AND logic)", () => {
      const conditions: FilterCondition[] = [
        { field: "totalScore", operator: "gte", value: 70 },
        { field: "priceChange24h", operator: "gt", value: 0 },
      ];

      let result = testAssets;
      for (const condition of conditions) {
        result = applyFilter(result, condition);
      }

      // BTC (90, 5.5), ETH (75, 3.2), SOL (85, 8.1) match both conditions
      expect(result).toHaveLength(3);
      expect(result.map((a) => a.id)).toEqual(["BTC", "ETH", "SOL"]);
    });

    it("should handle complex filter chains", () => {
      const conditions: FilterCondition[] = [
        { field: "totalScore", operator: "between", value: 60, value2: 90 },
        { field: "priceChange24h", operator: "between", value: -2, value2: 10 },
      ];

      let result = testAssets;
      for (const condition of conditions) {
        result = applyFilter(result, condition);
      }

      // BTC, ETH, ADA, SOL match (XRP -2.3 is outside price range -2 to 10)
      expect(result).toHaveLength(4);
    });
  });

  describe("Edge cases", () => {
    it("should return empty array when no matches", () => {
      const condition: FilterCondition = {
        field: "totalScore",
        operator: "gte",
        value: 100,
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(0);
    });

    it("should handle missing fields gracefully", () => {
      const condition: FilterCondition = {
        field: "nonexistent",
        operator: "gt",
        value: 50,
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(0);
    });

    it("should be case-insensitive for contains", () => {
      const condition: FilterCondition = {
        field: "name",
        operator: "contains",
        value: "BITCOIN",
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("BTC");
    });

    it("should handle partial string matches", () => {
      const condition: FilterCondition = {
        field: "name",
        operator: "contains",
        value: "eth",
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(1);
      expect(result.map((a) => a.id)).toEqual(["ETH"]);
    });
  });

  describe("Filter presets", () => {
    it("should filter high score assets", () => {
      const condition: FilterCondition = {
        field: "totalScore",
        operator: "gt",
        value: 80,
      };
      const result = applyFilter(testAssets, condition);
      expect(result).toHaveLength(2);
    });

    it("should filter bullish trend assets", () => {
      const conditions: FilterCondition[] = [
        { field: "priceChange24h", operator: "gt", value: 0 },
        { field: "totalScore", operator: "gt", value: 70 },
      ];

      let result = testAssets;
      for (const condition of conditions) {
        result = applyFilter(result, condition);
      }

      // BTC (5.5, 90), ETH (3.2, 75), SOL (8.1, 85) match both
      expect(result).toHaveLength(3);
    });
  });
});
