import { describe, it, expect, beforeEach } from 'vitest';
import { strategyHistoryRouter } from './strategyHistoryRouter';

// Mock context
const mockContext = {
  user: { id: 1 },
};

describe('strategyHistoryRouter', () => {
  let router: any;

  beforeEach(() => {
    router = strategyHistoryRouter.createCaller(mockContext);
  });

  describe('recordSnapshot', () => {
    it('should record a strategy snapshot', async () => {
      const result = await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 65,
          roi: 25.5,
          sharpeRatio: 1.8,
          maxDrawdown: -15,
          profitFactor: 2.1,
          totalProfit: 2550,
        },
      });

      expect(result.success).toBe(true);
      expect(result.snapshot.strategyName).toBe('MA_Crossover');
      expect(result.snapshot.winRate).toBe(65);
    });
  });

  describe('getHistory', () => {
    it('should retrieve strategy history', async () => {
      const now = Date.now();

      await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 65,
          roi: 25.5,
          sharpeRatio: 1.8,
          maxDrawdown: -15,
          profitFactor: 2.1,
          totalProfit: 2550,
        },
      });

      const history = await router.getHistory({
        strategyName: 'MA_Crossover',
        startDate: now - 24 * 60 * 60 * 1000,
        endDate: now + 24 * 60 * 60 * 1000,
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('getAllSnapshots', () => {
    it('should get all snapshots for a strategy', async () => {
      await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 65,
          roi: 25.5,
          sharpeRatio: 1.8,
          maxDrawdown: -15,
          profitFactor: 2.1,
          totalProfit: 2550,
        },
      });

      const snapshots = await router.getAllSnapshots({
        strategyName: 'MA_Crossover',
        limit: 50,
      });

      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBeGreaterThan(0);
    });
  });

  describe('getImprovement', () => {
    it('should calculate strategy improvement', async () => {
      const now = Date.now();

      // Record first snapshot
      await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -20,
          profitFactor: 1.8,
          totalProfit: 2000,
        },
      });

      // Record second snapshot
      await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 120,
          winRate: 65,
          roi: 25.5,
          sharpeRatio: 1.8,
          maxDrawdown: -15,
          profitFactor: 2.1,
          totalProfit: 2550,
        },
      });

      const improvement = await router.getImprovement({
        strategyName: 'MA_Crossover',
        period: 'all',
      });

      expect(improvement.metrics.roiChange).toBe(5.5);
      expect(improvement.metrics.winRateChange).toBe(5);
    });
  });

  describe('comparePerformance', () => {
    it('should compare performance across periods', async () => {
      await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 65,
          roi: 25.5,
          sharpeRatio: 1.8,
          maxDrawdown: -15,
          profitFactor: 2.1,
          totalProfit: 2550,
        },
      });

      const comparison = await router.comparePerformance({
        strategyName: 'MA_Crossover',
        periods: ['month'],
      });

      expect(typeof comparison).toBe('object');
    });
  });

  describe('getStatistics', () => {
    it('should calculate metric statistics', async () => {
      await router.recordSnapshot({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 65,
          roi: 25.5,
          sharpeRatio: 1.8,
          maxDrawdown: -15,
          profitFactor: 2.1,
          totalProfit: 2550,
        },
      });

      const stats = await router.getStatistics({
        strategyName: 'MA_Crossover',
        metric: 'roi',
      });

      expect(stats.metric).toBe('roi');
      expect(stats.current).toBe(25.5);
      expect(stats.min).toBeLessThanOrEqual(stats.max);
    });
  });
});
