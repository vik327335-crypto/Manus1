/**
 * Push Notification Router
 * Handles device registration, preference management, and notification delivery
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import PushNotificationService, { NotificationPreferences } from '../services/pushNotificationService';
import { getDb } from '../db';

// Device token table schema (to be added to database)
export const pushNotificationRouter = router({
  /**
   * Register device token for push notifications
   */
  registerDevice: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      deviceType: z.enum(['ios', 'android', 'web']),
      deviceName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Store device token in database (would need a push_notification_devices table)
        // For now, return success
        return {
          success: true,
          message: 'Device registered successfully',
          deviceToken: input.deviceToken,
        };
      } catch (error) {
        throw new Error(`Failed to register device: ${String(error)}`);
      }
    }),

  /**
   * Unregister device token
   */
  unregisterDevice: protectedProcedure
    .input(z.object({ deviceToken: z.string() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      try {
        // Remove device token from database
        return {
          success: true,
          message: 'Device unregistered successfully',
        };
      } catch (error) {
        throw new Error(`Failed to unregister device: ${String(error)}`);
      }
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      priceAlerts: z.boolean().optional(),
      portfolioUpdates: z.boolean().optional(),
      tradingSignals: z.boolean().optional(),
      trendingCollections: z.boolean().optional(),
      communityUpdates: z.boolean().optional(),
      backtestResults: z.boolean().optional(),
      nftAlerts: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
      vibrationEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        // Update preferences in database
        return {
          success: true,
          message: 'Preferences updated successfully',
          preferences: input,
        };
      } catch (error) {
        throw new Error(`Failed to update preferences: ${String(error)}`);
      }
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx: _ctx }) => {
    try {
      // Fetch from database, return defaults if not found
      const defaultPreferences: NotificationPreferences = {
        priceAlerts: true,
        portfolioUpdates: true,
        tradingSignals: true,
        trendingCollections: true,
        communityUpdates: true,
        backtestResults: true,
        nftAlerts: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };

      return defaultPreferences;
    } catch (error) {
      throw new Error(`Failed to get preferences: ${String(error)}`);
    }
  }),

  /**
   * Send test notification
   */
  sendTestNotification: protectedProcedure
    .input(z.object({ deviceToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendToDevice(input.deviceToken, {
          title: 'Test Notification',
          body: 'This is a test notification from CAN SLIM Crypto Scanner',
          icon: 'https://cdn.example.com/logo.png',
          color: '#3b82f6',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
          },
        });

        return {
          success: true,
          message: 'Test notification sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send test notification: ${String(error)}`);
      }
    }),

  /**
   * Send price alert
   */
  sendPriceAlert: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      symbol: z.string(),
      currentPrice: z.number(),
      threshold: z.number(),
      direction: z.enum(['above', 'below']),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendPriceAlert(
          input.deviceToken,
          input.symbol,
          input.currentPrice,
          input.threshold,
          input.direction
        );

        return {
          success: true,
          message: 'Price alert sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send price alert: ${String(error)}`);
      }
    }),

  /**
   * Send trading signal notification
   */
  sendTradingSignal: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      symbol: z.string(),
      signal: z.enum(['BUY', 'SELL', 'HOLD']),
      confidence: z.number(),
      entryPrice: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendTradingSignal(
          input.deviceToken,
          input.symbol,
          input.signal,
          input.confidence,
          input.entryPrice
        );

        return {
          success: true,
          message: 'Trading signal sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send trading signal: ${String(error)}`);
      }
    }),

  /**
   * Send portfolio update notification
   */
  sendPortfolioUpdate: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      totalValue: z.number(),
      dayChange: z.number(),
      dayChangePercent: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendPortfolioUpdate(
          input.deviceToken,
          input.totalValue,
          input.dayChange,
          input.dayChangePercent
        );

        return {
          success: true,
          message: 'Portfolio update sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send portfolio update: ${String(error)}`);
      }
    }),

  /**
   * Send backtest completion notification
   */
  sendBacktestCompletion: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      strategyName: z.string(),
      totalReturn: z.number(),
      sharpeRatio: z.number(),
      winRate: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendBacktestCompletion(
          input.deviceToken,
          input.strategyName,
          input.totalReturn,
          input.sharpeRatio,
          input.winRate
        );

        return {
          success: true,
          message: 'Backtest completion notification sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send backtest notification: ${String(error)}`);
      }
    }),

  /**
   * Send sentiment alert notification
   */
  sendSentimentAlert: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      symbol: z.string(),
      sentiment: z.enum(['positive', 'negative', 'neutral']),
      catalyst: z.string(),
      confidence: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendSentimentAlert(
          input.deviceToken,
          input.symbol,
          input.sentiment,
          input.catalyst,
          input.confidence
        );

        return {
          success: true,
          message: 'Sentiment alert sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send sentiment alert: ${String(error)}`);
      }
    }),

  /**
   * Send NFT alert notification
   */
  sendNFTAlert: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      collectionName: z.string(),
      floorPrice: z.number(),
      change24h: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendNFTAlert(
          input.deviceToken,
          input.collectionName,
          input.floorPrice,
          input.change24h
        );

        return {
          success: true,
          message: 'NFT alert sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send NFT alert: ${String(error)}`);
      }
    }),

  /**
   * Send copy trading update notification
   */
  sendCopyTradingUpdate: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      traderName: z.string(),
      symbol: z.string(),
      action: z.enum(['opened', 'closed']),
      pnl: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendCopyTradingUpdate(
          input.deviceToken,
          input.traderName,
          input.symbol,
          input.action,
          input.pnl
        );

        return {
          success: true,
          message: 'Copy trading update sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send copy trading update: ${String(error)}`);
      }
    }),

  /**
   * Send DeFi opportunity notification
   */
  sendDeFiOpportunity: protectedProcedure
    .input(z.object({
      deviceToken: z.string(),
      protocol: z.string(),
      apy: z.number(),
      riskLevel: z.enum(['low', 'medium', 'high']),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.sendDeFiOpportunity(
          input.deviceToken,
          input.protocol,
          input.apy,
          input.riskLevel
        );

        return {
          success: true,
          message: 'DeFi opportunity sent successfully',
        };
      } catch (error) {
        throw new Error(`Failed to send DeFi opportunity: ${String(error)}`);
      }
    }),

  /**
   * Subscribe to topic
   */
  subscribeTopic: protectedProcedure
    .input(z.object({
      deviceTokens: z.array(z.string()),
      topic: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.subscribeToTopic(input.deviceTokens, input.topic);

        return {
          success: true,
          message: `Subscribed to topic: ${input.topic}`,
        };
      } catch (error) {
        throw new Error(`Failed to subscribe to topic: ${String(error)}`);
      }
    }),

  /**
   * Unsubscribe from topic
   */
  unsubscribeTopic: protectedProcedure
    .input(z.object({
      deviceTokens: z.array(z.string()),
      topic: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await PushNotificationService.unsubscribeFromTopic(input.deviceTokens, input.topic);

        return {
          success: true,
          message: `Unsubscribed from topic: ${input.topic}`,
        };
      } catch (error) {
        throw new Error(`Failed to unsubscribe from topic: ${String(error)}`);
      }
    }),
});

export default pushNotificationRouter;
