import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import SocialCopyTradingService from "../services/socialCopyTradingService";

export const socialCopyTradingRouter = router({
  /**
   * Get top traders
   */
  getTopTraders: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      try {
        const traders = await SocialCopyTradingService.getTopTraders(input.limit);
        return { success: true, data: traders };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get trader performance
   */
  getTraderPerformance: protectedProcedure
    .input(z.object({ traderId: z.string(), period: z.string().default("30D") }))
    .query(async ({ input }) => {
      try {
        const performance = await SocialCopyTradingService.getTraderPerformance(
          input.traderId,
          input.period
        );
        return { success: true, data: performance };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Subscribe to copy trader
   */
  subscribeToCopyTrader: protectedProcedure
    .input(
      z.object({
        traderId: z.string(),
        allocationPercent: z.number().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = typeof ctx.user?.id === "string" ? ctx.user.id : "user_1";
        const subscription = await SocialCopyTradingService.subscribeToCopyTrader(
          userId,
          input.traderId,
          input.allocationPercent
        );
        return { success: true, data: subscription };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get user subscriptions
   */
  getUserSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = typeof ctx.user?.id === "string" ? ctx.user.id : "user_1";
      const subscriptions = await SocialCopyTradingService.getUserSubscriptions(userId);
      return { success: true, data: subscriptions };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),

  /**
   * Copy trader signal
   */
  copyTraderSignal: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        originalTradeId: z.string(),
        symbol: z.string(),
        action: z.enum(["BUY", "SELL"]),
        entryPrice: z.number().positive(),
        stopLoss: z.number().positive(),
        takeProfit: z.number().positive(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const trade = await SocialCopyTradingService.copyTraderSignal(
          input.subscriptionId,
          input.originalTradeId,
          {
            symbol: input.symbol,
            action: input.action,
            entryPrice: input.entryPrice,
            stopLoss: input.stopLoss,
            takeProfit: input.takeProfit,
            quantity: input.quantity,
          }
        );
        return { success: true, data: trade };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get copied trades history
   */
  getCopiedTradesHistory: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const trades = await SocialCopyTradingService.getCopiedTradesHistory(
          input.subscriptionId
        );
        return { success: true, data: trades };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Pause subscription
   */
  pauseSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const subscription = await SocialCopyTradingService.pauseSubscription(
          input.subscriptionId
        );
        return { success: true, data: subscription };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Resume subscription
   */
  resumeSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const subscription = await SocialCopyTradingService.resumeSubscription(
          input.subscriptionId
        );
        return { success: true, data: subscription };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get recommendations
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = typeof ctx.user?.id === "string" ? ctx.user.id : "user_1";
      const recommendations = await SocialCopyTradingService.getCopyTradingRecommendations(userId);
      return { success: true, data: recommendations };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),

  /**
   * Generate report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        subscriptions: z.array(
          z.object({
            id: z.string(),
            userId: z.string(),
            traderId: z.string(),
            allocationPercent: z.number(),
            status: z.enum(["ACTIVE", "PAUSED", "STOPPED"]),
            startDate: z.date(),
            totalCopied: z.number(),
            totalProfit: z.number(),
            copiedTrades: z.number(),
            createdAt: z.date(),
          })
        ),
        trades: z.array(
          z.object({
            id: z.string(),
            subscriptionId: z.string(),
            originalTradeId: z.string(),
            originalTrader: z.string(),
            symbol: z.string(),
            action: z.enum(["BUY", "SELL"]),
            entryPrice: z.number(),
            quantity: z.number(),
            stopLoss: z.number(),
            takeProfit: z.number(),
            status: z.enum(["OPEN", "CLOSED", "PENDING"]),
            executedPrice: z.number(),
            profit: z.number(),
            profitPercent: z.number(),
            copiedAt: z.date(),
            closedAt: z.date().optional(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = SocialCopyTradingService.generateCopyTradingReport(
          input.subscriptions as any,
          input.trades as any
        );
        return { success: true, data: report };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});
