import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { StripePaymentService } from "../services/stripePaymentService";
import { TelegramBotService } from "../services/telegramBotService";

export const paymentAndNotificationRouter = router({
  // ============ STRIPE PAYMENT PROCEDURES ============

  /**
   * Create a subscription for trader
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        tradeId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = typeof ctx.user?.id === "string" ? ctx.user.id : "user_1";
        // In production, get or create Stripe customer ID from database
        const customerId = `stripe_${userId}`;
        const subscription = await StripePaymentService.createSubscription(
          customerId,
          input.priceId,
          input.tradeId
        );
        return { success: true, data: subscription };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Cancel a subscription
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const subscription = await StripePaymentService.cancelSubscription(
          input.subscriptionId
        );
        return { success: true, data: subscription };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get subscription details
   */
  getSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const subscription = await StripePaymentService.getSubscription(
          input.subscriptionId
        );
        return { success: true, data: subscription };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Create a payment intent
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        currency: z.string().default("usd"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const paymentIntent = await StripePaymentService.createPaymentIntent(
          input.amount,
          input.currency,
          input.description
        );
        return { success: true, data: paymentIntent };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Confirm payment intent
   */
  confirmPaymentIntent: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const paymentIntent = await StripePaymentService.confirmPaymentIntent(
          input.paymentIntentId,
          input.paymentMethodId
        );
        return { success: true, data: paymentIntent };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * List customer subscriptions
   */
  listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = typeof ctx.user?.id === "string" ? ctx.user.id : "user_1";
      const customerId = `stripe_${userId}`;
      const subscriptions = await StripePaymentService.listCustomerSubscriptions(
        customerId
      );
      return { success: true, data: subscriptions };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),

  /**
   * List customer invoices
   */
  listInvoices: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = typeof ctx.user?.id === "string" ? ctx.user.id : "user_1";
      const customerId = `stripe_${userId}`;
      const invoices = await StripePaymentService.listCustomerInvoices(
        customerId
      );
      return { success: true, data: invoices };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),

  // ============ TELEGRAM BOT PROCEDURES ============

  /**
   * Send trading alert via Telegram
   */
  sendTradingAlert: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        symbol: z.string(),
        signal: z.enum(["BUY", "SELL", "HOLD"]),
        price: z.number(),
        confidence: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.sendTradingAlert({
          chatId: input.chatId,
          symbol: input.symbol,
          signal: input.signal as "BUY" | "SELL" | "HOLD",
          price: input.price,
          confidence: input.confidence,
          timestamp: new Date(),
        });
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Send portfolio update via Telegram
   */
  sendPortfolioUpdate: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        totalValue: z.number(),
        dayChange: z.number(),
        dayChangePercent: z.number(),
        topGainer: z.string(),
        topGainerPercent: z.number(),
        topLoser: z.string(),
        topLoserPercent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.sendPortfolioUpdate(
          input.chatId,
          {
            totalValue: input.totalValue,
            dayChange: input.dayChange,
            dayChangePercent: input.dayChangePercent,
            topGainer: input.topGainer,
            topGainerPercent: input.topGainerPercent,
            topLoser: input.topLoser,
            topLoserPercent: input.topLoserPercent,
          }
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Send backtest result via Telegram
   */
  sendBacktestResult: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        strategy: z.string(),
        symbol: z.string(),
        sharpeRatio: z.number(),
        maxDrawdown: z.number(),
        winRate: z.number(),
        profitFactor: z.number(),
        totalReturn: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.sendBacktestResult(
          input.chatId,
          {
            strategy: input.strategy,
            symbol: input.symbol,
            sharpeRatio: input.sharpeRatio,
            maxDrawdown: input.maxDrawdown,
            winRate: input.winRate,
            profitFactor: input.profitFactor,
            totalReturn: input.totalReturn,
          }
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Send sentiment analysis via Telegram
   */
  sendSentimentAnalysis: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        symbol: z.string(),
        overallScore: z.number(),
        twitter: z.number(),
        reddit: z.number(),
        news: z.number(),
        telegram: z.number(),
        trend: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.sendSentimentAnalysis(
          input.chatId,
          {
            symbol: input.symbol,
            overallScore: input.overallScore,
            sources: {
              twitter: input.twitter,
              reddit: input.reddit,
              news: input.news,
              telegram: input.telegram,
            },
            trend: input.trend as "BULLISH" | "BEARISH" | "NEUTRAL",
          }
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Send price alert via Telegram
   */
  sendPriceAlert: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        symbol: z.string(),
        currentPrice: z.number(),
        targetPrice: z.number(),
        alertType: z.enum(["ABOVE", "BELOW"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.sendPriceAlert(
          input.chatId,
          {
            symbol: input.symbol,
            currentPrice: input.currentPrice,
            targetPrice: input.targetPrice,
            alertType: input.alertType as "ABOVE" | "BELOW",
          }
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Send copy trading update via Telegram
   */
  sendCopyTradingUpdate: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        traderName: z.string(),
        signal: z.enum(["BUY", "SELL"]),
        symbol: z.string(),
        entryPrice: z.number(),
        quantity: z.number(),
        stopLoss: z.number(),
        takeProfit: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.sendCopyTradingUpdate(
          input.chatId,
          {
            traderName: input.traderName,
            signal: input.signal as "BUY" | "SELL",
            symbol: input.symbol,
            entryPrice: input.entryPrice,
            quantity: input.quantity,
            stopLoss: input.stopLoss,
            takeProfit: input.takeProfit,
          }
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Register Telegram webhook
   */
  registerTelegramWebhook: publicProcedure
    .input(z.object({ webhookUrl: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await TelegramBotService.registerWebhook(
          input.webhookUrl
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get Telegram webhook info
   */
  getTelegramWebhookInfo: publicProcedure.query(async () => {
    try {
      const result = await TelegramBotService.getWebhookInfo();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),
});
