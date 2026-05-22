/**
 * Сервис для анализа производительности стратегий day trading
 */

export interface StrategyTrade {
  id: string;
  strategyName: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercentage: number;
  status: 'WIN' | 'LOSS' | 'BREAK_EVEN';
  duration: number; // в минутах
}

export interface StrategyMetrics {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number; // процент
  lossRate: number; // процент
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  roi: number; // процент
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number; // процент
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgTradeTime: number; // в минутах
  bestTrade: number;
  worstTrade: number;
  recoveryFactor: number;
  profitability: number; // процент
  lastUpdated: number;
}

export interface StrategyComparison {
  period: '7d' | '30d' | '90d' | 'all';
  strategies: StrategyMetrics[];
  topPerformer: StrategyMetrics | null;
  worstPerformer: StrategyMetrics | null;
  averageMetrics: Partial<StrategyMetrics>;
}

/**
 * Расчёт метрик производительности стратегии
 */
export function calculateStrategyMetrics(trades: StrategyTrade[]): StrategyMetrics {
  if (trades.length === 0) {
    return {
      strategyName: '',
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      roi: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancy: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      avgTradeTime: 0,
      bestTrade: 0,
      worstTrade: 0,
      recoveryFactor: 0,
      profitability: 0,
      lastUpdated: Date.now(),
    };
  }

  const strategyName = trades[0].strategyName;
  const totalTrades = trades.length;

  // Подсчёт побед/поражений
  const winningTrades = trades.filter((t) => t.status === 'WIN').length;
  const losingTrades = trades.filter((t) => t.status === 'LOSS').length;
  const breakEvenTrades = trades.filter((t) => t.status === 'BREAK_EVEN').length;

  const winRate = (winningTrades / totalTrades) * 100;
  const lossRate = (losingTrades / totalTrades) * 100;

  // Расчёт прибыли/убытка
  const totalProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(
    trades
      .filter((t) => t.pnl < 0)
      .reduce((sum, t) => sum + t.pnl, 0)
  );
  const netProfit = trades.reduce((sum, t) => sum + t.pnl, 0);

  // ROI
  const totalInvested = trades.reduce((sum, t) => sum + t.entryPrice * t.quantity, 0);
  const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  // Profit Factor
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  // Sharpe Ratio
  const returns = trades.map((t) => t.pnlPercentage);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Max Drawdown
  let maxDrawdown = 0;
  let runningMax = 0;
  let runningProfit = 0;

  for (const trade of trades) {
    runningProfit += trade.pnl;
    if (runningProfit > runningMax) {
      runningMax = runningProfit;
    }
    const drawdown = runningMax - runningProfit;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const maxDrawdownPercent = totalInvested > 0 ? (maxDrawdown / totalInvested) * 100 : 0;

  // Средние значения
  const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

  // Expectancy (ожидаемое значение на сделку)
  const expectancy = (winRate / 100) * avgWin - (lossRate / 100) * avgLoss;

  // Последовательные победы/поражения
  let consecutiveWins = 0;
  let maxConsecutiveWins = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveLosses = 0;

  for (const trade of trades) {
    if (trade.status === 'WIN') {
      consecutiveWins++;
      consecutiveLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
    } else if (trade.status === 'LOSS') {
      consecutiveLosses++;
      consecutiveWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
    }
  }

  // Среднее время сделки
  const avgTradeTime =
    trades.reduce((sum, t) => sum + t.duration, 0) / trades.length;

  // Best/Worst Trade
  const bestTrade = Math.max(...trades.map((t) => t.pnl));
  const worstTrade = Math.min(...trades.map((t) => t.pnl));

  // Recovery Factor
  const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : 0;

  // Profitability
  const profitability = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return {
    strategyName,
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    winRate: Math.round(winRate * 100) / 100,
    lossRate: Math.round(lossRate * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdownPercent * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
    avgTradeTime: Math.round(avgTradeTime * 100) / 100,
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    recoveryFactor: Math.round(recoveryFactor * 100) / 100,
    profitability: Math.round(profitability * 100) / 100,
    lastUpdated: Date.now(),
  };
}

/**
 * Сравнение нескольких стратегий
 */
export function compareStrategies(
  allTrades: StrategyTrade[],
  period: '7d' | '30d' | '90d' | 'all' = 'all'
): StrategyComparison {
  // Фильтрация по периоду
  const now = Date.now();
  const periodMs = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    all: Infinity,
  }[period];

  const filteredTrades = allTrades.filter((t) => now - t.exitTime <= periodMs);

  // Группировка по стратегиям
  const strategiesByName = new Map<string, StrategyTrade[]>();

  for (const trade of filteredTrades) {
    if (!strategiesByName.has(trade.strategyName)) {
      strategiesByName.set(trade.strategyName, []);
    }
    strategiesByName.get(trade.strategyName)!.push(trade);
  }

  // Расчёт метрик для каждой стратегии
  const strategies = Array.from(strategiesByName.entries())
    .map(([_, trades]) => calculateStrategyMetrics(trades))
    .sort((a, b) => b.roi - a.roi);

  // Определение лучшей и худшей стратегии
  const topPerformer = strategies.length > 0 ? strategies[0] : null;
  const worstPerformer = strategies.length > 0 ? strategies[strategies.length - 1] : null;

  // Средние метрики
  const averageMetrics: Partial<StrategyMetrics> = {};
  if (strategies.length > 0) {
    const keys = Object.keys(strategies[0]) as (keyof StrategyMetrics)[];
    for (const key of keys) {
      if (typeof strategies[0][key] === 'number') {
        const sum = strategies.reduce((s, st) => s + (st[key] as number), 0);
        (averageMetrics[key] as number) = Math.round((sum / strategies.length) * 100) / 100;
      }
    }
  }

  return {
    period,
    strategies,
    topPerformer,
    worstPerformer,
    averageMetrics,
  };
}

/**
 * Получить рейтинг стратегий по различным метрикам
 */
export function rankStrategiesByMetric(
  strategies: StrategyMetrics[],
  metric: keyof StrategyMetrics
): StrategyMetrics[] {
  return [...strategies].sort((a, b) => {
    const aVal = a[metric] as number;
    const bVal = b[metric] as number;
    return bVal - aVal;
  });
}

/**
 * Получить рекомендацию по лучшей стратегии
 */
export function getStrategyRecommendation(
  strategies: StrategyMetrics[]
): { strategy: StrategyMetrics | null; reason: string } {
  if (strategies.length === 0) {
    return { strategy: null, reason: 'Нет данных о стратегиях' };
  }

  // Взвешенный рейтинг на основе нескольких метрик
  const scores = strategies.map((s) => {
    let score = 0;
    score += s.winRate * 0.3; // 30% - win rate
    score += Math.min(s.profitFactor, 5) * 0.25; // 25% - profit factor (max 5)
    score += Math.max(0, s.roi) * 0.2; // 20% - ROI
    score += Math.max(0, s.sharpeRatio) * 0.15; // 15% - Sharpe ratio
    score += Math.max(0, 100 - s.maxDrawdown) * 0.1; // 10% - низкий drawdown
    return score;
  });

  const bestIndex = scores.indexOf(Math.max(...scores));
  const bestStrategy = strategies[bestIndex];

  let reason = `Стратегия "${bestStrategy.strategyName}" рекомендуется на основе: `;
  const reasons = [];

  if (bestStrategy.winRate > 50) {
    reasons.push(`высокий win rate (${bestStrategy.winRate}%)`);
  }
  if (bestStrategy.profitFactor > 2) {
    reasons.push(`хороший profit factor (${bestStrategy.profitFactor})`);
  }
  if (bestStrategy.roi > 10) {
    reasons.push(`положительный ROI (${bestStrategy.roi}%)`);
  }
  if (bestStrategy.maxDrawdown < 20) {
    reasons.push(`низкий max drawdown (${bestStrategy.maxDrawdown}%)`);
  }

  reason += reasons.join(', ');

  return { strategy: bestStrategy, reason };
}

/**
 * Анализ тренда производительности стратегии
 */
export function analyzePerformanceTrend(
  trades: StrategyTrade[],
  windowSize: number = 10
): {
  trend: 'improving' | 'declining' | 'stable';
  recentWinRate: number;
  previousWinRate: number;
  changePercent: number;
} {
  if (trades.length < windowSize * 2) {
    return {
      trend: 'stable',
      recentWinRate: 0,
      previousWinRate: 0,
      changePercent: 0,
    };
  }

  // Последние N сделок
  const recentTrades = trades.slice(-windowSize);
  const previousTrades = trades.slice(-windowSize * 2, -windowSize);

  const recentWins = recentTrades.filter((t) => t.status === 'WIN').length;
  const previousWins = previousTrades.filter((t) => t.status === 'WIN').length;

  const recentWinRate = (recentWins / windowSize) * 100;
  const previousWinRate = (previousWins / windowSize) * 100;

  const changePercent = recentWinRate - previousWinRate;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (changePercent > 5) {
    trend = 'improving';
  } else if (changePercent < -5) {
    trend = 'declining';
  }

  return {
    trend,
    recentWinRate: Math.round(recentWinRate * 100) / 100,
    previousWinRate: Math.round(previousWinRate * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
  };
}
