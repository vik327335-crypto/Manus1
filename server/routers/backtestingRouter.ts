import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { BacktestingEngine, HistoricalData, BacktestResult } from "../services/backtesting";
import { getDb } from "../db";
import { backtests } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const backtestingRouter = router({
  /**
   * Запускает бэктест стратегии
   */
  runBacktest: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        initialCapital: z.number().positive(),
        minScore: z.number().min(0).max(10),
        stopLoss: z.number().min(0.1).max(50),
        takeProfit: z.number().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Генерируем исторические данные (в реальном приложении это будет из БД или API)
        const historicalData = generateMockHistoricalData(
          new Date(input.startDate),
          new Date(input.endDate)
        );

        // Определяем стратегию на основе ID
        const strategy = getStrategyFunction(input.strategyId, input.minScore);

        // Запускаем бэктест
        const result = await BacktestingEngine.runBacktest(
          historicalData,
          strategy,
          input.initialCapital
        );

        // Сохраняем результаты в БД
        const backtestId = `backtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db
          .insert(backtests)
          .values({
            id: backtestId,
            userId: ctx.user.id,
            strategyId: input.strategyId,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            initialCapital: input.initialCapital,
            totalReturn: Math.round(result.totalReturn * 10000),
            sharpeRatio: Math.round(result.sharpeRatio * 100),
            maxDrawdown: Math.round(result.maxDrawdown * 10000),
            winRate: Math.round(result.winRate * 10000),
            profitFactor: Math.round(result.profitFactor * 100),
            totalTrades: result.totalTrades,
            winningTrades: result.winningTrades,
            losingTrades: result.losingTrades,
            averageWin: Math.round(result.averageWin * 100),
            averageLoss: Math.round(result.averageLoss * 100),
            createdAt: new Date(),
          });

        return {
          success: true,
          backtestId: backtestId,
          results: result,
        };
      } catch (error) {
        console.error("Backtest error:", error);
        throw new Error("Failed to run backtest");
      }
    }),

  /**
   * Получает результаты бэктеста по ID
   */
  getBacktest: protectedProcedure
    .input(z.object({ backtestId: z.string() }))
    .query(async ({ input, ctx }) => {
      // TODO: Implement when db.query is available
      return { success: false, message: "Not yet implemented" };
    }),

  /**
   * Получает все бэктесты пользователя
   */
  getBacktests: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Implement when db.query is available
    return [];
  }),

  /**
   * Удаляет бэктест
   */
  deleteBacktest: protectedProcedure
    .input(z.object({ backtestId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement when db.query is available
      return { success: true };
    }),

  /**
   * Сравнивает несколько бэктестов
   */
  compareBacktests: protectedProcedure
    .input(
      z.object({
        backtestIds: z.array(z.string()).min(2).max(5),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Implement when db.query is available
      return {
        backtests: [],
        comparison: {
          bestReturn: 0,
          bestSharpe: 0,
          bestWinRate: 0,
          worstDrawdown: 0,
        },
      };
    }),

  /**
   * Экспортирует результаты бэктеста
   */
  exportBacktest: protectedProcedure
    .input(
      z.object({
        backtestId: z.string(),
        format: z.enum(["json", "csv"]),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Implement when db.query is available
      return {
        data: "",
        filename: `backtest-${input.backtestId}.${input.format}`,
      };
    }),
});

/**
 * Генерирует исторические данные для тестирования
 */
function generateMockHistoricalData(startDate: Date, endDate: Date): HistoricalData[] {
  const data: HistoricalData[] = [];
  let currentPrice = 100;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Пропускаем выходные
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const change = (Math.random() - 0.48) * 5; // Небольшой положительный дрейф
      const newPrice = currentPrice * (1 + change / 100);
      const high = newPrice * (1 + Math.random() * 0.02);
      const low = newPrice * (1 - Math.random() * 0.02);

      data.push({
        date: new Date(currentDate),
        open: currentPrice,
        high: Math.max(currentPrice, high),
        low: Math.min(currentPrice, low),
        close: newPrice,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });

      currentPrice = newPrice;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
}

  /**
   * Определяет стратегию на основе ID
   */
function getStrategyFunction(
  strategyId: string,
  minScore: number
): (data: HistoricalData[], index: number) => "BUY" | "SELL" | "HOLD" {
  return (data: HistoricalData[], index: number): "BUY" | "SELL" | "HOLD" => {
    if (index < 50) return "HOLD";

    const currentPrice = data[index].close;
    const sma50 = calculateSMA(data, index, 50);
    const sma200 = calculateSMA(data, index, 200);

    // Простая стратегия: покупаем когда SMA50 > SMA200 и score >= minScore
    const score = BacktestingEngine.calculateCanSlimScore(data.slice(0, index + 1));

    if (currentPrice > sma50 && sma50 > sma200 && score >= minScore) {
      return "BUY";
    } else if (currentPrice < sma50 || sma50 < sma200) {
      return "SELL";
    }

    return "HOLD";
  };
}

/**
 * Рассчитывает простую скользящую среднюю
 */
function calculateSMA(data: HistoricalData[], index: number, period: number): number {
  if (index < period) return 0;
  const slice = data.slice(index - period, index);
  return slice.reduce((sum: number, d: HistoricalData) => sum + d.close, 0) / period;
}
