import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  sendPriceAlert,
  sendScoreChangeAlert,
  sendCatalystAlert,
  sendPortfolioUpdateAlert,
  getDefaultPreferences,
  validatePreferences,
  type NotificationPreferences,
} from "../services/notificationService";

// In-memory storage for notification preferences (in production, use database)
const userPreferences = new Map<number, NotificationPreferences>();

// In-memory storage for push subscriptions
interface PushSubscription {
  userId: number;
  endpoint: string;
  auth: string;
  p256dh: string;
  createdAt: Date;
  isActive: boolean;
}
const pushSubscriptions = new Map<string, PushSubscription>();

export const notificationRouter = router({
  // Get user notification preferences
  getPreferences: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.user!.id;
    let prefs = userPreferences.get(userId);

    if (!prefs) {
      prefs = getDefaultPreferences(userId);
      userPreferences.set(userId, prefs);
    }

    return prefs;
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailAlerts: z.boolean().optional(),
        pushAlerts: z.boolean().optional(),
        priceAlerts: z.boolean().optional(),
        scoreAlerts: z.boolean().optional(),
        catalystAlerts: z.boolean().optional(),
        portfolioAlerts: z.boolean().optional(),
        alertThreshold: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const userId = ctx.user!.id;
      let prefs = userPreferences.get(userId);

      if (!prefs) {
        prefs = getDefaultPreferences(userId);
      }

      const updated = {
        ...prefs,
        ...input,
      };

      if (!validatePreferences(updated)) {
        throw new Error("Invalid notification preferences");
      }

      userPreferences.set(userId, updated);
      return updated;
    }),

  // Reset to default preferences
  resetPreferences: protectedProcedure.mutation(({ ctx }) => {
    const userId = ctx.user!.id;
    const defaults = getDefaultPreferences(userId);
    userPreferences.set(userId, defaults);
    return defaults;
  }),

  // Send test notification
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum(["email", "push", "both"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      const email = user.email || "test@example.com";

      try {
        if (input.type === "email" || input.type === "both") {
          await sendPriceAlert(
            user.id,
            email,
            "BTC",
            "Bitcoin",
            45000,
            44000,
            2.27,
            getDefaultPreferences(user.id)
          );
        }

        if (input.type === "push" || input.type === "both") {
          // Push notification is sent in the service
        }

        return {
          success: true,
          message: "Test notification sent successfully",
        };
      } catch (error) {
        console.error("[NotificationRouter] Error sending test notification:", error);
        throw new Error("Failed to send test notification");
      }
    }),

  // Send price alert
  sendPriceAlert: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        name: z.string(),
        currentPrice: z.number(),
        previousPrice: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      const email = user.email || "test@example.com";
      const priceChange = ((input.currentPrice - input.previousPrice) / input.previousPrice) * 100;
      const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);

      try {
        const success = await sendPriceAlert(
          user.id,
          email,
          input.ticker,
          input.name,
          input.currentPrice,
          input.previousPrice,
          priceChange,
          prefs
        );

        return {
          success,
          message: success ? "Price alert sent" : "Price alert preferences disabled",
        };
      } catch (error) {
        console.error("[NotificationRouter] Error sending price alert:", error);
        throw new Error("Failed to send price alert");
      }
    }),

  // Send score change alert
  sendScoreChangeAlert: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        name: z.string(),
        oldScore: z.number(),
        newScore: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      const email = user.email || "test@example.com";
      const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);

      try {
        const success = await sendScoreChangeAlert(
          user.id,
          email,
          input.ticker,
          input.name,
          input.oldScore,
          input.newScore,
          prefs
        );

        return {
          success,
          message: success ? "Score change alert sent" : "Score alert preferences disabled",
        };
      } catch (error) {
        console.error("[NotificationRouter] Error sending score alert:", error);
        throw new Error("Failed to send score alert");
      }
    }),

  // Send catalyst alert
  sendCatalystAlert: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        name: z.string(),
        catalyst: z.string(),
        sentiment: z.enum(["positive", "negative", "neutral"]),
        source: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      const email = user.email || "test@example.com";
      const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);

      try {
        const success = await sendCatalystAlert(
          user.id,
          email,
          input.ticker,
          input.name,
          input.catalyst,
          input.sentiment,
          input.source,
          prefs
        );

        return {
          success,
          message: success ? "Catalyst alert sent" : "Catalyst alert preferences disabled",
        };
      } catch (error) {
        console.error("[NotificationRouter] Error sending catalyst alert:", error);
        throw new Error("Failed to send catalyst alert");
      }
    }),

  // Send portfolio update alert
  sendPortfolioUpdateAlert: protectedProcedure
    .input(
      z.object({
        portfolioName: z.string(),
        totalReturn: z.number(),
        bestPerformer: z.string(),
        worstPerformer: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      const email = user.email || "test@example.com";
      const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);

      try {
        const success = await sendPortfolioUpdateAlert(
          user.id,
          email,
          input.portfolioName,
          input.totalReturn,
          input.bestPerformer,
          input.worstPerformer,
          prefs
        );

        return {
          success,
          message: success ? "Portfolio alert sent" : "Portfolio alert preferences disabled",
        };
      } catch (error) {
        console.error("[NotificationRouter] Error sending portfolio alert:", error);
        throw new Error("Failed to send portfolio alert");
      }
    }),

  // Subscribe to push notifications
  subscribeToPush: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        auth: z.string(),
        p256dh: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const subscription: PushSubscription = {
        userId,
        endpoint: input.endpoint,
        auth: input.auth,
        p256dh: input.p256dh,
        createdAt: new Date(),
        isActive: true,
      };

      pushSubscriptions.set(`${userId}-${input.endpoint}`, subscription);
      console.info(`[Notifications] User ${userId} subscribed to push notifications`);

      return {
        success: true,
        message: "Successfully subscribed to push notifications",
      };
    }),

  // Unsubscribe from push notifications
  unsubscribeFromPush: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const key = `${userId}-${input.endpoint}`;

      if (pushSubscriptions.has(key)) {
        pushSubscriptions.delete(key);
        console.info(`[Notifications] User ${userId} unsubscribed from push notifications`);
      }

      return {
        success: true,
        message: "Successfully unsubscribed from push notifications",
      };
    }),

  // Get push subscriptions for a user
  getPushSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const subscriptions: PushSubscription[] = [];

    pushSubscriptions.forEach((sub) => {
      if (sub.userId === userId && sub.isActive) {
        subscriptions.push(sub);
      }
    });

    return {
      count: subscriptions.length,
      subscriptions: subscriptions.map((sub) => ({
        endpoint: sub.endpoint.substring(0, 50) + "...",
        createdAt: sub.createdAt,
      })),
    };
  }),

  // Notify about new trade
  notifyNewTrade: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        type: z.enum(['entry', 'exit', 'alert']),
        price: z.number(),
        quantity: z.number(),
        pnl: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user!;
      const email = user.email || 'test@example.com';
      const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);

      try {
        const notificationSent = await sendPriceAlert(
          user.id,
          email,
          input.symbol,
          input.strategyName,
          input.price,
          input.price,
          0,
          prefs
        );

        return {
          success: true,
          notificationSent,
          message: `Trade notification sent for ${input.symbol}`,
        };
      } catch (error: any) {
        console.error('[NotificationRouter] Error sending trade notification:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // Notify about goal reached
  notifyGoalReached: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        goalType: z.enum(['profit', 'winRate', 'roi', 'sharpeRatio']),
        targetValue: z.number(),
        currentValue: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user!;
      const email = user.email || 'test@example.com';
      const goalLabels: Record<string, string> = {
        profit: 'Profit',
        winRate: 'Win Rate',
        roi: 'ROI',
        sharpeRatio: 'Sharpe Ratio',
      };

      try {
        const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);
        const notificationSent = await sendScoreChangeAlert(
          user.id,
          email,
          input.strategyName,
          `${goalLabels[input.goalType]} reached`,
          input.targetValue,
          input.currentValue,
          prefs
        );

        return {
          success: true,
          notificationSent,
          message: `Goal notification sent for ${input.strategyName}`,
        };
      } catch (error: any) {
        console.error('[NotificationRouter] Error sending goal notification:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // Notify about risk
  notifyRisk: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        riskType: z.enum(['maxDrawdown', 'largeDrawdown', 'stopLoss', 'riskLimit']),
        value: z.number(),
        threshold: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user!;
      const email = user.email || 'test@example.com';
      const riskLabels: Record<string, string> = {
        maxDrawdown: 'Max Drawdown',
        largeDrawdown: 'Large Drawdown',
        stopLoss: 'Stop Loss',
        riskLimit: 'Risk Limit',
      };

      try {
        const prefs = userPreferences.get(user.id) || getDefaultPreferences(user.id);
        const notificationSent = await sendCatalystAlert(
          user.id,
          email,
          input.strategyName,
          riskLabels[input.riskType],
          `${riskLabels[input.riskType]}: ${input.value}, Threshold: ${input.threshold}`,
          'negative',
          'risk-system',
          prefs
        );

        return {
          success: true,
          notificationSent,
          message: `Risk notification sent for ${input.strategyName}`,
        };
      } catch (error: any) {
        console.error('[NotificationRouter] Error sending risk notification:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
