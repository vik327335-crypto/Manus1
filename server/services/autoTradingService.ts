/**
 * Automated Trading Service
 * Manages automated trading execution, position management, and risk controls
 */

export interface TradeSignal {
  ticker: string;
  action: "BUY" | "SELL";
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  timestamp: Date;
}

export interface Position {
  id: string;
  ticker: string;
  exchange: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  status: "OPEN" | "CLOSED" | "PENDING";
  createdAt: Date;
  closedAt?: Date;
}

export interface TradeOrder {
  id: string;
  positionId?: string;
  ticker: string;
  exchange: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: "PENDING" | "FILLED" | "CANCELLED" | "FAILED";
  executedAt?: Date;
  error?: string;
}

export interface RiskProfile {
  maxPositionSize: number; // % of portfolio
  maxDailyLoss: number; // % of portfolio
  maxDrawdown: number; // % of portfolio
  riskPerTrade: number; // % of portfolio
  maxOpenPositions: number;
  stopLossPercent: number;
  takeProfitPercent: number;
}

export class AutoTradingService {
  /**
   * Calculate position size based on risk management rules
   */
  static calculatePositionSize(
    portfolio: number,
    riskProfile: RiskProfile,
    entryPrice: number,
    stopLoss: number
  ): number {
    const riskAmount = portfolio * (riskProfile.riskPerTrade / 100);
    const priceRisk = Math.abs(entryPrice - stopLoss);

    if (priceRisk === 0) return 0;

    const quantity = riskAmount / priceRisk;
    const maxPositionValue = portfolio * (riskProfile.maxPositionSize / 100);
    const maxQuantity = maxPositionValue / entryPrice;

    return Math.min(quantity, maxQuantity);
  }

  /**
   * Validate trade signal against risk rules
   */
  static validateTradeSignal(
    signal: TradeSignal,
    riskProfile: RiskProfile,
    openPositions: Position[],
    portfolio: number,
    dailyLoss: number
  ): { valid: boolean; reason?: string } {
    // Check confidence threshold
    if (signal.confidence < 0.5) {
      return { valid: false, reason: "Confidence below threshold (50%)" };
    }

    // Check max open positions
    if (openPositions.length >= riskProfile.maxOpenPositions) {
      return { valid: false, reason: "Max open positions reached" };
    }

    // Check daily loss limit
    if (dailyLoss >= portfolio * (riskProfile.maxDailyLoss / 100)) {
      return { valid: false, reason: "Daily loss limit exceeded" };
    }

    // Check risk/reward ratio
    if (signal.riskRewardRatio < 1) {
      return { valid: false, reason: "Risk/reward ratio below 1:1" };
    }

    // Check position size
    const positionSize = this.calculatePositionSize(
      portfolio,
      riskProfile,
      signal.targetPrice,
      signal.stopLoss
    );

    if (positionSize === 0) {
      return { valid: false, reason: "Position size calculation resulted in 0" };
    }

    return { valid: true };
  }

  /**
   * Execute buy order
   */
  static async executeBuyOrder(
    signal: TradeSignal,
    riskProfile: RiskProfile,
    portfolio: number
  ): Promise<TradeOrder> {
    const quantity = this.calculatePositionSize(
      portfolio,
      riskProfile,
      signal.targetPrice,
      signal.stopLoss
    );

    return {
      id: `order_${Date.now()}`,
      ticker: signal.ticker,
      exchange: "BINANCE", // Default exchange
      action: "BUY",
      quantity,
      price: signal.targetPrice,
      status: "PENDING",
    };
  }

  /**
   * Execute sell order
   */
  static async executeSellOrder(position: Position): Promise<TradeOrder> {
    return {
      id: `order_${Date.now()}`,
      positionId: position.id,
      ticker: position.ticker,
      exchange: position.exchange,
      action: "SELL",
      quantity: position.quantity,
      price: position.currentPrice,
      status: "PENDING",
    };
  }

  /**
   * Check stop loss and take profit levels
   */
  static checkExitConditions(
    position: Position,
    currentPrice: number
  ): { shouldExit: boolean; reason?: string; exitPrice?: number } {
    // Check stop loss
    if (currentPrice <= position.entryPrice * 0.95) {
      return { shouldExit: true, reason: "Stop loss hit", exitPrice: currentPrice };
    }

    // Check take profit
    if (currentPrice >= position.entryPrice * 1.05) {
      return { shouldExit: true, reason: "Take profit hit", exitPrice: currentPrice };
    }

    return { shouldExit: false };
  }

