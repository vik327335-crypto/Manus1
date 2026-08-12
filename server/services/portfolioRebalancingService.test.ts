import { describe, expect, it } from "vitest";
import PortfolioRebalancingService from "./portfolioRebalancingService";

describe("PortfolioRebalancingService", () => {
  it("создаёт симметричный план покупки и продажи при существенном дрейфе", () => {
    const plan = PortfolioRebalancingService.buildPlan(
      [
        { symbol: "BTC", quantity: 1, currentPrice: 1000 },
        { symbol: "ETH", quantity: 10, currentPrice: 100 },
      ],
      [
        { symbol: "BTC", targetAllocation: 40 },
        { symbol: "ETH", targetAllocation: 60 },
      ],
      { driftThreshold: 3, minTradeValue: 25, estimatedFeeBps: 10 }
    );

    expect(plan.portfolioValue).toBe(2000);
    expect(plan.requiresRebalancing).toBe(true);
    expect(plan.totalDriftBefore).toBe(20);
    expect(plan.totalDriftAfter).toBe(0);
    expect(plan.turnoverValue).toBe(400);
    expect(plan.estimatedFees).toBeCloseTo(0.4);
    expect(plan.trades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "BTC", action: "SELL", tradeValue: 200, tradeQuantity: 0.2 }),
        expect.objectContaining({ symbol: "ETH", action: "BUY", tradeValue: 200, tradeQuantity: 2 }),
      ])
    );
  });

  it("оставляет позицию без действия в пределах допустимого дрейфа", () => {
    const plan = PortfolioRebalancingService.buildPlan(
      [
        { symbol: "BTC", quantity: 0.51, currentPrice: 1000 },
        { symbol: "ETH", quantity: 4.9, currentPrice: 100 },
      ],
      [
        { symbol: "BTC", targetAllocation: 50 },
        { symbol: "ETH", targetAllocation: 50 },
      ],
      { driftThreshold: 3, minTradeValue: 25 }
    );

    expect(plan.requiresRebalancing).toBe(false);
    expect(plan.trades.map((trade) => trade.action)).toEqual(["HOLD", "HOLD"]);
    expect(plan.turnoverValue).toBe(0);
  });

  it("учитывает заданный денежный резерв в сумме целевых аллокаций", () => {
    const validation = PortfolioRebalancingService.validateTargets(
      [{ symbol: "BTC", targetAllocation: 80 }],
      20
    );
    const invalid = PortfolioRebalancingService.validateTargets(
      [{ symbol: "BTC", targetAllocation: 100 }],
      20
    );

    expect(validation).toMatchObject({ valid: true, targetTotal: 80 });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors[0]).toContain("80.00%");
  });

  it("отклоняет повторяющиеся или неполные цели", () => {
    const validation = PortfolioRebalancingService.validateTargets([
      { symbol: "btc", targetAllocation: 50 },
      { symbol: "BTC", targetAllocation: 50 },
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("Duplicate target symbol: BTC");
  });
});
