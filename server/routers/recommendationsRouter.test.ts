import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recommendationsRouter } from './recommendationsRouter';

// Mock LLM
vi.mock('../_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify([
            {
              category: 'risk',
              priority: 'high',
              title: 'Reduce Max Drawdown',
              description: 'Your strategy has high drawdown',
              action: 'Add stop-loss orders',
              expectedImpact: 'Reduce drawdown by 10%',
              difficulty: 'easy',
            },
            {
              category: 'performance',
              priority: 'medium',
              title: 'Improve Win Rate',
              description: 'Win rate is below target',
              action: 'Optimize entry signals',
              expectedImpact: 'Increase win rate by 5%',
              difficulty: 'medium',
            },
          ]),
        },
      },
    ],
  }),
}));

// Mock context
const mockContext = {
  user: { id: 1 },
};

describe('recommendationsRouter', () => {
  let router: any;

  beforeEach(() => {
    router = recommendationsRouter.createCaller(mockContext);
  });

  describe('generateRecommendations', () => {
    it('should generate AI recommendations', async () => {
      const result = await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include recommendation details', async () => {
      const result = await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const rec = result.recommendations[0];
      expect(rec.id).toBeDefined();
      expect(rec.strategyName).toBe('MA_Crossover');
      expect(rec.category).toBeDefined();
      expect(rec.priority).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.action).toBeDefined();
      expect(rec.expectedImpact).toBeDefined();
      expect(rec.difficulty).toBeDefined();
      expect(rec.timestamp).toBeDefined();
    });
  });

  describe('getRecommendations', () => {
    it('should retrieve recommendations', async () => {
      await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const recs = await router.getRecommendations({
        strategyName: 'MA_Crossover',
      });

      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const recs = await router.getRecommendations({
        strategyName: 'MA_Crossover',
        category: 'risk',
      });

      expect(Array.isArray(recs)).toBe(true);
      recs.forEach((rec) => {
        expect(rec.category).toBe('risk');
      });
    });

    it('should filter by priority', async () => {
      await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const recs = await router.getRecommendations({
        strategyName: 'MA_Crossover',
        priority: 'high',
      });

      expect(Array.isArray(recs)).toBe(true);
      recs.forEach((rec) => {
        expect(rec.priority).toBe('high');
      });
    });
  });

  describe('getRecommendationStats', () => {
    it('should calculate recommendation statistics', async () => {
      await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const stats = await router.getRecommendationStats({
        strategyName: 'MA_Crossover',
      });

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(stats.byDifficulty).toBeDefined();
      expect(stats.lastGenerated).toBeDefined();
    });
  });

  describe('markAsImplemented', () => {
    it('should mark recommendation as implemented', async () => {
      const result = await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const recId = result.recommendations[0].id;

      const markResult = await router.markAsImplemented({
        strategyName: 'MA_Crossover',
        recommendationId: recId,
      });

      expect(markResult.success).toBe(true);

      const recs = await router.getRecommendations({
        strategyName: 'MA_Crossover',
      });

      expect(recs.find((r) => r.id === recId)).toBeUndefined();
    });
  });

  describe('clearRecommendations', () => {
    it('should clear all recommendations', async () => {
      await router.generateRecommendations({
        strategyName: 'MA_Crossover',
        metrics: {
          totalTrades: 100,
          winRate: 60,
          roi: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -25,
          profitFactor: 1.8,
          averageWin: 150,
          averageLoss: 100,
          largestWin: 500,
          largestLoss: 300,
        },
      });

      const clearResult = await router.clearRecommendations({
        strategyName: 'MA_Crossover',
      });

      expect(clearResult.success).toBe(true);
      expect(clearResult.clearedCount).toBeGreaterThan(0);

      const recs = await router.getRecommendations({
        strategyName: 'MA_Crossover',
      });

      expect(recs.length).toBe(0);
    });
  });
});
