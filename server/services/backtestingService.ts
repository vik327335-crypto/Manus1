/**
 * Backtesting Service
 * Executes trading strategies against historical data
 */

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeSignal {
  time: number;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  reason: string;
}

export interface BacktestTrade {
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  duration: number; // in milliseconds
}

export interface BacktestMetrics {
  totalReturn: number; // percentage
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number; // percentage
  winRate: number; // percentage
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  trades: BacktestTrade[];
}

export interface StrategyParams {
  [key: string]: number | string | boolean;
}

export type StrategyFunction = (
  candles: OHLCV[],
  params: StrategyParams
) => TradeSignal[];

export class BacktestingService {
  /**
   * Run backtest for a strategy
   */
  static runBacktest(
    historicalData: OHLCV[],
    strategy: StrategyFunction,
    params: StrategyParams,
    initialCapital: number = 10000
  ): BacktestMetrics {
    // Generate trade signals
    const signals = strategy(historicalData, params);

    // Execute trades
    const trades: BacktestTrade[] = [];
    let currentPosition: {
      entryTime: number;
      entryPrice: number;
      quantity: number;
    } | null = null;

    for (const signal of signals) {
      const candle = historicalData.find((c) => c.time >= signal.time);
      if (!candle) continue;

      if (signal.type === "BUY" && !currentPosition) {
        currentPosition = {
          entryTime: signal.time,
          entryPrice: signal.price,
          quantity: signal.quantity,
        };
      } else if (signal.type === "SELL" && currentPosition) {
        const trade: BacktestTrade = {
          entryTime: currentPosition.entryTime,
          entryPrice: currentPosition.entryPrice,
          exitTime: signal.time,
          exitPrice: signal.price,
          quantity: currentPosition.quantity,
          pnl: (signal.price - currentPosition.entryPrice) * currentPosition.quantity,
          pnlPercent:
            ((signal.price - currentPosition.entryPrice) /
              currentPosition.entryPrice) *
            100,
          duration: signal.time - currentPosition.entryTime,
        };

        trades.push(trade);
        currentPosition = null;
      }
    }

    // Calculate metrics
    return this.calculateMetrics(trades, initialCapital);
  }