  /**
   * Calculate unrealized P&L
   */
  static calculateUnrealizedPnL(position: Position, currentPrice: number): {
    pnl: number;
    pnlPercent: number;
  } {
    const pnl = (currentPrice - position.entryPrice) * position.quantity;
    const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

    return { pnl, pnlPercent };
  }

  /**
   * Get portfolio metrics
   */
  static calculatePortfolioMetrics(
    positions: Position[],
    portfolio: number
  ): {
    totalValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    openPositions: number;
    winRate: number;
    averageRiskReward: number;
  } {
    let totalPnL = 0;
    let winningTrades = 0;
    let totalTrades = 0;
    let totalRiskReward = 0;

    for (const position of positions) {
      totalPnL += position.unrealizedPnL;

      if (position.unrealizedPnL > 0) {
        winningTrades++;
      }

      if (position.status === "CLOSED") {
        totalTrades++;
      }
    }

    const openPositions = positions.filter((p) => p.status === "OPEN").length;
    const totalValue = portfolio + totalPnL;
    const totalPnLPercent = (totalPnL / portfolio) * 100;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const averageRiskReward = totalTrades > 0 ? totalRiskReward / totalTrades : 0;

    return {
      totalValue,
      totalPnL,
      totalPnLPercent,
      openPositions,
      winRate,
      averageRiskReward,
    };
  }

  /**
   * Rebalance portfolio
   */
  static rebalancePortfolio(
    positions: Position[],
    targetAllocation: Record<string, number>
  ): TradeOrder[] {
    const orders: TradeOrder[] = [];

    for (const position of positions) {
      const targetPercent = targetAllocation[position.ticker] || 0;
      const currentPercent =
        (position.quantity * position.currentPrice) /
        positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);

      if (Math.abs(currentPercent - targetPercent) > 0.05) {
        // 5% threshold
        if (currentPercent > targetPercent) {
          // Sell
          const quantityToSell = Math.floor(
            position.quantity * ((currentPercent - targetPercent) / currentPercent)
          );
          orders.push({
            id: `order_${Date.now()}`,
            positionId: position.id,
            ticker: position.ticker,
            exchange: position.exchange,
            action: "SELL",
            quantity: quantityToSell,
            price: position.currentPrice,
            status: "PENDING",
          });
        } else {
          // Buy
          const quantityToBuy = Math.floor(
            position.quantity * ((targetPercent - currentPercent) / currentPercent)
          );
          orders.push({
            id: `order_${Date.now()}`,
            ticker: position.ticker,
            exchange: position.exchange,
            action: "BUY",
            quantity: quantityToBuy,
            price: position.currentPrice,
            status: "PENDING",
          });
        }
      }
    }

    return orders;
  }

  /**
   * Detect overtrading (too many trades in short period)
   */
  static detectOvertrading(
    orders: TradeOrder[],
    timeWindowMinutes: number = 60
  ): boolean {
    const now = Date.now();
    const recentOrders = orders.filter(
      (o) => o.executedAt && now - o.executedAt.getTime() < timeWindowMinutes * 60 * 1000
    );

    return recentOrders.length > 5; // More than 5 trades in time window
  }

  /**
   * Calculate Sharpe ratio for trading strategy
   */
  static calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.02
  ): number {
    if (returns.length === 0) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return (meanReturn - riskFreeRate) / stdDev;
  }

  /**
   * Generate trading report
   */
  static generateTradingReport(
    positions: Position[],
    orders: TradeOrder[],
    portfolio: number
  ): {
    summary: string;
    metrics: Record<string, number | string>;
    recommendations: string[];
  } {
    const metrics = this.calculatePortfolioMetrics(positions, portfolio);
    const recommendations: string[] = [];

    if (metrics.totalPnLPercent < -10) {
      recommendations.push("Portfolio is down more than 10%. Consider reviewing strategy.");
    }

    if (metrics.winRate < 40) {
      recommendations.push("Win rate below 40%. Consider tightening entry criteria.");
    }

    if (metrics.openPositions === 0) {
      recommendations.push("No open positions. Consider looking for new trading opportunities.");
    }

    if (this.detectOvertrading(orders)) {
      recommendations.push("Overtrading detected. Reduce trade frequency.");
    }

    return {
      summary: `Portfolio Value: $${metrics.totalValue.toFixed(2)}, P&L: ${metrics.totalPnLPercent.toFixed(2)}%`,
      metrics: {
        totalValue: metrics.totalValue,
        totalPnL: metrics.totalPnL,
        totalPnLPercent: metrics.totalPnLPercent,
        openPositions: metrics.openPositions,
        winRate: metrics.winRate,
      },
      recommendations,
    };
  }
}

export default AutoTradingService;
