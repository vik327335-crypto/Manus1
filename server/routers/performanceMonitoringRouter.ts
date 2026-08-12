import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import PerformanceMonitoringService from "../services/performanceMonitoringService";

const periodSchema = z.enum(["minute", "hour", "day"]);

const periodToWindow = (period: z.infer<typeof periodSchema>): number => {
  if (period === "minute") return 60_000;
  if (period === "day") return 86_400_000;
  return 3_600_000;
};

/**
 * Operational performance telemetry for authenticated users.
 * Administrative mutations are limited to the project owner/admin role.
 */
export const performanceMonitoringRouter = router({
  getReport: protectedProcedure
    .input(z.object({ period: periodSchema.default("hour") }))
    .query(({ input }) => ({
      success: true,
      report: PerformanceMonitoringService.generatePerformanceReport(input.period),
    })),

  getSystemHealth: protectedProcedure.query(() => ({
    success: true,
    health: PerformanceMonitoringService.getSystemHealth(),
  })),

  getSlowEndpoints: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        period: periodSchema.default("hour"),
      })
    )
    .query(({ input }) => ({
      success: true,
      endpoints: PerformanceMonitoringService.getSlowEndpoints(
        input.limit,
        periodToWindow(input.period)
      ),
    })),

  getErrorDistribution: protectedProcedure
    .input(z.object({ period: periodSchema.default("hour") }))
    .query(({ input }) => ({
      success: true,
      distribution: PerformanceMonitoringService.getErrorDistribution(periodToWindow(input.period)),
    })),

  recordMetric: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().min(1).max(500),
        method: z.string().min(1).max(16),
        duration: z.number().nonnegative().max(120_000),
        statusCode: z.number().int().min(100).max(599),
        cached: z.boolean().default(false),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can record operational telemetry manually");
      }

      PerformanceMonitoringService.recordMetric(
        input.endpoint,
        input.method.toUpperCase(),
        input.duration,
        input.statusCode,
        input.cached
      );

      return { success: true };
    }),

  cleanupMetrics: protectedProcedure
    .input(z.object({ maxAgeHours: z.number().min(1).max(720).default(24) }))
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can clean up monitoring metrics");
      }

      const removed = PerformanceMonitoringService.cleanup(input.maxAgeHours * 3_600_000);
      return { success: true, removed };
    }),
});

export default performanceMonitoringRouter;
