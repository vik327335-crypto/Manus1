import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// Глобальный эмиттер для WebSocket событий
const metricsEmitter = new EventEmitter();

interface StrategyMetricsUpdate {
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
  timestamp: number;
}

export const websocketRouter = router({
  // Подписка на обновления метрик стратегии
  subscribeToStrategyMetrics: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
      })
    )
    .subscription(({ input }) => {
      return observable<StrategyMetricsUpdate>((emit) => {
        // Обработчик для обновлений
        const onMetricsUpdate = (data: StrategyMetricsUpdate) => {
          if (data.strategyName === input.strategyName) {
            emit.next(data);
          }
        };

        // Подписываемся на события
        metricsEmitter.on('metricsUpdate', onMetricsUpdate);

        // Отписываемся при отключении
        return () => {
          metricsEmitter.off('metricsUpdate', onMetricsUpdate);
        };
      });
    }),

  // Подписка на обновления всех стратегий
  subscribeToAllMetrics: protectedProcedure.subscription(() => {
    return observable<StrategyMetricsUpdate>((emit) => {
      const onMetricsUpdate = (data: StrategyMetricsUpdate) => {
        emit.next(data);
      };

      metricsEmitter.on('metricsUpdate', onMetricsUpdate);

      return () => {
        metricsEmitter.off('metricsUpdate', onMetricsUpdate);
      };
    });
  }),

  // Отправить обновление метрик (для тестирования и интеграции)
  publishMetricsUpdate: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        totalTrades: z.number(),
        winningTrades: z.number(),
        losingTrades: z.number(),
        winRate: z.number(),
        totalProfit: z.number(),
        totalLoss: z.number(),
        roi: z.number(),
        profitFactor: z.number(),
        sharpeRatio: z.number(),
        maxDrawdown: z.number(),
        averageWin: z.number(),
        averageLoss: z.number(),
        largestWin: z.number(),
        largestLoss: z.number(),
      })
    )
    .mutation(({ input }) => {
      const update: StrategyMetricsUpdate = {
        ...input,
        timestamp: Date.now(),
      };

      // Отправляем обновление всем подписчикам
      metricsEmitter.emit('metricsUpdate', update);

      return {
        success: true,
        message: 'Metrics update published',
      };
    }),

  // Получить статус подписок
  getSubscriptionStatus: protectedProcedure.query(() => {
    return {
      listenerCount: metricsEmitter.listenerCount('metricsUpdate'),
      eventNames: metricsEmitter.eventNames(),
    };
  }),
});

// Экспортируем эмиттер для использования в других местах
export { metricsEmitter };
