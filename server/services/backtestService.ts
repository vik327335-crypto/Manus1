/**
 * CAN SLIM backtesting engine for historical analysis
 * Evaluates CAN SLIM criteria on historical data to measure strategy effectiveness
 */

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  positionSize: number; // % of capital per position
  minCanSlimScore: number; // Minimum score to enter trade
  stopLoss: number; // % below entry
  takeProfit: number; // % above entry
}

export interface BacktestTrade {
  entryDate: Date;
  exitDate: Date;
  ticker: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  reason: "stop_loss" | "take_profit" | "exit_signal" | "end_of_period";
  canSlimScore: number;
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
  monthlyReturns: Record<string, number>;
}

/**
 * Calculate CAN SLIM score for historical period
 */
export function calculateHistoricalCanSlimScore(
  historicalData: {
    currentGrowth: number; // Current earnings growth %
    annualGrowth: number; // Annual earnings growth %
    newCatalysts: number; // 0-1 scale
    supplyDynamics: number; // 0-1 scale
    relativeStrength: number; // 0-1 scale
    institutionalSupport: number; // 0-1 scale
    marketTrend: number; // 0-1 scale
  }
): number {
  // Weighted CAN SLIM scoring
  const weights = {
    C: 0.15, // Current Growth
    A: 0.15, // Annual Growth
    N: 0.15, // New Catalysts
    S: 0.15, // Supply Dynamics
    L: 0.15, // Relative Strength (Leader)
    I: 0.15, // Institutional Support
    M: 0.1, // Market Trend
  };

  const score =
    historicalData.currentGrowth * weights.C +
    historicalData.annualGrowth * weights.A +
    historicalData.newCatalysts * weights.N +
    historicalData.supplyDynamics * weights.S +
    historicalData.relativeStrength * weights.L +
    historicalData.institutionalSupport * weights.I +
    historicalData.marketTrend * weights.M;

  return Math.min(10, Math.max(0, score * 10)); // Normalize to 0-10
}

/**
 * Simulate trade entry based on CAN SLIM criteria
 */
export function shouldEnterTrade(
  canSlimScore: number,
  minScore: number,
  marketTrend: number
): boolean {
  // Enter if CAN SLIM score is above threshold and market trend is positive
  return canSlimScore >= minScore && marketTrend > 0.5;
}

/**
 * Calculate position size based on Kelly Criterion
 */
export function calculatePositionSize(
  capital: number,
  winRate: number,
  avgWin: number,
  avgLoss: number,
  maxRiskPercent: number = 2
): number {
  if (avgLoss === 0) return capital * (maxRiskPercent / 100);

  // Kelly Criterion: f = (bp - q) / b
  // where b = ratio of win to loss, p = win probability, q = loss probability
  const b = avgWin / avgLoss;
  const p = winRate;
  const q = 1 - winRate;

  let kellyCriterion = (b * p - q) / b;

  // Apply safety factor (use 25% of Kelly to reduce volatility)
  kellyCriterion = kellyCriterion * 0.25;

  // Cap at max risk percentage
  kellyCriterion = Math.min(kellyCriterion, maxRiskPercent / 100);
  kellyCriterion = Math.max(kellyCriterion, 0.01); // Minimum 1% risk

  return capital * kellyCriterion;
}

/**
 * Run backtest on historical data
 */
