import { describe, it, expect, beforeEach } from "vitest";

// Mock alert condition types
interface AlertCondition {
  field: string;
  operator: "equals" | "gt" | "gte" | "lt" | "lte" | "between";
  value: any;
  value2?: any;
}

interface Asset {
  id: string;
  totalScore: number;
  priceChange24h: number;
  volume: number;
  [key: string]: any;
}

// Alert condition evaluation function
function evaluateCondition(asset: Asset, condition: AlertCondition): boolean {
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
    default:
      return false;
  }
}

describe("Alert Conditions", () => {
  let testAsset: Asset;

  beforeEach(() => {
    testAsset = {
      id: "BTC",
      totalScore: 85,
      priceChange24h: 5.5,
      volume: 1000000,
    };
  });

  describe("Price-based alerts", () => {
    it("should trigger alert when price is above threshold", () => {
      const condition: AlertCondition = {
        field: "priceChange24h",
        operator: "gt",
        value: 3,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(true);
    });

    it("should not trigger alert when price is below threshold", () => {
      const condition: AlertCondition = {
        field: "priceChange24h",
        operator: "gt",
        value: 10,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(false);
    });

    it("should handle between operator for price ranges", () => {
      const condition: AlertCondition = {
        field: "priceChange24h",
        operator: "between",
        value: 0,
        value2: 10,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(true);
    });
  });

  describe("Score-based alerts", () => {
    it("should trigger alert for high CAN SLIM scores", () => {
      const condition: AlertCondition = {
        field: "totalScore",
        operator: "gte",
        value: 80,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(true);
    });

    it("should not trigger alert for low CAN SLIM scores", () => {
      const condition: AlertCondition = {
        field: "totalScore",
        operator: "gte",
        value: 90,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(false);
    });
  });

  describe("Volume-based alerts", () => {
    it("should trigger alert for high volume", () => {
      const condition: AlertCondition = {
        field: "volume",
        operator: "gte",
        value: 500000,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(true);
    });

    it("should handle volume surge detection", () => {
      const condition: AlertCondition = {
        field: "volume",
        operator: "gt",
        value: 1500000,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should return false for missing fields", () => {
      const condition: AlertCondition = {
        field: "nonexistent",
        operator: "gt",
        value: 50,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(false);
    });

    it("should handle equality checks", () => {
      const condition: AlertCondition = {
        field: "id",
        operator: "equals",
        value: "BTC",
      };
      expect(evaluateCondition(testAsset, condition)).toBe(true);
    });

    it("should handle less than operator", () => {
      const condition: AlertCondition = {
        field: "priceChange24h",
        operator: "lt",
        value: 10,
      };
      expect(evaluateCondition(testAsset, condition)).toBe(true);
    });
  });

  describe("Multiple conditions", () => {
    it("should evaluate multiple conditions (AND logic)", () => {
      const conditions: AlertCondition[] = [
        { field: "totalScore", operator: "gte", value: 80 },
        { field: "priceChange24h", operator: "gt", value: 0 },
      ];

      const allMatch = conditions.every((c) => evaluateCondition(testAsset, c));
      expect(allMatch).toBe(true);
    });

    it("should handle complex filter combinations", () => {
      const conditions: AlertCondition[] = [
        { field: "totalScore", operator: "between", value: 70, value2: 90 },
        { field: "priceChange24h", operator: "between", value: 0, value2: 10 },
        { field: "volume", operator: "gte", value: 100000 },
      ];

      const allMatch = conditions.every((c) => evaluateCondition(testAsset, c));
      expect(allMatch).toBe(true);
    });
  });
});
