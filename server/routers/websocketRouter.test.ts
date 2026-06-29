import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { websocketRouter, metricsEmitter } from './websocketRouter';

describe('websocketRouter', () => {
  const mockContext = {
    user: { id: 1 },
    req: {} as any,
    res: {} as any,
  };

  const mockMetricsUpdate = {
    strategyName: 'Test Strategy',
    totalTrades: 100,
    winningTrades: 60,
    losingTrades: 40,
    winRate: 60,
    totalProfit: 5000,
    totalLoss: 2000,
    roi: 250,
    profitFactor: 2.5,
    sharpeRatio: 1.5,
    maxDrawdown: -1000,
    averageWin: 83.33,
    averageLoss: 50,
    largestWin: 500,
    largestLoss: 300,
  };

  beforeEach(() => {
    // Очищаем все слушатели перед каждым тестом
    metricsEmitter.removeAllListeners();
  });

  afterEach(() => {
    metricsEmitter.removeAllListeners();
  });

  describe('publishMetricsUpdate', () => {
    it('should publish metrics update successfully', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const result = await caller.publishMetricsUpdate(mockMetricsUpdate);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Metrics update published');
    });

    it('should emit metricsUpdate event', async () => {
      const caller = websocketRouter.createCaller(mockContext);
      let emittedData: any = null;

      metricsEmitter.on('metricsUpdate', (data) => {
        emittedData = data;
      });

      await caller.publishMetricsUpdate(mockMetricsUpdate);

      expect(emittedData).not.toBeNull();
      expect(emittedData.strategyName).toBe('Test Strategy');
      expect(emittedData.timestamp).toBeDefined();
    });

    it('should include timestamp in emitted data', async () => {
      const caller = websocketRouter.createCaller(mockContext);
      let emittedData: any = null;

      metricsEmitter.on('metricsUpdate', (data) => {
        emittedData = data;
      });

      const beforeTime = Date.now();
      await caller.publishMetricsUpdate(mockMetricsUpdate);
      const afterTime = Date.now();

      expect(emittedData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(emittedData.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const status = await caller.getSubscriptionStatus();

      expect(status).toBeDefined();
      expect(status.listenerCount).toBeDefined();
      expect(status.eventNames).toBeDefined();
    });

    it('should show correct listener count', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      // Добавляем слушателей
      metricsEmitter.on('metricsUpdate', () => {});
      metricsEmitter.on('metricsUpdate', () => {});

      const status = await caller.getSubscriptionStatus();

      expect(status.listenerCount).toBe(2);
    });

    it('should show metricsUpdate in event names', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      metricsEmitter.on('metricsUpdate', () => {});

      const status = await caller.getSubscriptionStatus();

      expect(status.eventNames).toContain('metricsUpdate');
    });
  });

  describe('subscribeToStrategyMetrics', () => {
    it('should create subscription for specific strategy', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const subscription = caller.subscribeToStrategyMetrics({
        strategyName: 'Test Strategy',
      });

      expect(subscription).toBeDefined();
    });

    it('should create subscription object', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const observable = caller.subscribeToStrategyMetrics({
        strategyName: 'Test Strategy',
      });

      expect(observable).toBeDefined();
    });
  });

  describe('subscribeToAllMetrics', () => {
    it('should create subscription for all metrics', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const subscription = caller.subscribeToAllMetrics();

      expect(subscription).toBeDefined();
    });

    it('should create subscription object', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const observable = caller.subscribeToAllMetrics();

      expect(observable).toBeDefined();
    });
  });

  describe('Multiple subscriptions', () => {
    it('should create multiple subscriptions', async () => {
      const caller = websocketRouter.createCaller(mockContext);

      const sub1 = caller.subscribeToStrategyMetrics({
        strategyName: 'Strategy A',
      });

      const sub2 = caller.subscribeToStrategyMetrics({
        strategyName: 'Strategy B',
      });

      expect(sub1).toBeDefined();
      expect(sub2).toBeDefined();
    });
  });

  describe('Metrics data validation', () => {
    it('should preserve all metrics fields in update', async () => {
      const caller = websocketRouter.createCaller(mockContext);
      let emittedData: any = null;

      metricsEmitter.on('metricsUpdate', (data) => {
        emittedData = data;
      });

      await caller.publishMetricsUpdate(mockMetricsUpdate);

      expect(emittedData.totalTrades).toBe(100);
      expect(emittedData.winRate).toBe(60);
      expect(emittedData.roi).toBe(250);
      expect(emittedData.profitFactor).toBe(2.5);
      expect(emittedData.sharpeRatio).toBe(1.5);
    });
  });
});
