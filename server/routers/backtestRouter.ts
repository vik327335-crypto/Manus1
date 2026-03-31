/**
 * tRPC router for backtesting operations
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  runBacktest,
  optimizeCanSlimParameters,
  BacktestConfig,
} from "../services/backtestService";

export const backtestRouter = router({
  /**
   * Run a single backtest with given parameters
   */
  runBacktest: publicProcedure
    .input(
      z.object({
        startDate: z.string().datetime().transform((s) => new Date(s)),
        endDate: z.string().datetime().transform((s) => new Date(s)),
        initialCapital: z.number().positive(),
        positionSize: z.number().min(1).max(100),
        minCanSlimScore: z.number().min(0).max(10),
        stopLoss: z.number().min(1).max(50),
        takeProfit: z.number().min(5).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const config: BacktestConfig = {
        startDate: input.startDate,
        endDate: input.endDate,
        initialCapital: input.initialCapital,
        positionSize: input.positionSize,
        minCanSlimScore: input.minCanSlimScore,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
      };

      // Mock historical data for demonstration
      const historicalData = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000),
        ticker: ["BTC", "ETH", "ADA"][i % 3],
        price: 40000 + Math.random() * 10000,
        canSlimScore: 5 + Math.random() * 5,
        marketTrend: 0.5 + Math.random() * 0.5,
      }));

      const results = await runBacktest(historicalData, config);

      return {
        success: true,
        results: {
          totalTrades: results.totalTrades,
          winningTrades: results.winningTrades,
          losingTrades: results.losingTrades,
          winRate: results.winRate,
          totalPnL: results.totalPnL,
          totalPnLPercent: results.totalPnLPercent,
          averageWin: results.averageWin,
          averageLoss: results.averageLoss,
          profitFactor: results.profitFactor,
          sharpeRatio: results.sharpeRatio,
          maxDrawdown: results.maxDrawdown,
          trades: results.trades.map((t) => ({
            entryDate: t.entryDate.toISOString(),
            exitDate: t.exitDate.toISOString(),
            ticker: t.ticker,
            entryPrice: t.entryPrice,
            exitPrice: t.exitPrice,
            quantity: t.quantity,
            pnl: t.pnl,
            pnlPercent: t.pnlPercent,
            reason: t.reason,
            canSlimScore: t.canSlimScore,
          })),
          monthlyReturns: results.monthlyReturns,
        },
      };
    }),

  /**
   * Optimize CAN SLIM parameters using grid search
   */
  optimizeParameters: publicProcedure
    .input(
      z.object({
        startDate: z.string().datetime().transform((s) => new Date(s)),
        endDate: z.string().datetime().transform((s) => new Date(s)),
        initialCapital: z.number().positive(),
        positionSize: z.number().min(1).max(100),
        minScoreRange: z.tuple([z.number(), z.number(), z.number()]),
        stopLossRange: z.tuple([z.number(), z.number(), z.number()]),
        takeProfitRange: z.tuple([z.number(), z.number(), z.number()]),
      })
    )
    .mutation(async ({ input }) => {
      const baseConfig: BacktestConfig = {
        startDate: input.startDate,
        endDate: input.endDate,
        initialCapital: input.initialCapital,
        positionSize: input.positionSize,
        minCanSlimScore: input.minScoreRange[0],
        stopLoss: input.stopLossRange[0],
        takeProfit: input.takeProfitRange[0],
      };

      // Mock historical data
      const historicalData = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000),
        ticker: ["BTC", "ETH", "ADA"][i % 3],
        price: 40000 + Math.random() * 10000,
        canSlimScore: 5 + Math.random() * 5,
        marketTrend: 0.5 + Math.random() * 0.5,
      }));

      const optimization = await optimizeCanSlimParameters(historicalData, baseConfig, {
        minCanSlimScore: input.minScoreRange,
        stopLoss: input.stopLossRange,
        takeProfit: input.takeProfitRange,
      });

      return {
        success: true,
        optimalConfig: {
          minCanSlimScore: optimization.optimalConfig.minCanSlimScore,
          stopLoss: optimization.optimalConfig.stopLoss,
          takeProfit: optimization.optimalConfig.takeProfit,
        },
        optimalResults: {
          totalTrades: optimization.results.totalTrades,
          winRate: optimization.results.winRate,
          sharpeRatio: optimization.results.sharpeRatio,
          totalPnLPercent: optimization.results.totalPnLPercent,
          maxDrawdown: optimization.results.maxDrawdown,
        },
        parameterGrid: optimization.parameterGrid.map((item) => ({
          minCanSlimScore: item.config.minCanSlimScore,
          stopLoss: item.config.stopLoss,
          takeProfit: item.config.takeProfit,
          sharpeRatio: item.sharpeRatio,
          winRate: item.winRate,
          totalReturn: item.totalReturn,
        })),
      };
    }),

  /**
   * Get sample backtest results (for demo)
   */
  getSampleResults: publicProcedure.query(() => {
    return {
      totalTrades: 24,
      winningTrades: 16,
      losingTrades: 8,
      winRate: 66.7,
      totalPnL: 12500,
      totalPnLPercent: 25,
      averageWin: 1562.5,
      averageLoss: 937.5,
      profitFactor: 2.67,
      sharpeRatio: 1.85,
      maxDrawdown: 8.5,
      equityCurve: [
        { date: "Jan 1", equity: 50000 },
        { date: "Jan 15", equity: 51200 },
        { date: "Feb 1", equity: 53500 },
        { date: "Feb 15", equity: 52100 },
        { date: "Mar 1", equity: 55800 },
        { date: "Mar 15", equity: 58300 },
        { date: "Apr 1", equity: 59200 },
        { date: "Apr 15", equity: 61500 },
        { date: "May 1", equity: 62500 },
      ],
      monthlyReturns: {
        January: 2.4,
        February: 4.3,
        March: 5.1,
        April: 3.8,
        May: 1.9,
      },
    };
  }),
});
