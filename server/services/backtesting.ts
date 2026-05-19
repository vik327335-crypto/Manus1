/**
 * Сервис для бэктестинга CAN SLIM стратегий
 * Тестирует стратегии на исторических данных и рассчитывает метрики
 */

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  tradeDetails: TradeDetail[];
}

export interface TradeDetail {
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  type: "BUY" | "SELL";
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Класс для бэктестинга стратегий
 */
export class BacktestingEngine {
  /**
   * Рассчитывает Sharpe ratio
   */
  static calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;
    return (meanReturn - riskFreeRate / 252) / (stdDev / Math.sqrt(252));
  }

  /**
   * Рассчитывает максимальный drawdown
   */
  static calculateMaxDrawdown(prices: number[]): number {
    if (prices.length === 0) return 0;

    let maxDrawdown = 0;
    let peak = prices[0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      }
      const drawdown = (peak - prices[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Рассчитывает метрики бэктеста
   */
  static calculateMetrics(trades: TradeDetail[], initialCapital: number): BacktestResult {
    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalReturn = totalPnl / initialCapital;

    const dailyReturns: number[] = [];
    let currentCapital = initialCapital;

    for (const trade of trades) {
      const dayReturn = trade.pnl / currentCapital;
      dailyReturns.push(dayReturn);
      currentCapital += trade.pnl;
    }

    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);

    // Рассчитываем equity curve для max drawdown
    const equityCurve: number[] = [initialCapital];
    for (const trade of trades) {
      equityCurve.push(equityCurve[equityCurve.length - 1] + trade.pnl);
    }
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve);

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const tradingDays = trades.length > 0 ? 252 : 1; // Предполагаем 252 торговых дня в году
    const annualizedReturn = Math.pow(1 + totalReturn, tradingDays / Math.max(trades.length, 1)) - 1;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      profitFactor,
      averageWin,
      averageLoss,
      tradeDetails: trades,
    };
  }

  /**
   * Запускает бэктест стратегии на исторических данных
   */
  static async runBacktest(
    historicalData: HistoricalData[],
    strategy: (data: HistoricalData[], index: number) => "BUY" | "SELL" | "HOLD",
    initialCapital: number = 10000
  ): Promise<BacktestResult> {
    const trades: TradeDetail[] = [];
    let position: TradeDetail | null = null;

    for (let i = 1; i < historicalData.length; i++) {
      const signal = strategy(historicalData, i);
      const currentPrice = historicalData[i].close;

      if (signal === "BUY" && !position) {
        // Открываем позицию
        position = {
          entryDate: historicalData[i].date,
          exitDate: new Date(),
          entryPrice: currentPrice,
          exitPrice: 0,
          quantity: Math.floor(initialCapital / currentPrice),
          pnl: 0,
          pnlPercent: 0,
          type: "BUY",
        };
      } else if (signal === "SELL" && position) {
        // Закрываем позицию
        position.exitDate = historicalData[i].date;
        position.exitPrice = currentPrice;
        position.pnl = (position.exitPrice - position.entryPrice) * position.quantity;
        position.pnlPercent = ((position.exitPrice - position.entryPrice) / position.entryPrice) * 100;
        trades.push(position);
        position = null;
      }
    }

    // Закрываем оставшуюся позицию в конце периода
    if (position) {
      const lastPrice = historicalData[historicalData.length - 1].close;
      position.exitDate = historicalData[historicalData.length - 1].date;
      position.exitPrice = lastPrice;
      position.pnl = (position.exitPrice - position.entryPrice) * position.quantity;
      position.pnlPercent = ((position.exitPrice - position.entryPrice) / position.entryPrice) * 100;
      trades.push(position);
    }

    return this.calculateMetrics(trades, initialCapital);
  }

  /**
   * Рассчитывает CAN SLIM score на основе исторических данных
   */
  static calculateCanSlimScore(data: HistoricalData[]): number {
    if (data.length < 50) return 0;

    let score = 0;

    // C - Current quarterly earnings (симулируем на основе волатильности)
    const recentVolatility = this.calculateVolatility(data.slice(-20));
    if (recentVolatility > 0.02) score += 1;

    // A - Annual earnings (тренд за год)
    const yearAgo = data.length >= 252 ? data[data.length - 252] : data[0];
    const currentPrice = data[data.length - 1].close;
    const yearAgoPrice = yearAgo.close;
    const yearReturn = (currentPrice - yearAgoPrice) / yearAgoPrice;
    if (yearReturn > 0.25) score += 1;

    // N - New highs (близость к максимуму)
    const max52Week = Math.max(...data.slice(-252).map((d) => d.high));
    if (currentPrice > max52Week * 0.9) score += 1;

    // S - Supply and demand (объём)
    const avgVolume = data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
    const recentVolume = data[data.length - 1].volume;
    if (recentVolume > avgVolume * 1.2) score += 1;

    // L - Leader (относительная сила)
    const sma50 = this.calculateSMA(data, 50);
    const sma200 = this.calculateSMA(data, 200);
    if (sma50 > sma200) score += 1;

    // I - Institutional buying (симулируем на основе тренда)
    const trend = this.calculateTrend(data.slice(-30));
    if (trend > 0.01) score += 1;

    // M - Market direction (общий тренд)
    const marketTrend = this.calculateTrend(data);
    if (marketTrend > 0) score += 1;

    return score;
  }

  /**
   * Рассчитывает простую скользящую среднюю
   */
  private static calculateSMA(data: HistoricalData[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((sum, d) => sum + d.close, 0) / period;
  }

  /**
   * Рассчитывает волатильность
   */
  private static calculateVolatility(data: HistoricalData[]): number {
    if (data.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Рассчитывает тренд
   */
  private static calculateTrend(data: HistoricalData[]): number {
    if (data.length < 2) return 0;
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    return (lastPrice - firstPrice) / firstPrice;
  }
}

/**
 * Создаёт экземпляр BacktestingEngine
 */
export function createBacktestingEngine(): typeof BacktestingEngine {
  return BacktestingEngine;
}
