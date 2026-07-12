import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import AlertService from "../services/alertService";

export const alertRouter = router({
  /**
   * Create a new alert
   */
  createAlert: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        type: z.enum(["PRICE", "SIGNAL", "PORTFOLIO", "NEWS"]),
        condition: z.enum(["ABOVE", "BELOW", "CHANGE_PERCENT"]),
        targetValue: z.number(),
        notificationMethods: z.array(z.enum(["EMAIL", "PUSH", "SMS", "IN_APP"])),
      })
    )
    .mutation(({ input }) => {
      try {
        const alert = {
          id: `alert-${Date.now()}`,
          userId: "user-id",
          type: input.type as "PRICE" | "SIGNAL" | "PORTFOLIO" | "NEWS",
          ticker: input.ticker,
          condition: input.condition as "ABOVE" | "BELOW" | "CHANGE_PERCENT",
          targetValue: input.targetValue,
          isActive: true,
          createdAt: new Date(),
          notificationMethods: input.notificationMethods as (
            | "EMAIL"
            | "PUSH"
            | "SMS"
            | "IN_APP"
          )[],
        };
        return { success: true, data: alert };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Check if alert should trigger
   */
  checkAlert: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        condition: z.enum(["ABOVE", "BELOW", "CHANGE_PERCENT"]),
        targetValue: z.number(),
        currentPrice: z.number(),
      })
    )
    .query(({ input }) => {
      try {
        const alert = {
          id: "temp",
          userId: "temp",
          type: "PRICE" as const,
          ticker: input.ticker,
          condition: input.condition as "ABOVE" | "BELOW" | "CHANGE_PERCENT",
          targetValue: input.targetValue,
          isActive: true,
          createdAt: new Date(),
          notificationMethods: [] as ("EMAIL" | "PUSH" | "SMS" | "IN_APP")[],
        };

        const shouldTrigger = AlertService.shouldTriggerAlert(alert, input.currentPrice);
        return { success: true, data: { shouldTrigger } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate alert trigger
   */
  generateAlertTrigger: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        condition: z.enum(["ABOVE", "BELOW", "CHANGE_PERCENT"]),
        targetValue: z.number(),
        currentPrice: z.number(),
      })
    )
    .query(({ input }) => {
      try {
        const alert = {
          id: "temp",
          userId: "temp",
          type: "PRICE" as const,
          ticker: input.ticker,
          condition: input.condition as "ABOVE" | "BELOW" | "CHANGE_PERCENT",
          targetValue: input.targetValue,
          isActive: true,
          createdAt: new Date(),
          notificationMethods: [] as ("EMAIL" | "PUSH" | "SMS" | "IN_APP")[],
        };

        const trigger = AlertService.generateAlertTrigger(alert, input.currentPrice);
        return { success: true, data: trigger };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate email template
   */
  generateEmailTemplate: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        currentPrice: z.number(),
        targetPrice: z.number(),
        message: z.string(),
        alertType: z.enum(["PRICE_ALERT", "SIGNAL_ALERT", "PORTFOLIO_ALERT", "NEWS_ALERT"]),
      })
    )
    .query(({ input }) => {
      try {
        const trigger = {
          alertId: "temp",
          userId: "temp",
          ticker: input.ticker,
          currentPrice: input.currentPrice,
          targetPrice: input.targetPrice,
          message: input.message,
          timestamp: new Date(),
        };

        const template = AlertService.generateEmailTemplate(
          trigger,
          input.alertType as "PRICE_ALERT" | "SIGNAL_ALERT" | "PORTFOLIO_ALERT" | "NEWS_ALERT"
        );
        return { success: true, data: template };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate push notification template
   */
  generatePushTemplate: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        currentPrice: z.number(),
        targetPrice: z.number(),
        message: z.string(),
        alertType: z.enum(["PRICE_ALERT", "SIGNAL_ALERT", "PORTFOLIO_ALERT", "NEWS_ALERT"]),
      })
    )
    .query(({ input }) => {
      try {
        const trigger = {
          alertId: "temp",
          userId: "temp",
          ticker: input.ticker,
          currentPrice: input.currentPrice,
          targetPrice: input.targetPrice,
          message: input.message,
          timestamp: new Date(),
        };

        const template = AlertService.generatePushTemplate(
          trigger,
          input.alertType as "PRICE_ALERT" | "SIGNAL_ALERT" | "PORTFOLIO_ALERT" | "NEWS_ALERT"
        );
        return { success: true, data: template };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate alert frequency
   */
  calculateAlertFrequency: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          type: z.enum(["PRICE", "SIGNAL", "PORTFOLIO", "NEWS"]),
          ticker: z.string(),
          condition: z.enum(["ABOVE", "BELOW", "CHANGE_PERCENT"]),
          targetValue: z.number(),
          isActive: z.boolean(),
          createdAt: z.date(),
          notificationMethods: z.array(z.enum(["EMAIL", "PUSH", "SMS", "IN_APP"])),
        })
      )
    )
    .query(({ input }) => {
      try {
        const frequency = AlertService.calculateAlertFrequency(input);
        return { success: true, data: frequency };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Filter alerts
   */
  filterAlerts: protectedProcedure
    .input(
      z.object({
        alerts: z.array(
          z.object({
            id: z.string(),
            userId: z.string(),
            type: z.enum(["PRICE", "SIGNAL", "PORTFOLIO", "NEWS"]),
            ticker: z.string(),
            condition: z.enum(["ABOVE", "BELOW", "CHANGE_PERCENT"]),
            targetValue: z.number(),
            isActive: z.boolean(),
            createdAt: z.date(),
            notificationMethods: z.array(z.enum(["EMAIL", "PUSH", "SMS", "IN_APP"])),
          })
        ),
        criteria: z.object({
          type: z.enum(["PRICE", "SIGNAL", "PORTFOLIO", "NEWS"]).optional(),
          ticker: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .query(({ input }) => {
      try {
        const filtered = AlertService.filterAlerts(input.alerts, input.criteria);
        return { success: true, data: filtered };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get alert statistics
   */
  getAlertStatistics: protectedProcedure
    .input(
      z.object({
        alerts: z.array(
          z.object({
            id: z.string(),
            userId: z.string(),
            type: z.enum(["PRICE", "SIGNAL", "PORTFOLIO", "NEWS"]),
            ticker: z.string(),
            condition: z.enum(["ABOVE", "BELOW", "CHANGE_PERCENT"]),
            targetValue: z.number(),
            isActive: z.boolean(),
            createdAt: z.date(),
            notificationMethods: z.array(z.enum(["EMAIL", "PUSH", "SMS", "IN_APP"])),
          })
        ),
        triggers: z.array(
          z.object({
            alertId: z.string(),
            userId: z.string(),
            ticker: z.string(),
            currentPrice: z.number(),
            targetPrice: z.number(),
            message: z.string(),
            timestamp: z.date(),
          })
        ),
      })
    )
    .query(({ input }) => {
      try {
        const stats = AlertService.getAlertStatistics(input.alerts, input.triggers);
        return { success: true, data: stats };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Recommend alerts
   */
  recommendAlerts: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          entryPrice: z.number(),
          currentPrice: z.number(),
        })
      )
    )
    .query(({ input }) => {
      try {
        const recommendations = AlertService.recommendAlerts(input);
        return { success: true, data: recommendations };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});
