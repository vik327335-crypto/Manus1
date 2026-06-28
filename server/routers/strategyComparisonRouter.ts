import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { dayTradingPositions } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface StrategyMetrics {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  roi: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
}

interface PeriodComparison {
  strategyName: string;
  periods: {
    period: string;
    metrics: StrategyMetrics;
  }[];
}

// Функция для расчёта метрик по позициям
function calculateMetrics(positions: any[]): StrategyMetrics | null {
  if (!positions || positions.length === 0) {
    return null;
  }

  const winningTrades = positions.filter((p: any) => p.profitLoss > 0).length;
  const losingTrades = positions.filter((p: any) => p.profitLoss < 0).length;
  const totalProfit = positions
    .filter((p: any) => p.profitLoss > 0)
    .reduce((sum: number, p: any) => sum + p.profitLoss, 0);
  const totalLoss = Math.abs(
    positions
      .filter((p: any) => p.profitLoss < 0)
      .reduce((sum: number, p: any) => sum + p.profitLoss, 0)
  );

  const strategyName = positions[0]?.strategyName || 'Unknown';

  return {
    strategyName,
    totalTrades: positions.length,
    winningTrades,
    losingTrades,
    winRate: (winningTrades / positions.length) * 100,
    totalProfit,
    totalLoss,
    roi: totalProfit > 0 ? (totalProfit / totalLoss) * 100 : 0,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
    sharpeRatio: 0, // Требует дополнительных расчётов
    maxDrawdown: 0, // Требует дополнительных расчётов
    averageWin: winningTrades > 0 ? totalProfit / winningTrades : 0,
    averageLoss: losingTrades > 0 ? totalLoss / losingTrades : 0,
    largestWin: Math.max(...positions.map((p: any) => p.profitLoss), 0),
    largestLoss: Math.abs(Math.min(...positions.map((p: any) => p.profitLoss), 0)),
  };
}

export const strategyComparisonRouter = router({
  // Сравнить стратегию по разным периодам
  compareStrategyByPeriods: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        periods: z.array(
          z.object({
            name: z.string(),
            startDate: z.number(),
            endDate: z.number(),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : 0;
        const periodComparisons: PeriodComparison = {
          strategyName: input.strategyName,
          periods: [],
        };

        // Получаем метрики для каждого периода
        for (const period of input.periods) {
          const positions: any[] = await db
            .select()
            .from(dayTradingPositions)
            .where(
              and(
                eq(dayTradingPositions.userId, userId),
                eq(dayTradingPositions.strategyName, input.strategyName),
                gte(dayTradingPositions.openTime, period.startDate),
                lte(dayTradingPositions.openTime, period.endDate)
              )
            );

          const metrics = calculateMetrics(positions);
          if (metrics) {
            periodComparisons.periods.push({
              period: period.name,
              metrics,
            });
          }
        }

        return {
          success: true,
          data: periodComparisons,
        };
      } catch (error: any) {
        throw new Error(`Failed to compare strategy by periods: ${error.message}`);
      }
    }),

  // Сравнить несколько стратегий в одном периоде
  compareStrategiesByPeriod: protectedProcedure
    .input(
      z.object({
        strategyNames: z.array(z.string()),
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : 0;
        const comparisons: StrategyMetrics[] = [];

        // Получаем метрики для каждой стратегии
        for (const strategyName of input.strategyNames) {
          const positions: any[] = await db
            .select()
            .from(dayTradingPositions)
            .where(
              and(
                eq(dayTradingPositions.userId, userId),
                eq(dayTradingPositions.strategyName, strategyName),
                gte(dayTradingPositions.openTime, input.startDate),
                lte(dayTradingPositions.openTime, input.endDate)
              )
            );

          const metrics = calculateMetrics(positions);
          if (metrics) {
            comparisons.push(metrics);
          }
        }

        return {
          success: true,
          data: comparisons,
        };
      } catch (error: any) {
        throw new Error(`Failed to compare strategies by period: ${error.message}`);
      }
    }),

  // Получить тренд метрик стратегии по времени
  getStrategyTrend: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        startDate: z.number(),
        endDate: z.number(),
        intervalDays: z.number().default(7),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : 0;
        const trendData: any[] = [];

        // Разбиваем период на интервалы
        const intervalMs = input.intervalDays * 24 * 60 * 60 * 1000;
        let currentStart = input.startDate;

        while (currentStart < input.endDate) {
          const currentEnd = Math.min(currentStart + intervalMs, input.endDate);

          const positions: any[] = await db
            .select()
            .from(dayTradingPositions)
            .where(
              and(
                eq(dayTradingPositions.userId, userId),
                eq(dayTradingPositions.strategyName, input.strategyName),
                gte(dayTradingPositions.openTime, currentStart),
                lte(dayTradingPositions.openTime, currentEnd)
              )
            );

          const metrics = calculateMetrics(positions);
          if (metrics) {
            trendData.push({
              date: new Date(currentStart).toISOString().split('T')[0],
              ...metrics,
            });
          }

          currentStart = currentEnd;
        }

        return {
          success: true,
          data: trendData,
        };
      } catch (error: any) {
        throw new Error(`Failed to get strategy trend: ${error.message}`);
      }
    }),
});
