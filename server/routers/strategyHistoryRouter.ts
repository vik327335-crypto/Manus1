import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb as _getDb } from '../db';
import { dayTradingPositions as _dayTradingPositions } from '../../drizzle/schema';
import { eq as _eq, gte as _gte, lte as _lte, desc as _desc } from 'drizzle-orm';

interface StrategySnapshot {
  timestamp: number;
  strategyName: string;
  totalTrades: number;
  winRate: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  totalProfit: number;
}

// In-memory storage for strategy snapshots (in production, use database)
const strategySnapshots = new Map<string, StrategySnapshot[]>();

function getSnapshotKey(userId: number, strategyName: string): string {
  return `${userId}:${strategyName}`;
}

export const strategyHistoryRouter = router({
  // Record strategy metrics snapshot
  recordSnapshot: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        metrics: z.object({
          totalTrades: z.number(),
          winRate: z.number(),
          roi: z.number(),
          sharpeRatio: z.number(),
          maxDrawdown: z.number(),
          profitFactor: z.number(),
          totalProfit: z.number(),
        }),
      })
    )
    .mutation(({ input, ctx }) => {
      const key = getSnapshotKey(ctx.user.id, input.strategyName);
      const snapshots = strategySnapshots.get(key) || [];

      const snapshot: StrategySnapshot = {
        timestamp: Date.now(),
        strategyName: input.strategyName,
        ...input.metrics,
      };

      snapshots.push(snapshot);

      // Keep only last 1000 snapshots per strategy
      if (snapshots.length > 1000) {
        snapshots.shift();
      }

      strategySnapshots.set(key, snapshots);

      return {
        success: true,
        snapshot,
      };
    }),

  // Get strategy history for a period
  getHistory: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        startDate: z.number(),
        endDate: z.number(),
        limit: z.number().default(100),
      })
    )
    .query(({ input, ctx }) => {
      const key = getSnapshotKey(ctx.user.id, input.strategyName);
      const snapshots = strategySnapshots.get(key) || [];

      const filtered = snapshots.filter(
        (s) => s.timestamp >= input.startDate && s.timestamp <= input.endDate
      );

      return filtered.slice(-input.limit);
    }),

  // Get all strategy snapshots
  getAllSnapshots: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(({ input, ctx }) => {
      const key = getSnapshotKey(ctx.user.id, input.strategyName);
      const snapshots = strategySnapshots.get(key) || [];

      return snapshots.slice(-input.limit).reverse();
    }),

  // Calculate strategy improvement
  getImprovement: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        period: z.enum(['day', 'week', 'month', 'all']),
      })
    )
    .query(({ input, ctx }) => {
      const key = getSnapshotKey(ctx.user.id, input.strategyName);
      const snapshots = strategySnapshots.get(key) || [];

      if (snapshots.length < 2) {
        return {
          improvement: 0,
          metrics: {
            roiChange: 0,
            winRateChange: 0,
            sharpeRatioChange: 0,
            profitFactorChange: 0,
          },
        };
      }

      // Calculate time window
      const now = Date.now();
      let cutoffTime = 0;

      switch (input.period) {
        case 'day':
          cutoffTime = now - 24 * 60 * 60 * 1000;
          break;
        case 'week':
          cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'all':
          cutoffTime = 0;
          break;
      }

      const periodSnapshots = snapshots.filter((s) => s.timestamp >= cutoffTime);

      if (periodSnapshots.length < 2) {
        return {
          improvement: 0,
          metrics: {
            roiChange: 0,
            winRateChange: 0,
            sharpeRatioChange: 0,
            profitFactorChange: 0,
          },
        };
      }

      const first = periodSnapshots[0];
      const last = periodSnapshots[periodSnapshots.length - 1];

      const roiChange = last.roi - first.roi;
      const winRateChange = last.winRate - first.winRate;
      const sharpeRatioChange = last.sharpeRatio - first.sharpeRatio;
      const profitFactorChange = last.profitFactor - first.profitFactor;

      // Calculate overall improvement score
      const improvement =
        (roiChange > 0 ? 1 : -1) * Math.abs(roiChange) +
        (winRateChange > 0 ? 1 : -1) * Math.abs(winRateChange) * 0.5 +
        (sharpeRatioChange > 0 ? 1 : -1) * Math.abs(sharpeRatioChange) * 0.5;

      return {
        improvement: Math.round(improvement * 100) / 100,
        metrics: {
          roiChange: Math.round(roiChange * 100) / 100,
          winRateChange: Math.round(winRateChange * 100) / 100,
          sharpeRatioChange: Math.round(sharpeRatioChange * 100) / 100,
          profitFactorChange: Math.round(profitFactorChange * 100) / 100,
        },
        period: input.period,
        snapshotCount: periodSnapshots.length,
      };
    }),

  // Compare strategy performance across periods
  comparePerformance: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        periods: z.array(z.enum(['week1', 'week2', 'week3', 'week4', 'month'])),
      })
    )
    .query(({ input, ctx }) => {
      const key = getSnapshotKey(ctx.user.id, input.strategyName);
      const snapshots = strategySnapshots.get(key) || [];

      const now = Date.now();
      const comparison: Record<string, any> = {};

      const periodRanges: Record<string, [number, number]> = {
        week1: [now - 7 * 24 * 60 * 60 * 1000, now],
        week2: [now - 14 * 24 * 60 * 60 * 1000, now - 7 * 24 * 60 * 60 * 1000],
        week3: [now - 21 * 24 * 60 * 60 * 1000, now - 14 * 24 * 60 * 60 * 1000],
        week4: [now - 28 * 24 * 60 * 60 * 1000, now - 21 * 24 * 60 * 60 * 1000],
        month: [now - 30 * 24 * 60 * 60 * 1000, now],
      };

      for (const period of input.periods) {
        const [start, end] = periodRanges[period];
        const periodSnapshots = snapshots.filter((s) => s.timestamp >= start && s.timestamp <= end);

        if (periodSnapshots.length > 0) {
          const latest = periodSnapshots[periodSnapshots.length - 1];
          comparison[period] = {
            roi: latest.roi,
            winRate: latest.winRate,
            sharpeRatio: latest.sharpeRatio,
            profitFactor: latest.profitFactor,
            totalProfit: latest.totalProfit,
            snapshotCount: periodSnapshots.length,
          };
        }
      }

      return comparison;
    }),

  // Get strategy statistics over time
  getStatistics: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        metric: z.enum(['roi', 'winRate', 'sharpeRatio', 'profitFactor']),
      })
    )
    .query(({ input, ctx }) => {
      const key = getSnapshotKey(ctx.user.id, input.strategyName);
      const snapshots = strategySnapshots.get(key) || [];

      if (snapshots.length === 0) {
        return {
          metric: input.metric,
          min: 0,
          max: 0,
          avg: 0,
          current: 0,
          trend: 'stable',
        };
      }

      const values = snapshots.map((s) => s[input.metric as keyof StrategySnapshot] as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const current = values[values.length - 1];

      // Calculate trend
      const recentValues = values.slice(-10);
      const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      let trend = 'stable';
      if (recentAvg > avg * 1.05) {
        trend = 'improving';
      } else if (recentAvg < avg * 0.95) {
        trend = 'declining';
      }

      return {
        metric: input.metric,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        current: Math.round(current * 100) / 100,
        trend,
        snapshotCount: snapshots.length,
      };
    }),
});
