/**
 * Portfolio Service
 * Manages user portfolio tracking with real-time P&L calculations
 */

export interface PortfolioPosition {
  id: string;
  userId: string;
  ticker: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  exchange: "binance" | "coinbase" | "kraken";
  entryDate: Date;
  notes?: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
  positionCount: number;
  bestPerformer: {
    ticker: string;
    gainLossPercent: number;
  } | null;
  worstPerformer: {
    ticker: string;
    gainLossPercent: number;
  } | null;
}

export interface PositionMetrics {
  ticker: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  gainLoss: number;
  gainLossPercent: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
  allocation: number; // percentage of portfolio
  value: number;
}

export class PortfolioService {
  /**
   * Calculate position metrics
   */
  static calculatePositionMetrics(
    position: PortfolioPosition,
    previousPrice?: number
  ): PositionMetrics {
    const value = position.quantity * position.currentPrice;
    const cost = position.quantity * position.entryPrice;
    const gainLoss = value - cost;
    const gainLossPercent = (gainLoss / cost) * 100;

    const dayGainLoss = previousPrice
      ? position.quantity * (position.currentPrice - previousPrice)
      : 0;
    const dayGainLossPercent = previousPrice
      ? ((position.currentPrice - previousPrice) / previousPrice) * 100
      : 0;

    return {
      ticker: position.ticker,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      currentPrice: position.currentPrice,
      gainLoss,
      gainLossPercent,
      dayGainLoss,
      dayGainLossPercent,
      allocation: 0, // Will be calculated in portfolio metrics
      value,
    };
  }