export async function runBacktest(
  historicalPrices: Array<{
    date: Date;
    ticker: string;
    price: number;
    canSlimScore: number;
    marketTrend: number;
  }>,
  config: BacktestConfig
): Promise<BacktestResults> {
  const trades: BacktestTrade[] = [];
  let capital = config.initialCapital;
  const equityHistory: number[] = [];
  const monthlyReturns: Record<string, number> = {};

  // Group prices by date
  const pricesByDate = new Map<string, typeof historicalPrices>();
  for (const price of historicalPrices) {
    const dateKey = price.date.toISOString().split("T")[0];
    if (!pricesByDate.has(dateKey)) {
      pricesByDate.set(dateKey, []);
    }
    pricesByDate.get(dateKey)!.push(price);
  }

  // Simulate trading
  const dates = Array.from(pricesByDate.keys()).sort();

  for (let i = 0; i < dates.length - 1; i++) {
    const currentDate = new Date(dates[i]);
    const nextDate = new Date(dates[i + 1]);
    const dayPrices = pricesByDate.get(dates[i]) || [];

    // Check for entry signals
    for (const price of dayPrices) {
      if (
        shouldEnterTrade(price.canSlimScore, config.minCanSlimScore, price.marketTrend)
      ) {
        // Calculate position size
        const positionCapital = capital * (config.positionSize / 100);
        const quantity = positionCapital / price.price;

        // Find exit
        let exitPrice = price.price;
        let exitDate = nextDate;
        let reason: BacktestTrade["reason"] = "exit_signal";

        // Check for stop loss or take profit
        const stopLossPrice = price.price * (1 - config.stopLoss / 100);
        const takeProfitPrice = price.price * (1 + config.takeProfit / 100);

        // Simulate price movement (simplified - use next day's close)
        const nextDayPrices = pricesByDate.get(dates[i + 1]) || [];
        const nextDayPrice = nextDayPrices.find((p) => p.ticker === price.ticker);

        if (nextDayPrice) {
          exitPrice = nextDayPrice.price;
          exitDate = nextDayPrice.date;

          if (exitPrice <= stopLossPrice) {
            exitPrice = stopLossPrice;
            reason = "stop_loss";
          } else if (exitPrice >= takeProfitPrice) {
            exitPrice = takeProfitPrice;
            reason = "take_profit";
          }
        }

        const pnl = (exitPrice - price.price) * quantity;
        const pnlPercent = ((exitPrice - price.price) / price.price) * 100;

        trades.push({
          entryDate: currentDate,
          exitDate,
          ticker: price.ticker,
          entryPrice: price.price,
          exitPrice,
          quantity,
          pnl,
          pnlPercent,
          reason,
          canSlimScore: price.canSlimScore,
        });

        capital += pnl;
      }
    }

    equityHistory.push(capital);

    // Track monthly returns
    const monthKey = dates[i].substring(0, 7);
    if (!monthlyReturns[monthKey]) {
      monthlyReturns[monthKey] = 0;
    }
  }

  // Calculate statistics
  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl < 0);

  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

  const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

  // Calculate Sharpe Ratio
  const returns = equityHistory.map((eq, i) =>
    i === 0 ? 0 : (eq - equityHistory[i - 1]) / equityHistory[i - 1]
  );
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0;

  // Calculate Max Drawdown
  let maxDrawdown = 0;
  let peak = config.initialCapital;
  for (const equity of equityHistory) {
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = (peak - equity) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    totalPnL: capital - config.initialCapital,
    totalPnLPercent: ((capital - config.initialCapital) / config.initialCapital) * 100,
    averageWin,
    averageLoss,
    profitFactor,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    trades,
    monthlyReturns,
  };
}

/**
 * Optimize CAN SLIM parameters
 */
export async function optimizeCanSlimParameters(
  historicalData: Array<{
    date: Date;
    ticker: string;
    price: number;
    canSlimScore: number;
    marketTrend: number;
  }>,
  baseConfig: BacktestConfig,
  paramRanges: {
    minCanSlimScore: [number, number, number]; // [min, max, step]
    stopLoss: [number, number, number];
    takeProfit: [number, number, number];
  }
): Promise<{
  optimalConfig: BacktestConfig;
  results: BacktestResults;
  parameterGrid: Array<{
    config: BacktestConfig;
    sharpeRatio: number;
    winRate: number;
    totalReturn: number;
  }>;
}> {
  const parameterGrid: Array<{
    config: BacktestConfig;
    sharpeRatio: number;
    winRate: number;
    totalReturn: number;
  }> = [];

  let bestSharpe = -Infinity;
  let optimalConfig = baseConfig;
  let optimalResults = await runBacktest(historicalData, baseConfig);

  // Grid search
  for (
    let minScore = paramRanges.minCanSlimScore[0];
    minScore <= paramRanges.minCanSlimScore[1];
    minScore += paramRanges.minCanSlimScore[2]
  ) {
    for (
      let stopLoss = paramRanges.stopLoss[0];
      stopLoss <= paramRanges.stopLoss[1];
      stopLoss += paramRanges.stopLoss[2]
    ) {
      for (
        let takeProfit = paramRanges.takeProfit[0];
        takeProfit <= paramRanges.takeProfit[1];
        takeProfit += paramRanges.takeProfit[2]
      ) {
        const config: BacktestConfig = {
          ...baseConfig,
          minCanSlimScore: minScore,
          stopLoss,
          takeProfit,
        };

        const results = await runBacktest(historicalData, config);

        parameterGrid.push({
          config,
          sharpeRatio: results.sharpeRatio,
          winRate: results.winRate,
          totalReturn: results.totalPnLPercent,
        });

        if (results.sharpeRatio > bestSharpe) {
          bestSharpe = results.sharpeRatio;
          optimalConfig = config;
          optimalResults = results;
        }
      }
    }
  }

  return {
    optimalConfig,
    results: optimalResults,
    parameterGrid,
  };
}