  /**
   * Calculate backtest metrics
   */
  static calculateMetrics(
    trades: BacktestTrade[],
    initialCapital: number
  ): BacktestMetrics {
    if (trades.length === 0) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        averageWin: 0,
        averageLoss: 0,
        trades: [],
      };
    }

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalReturn = (totalPnL / initialCapital) * 100;

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const winRate = (winningTrades.length / trades.length) * 100;
    const averageWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) /
          winningTrades.length
        : 0;
    const averageLoss =
      losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) /
          losingTrades.length
        : 0;

    const profitFactor =
      averageLoss !== 0
        ? Math.abs(averageWin * winningTrades.length) /
          Math.abs(averageLoss * losingTrades.length)
        : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = initialCapital;
    let currentCapital = initialCapital;

    for (const trade of trades) {
      currentCapital += trade.pnl;
      if (currentCapital > peak) {
        peak = currentCapital;
      }
      const drawdown = ((peak - currentCapital) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map((t) => (t.pnl / initialCapital) * 100);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;

    // Annualized return (assuming 252 trading days per year)
    const annualizedReturn =
      Math.pow(1 + totalReturn / 100, 252 / trades.length) * 100 - 100;

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin,
      averageLoss,
      trades,
    };
  }

  /**
   * Compare multiple backtest results
   */
  static compareResults(results: BacktestMetrics[]): {
    best: BacktestMetrics;
    worst: BacktestMetrics;
    average: BacktestMetrics;
  } {
    if (results.length === 0) {
      throw new Error("No results to compare");
    }

    const best = results.reduce((prev, current) =>
      current.totalReturn > prev.totalReturn ? current : prev
    );

    const worst = results.reduce((prev, current) =>
      current.totalReturn < prev.totalReturn ? current : prev
    );

    const avgMetrics: BacktestMetrics = {
      totalReturn:
        results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length,
      annualizedReturn:
        results.reduce((sum, r) => sum + r.annualizedReturn, 0) /
        results.length,
      sharpeRatio:
        results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length,
      maxDrawdown:
        results.reduce((sum, r) => sum + r.maxDrawdown, 0) / results.length,
      winRate:
        results.reduce((sum, r) => sum + r.winRate, 0) / results.length,
      profitFactor:
        results.reduce((sum, r) => sum + r.profitFactor, 0) / results.length,
      totalTrades: Math.round(
        results.reduce((sum, r) => sum + r.totalTrades, 0) / results.length
      ),
      winningTrades: Math.round(
        results.reduce((sum, r) => sum + r.winningTrades, 0) / results.length
      ),
      losingTrades: Math.round(
        results.reduce((sum, r) => sum + r.losingTrades, 0) / results.length
      ),
      averageWin:
        results.reduce((sum, r) => sum + r.averageWin, 0) / results.length,
      averageLoss:
        results.reduce((sum, r) => sum + r.averageLoss, 0) / results.length,
      trades: [],
    };

    return { best, worst, average: avgMetrics };
  }

  /**
   * Generate buy/sell signals based on simple moving averages
   */
  static smaStrategy(
    candles: OHLCV[],
    params: StrategyParams
  ): TradeSignal[] {
    const fastPeriod = (params.fastPeriod as number) || 10;
    const slowPeriod = (params.slowPeriod as number) || 20;
    const quantity = (params.quantity as number) || 1;

    const signals: TradeSignal[] = [];

    for (let i = slowPeriod; i < candles.length; i++) {
      const fastSMA =
        candles
          .slice(i - fastPeriod, i)
          .reduce((sum, c) => sum + c.close, 0) / fastPeriod;

      const slowSMA =
        candles
          .slice(i - slowPeriod, i)
          .reduce((sum, c) => sum + c.close, 0) / slowPeriod;

      const prevFastSMA =
        candles
          .slice(i - fastPeriod - 1, i - 1)
          .reduce((sum, c) => sum + c.close, 0) / fastPeriod;

      const prevSlowSMA =
        candles
          .slice(i - slowPeriod - 1, i - 1)
          .reduce((sum, c) => sum + c.close, 0) / slowPeriod;

      // Golden cross
      if (prevFastSMA <= prevSlowSMA && fastSMA > slowSMA) {
        signals.push({
          time: candles[i].time,
          type: "BUY",
          price: candles[i].close,
          quantity,
          reason: "Golden Cross",
        });
      }

      // Death cross
      if (prevFastSMA >= prevSlowSMA && fastSMA < slowSMA) {
        signals.push({
          time: candles[i].time,
          type: "SELL",
          price: candles[i].close,
          quantity,
          reason: "Death Cross",
        });
      }
    }

    return signals;
  }

  /**
   * Generate buy/sell signals based on RSI
   */
  static rsiStrategy(
    candles: OHLCV[],
    params: StrategyParams
  ): TradeSignal[] {
    const period = (params.period as number) || 14;
    const overbought = (params.overbought as number) || 70;
    const oversold = (params.oversold as number) || 30;
    const quantity = (params.quantity as number) || 1;

    const signals: TradeSignal[] = [];
    const rsiValues = this.calculateRSI(candles, period);

    for (let i = 1; i < rsiValues.length; i++) {
      const prevRSI = rsiValues[i - 1];
      const currentRSI = rsiValues[i];

      // Oversold - buy signal
      if (prevRSI <= oversold && currentRSI > oversold) {
        signals.push({
          time: candles[i].time,
          type: "BUY",
          price: candles[i].close,
          quantity,
          reason: `RSI Oversold (${currentRSI.toFixed(2)})`,
        });
      }

      // Overbought - sell signal
      if (prevRSI >= overbought && currentRSI < overbought) {
        signals.push({
          time: candles[i].time,
          type: "SELL",
          price: candles[i].close,
          quantity,
          reason: `RSI Overbought (${currentRSI.toFixed(2)})`,
        });
      }
    }

    return signals;
  }

  /**
   * Calculate RSI indicator
   */
  private static calculateRSI(candles: OHLCV[], period: number): number[] {
    const rsi: number[] = [];

    for (let i = period; i < candles.length; i++) {
      let gains = 0;
      let losses = 0;

      for (let j = i - period; j < i; j++) {
        const change = candles[j + 1].close - candles[j].close;
        if (change > 0) {
          gains += change;
        } else {
          losses += Math.abs(change);
        }
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsiValue = 100 - 100 / (1 + rs);

      rsi.push(rsiValue);
    }

    return rsi;
  }
}

export default BacktestingService;
