import { z } from "zod";
import { getDb } from "../db";
import { dayTradingSignals, dayTradingPositions } from "../../drizzle/schema";
import { eq, gte, lte, desc, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { cacheService, cacheKeys } from "../cache";

export const strategyDataRouter = router({
  // Получить все сигналы для стратегии
  getStrategySignals: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const filters: any[] = [
        eq(dayTradingSignals.strategyName, input.strategyName),
        eq(dayTradingSignals.userId, ctx.user.id),
      ];

      if (input.startDate) {
        filters.push(gte(dayTradingSignals.timestamp, input.startDate));
      }
      if (input.endDate) {
        filters.push(lte(dayTradingSignals.timestamp, input.endDate));
      }

      const signals = await db.select().from(dayTradingSignals).where(and(...filters)).orderBy(desc(dayTradingSignals.timestamp)).limit(input.limit);

      return signals;
    }),

  // Получить все позиции для стратегии
  getStrategyPositions: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const filters: any[] = [
        eq(dayTradingPositions.strategyName, input.strategyName),
        eq(dayTradingPositions.userId, ctx.user.id),
      ];

      if (input.startDate) {
        filters.push(gte(dayTradingPositions.openTime, input.startDate));
      }
      if (input.endDate) {
        filters.push(lte(dayTradingPositions.closeTime || 0, input.endDate));
      }

      const positions = await db.select().from(dayTradingPositions).where(and(...filters)).orderBy(desc(dayTradingPositions.openTime)).limit(input.limit);

      return positions;
    }),

  // Получить метрики стратегии за период
  getStrategyMetrics: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const positions = await db.select().from(dayTradingPositions).where(and(
        eq(dayTradingPositions.strategyName, input.strategyName),
        eq(dayTradingPositions.userId, ctx.user.id),
        gte(dayTradingPositions.openTime, input.startDate),
        lte(dayTradingPositions.openTime, input.endDate)
      ));

      if (positions.length === 0) {
        return {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          breakEvenTrades: 0,
          winRate: 0,
          totalProfit: 0,
          totalLoss: 0,
          profitFactor: 0,
          averageWin: 0,
          averageLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          consecutiveWins: 0,
          consecutiveLosses: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          roi: 0,
        };
      }

      // Расчёт метрик
      let winningTrades = 0;
      let losingTrades = 0;
      let breakEvenTrades = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      let largestWin = 0;
      let largestLoss = 0;
      let maxDrawdown = 0;
      let runningBalance = 0;
      let peakBalance = 0;

      const returns: number[] = [];

      for (const position of positions) {
        const pnl = (position.closePrice || 0) - position.openPrice;
        const pnlPercent = (pnl / position.openPrice) * 100;

        returns.push(pnlPercent);

        if (pnl > 0) {
          winningTrades++;
          totalProfit += pnl;
          largestWin = Math.max(largestWin, pnl);
        } else if (pnl < 0) {
          losingTrades++;
          totalLoss += Math.abs(pnl);
          largestLoss = Math.max(largestLoss, Math.abs(pnl));
        } else {
          breakEvenTrades++;
        }

        runningBalance += pnl;
        peakBalance = Math.max(peakBalance, runningBalance);
        maxDrawdown = Math.min(maxDrawdown, runningBalance - peakBalance);
      }

      const totalTrades = positions.length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
      const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
      const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

      // Расчёт Sharpe Ratio
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance =
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

      // Расчёт ROI
      const initialCapital = positions.reduce((sum: number, p: any) => sum + p.quantity * p.openPrice, 0);
      const roi = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        breakEvenTrades,
        winRate: Math.round(winRate * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalLoss: Math.round(totalLoss * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        averageWin: Math.round(averageWin * 100) / 100,
        averageLoss: Math.round(averageLoss * 100) / 100,
        largestWin: Math.round(largestWin * 100) / 100,
        largestLoss: Math.round(largestLoss * 100) / 100,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        roi: Math.round(roi * 100) / 100,
      };
    }),

  // Получить список всех стратегий пользователя
  getUserStrategies: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const positions = await db.select().from(dayTradingPositions).where(eq(dayTradingPositions.userId, ctx.user.id));

    const strategies = Array.from(new Set(positions.map((p: any) => p.strategyName as string)));
    return strategies;
  }),

  // Получить сравнительные метрики всех стратегий
  getAllStrategiesMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check cache first
      const cacheKey = cacheKeys.allMetrics(ctx.user.id, input.startDate, input.endDate);
      const cachedMetrics = cacheService.get(cacheKey);
      if (cachedMetrics) {
        console.log(`[Cache] Hit for all metrics (user: ${ctx.user.id})`);
        return cachedMetrics;
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const positions = await db.select().from(dayTradingPositions).where(eq(dayTradingPositions.userId, ctx.user.id));

      const strategies = Array.from(new Set(positions.map((p: any) => p.strategyName as string)));

      const allMetrics = await Promise.all(
        (strategies as string[]).map(async (strategy: string) => {
          const strategyPositions = positions.filter((p: any) => p.strategyName === strategy);

          if (strategyPositions.length === 0) {
            return {
              strategyName: strategy,
              totalTrades: 0,
              winningTrades: 0,
              losingTrades: 0,
              breakEvenTrades: 0,
              winRate: 0,
              totalProfit: 0,
              totalLoss: 0,
              profitFactor: 0,
              averageWin: 0,
              averageLoss: 0,
              largestWin: 0,
              largestLoss: 0,
              consecutiveWins: 0,
              consecutiveLosses: 0,
              maxDrawdown: 0,
              sharpeRatio: 0,
              roi: 0,
            };
          }

          let winningTrades = 0;
          let losingTrades = 0;
          let breakEvenTrades = 0;
          let totalProfit = 0;
          let totalLoss = 0;
          let largestWin = 0;
          let largestLoss = 0;
          let maxDrawdown = 0;
          let runningBalance = 0;
          let peakBalance = 0;
          const returns: number[] = [];

          for (const position of strategyPositions) {
            const pnl = (position.closePrice || 0) - position.openPrice;
            const pnlPercent = (pnl / position.openPrice) * 100;
            returns.push(pnlPercent);

            if (pnl > 0) {
              winningTrades++;
              totalProfit += pnl;
              largestWin = Math.max(largestWin, pnl);
            } else if (pnl < 0) {
              losingTrades++;
              totalLoss += Math.abs(pnl);
              largestLoss = Math.max(largestLoss, Math.abs(pnl));
            } else {
              breakEvenTrades++;
            }

            runningBalance += pnl;
            peakBalance = Math.max(peakBalance, runningBalance);
            maxDrawdown = Math.min(maxDrawdown, runningBalance - peakBalance);
          }

          const totalTrades = strategyPositions.length;
          const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
          const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
          const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
          const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

          const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
          const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
          const stdDev = Math.sqrt(variance);
          const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

          const initialCapital = strategyPositions.reduce((sum: number, p: any) => sum + p.quantity * p.openPrice, 0);
          const roi = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;

          return {
            strategyName: strategy,
            totalTrades,
            winningTrades,
            losingTrades,
            breakEvenTrades,
            winRate: Math.round(winRate * 100) / 100,
            totalProfit: Math.round(totalProfit * 100) / 100,
            totalLoss: Math.round(totalLoss * 100) / 100,
            profitFactor: Math.round(profitFactor * 100) / 100,
            averageWin: Math.round(averageWin * 100) / 100,
            averageLoss: Math.round(averageLoss * 100) / 100,
            largestWin: Math.round(largestWin * 100) / 100,
            largestLoss: Math.round(largestLoss * 100) / 100,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            maxDrawdown: Math.round(maxDrawdown * 100) / 100,
            sharpeRatio: Math.round(sharpeRatio * 100) / 100,
            roi: Math.round(roi * 100) / 100,
          };
        })
      );

      // Cache the results for 5 minutes (300 seconds)
      cacheService.set(cacheKey, allMetrics, 300);
      console.log(`[Cache] Stored all metrics for user ${ctx.user.id}`);

      return allMetrics;
    }),
});
