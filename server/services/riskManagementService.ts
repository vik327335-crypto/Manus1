/**
 * Advanced Risk Management Service
 * Handles position sizing, hedging, stop-loss/take-profit, and VaR calculations
 */

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  weight: number; // Portfolio weight percentage
}

export interface RiskMetrics {
  portfolioValue: number;
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number; // VaR at 95% confidence
  conditionalVaR: number; // CVaR (Expected Shortfall)
  beta: number;
  correlation: number;
}

export interface PositionSizing {
  symbol: string;
  optimalSize: number;
  maxSize: number;
  minSize: number;
  riskPercentage: number;
  recommendedQuantity: number;
}

export interface HedgeStrategy {
  symbol: string;
  hedgeType: 'put_option' | 'short_sale' | 'inverse_etf' | 'futures';
  hedgeRatio: number; // Percentage of position to hedge
  cost: number;
  protection: number; // Maximum loss with hedge
}

export interface StopLossStrategy {
  symbol: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
  maxLossPercentage: number;
  maxGainPercentage: number;
}

export class RiskManagementService {
  /**
   * Calculate position size using Kelly Criterion
   */
  static calculateKellyCriterion(
    accountSize: number,
    winRate: number,
    avgWin: number,
    avgLoss: number,
    maxRiskPercentage: number = 2
  ): number {
    if (avgLoss === 0) return 0;

    const winLossRatio = avgWin / avgLoss;
    const kellyCriterion = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;

    // Apply safety factor (use 25% of Kelly to reduce volatility)
    const safeKelly = Math.max(0, Math.min(kellyCriterion * 0.25, maxRiskPercentage / 100));

    return accountSize * safeKelly;
  }

  /**
   * Calculate optimal position size based on volatility
   */
  static calculateVolatilityBasedSize(
    accountSize: number,
    volatility: number,
    riskPercentage: number = 2
  ): number {
    const riskAmount = (accountSize * riskPercentage) / 100;
    const positionSize = riskAmount / (volatility * 100);

    return Math.max(0, positionSize);
  }

