/**
 * Backtesting Analytics Router
 * Handles backtesting analysis, Monte Carlo simulations, and strategy comparison
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';

export interface BacktestMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  recoveryFactor: number;
  averageWinSize: number;
  averageLossSize: number;
  totalTrades: number;
  profitableTrades: number;
}

export interface MonteCarloResult {
  iteration: number;
  finalValue: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export const backtestingAnalyticsRouter = router({
  /**
   * Calculate backtest metrics
   */
  calculateMetrics: protectedProcedure
    .input(
      z.object({
        initialCapital: z.number(),
        finalCapital: z.number(),
        trades: z.array(
          z.object({
            entryPrice: z.number(),
            exitPrice: z.number(),
            quantity: z.number(),
            entryDate: z.string(),
            exitDate: z.string(),
          })
        ),
        dailyReturns: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      try {
        const totalReturn = ((input.finalCapital - input.initialCapital) / input.initialCapital) * 100;
        const annualizedReturn = totalReturn / 2; // Simplified for 2-year period

        // Calculate Sharpe Ratio
        const avgReturn = input.dailyReturns.reduce((a, b) => a + b, 0) / input.dailyReturns.length;
        const variance =
          input.dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / input.dailyReturns.length;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252);

        // Calculate trade metrics
        const trades = input.trades.map((t) => ({
          profit: (t.exitPrice - t.entryPrice) * t.quantity,
          size: t.quantity * t.entryPrice,
        }));

        const profitableTrades = trades.filter((t) => t.profit > 0).length;
        const totalTrades = trades.length;
        const winRate = (profitableTrades / totalTrades) * 100;

        const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
        const totalLoss = trades.filter((t) => t.profit < 0).reduce((sum, t) => sum + Math.abs(t.profit), 0);
        const profitFactor = totalProfit / (totalLoss || 1);

        const avgWinSize = trades.filter((t) => t.profit > 0).length > 0
          ? trades.filter((t) => t.profit > 0).reduce((sum, t) => sum + t.profit, 0) /
            trades.filter((t) => t.profit > 0).length
          : 0;

        const avgLossSize = trades.filter((t) => t.profit < 0).length > 0
          ? Math.abs(
              trades.filter((t) => t.profit < 0).reduce((sum, t) => sum + t.profit, 0) /
                trades.filter((t) => t.profit < 0).length
            )
          : 0;

        // Calculate Max Drawdown
        let peak = input.initialCapital;
        let maxDD = 0;
        let currentCapital = input.initialCapital;

        for (const trade of trades) {
          currentCapital += trade.profit;
          peak = Math.max(peak, currentCapital);
          const dd = (currentCapital - peak) / peak;
          maxDD = Math.min(maxDD, dd);
        }

        const maxDrawdown = maxDD * 100;
        const recoveryFactor = totalReturn / Math.abs(maxDrawdown || 1);

        return {
          success: true,
          metrics: {
            totalReturn,
            annualizedReturn,
            sharpeRatio,
            maxDrawdown,
            winRate,
            profitFactor,
            recoveryFactor,
            averageWinSize: avgWinSize,
            averageLossSize: avgLossSize,
            totalTrades,
            profitableTrades,
          },
        };
      } catch (error) {
        throw new Error(`Failed to calculate metrics: ${String(error)}`);
      }
    }),

  /**
   * Run Monte Carlo simulation
   */
  runMonteCarloSimulation: protectedProcedure
    .input(
      z.object({
        trades: z.array(
          z.object({
            profit: z.number(),
          })
        ),
        initialCapital: z.number(),
        iterations: z.number().default(1000),
      })
    )
    .query(async ({ input }) => {
      try {
        const tradeReturns = input.trades.map((t) => t.profit);
        const avgReturn = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
        const variance =
          tradeReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / tradeReturns.length;
        const stdDev = Math.sqrt(variance);

        const simulations: MonteCarloResult[] = [];

        for (let i = 0; i < input.iterations; i++) {
          let capital = input.initialCapital;
          let peak = capital;
          let maxDD = 0;

          for (let j = 0; j < input.trades.length; j++) {
            // Generate random trade return from distribution
            const randomReturn = avgReturn + stdDev * (Math.random() + Math.random() - 1);
            capital += randomReturn;
            peak = Math.max(peak, capital);
            const dd = (capital - peak) / peak;
            maxDD = Math.min(maxDD, dd);
          }

          const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252);

          simulations.push({
            iteration: i,
            finalValue: capital,
            maxDrawdown: maxDD * 100,
            sharpeRatio,
          });
        }

        // Calculate statistics
        const finalValues = simulations.map((s) => s.finalValue).sort((a, b) => a - b);
        const maxDrawdowns = simulations.map((s) => s.maxDrawdown);

        return {
          success: true,
          simulations,
          statistics: {
            avgFinalValue: finalValues.reduce((a, b) => a + b, 0) / finalValues.length,
            minFinalValue: finalValues[0],
            maxFinalValue: finalValues[finalValues.length - 1],
            percentile5: finalValues[Math.floor(finalValues.length * 0.05)],
            percentile25: finalValues[Math.floor(finalValues.length * 0.25)],
            percentile50: finalValues[Math.floor(finalValues.length * 0.5)],
            percentile75: finalValues[Math.floor(finalValues.length * 0.75)],
            percentile95: finalValues[Math.floor(finalValues.length * 0.95)],
            avgMaxDrawdown: maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length,
            worstDrawdown: Math.min(...maxDrawdowns),
          },
        };
      } catch (error) {
        throw new Error(`Failed to run Monte Carlo simulation: ${String(error)}`);
      }
    }),

  /**
   * Compare multiple strategies
   */
  compareStrategies: protectedProcedure
    .input(
      z.object({
        strategies: z.array(
          z.object({
            name: z.string(),
            totalReturn: z.number(),
            sharpeRatio: z.number(),
            maxDrawdown: z.number(),
            winRate: z.number(),
            profitFactor: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        // Rank strategies
        const ranked = input.strategies
          .map((s, _i) => ({
            ...s,
            rank: 0,
            score: 0,
          }))
          .map((s) => {
            let score = 0;
            // Return score (0-30 points)
            score += Math.min(30, s.totalReturn / 5);
            // Sharpe ratio score (0-30 points)
            score += Math.min(30, s.sharpeRatio * 10);
            // Drawdown score (0-20 points)
            score += Math.max(0, 20 + s.maxDrawdown * 2);
            // Win rate score (0-20 points)
            score += (s.winRate / 100) * 20;

            return { ...s, score };
          })
          .sort((a, b) => b.score - a.score)
          .map((s, i) => ({ ...s, rank: i + 1 }));

        return {
          success: true,
          comparison: ranked,
          bestStrategy: ranked[0],
        };
      } catch (error) {
        throw new Error(`Failed to compare strategies: ${String(error)}`);
      }
    }),

  /**
   * Analyze strategy robustness
   */
  analyzeRobustness: protectedProcedure
    .input(
      z.object({
        trades: z.array(
          z.object({
            profit: z.number(),
            entryDate: z.string(),
          })
        ),
        totalReturn: z.number(),
        maxDrawdown: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Calculate consistency
        const monthlyProfits: Record<string, number> = {};
        for (const trade of input.trades) {
          const month = new Date(trade.entryDate).toISOString().slice(0, 7);
          monthlyProfits[month] = (monthlyProfits[month] || 0) + trade.profit;
        }

        const monthlyReturns = Object.values(monthlyProfits);
        const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
        const monthlyVariance =
          monthlyReturns.reduce((sum, r) => sum + Math.pow(r - avgMonthlyReturn, 2), 0) / monthlyReturns.length;
        const monthlyStdDev = Math.sqrt(monthlyVariance);
        const consistency = monthlyStdDev === 0 ? 100 : Math.max(0, 100 - (monthlyStdDev / Math.abs(avgMonthlyReturn || 1)) * 100);

        // Stability score
        const stabilityScore = Math.min(100, Math.abs(input.totalReturn) / Math.abs(input.maxDrawdown || 1));

        // Risk-adjusted score
        const riskAdjustedScore = (input.totalReturn / Math.abs(input.maxDrawdown || 1)) * 10;

        return {
          success: true,
          robustness: {
            consistency: Math.max(0, consistency),
            stabilityScore: Math.min(100, stabilityScore),
            riskAdjustedScore: Math.min(100, riskAdjustedScore),
            overallRobustness: (Math.max(0, consistency) + Math.min(100, stabilityScore) + Math.min(100, riskAdjustedScore)) / 3,
          },
        };
      } catch (error) {
        throw new Error(`Failed to analyze robustness: ${String(error)}`);
      }
    }),

  /**
   * Generate backtest report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        metrics: z.object({
          totalReturn: z.number(),
          sharpeRatio: z.number(),
          maxDrawdown: z.number(),
          winRate: z.number(),
        }),
        period: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = {
          title: `Backtest Report: ${input.strategyName}`,
          period: input.period,
          summary: `Strategy ${input.strategyName} achieved ${input.metrics.totalReturn.toFixed(2)}% total return with a Sharpe ratio of ${input.metrics.sharpeRatio.toFixed(2)}.`,
          metrics: input.metrics,
          recommendations: [] as string[],
        };

        // Generate recommendations
        if (input.metrics.sharpeRatio > 1.5) {
          report.recommendations.push('Strong risk-adjusted returns. Consider increasing position size.');
        }
        if (input.metrics.maxDrawdown > -20) {
          report.recommendations.push('Acceptable drawdown levels. Strategy shows good downside protection.');
        }
        if (input.metrics.winRate > 60) {
          report.recommendations.push('High win rate indicates strong signal quality. Monitor for overfitting.');
        }

        return {
          success: true,
          report,
        };
      } catch (error) {
        throw new Error(`Failed to generate report: ${String(error)}`);
      }
    }),
});

export default backtestingAnalyticsRouter;
