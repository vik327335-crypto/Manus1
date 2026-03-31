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
});
