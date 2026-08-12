export type RebalanceAction = "BUY" | "SELL" | "HOLD";

export interface RebalancePositionInput {
  symbol: string;
  quantity: number;
  currentPrice: number;
}

export interface AllocationTarget {
  symbol: string;
  targetAllocation: number;
}

export interface RebalanceConstraints {
  driftThreshold: number;
  minTradeValue: number;
  cashReservePercentage: number;
  estimatedFeeBps: number;
}

export interface RebalanceTrade {
  symbol: string;
  action: RebalanceAction;
  currentValue: number;
  currentAllocation: number;
  targetAllocation: number;
  driftPercentagePoints: number;
  tradeValue: number;
  tradeQuantity: number;
  estimatedFee: number;
  rationale: string;
}

export interface RebalancePlan {
  portfolioValue: number;
  investableValue: number;
  cashReserveValue: number;
  targetAllocationTotal: number;
  totalDriftBefore: number;
  totalDriftAfter: number;
  turnoverValue: number;
  turnoverPercentage: number;
  estimatedFees: number;
  requiresRebalancing: boolean;
  trades: RebalanceTrade[];
}

const DEFAULT_CONSTRAINTS: RebalanceConstraints = {
  driftThreshold: 3,
  minTradeValue: 25,
  cashReservePercentage: 0,
  estimatedFeeBps: 10,
};

export class PortfolioRebalancingService {
  static validateTargets(
    targets: AllocationTarget[],
    cashReservePercentage = 0
  ): { valid: boolean; errors: string[]; targetTotal: number } {
    const errors: string[] = [];
    const uniqueSymbols = new Set<string>();
    const targetTotal = targets.reduce((sum, target) => sum + target.targetAllocation, 0);
    const requiredTotal = 100 - cashReservePercentage;

    if (targets.length === 0) errors.push("At least one target allocation is required");
    if (cashReservePercentage < 0 || cashReservePercentage >= 100) {
      errors.push("Cash reserve must be between 0% and less than 100%");
    }

    for (const target of targets) {
      const normalized = target.symbol.trim().toUpperCase();
      if (!normalized) errors.push("Target symbols cannot be empty");
      if (uniqueSymbols.has(normalized)) errors.push(`Duplicate target symbol: ${normalized}`);
      uniqueSymbols.add(normalized);
      if (target.targetAllocation < 0) errors.push(`Allocation for ${normalized} cannot be negative`);
    }

    if (Math.abs(targetTotal - requiredTotal) > 0.01) {
      errors.push(`Target allocations must total ${requiredTotal.toFixed(2)}%`);
    }

    return { valid: errors.length === 0, errors, targetTotal };
  }

  static buildPlan(
    positions: RebalancePositionInput[],
    targets: AllocationTarget[],
    constraints: Partial<RebalanceConstraints> = {}
  ): RebalancePlan {
    const settings = { ...DEFAULT_CONSTRAINTS, ...constraints };
    const validation = this.validateTargets(targets, settings.cashReservePercentage);
    if (!validation.valid) throw new Error(validation.errors.join(" "));

    const normalizedPositions = new Map<string, RebalancePositionInput>();
    for (const position of positions) {
      const symbol = position.symbol.trim().toUpperCase();
      if (!symbol || position.quantity < 0 || position.currentPrice <= 0) {
        throw new Error("Every position must have a symbol, non-negative quantity, and positive current price");
      }
      const existing = normalizedPositions.get(symbol);
      normalizedPositions.set(symbol, {
        symbol,
        quantity: (existing?.quantity ?? 0) + position.quantity,
        currentPrice: position.currentPrice,
      });
    }

    const totalValue = Array.from(normalizedPositions.values()).reduce(
      (sum, position) => sum + position.quantity * position.currentPrice,
      0
    );

    if (totalValue <= 0) throw new Error("Portfolio value must be greater than zero");

    const investableValue = totalValue * (1 - settings.cashReservePercentage / 100);
    const targetMap = new Map(targets.map((target) => [target.symbol.trim().toUpperCase(), target.targetAllocation]));
    const allSymbols = new Set<string>([
      ...Array.from(normalizedPositions.keys()),
      ...Array.from(targetMap.keys()),
    ]);

    const trades: RebalanceTrade[] = [];
    let totalDriftBefore = 0;
    let totalDriftAfter = 0;
    let turnoverValue = 0;
    let estimatedFees = 0;

    for (const symbol of Array.from(allSymbols).sort()) {
      const position = normalizedPositions.get(symbol);
      const targetAllocation = targetMap.get(symbol) ?? 0;
      const currentValue = position ? position.quantity * position.currentPrice : 0;
      const currentAllocation = (currentValue / totalValue) * 100;
      const driftPercentagePoints = targetAllocation - currentAllocation;
      const desiredValue = (targetAllocation / 100) * totalValue;
      const rawTradeValue = desiredValue - currentValue;
      const shouldTrade =
        Math.abs(driftPercentagePoints) >= settings.driftThreshold &&
        Math.abs(rawTradeValue) >= settings.minTradeValue;
      const tradeValue = shouldTrade ? Math.abs(rawTradeValue) : 0;
      const price = position?.currentPrice;
      const action: RebalanceAction = shouldTrade ? (rawTradeValue > 0 ? "BUY" : "SELL") : "HOLD";
      const estimatedFee = (tradeValue * settings.estimatedFeeBps) / 10_000;
      const targetAfterTrade = shouldTrade ? targetAllocation : currentAllocation;

      totalDriftBefore += Math.abs(driftPercentagePoints);
      totalDriftAfter += Math.abs(targetAllocation - targetAfterTrade);
      turnoverValue += tradeValue;
      estimatedFees += estimatedFee;

      trades.push({
        symbol,
        action,
        currentValue,
        currentAllocation,
        targetAllocation,
        driftPercentagePoints,
        tradeValue,
        tradeQuantity: shouldTrade && price ? tradeValue / price : 0,
        estimatedFee,
        rationale: shouldTrade
          ? `${Math.abs(driftPercentagePoints).toFixed(2)} percentage-point drift exceeds the configured threshold.`
          : "Within drift threshold or below the minimum trade value.",
      });
    }

    return {
      portfolioValue: totalValue,
      investableValue,
      cashReserveValue: totalValue - investableValue,
      targetAllocationTotal: validation.targetTotal,
      totalDriftBefore,
      totalDriftAfter,
      turnoverValue,
      turnoverPercentage: (turnoverValue / totalValue) * 100,
      estimatedFees,
      requiresRebalancing: trades.some((trade) => trade.action !== "HOLD"),
      trades,
    };
  }
}

export default PortfolioRebalancingService;
