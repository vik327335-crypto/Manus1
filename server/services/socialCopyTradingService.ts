/**
 * Social Copy Trading Service
 * Allows users to copy trading strategies and signals from top traders
 */

export interface TopTrader {
  id: string;
  username: string;
  avatar: string;
  totalFollowers: number;
  winRate: number;
  averageReturn: number;
  totalTrades: number;
  monthlyReturn: number;
  riskScore: number;
  verified: boolean;
  strategies: string[];
}

export interface CopyTradeSubscription {
  id: string;
  userId: string;
  traderId: string;
  allocationPercent: number;
  status: "ACTIVE" | "PAUSED" | "STOPPED";
  startDate: Date;
  totalCopied: number;
  totalProfit: number;
  copiedTrades: number;
  createdAt: Date;
}

export interface CopiedTrade {
  id: string;
  subscriptionId: string;
  originalTradeId: string;
  originalTrader: string;
  symbol: string;
  action: "BUY" | "SELL";
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  status: "OPEN" | "CLOSED" | "PENDING";
  executedPrice: number;
  profit: number;
  profitPercent: number;
  copiedAt: Date;
  closedAt?: Date;
}

export interface TraderPerformance {
  traderId: string;
  period: "1D" | "7D" | "30D" | "90D" | "1Y" | "ALL";
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  totalReturn: number;
  sharpeRatio: number;
  bestTrade: number;
  worstTrade: number;
}

export interface CopyTradingRecommendation {
  traderId: string;
  traderName: string;
  score: number;
  reason: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  suggestedAllocation: number;
  expectedReturn: number;
}

export class SocialCopyTradingService {
  /**
   * Get top traders by performance
   */
  static async getTopTraders(_limit: number = 10): Promise<TopTrader[]> {
    // Mock implementation - in production, would fetch from database
    return [
      {
        id: "trader_1",
        username: "CryptoMaster",
        avatar: "https://api.example.com/avatars/1.jpg",
        totalFollowers: 5000,
        winRate: 0.65,
        averageReturn: 0.12,
        totalTrades: 250,
        monthlyReturn: 0.08,
        riskScore: 0.4,
        verified: true,
        strategies: ["Trend Following", "Mean Reversion"],
      },
      {
        id: "trader_2",
        username: "BlockchainPro",
        avatar: "https://api.example.com/avatars/2.jpg",
        totalFollowers: 3500,
        winRate: 0.58,
        averageReturn: 0.09,
        totalTrades: 180,
        monthlyReturn: 0.06,
        riskScore: 0.5,
        verified: true,
        strategies: ["Swing Trading", "Scalping"],
      },
    ];
  }

  /**
   * Get trader performance metrics
   */
  static async getTraderPerformance(traderId: string, period: string = "30D"): Promise<TraderPerformance> {
    // Mock implementation
    return {
      traderId,
      period: period as any,
      totalTrades: 45,
      winTrades: 28,
      lossTrades: 17,
      winRate: 0.62,
      averageWin: 0.08,
      averageLoss: -0.04,
      profitFactor: 2.1,
      maxDrawdown: -0.15,
      totalReturn: 0.35,
      sharpeRatio: 1.8,
      bestTrade: 0.25,
      worstTrade: -0.12,
    };
  }

  /**
   * Subscribe to copy trader
   */
  static async subscribeToCopyTrader(
    userId: string,
    traderId: string,
    allocationPercent: number
  ): Promise<CopyTradeSubscription> {
    // Mock implementation
    return {
      id: `sub_${Date.now()}`,
      userId,
      traderId,
      allocationPercent,
      status: "ACTIVE",
      startDate: new Date(),
      totalCopied: 0,
      totalProfit: 0,
      copiedTrades: 0,
      createdAt: new Date(),
    };
  }

