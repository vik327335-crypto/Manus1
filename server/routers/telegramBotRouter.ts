/**
 * Telegram Bot Router
 * tRPC routes for Telegram bot management
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TelegramBotService } from '../services/telegramBotService';

export const telegramBotRouter = router({
  /**
   * Register user with Telegram
   */
  registerUser: protectedProcedure
    .input(z.object({ chatId: z.string(), username: z.string().optional(), firstName: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await TelegramBotService.registerUser(
        String(ctx.user.id),
        input.chatId,
        input.username,
        input.firstName
      );
    }),

  /**
   * Send alert notification
   */
  sendAlert: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        alertType: z.string(),
        symbol: z.string(),
        price: z.number(),
        threshold: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendAlertNotification(
        input.chatId,
        input.alertType,
        input.symbol,
        input.price,
        input.threshold
      );
    }),

  /**
   * Send trading signal
   */
  sendTradingSignal: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        symbol: z.string(),
        signal: z.enum(['BUY', 'SELL', 'HOLD']),
        confidence: z.number(),
        entryPrice: z.number(),
        targetPrice: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendTradingSignal(
        input.chatId,
        input.symbol,
        input.signal,
        input.confidence,
        input.entryPrice,
        input.targetPrice
      );
    }),

  /**
   * Send portfolio update
   */
  sendPortfolioUpdate: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        totalValue: z.number(),
        dayChange: z.number(),
        dayChangePercent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendPortfolioUpdate(
        input.chatId,
        input.totalValue,
        input.dayChange,
        input.dayChangePercent
      );
    }),

  /**
   * Send backtest completion
   */
  sendBacktestCompletion: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        strategyName: z.string(),
        winRate: z.number(),
        profitFactor: z.number(),
        sharpeRatio: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendBacktestCompletion(
        input.chatId,
        input.strategyName,
        input.winRate,
        input.profitFactor,
        input.sharpeRatio
      );
    }),

  /**
   * Send sentiment update
   */
  sendSentimentUpdate: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        symbol: z.string(),
        sentiment: z.number(),
        trend: z.string(),
        sources: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendSentimentUpdate(
        input.chatId,
        input.symbol,
        input.sentiment,
        input.trend,
        input.sources
      );
    }),

  /**
   * Send NFT alert
   */
  sendNFTAlert: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        nftName: z.string(),
        collection: z.string(),
        priceChange: z.number(),
        currentPrice: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendNFTAlert(
        input.chatId,
        input.nftName,
        input.collection,
        input.priceChange,
        input.currentPrice
      );
    }),

  /**
   * Send copy trading update
   */
  sendCopyTradingUpdate: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        traderName: z.string(),
        action: z.enum(['BUY', 'SELL']),
        symbol: z.string(),
        quantity: z.number(),
        price: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendCopyTradingUpdate(
        input.chatId,
        input.traderName,
        input.action,
        input.symbol,
        input.quantity,
        input.price
      );
    }),

  /**
   * Send DeFi notification
   */
  sendDeFiNotification: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        protocol: z.string(),
        action: z.string(),
        amount: z.number(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await TelegramBotService.sendDeFiNotification(
        input.chatId,
        input.protocol,
        input.action,
        input.amount,
        input.token
      );
    }),

  /**
   * Get bot info
   */
  getBotInfo: protectedProcedure.query(async () => {
    return await TelegramBotService.getBotInfo();
  }),
});

export default telegramBotRouter;
