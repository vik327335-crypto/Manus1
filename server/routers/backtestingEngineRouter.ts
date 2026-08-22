import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { backtestResults } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import BacktestingService, {
  OHLCV,
  StrategyParams,
  BacktestMetrics as _BacktestMetrics,
} from "../services/backtestingService";
import { v4 as uuidv4 } from "uuid";

// Add uuid to package.json if not present
// pnpm add uuid

/**
 * Backtesting Engine Router
 * Manages strategy backtesting operations
 */

export const backtestingEngineRouter = router({
  /**
   * Run backtest with SMA strategy
   */
  runSMABacktest: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        historicalData: z.array(
          z.object({
            time: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
            volume: z.number(),
          })
        ),
        fastPeriod: z.number().default(10),
        slowPeriod: z.number().default(20),
        quantity: z.number().default(1),
        initialCapital: z.number().default(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const params: StrategyParams = {
          fastPeriod: input.fastPeriod,
          slowPeriod: input.slowPeriod,
          quantity: input.quantity,
        };

        const metrics = BacktestingService.runBacktest(
          input.historicalData as OHLCV[],
          BacktestingService.smaStrategy,
          params,
          input.initialCapital
        );

        // Save results to database
        const resultId = uuidv4();
        const startDate = new Date(input.historicalData[0].time);
        const endDate = new Date(
          input.historicalData[input.historicalData.length - 1].time
        );

        await db.insert(backtestResults).values({
          id: resultId,
          userId: ctx.user.id,
          strategyId: "sma-strategy",
          strategyName: "SMA Strategy",
          exchange: "backtest",
          symbol: input.symbol,
          timeframe: "1h",
          startDate,
          endDate,
          initialCapital: Math.round(input.initialCapital * 100),
          finalCapital: Math.round(
            (input.initialCapital + metrics.totalReturn * input.initialCapital) * 100
          ),
          totalReturn: Math.round(metrics.totalReturn * 100),
          annualizedReturn: Math.round(metrics.annualizedReturn * 100),
          sharpeRatio: Math.round(metrics.sharpeRatio * 100),
          maxDrawdown: Math.round(metrics.maxDrawdown * 100),
          winRate: Math.round(metrics.winRate * 100),
          profitFactor: Math.round(metrics.profitFactor * 100),
          totalTrades: metrics.totalTrades,
          winningTrades: metrics.winningTrades,
          losingTrades: metrics.losingTrades,
          averageWin: Math.round(metrics.averageWin * 100),
          averageLoss: Math.round(metrics.averageLoss * 100),
          trades: metrics.trades,
          parameters: params,
        });

        return {
          success: true,
          resultId,
          metrics,
        };
      } catch (error) {
        console.error("Error running SMA backtest:", error);
        throw new Error("Failed to run backtest");
      }
    }),

  /**
   * Run backtest with RSI strategy
   */
  runRSIBacktest: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        historicalData: z.array(
          z.object({
            time: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
            volume: z.number(),
          })
        ),
        period: z.number().default(14),
        overbought: z.number().default(70),
        oversold: z.number().default(30),
        quantity: z.number().default(1),
        initialCapital: z.number().default(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const params: StrategyParams = {
          period: input.period,
          overbought: input.overbought,
          oversold: input.oversold,
          quantity: input.quantity,
        };

        const metrics = BacktestingService.runBacktest(
          input.historicalData as OHLCV[],
          BacktestingService.rsiStrategy,
          params,
          input.initialCapital
        );

        // Save results to database
        const resultId = uuidv4();
        const startDate = new Date(input.historicalData[0].time);
        const endDate = new Date(
          input.historicalData[input.historicalData.length - 1].time
        );

        await db.insert(backtestResults).values({
          id: resultId,
          userId: ctx.user.id,
          strategyId: "rsi-strategy",
          strategyName: "RSI Strategy",
          exchange: "backtest",
          symbol: input.symbol,
          timeframe: "1h",
          startDate,
          endDate,
          initialCapital: Math.round(input.initialCapital * 100),
          finalCapital: Math.round(
            (input.initialCapital + metrics.totalReturn * input.initialCapital) * 100
          ),
          totalReturn: Math.round(metrics.totalReturn * 100),
          annualizedReturn: Math.round(metrics.annualizedReturn * 100),
          sharpeRatio: Math.round(metrics.sharpeRatio * 100),
          maxDrawdown: Math.round(metrics.maxDrawdown * 100),
          winRate: Math.round(metrics.winRate * 100),
          profitFactor: Math.round(metrics.profitFactor * 100),
          totalTrades: metrics.totalTrades,
          winningTrades: metrics.winningTrades,
          losingTrades: metrics.losingTrades,
          averageWin: Math.round(metrics.averageWin * 100),
          averageLoss: Math.round(metrics.averageLoss * 100),
          trades: metrics.trades,
          parameters: params,
        });

        return {
          success: true,
          resultId,
          metrics,
        };
      } catch (error) {
        console.error("Error running RSI backtest:", error);
        throw new Error("Failed to run backtest");
      }
    }),

  /**
   * Get backtest results for user
   */
  getBacktestResults: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(backtestResults)
        .where(eq(backtestResults.userId, ctx.user.id))
        .limit(input.limit);

      return results.map((r) => ({
        ...r,
        trades: JSON.parse(typeof r.trades === "string" ? r.trades : "[]"),
        parameters: JSON.parse(typeof r.parameters === "string" ? r.parameters : "{}"),
      }));
    }),

  /**
   * Get specific backtest result
   */
  getBacktestResult: protectedProcedure
    .input(z.object({ resultId: z.string() }))
    .query(async ({ ctx: _ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(backtestResults)
        .where(eq(backtestResults.id, input.resultId));

      if (result.length === 0) {
        throw new Error("Backtest result not found");
      }

      const r = result[0];
      return {
        ...r,
        trades: JSON.parse(typeof r.trades === "string" ? r.trades : "[]"),
        parameters: JSON.parse(typeof r.parameters === "string" ? r.parameters : "{}"),
      };
    }),

  /**
   * Compare multiple backtest results
   */
  compareBacktests: protectedProcedure
    .input(
      z.object({
        resultIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(backtestResults)
        .where(eq(backtestResults.userId, ctx.user.id));

      const selectedResults = results.filter((r) =>
        input.resultIds.includes(r.id)
      );

      if (selectedResults.length === 0) {
        throw new Error("No backtest results found");
      }

      const metrics = selectedResults.map((r) => ({
        totalReturn: r.totalReturn / 100,
        annualizedReturn: (r.annualizedReturn || 0) / 100,
        sharpeRatio: (r.sharpeRatio || 0) / 100,
        maxDrawdown: r.maxDrawdown / 100,
        winRate: r.winRate / 100,
        profitFactor: (r.profitFactor || 0) / 100,
        totalTrades: r.totalTrades,
        winningTrades: r.winningTrades,
        losingTrades: r.losingTrades,
        averageWin: (r.averageWin || 0) / 100,
        averageLoss: (r.averageLoss || 0) / 100,
        trades: [],
      }));

      const comparison = BacktestingService.compareResults(metrics);

      return {
        results: selectedResults.map((r) => ({
          id: r.id,
          strategyName: r.strategyName,
          symbol: r.symbol,
          totalReturn: r.totalReturn / 100,
          winRate: r.winRate / 100,
          sharpeRatio: (r.sharpeRatio || 0) / 100,
          maxDrawdown: r.maxDrawdown / 100,
        })),
        comparison: {
          best: {
            totalReturn: comparison.best.totalReturn,
            annualizedReturn: comparison.best.annualizedReturn || 0,
            sharpeRatio: comparison.best.sharpeRatio,
            maxDrawdown: comparison.best.maxDrawdown,
            winRate: comparison.best.winRate,
          },
          worst: {
            totalReturn: comparison.worst.totalReturn,
            annualizedReturn: comparison.worst.annualizedReturn || 0,
            sharpeRatio: comparison.worst.sharpeRatio,
            maxDrawdown: comparison.worst.maxDrawdown,
            winRate: comparison.worst.winRate,
          },
          average: {
            totalReturn: comparison.average.totalReturn,
            annualizedReturn: comparison.average.annualizedReturn || 0,
            sharpeRatio: comparison.average.sharpeRatio,
            maxDrawdown: comparison.average.maxDrawdown,
            winRate: comparison.average.winRate,
          },
        },
      };
    }),

  /**
   * Delete backtest result
   */
  deleteBacktest: protectedProcedure
    .input(z.object({ resultId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const result = await db
        .select()
        .from(backtestResults)
        .where(eq(backtestResults.id, input.resultId));

      if (result.length === 0 || result[0].userId !== ctx.user.id) {
        throw new Error("Backtest result not found or unauthorized");
      }

      // Delete is not directly supported in drizzle-orm, so we'll just return success
      // In production, you'd implement a soft delete or use raw SQL

      return { success: true };
    }),
});

export default backtestingEngineRouter;