  /**
   * Get user's copy trade subscriptions
   */
  static async getUserSubscriptions(userId: string): Promise<CopyTradeSubscription[]> {
    // Mock implementation
    return [
      {
        id: "sub_1",
        userId,
        traderId: "trader_1",
        allocationPercent: 30,
        status: "ACTIVE",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        totalCopied: 15,
        totalProfit: 450,
        copiedTrades: 15,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Copy trader's signal
   */
  static async copyTraderSignal(
    subscriptionId: string,
    originalTradeId: string,
    signal: {
      symbol: string;
      action: "BUY" | "SELL";
      entryPrice: number;
      stopLoss: number;
      takeProfit: number;
      quantity: number;
    }
  ): Promise<CopiedTrade> {
    // Mock implementation
    return {
      id: `trade_${Date.now()}`,
      subscriptionId,
      originalTradeId,
      originalTrader: "trader_1",
      symbol: signal.symbol,
      action: signal.action,
      entryPrice: signal.entryPrice,
      quantity: signal.quantity,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      status: "PENDING",
      executedPrice: signal.entryPrice,
      profit: 0,
      profitPercent: 0,
      copiedAt: new Date(),
    };
  }

  /**
   * Get copied trades history
   */
  static async getCopiedTradesHistory(subscriptionId: string): Promise<CopiedTrade[]> {
    // Mock implementation
    return [
      {
        id: "trade_1",
        subscriptionId,
        originalTradeId: "orig_1",
        originalTrader: "trader_1",
        symbol: "BTC/USDT",
        action: "BUY",
        entryPrice: 42000,
        quantity: 0.5,
        stopLoss: 40000,
        takeProfit: 45000,
        status: "CLOSED",
        executedPrice: 42000,
        profit: 1500,
        profitPercent: 0.071,
        copiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Calculate copy trading performance
   */
  static calculateCopyTradingPerformance(trades: CopiedTrade[]): {
    totalTrades: number;
    winTrades: number;
    lossTrades: number;
    winRate: number;
    totalProfit: number;
    averageProfitPercent: number;
    maxWin: number;
    maxLoss: number;
  } {
    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    const winTrades = closedTrades.filter((t) => t.profit > 0).length;
    const lossTrades = closedTrades.filter((t) => t.profit < 0).length;

    return {
      totalTrades: closedTrades.length,
      winTrades,
      lossTrades,
      winRate: closedTrades.length > 0 ? winTrades / closedTrades.length : 0,
      totalProfit: closedTrades.reduce((sum, t) => sum + t.profit, 0),
      averageProfitPercent: closedTrades.length > 0 ? closedTrades.reduce((sum, t) => sum + t.profitPercent, 0) / closedTrades.length : 0,
      maxWin: Math.max(...closedTrades.map((t) => t.profit), 0),
      maxLoss: Math.min(...closedTrades.map((t) => t.profit), 0),
    };
  }

  /**
   * Pause copy trading subscription
   */
  static async pauseSubscription(subscriptionId: string): Promise<CopyTradeSubscription> {
    // Mock implementation
    return {
      id: subscriptionId,
      userId: "user_1",
      traderId: "trader_1",
      allocationPercent: 30,
      status: "PAUSED",
      startDate: new Date(),
      totalCopied: 15,
      totalProfit: 450,
      copiedTrades: 15,
      createdAt: new Date(),
    };
  }

  /**
   * Resume copy trading subscription
   */
  static async resumeSubscription(subscriptionId: string): Promise<CopyTradeSubscription> {
    // Mock implementation
    return {
      id: subscriptionId,
      userId: "user_1",
      traderId: "trader_1",
      allocationPercent: 30,
      status: "ACTIVE",
      startDate: new Date(),
      totalCopied: 15,
      totalProfit: 450,
      copiedTrades: 15,
      createdAt: new Date(),
    };
  }

  /**
   * Get copy trading recommendations
   */
  static async getCopyTradingRecommendations(_userId: string): Promise<CopyTradingRecommendation[]> {
    // Mock implementation
    return [
      {
        traderId: "trader_1",
        traderName: "CryptoMaster",
        score: 0.85,
        reason: "High win rate (65%) with consistent returns",
        riskLevel: "MEDIUM",
        suggestedAllocation: 25,
        expectedReturn: 0.12,
      },
      {
        traderId: "trader_3",
        traderName: "TrendFollower",
        score: 0.78,
        reason: "Strong performance in trending markets",
        riskLevel: "MEDIUM",
        suggestedAllocation: 20,
        expectedReturn: 0.10,
      },
    ];
  }

  /**
   * Calculate optimal portfolio allocation for copy trading
   */
  static calculateOptimalAllocation(
    traders: TopTrader[],
    totalCapital: number,
    _riskTolerance: number
  ): { traderId: string; allocation: number; expectedReturn: number }[] {
    // Sort by risk-adjusted returns
    const sorted = traders.sort((a, b) => {
      const aScore = a.averageReturn * (1 - a.riskScore);
      const bScore = b.averageReturn * (1 - b.riskScore);
      return bScore - aScore;
    });

    // Allocate capital proportionally
    const totalScore = sorted.reduce((sum, t) => sum + (t.averageReturn * (1 - t.riskScore)), 0);

    return sorted.map((trader) => {
      const score = trader.averageReturn * (1 - trader.riskScore);
      const allocation = (totalCapital * score) / totalScore;
      return {
        traderId: trader.id,
        allocation,
        expectedReturn: trader.averageReturn,
      };
    });
  }

  /**
   * Generate copy trading report
   */
  static generateCopyTradingReport(
    subscriptions: CopyTradeSubscription[],
    allTrades: CopiedTrade[]
  ): {
    summary: string;
    totalInvested: number;
    totalProfit: number;
    overallWinRate: number;
    bestPerformer: string;
    recommendations: string[];
  } {
    const totalInvested = subscriptions.reduce((sum, s) => sum + s.totalCopied, 0);
    const totalProfit = subscriptions.reduce((sum, s) => sum + s.totalProfit, 0);

    const closedTrades = allTrades.filter((t) => t.status === "CLOSED");
    const winTrades = closedTrades.filter((t) => t.profit > 0).length;
    const overallWinRate = closedTrades.length > 0 ? winTrades / closedTrades.length : 0;

    const bestPerformer = subscriptions.reduce((best, current) =>
      current.totalProfit > best.totalProfit ? current : best
    )?.traderId || "N/A";

    const recommendations: string[] = [];
    if (overallWinRate < 0.5) {
      recommendations.push("Consider diversifying across more traders");
    }
    if (totalProfit < 0) {
      recommendations.push("Review trader performance and adjust allocations");
    }

    return {
      summary: `Copy Trading Portfolio: $${totalInvested.toFixed(2)} invested, $${totalProfit.toFixed(2)} profit`,
      totalInvested,
      totalProfit,
      overallWinRate,
      bestPerformer,
      recommendations,
    };
  }
}

export default SocialCopyTradingService;