  /**
   * Calculate portfolio metrics
   */
  static calculatePortfolioMetrics(
    positions: PortfolioPosition[],
    previousPrices?: Map<string, number>
  ): PortfolioMetrics {
    let totalValue = 0;
    let totalCost = 0;
    let totalDayGainLoss = 0;

    const positionMetrics = positions.map((position) => {
      const prevPrice = previousPrices?.get(position.ticker);
      return this.calculatePositionMetrics(position, prevPrice);
    });

    positionMetrics.forEach((metrics) => {
      totalValue += metrics.value;
      totalCost += metrics.quantity * metrics.entryPrice;
      totalDayGainLoss += metrics.dayGainLoss;
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const dayGainLossPercent = totalCost > 0 ? (totalDayGainLoss / totalCost) * 100 : 0;

    // Add allocation percentages
    positionMetrics.forEach((metrics) => {
      metrics.allocation = totalValue > 0 ? (metrics.value / totalValue) * 100 : 0;
    });

    // Find best and worst performers
    let bestPerformer: { ticker: string; gainLossPercent: number } | null = null;
    let worstPerformer: { ticker: string; gainLossPercent: number } | null = null;

    positionMetrics.forEach((metrics) => {
      if (!bestPerformer || metrics.gainLossPercent > bestPerformer.gainLossPercent) {
        bestPerformer = {
          ticker: metrics.ticker,
          gainLossPercent: metrics.gainLossPercent,
        };
      }
      if (!worstPerformer || metrics.gainLossPercent < worstPerformer.gainLossPercent) {
        worstPerformer = {
          ticker: metrics.ticker,
          gainLossPercent: metrics.gainLossPercent,
        };
      }
    });

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      dayGainLoss: totalDayGainLoss,
      dayGainLossPercent,
      positionCount: positions.length,
      bestPerformer,
      worstPerformer,
    };
  }

  /**
   * Calculate risk metrics
   */
  static calculateRiskMetrics(positions: PortfolioPosition[]) {
    const gainLossPercents = positions.map((pos) => {
      const gainLoss = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      return gainLoss;
    });

    if (gainLossPercents.length === 0) {
      return { volatility: 0, sharpeRatio: 0, maxDrawdown: 0, beta: 0 };
    }

    // Calculate volatility (standard deviation)
    const mean = gainLossPercents.reduce((a, b) => a + b) / gainLossPercents.length;
    const variance =
      gainLossPercents.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      gainLossPercents.length;
    const volatility = Math.sqrt(variance);

    // Calculate Sharpe Ratio (assuming 0% risk-free rate)
    const sharpeRatio = mean > 0 ? mean / volatility : 0;

    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let peak = gainLossPercents[0];
    gainLossPercents.forEach((val) => {
      if (val > peak) {
        peak = val;
      }
      const drawdown = peak - val;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return {
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      beta: 1.0, // Would need market data to calculate true beta
    };
  }

  /**
   * Calculate diversification score
   */
  static calculateDiversificationScore(positions: PortfolioPosition[]): number {
    if (positions.length === 0) return 0;

    const totalValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0);
    if (totalValue === 0) return 0;

    // Calculate Herfindahl-Hirschman Index (HHI)
    let hhi = 0;
    positions.forEach((pos) => {
      const allocation = (pos.quantity * pos.currentPrice) / totalValue;
      hhi += allocation * allocation;
    });

    // Convert HHI to diversification score (0-100)
    // HHI ranges from 1/n (perfectly diversified) to 1 (concentrated)
    const minHHI = 1 / positions.length;
    const diversificationScore = ((1 - hhi) / (1 - minHHI)) * 100;

    return Math.max(0, Math.min(100, diversificationScore));
  }

  /**
   * Generate portfolio rebalancing recommendations
   */
  static generateRebalancingRecommendations(
    positions: PortfolioPosition[],
    targetAllocations: Map<string, number>
  ) {
    const metrics = this.calculatePortfolioMetrics(positions);
    const recommendations: Array<{
      ticker: string;
      currentAllocation: number;
      targetAllocation: number;
      action: "BUY" | "SELL";
      amount: number;
    }> = [];

    positions.forEach((pos) => {
      const currentAllocation =
        (pos.quantity * pos.currentPrice) / metrics.totalValue;
      const targetAllocation = targetAllocations.get(pos.ticker) || 0;
      const difference = targetAllocation - currentAllocation;

      if (Math.abs(difference) > 0.05) {
        // 5% threshold
        recommendations.push({
          ticker: pos.ticker,
          currentAllocation: currentAllocation * 100,
          targetAllocation: targetAllocation * 100,
          action: difference > 0 ? "BUY" : "SELL",
          amount: Math.abs(difference * metrics.totalValue),
        });
      }
    });

    return recommendations;
  }

  /**
   * Calculate portfolio correlation matrix
   */
  static calculateCorrelationMatrix(
    positions: PortfolioPosition[],
    priceHistory: Map<string, number[]>
  ): Map<string, Map<string, number>> {
    const correlations = new Map<string, Map<string, number>>();

    positions.forEach((pos1) => {
      const prices1 = priceHistory.get(pos1.ticker) || [];
      const row = new Map<string, number>();

      positions.forEach((pos2) => {
        const prices2 = priceHistory.get(pos2.ticker) || [];

        if (prices1.length === 0 || prices2.length === 0) {
          row.set(pos2.ticker, 0);
          return;
        }

        // Calculate correlation coefficient
        const mean1 = prices1.reduce((a, b) => a + b) / prices1.length;
        const mean2 = prices2.reduce((a, b) => a + b) / prices2.length;

        let covariance = 0;
        let variance1 = 0;
        let variance2 = 0;

        for (let i = 0; i < prices1.length; i++) {
          const diff1 = prices1[i] - mean1;
          const diff2 = prices2[i] - mean2;
          covariance += diff1 * diff2;
          variance1 += diff1 * diff1;
          variance2 += diff2 * diff2;
        }

        const correlation =
          covariance / Math.sqrt(variance1 * variance2);
        row.set(pos2.ticker, correlation);
      });

      correlations.set(pos1.ticker, row);
    });

    return correlations;
  }

  /**
   * Estimate portfolio value at risk (VaR)
   */
  static calculateValueAtRisk(
    positions: PortfolioPosition[],
    confidenceLevel: number = 0.95 // 95% confidence
  ): number {
    const gainLossPercents = positions.map((pos) => {
      return ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
    });

    if (gainLossPercents.length === 0) return 0;

    // Sort returns
    gainLossPercents.sort((a, b) => a - b);

    // Find VaR at confidence level
    const index = Math.ceil((1 - confidenceLevel) * gainLossPercents.length);
    const varPercent = gainLossPercents[index];

    const totalValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0);
    return (varPercent / 100) * totalValue;
  }
}

export default PortfolioService;