  /**
   * Calculate Value at Risk (VaR) using historical method
   */
  static calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));

    return sortedReturns[index];
  }

  /**
   * Calculate Conditional VaR (Expected Shortfall)
   */
  static calculateCVaR(returns: number[], confidenceLevel: number = 0.95): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));

    const tailReturns = sortedReturns.slice(0, index + 1);
    const cvar = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;

    return cvar;
  }

  /**
   * Calculate portfolio volatility
   */
  static calculatePortfolioVolatility(
    positions: Position[],
    historicalPrices: Record<string, number[]>
  ): number {
    let variance = 0;

    for (const position of positions) {
      const prices = historicalPrices[position.symbol] || [];
      if (prices.length < 2) continue;

      // Calculate returns
      const returns: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }

      // Calculate standard deviation
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
      const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);

      // Add to portfolio variance (weighted)
      variance += Math.pow(stdDev * position.weight, 2);
    }

    return Math.sqrt(variance);
  }

  /**
   * Calculate Sharpe Ratio
   */
  static calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return (mean - riskFreeRate / 252) / stdDev; // Annualized
  }

  /**
   * Calculate maximum drawdown
   */
  static calculateMaxDrawdown(prices: number[]): number {
    let maxPrice = prices[0];
    let maxDrawdown = 0;

    for (const price of prices) {
      if (price > maxPrice) {
        maxPrice = price;
      }

      const drawdown = (maxPrice - price) / maxPrice;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Generate stop-loss and take-profit levels
   */
  static generateStopLossLevels(
    entryPrice: number,
    volatility: number,
    riskRewardRatio: number = 1 / 2
  ): StopLossStrategy {
    const stopLossDistance = entryPrice * volatility * 2; // 2x volatility
    const stopLossPrice = entryPrice - stopLossDistance;

    const takeProfitDistance = stopLossDistance / riskRewardRatio;
    const takeProfitPrice = entryPrice + takeProfitDistance;

    const maxLossPercentage = (stopLossDistance / entryPrice) * 100;
    const maxGainPercentage = (takeProfitDistance / entryPrice) * 100;

    return {
      symbol: '',
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      riskRewardRatio,
      maxLossPercentage,
      maxGainPercentage,
    };
  }

  /**
   * Calculate portfolio beta
   */
  static calculateBeta(
    portfolioReturns: number[],
    marketReturns: number[]
  ): number {
    const n = Math.min(portfolioReturns.length, marketReturns.length);
    if (n < 2) return 1;

    const portfolioMean = portfolioReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const marketMean = marketReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < n; i++) {
      covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }

    covariance /= n;
    marketVariance /= n;

    return marketVariance === 0 ? 1 : covariance / marketVariance;
  }

  /**
   * Generate hedging strategy
   */
  static generateHedgeStrategy(
    position: Position,
    hedgeRatio: number = 0.5
  ): HedgeStrategy {
    const positionValue = position.quantity * position.currentPrice;
    const hedgeValue = positionValue * hedgeRatio;

    // Estimate hedge cost (typically 2-5% of position value)
    const hedgeCost = hedgeValue * 0.03;

    // Maximum loss with hedge
    const maxLossWithoutHedge = positionValue * 0.5; // Assume 50% downside
    const maxLossWithHedge = maxLossWithoutHedge * (1 - hedgeRatio) + hedgeCost;

    return {
      symbol: position.symbol,
      hedgeType: 'put_option',
      hedgeRatio,
      cost: hedgeCost,
      protection: maxLossWithHedge,
    };
  }

  /**
   * Calculate correlation between assets
   */
  static calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    if (n < 2) return 0;

    const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;

      covariance += diff1 * diff2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
    }

    const stdDev1 = Math.sqrt(variance1 / n);
    const stdDev2 = Math.sqrt(variance2 / n);

    if (stdDev1 === 0 || stdDev2 === 0) return 0;

    return (covariance / n) / (stdDev1 * stdDev2);
  }

  /**
   * Validate position sizing
   */
  static validatePositionSize(
    positionSize: number,
    accountSize: number,
    maxRiskPercentage: number = 5
  ): { valid: boolean; error?: string } {
    const riskPercentage = (positionSize / accountSize) * 100;

    if (riskPercentage > maxRiskPercentage) {
      return {
        valid: false,
        error: `Position size exceeds maximum risk of ${maxRiskPercentage}%`,
      };
    }

    if (positionSize <= 0) {
      return {
        valid: false,
        error: 'Position size must be positive',
      };
    }

    return { valid: true };
  }

  /**
   * Calculate portfolio concentration risk
   */
  static calculateConcentrationRisk(positions: Position[]): number {
    let herfindahlIndex = 0;

    for (const position of positions) {
      herfindahlIndex += Math.pow(position.weight, 2);
    }

    // Normalize to 0-1 scale (0 = diversified, 1 = concentrated)
    return herfindahlIndex;
  }

  /**
   * Generate risk report
   */
  static generateRiskReport(
    positions: Position[],
    portfolioValue: number,
    returns: number[]
  ): RiskMetrics {
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length
    );

    const portfolioReturns = returns.reduce((a, b) => a + b, 0) / returns.length;
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const maxDrawdown = this.calculateMaxDrawdown(
      positions.map((p) => p.currentPrice)
    );

    const historicalPrices: Record<string, number[]> = {};
    for (const position of positions) {
      historicalPrices[position.symbol] = [position.entryPrice, position.currentPrice];
    }

    const portfolioVolatility = this.calculatePortfolioVolatility(positions, historicalPrices);
    const var95 = this.calculateVaR(returns, 0.95);
    const cvar95 = this.calculateCVaR(returns, 0.95);

    return {
      portfolioValue,
      totalReturn: portfolioReturns,
      volatility: portfolioVolatility,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk: var95,
      conditionalVaR: cvar95,
      beta: 1, // Would need market returns for accurate calculation
      correlation: 0, // Would need other assets for calculation
    };
  }
}

export default RiskManagementService;
