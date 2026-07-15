import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import AutoTradingService from "../services/autoTradingService";

const riskProfileSchema = z.object({
  maxPositionSize: z.number().min(1).max(100),
  maxDailyLoss: z.number().min(1).max(100),
  maxDrawdown: z.number().min(1).max(100),
  riskPerTrade: z.number().min(0.1).max(10),
  maxOpenPositions: z.number().min(1).max(50),
  stopLossPercent: z.number().min(0.1).max(50),
  takeProfitPercent: z.number().min(0.1).max(100),
});

const tradeSignalSchema = z.object({
  ticker: z.string(),
  action: z.enum(["BUY", "SELL"]),
  confidence: z.number().min(0).max(1),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  riskRewardRatio: z.number().positive(),
});

const positionSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  exchange: z.string(),
  quantity: z.number().positive(),
  entryPrice: z.number().positive(),
  currentPrice: z.number().positive(),
  unrealizedPnL: z.number(),
  unrealizedPnLPercent: z.number(),
  status: z.enum(["OPEN", "CLOSED", "PENDING"]),
  createdAt: z.date(),
  closedAt: z.date().optional(),
});

export const autoTradingRouter = router({
  /**
   * Validate trade signal against risk rules
   */
  validateSignal: protectedProcedure
    .input(
      z.object({
        signal: tradeSignalSchema,
        riskProfile: riskProfileSchema,
        openPositions: z.array(positionSchema),
        portfolio: z.number().positive(),
        dailyLoss: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const signalWithTimestamp = {
          ...input.signal,
          timestamp: new Date(),
        };
        const result = AutoTradingService.validateTradeSignal(
          signalWithTimestamp,
          input.riskProfile,
          input.openPositions as any,
          input.portfolio,
          input.dailyLoss
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Calculate position size
   */
  calculatePositionSize: protectedProcedure
    .input(
      z.object({
        portfolio: z.number().positive(),
        riskProfile: riskProfileSchema,
        entryPrice: z.number().positive(),
        stopLoss: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      try {
        const size = AutoTradingService.calculatePositionSize(
          input.portfolio,
          input.riskProfile as any,
          input.entryPrice,
          input.stopLoss
        );

        return {
          success: true,
          data: { positionSize: size },
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Execute buy order
   */
  executeBuyOrder: protectedProcedure
    .input(
      z.object({
        signal: tradeSignalSchema,
        riskProfile: riskProfileSchema,
        portfolio: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const signalWithTimestamp = {
          ...input.signal,
          timestamp: new Date(),
        };
        const order = await AutoTradingService.executeBuyOrder(
          signalWithTimestamp,
          input.riskProfile,
          input.portfolio
        );

        return {
          success: true,
          data: order,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Execute sell order
   */
  executeSellOrder: protectedProcedure
    .input(z.object({ position: positionSchema }))
    .mutation(async ({ input }) => {
      try {
        const order = await AutoTradingService.executeSellOrder(input.position as any);

        return {
          success: true,
          data: order,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Check exit conditions
   */
  checkExitConditions: protectedProcedure
    .input(
      z.object({
        position: z.object({
          id: z.string(),
          ticker: z.string(),
          exchange: z.string(),
          quantity: z.number().positive(),
          entryPrice: z.number().positive(),
          currentPrice: z.number().positive(),
          unrealizedPnL: z.number(),
          unrealizedPnLPercent: z.number(),
          status: z.enum(["OPEN", "CLOSED", "PENDING"]),
          createdAt: z.date(),
          closedAt: z.date().optional(),
        }),
        currentPrice: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = AutoTradingService.checkExitConditions(
          input.position as any,
          input.currentPrice
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Calculate portfolio metrics
   */
  getPortfolioMetrics: protectedProcedure
    .input(
      z.object({
        positions: z.array(positionSchema),
        portfolio: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = AutoTradingService.calculatePortfolioMetrics(
          input.positions as any,
          input.portfolio
        );

        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Rebalance portfolio
   */
  rebalancePortfolio: protectedProcedure
    .input(
      z.object({
        positions: z.array(positionSchema),
        targetAllocation: z.record(z.string(), z.number()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const orders = AutoTradingService.rebalancePortfolio(
          input.positions as any,
          input.targetAllocation
        );

        return {
          success: true,
          data: { orders },
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Generate trading report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        positions: z.array(positionSchema),
        orders: z.array(
          z.object({
            id: z.string(),
            positionId: z.string().optional(),
            ticker: z.string(),
            exchange: z.string(),
            action: z.enum(["BUY", "SELL"]),
            quantity: z.number().positive(),
            price: z.number().positive(),
            status: z.enum(["PENDING", "FILLED", "CANCELLED", "FAILED"]),
            executedAt: z.date().optional(),
            error: z.string().optional(),
          })
        ),
        portfolio: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = AutoTradingService.generateTradingReport(
          input.positions as any,
          input.orders as any,
          input.portfolio
        );

        return {
          success: true,
          data: report,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),
});
