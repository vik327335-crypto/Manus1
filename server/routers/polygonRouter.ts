import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  fetchPolygonOHLCV,
  fetchMultiYearOHLCV,
  calculateIndicators,
  clearCache,
  getCacheStats,
} from "../services/polygonIntegration";
import {
  createExportJob,
  updateExportJob,
  deleteExportJob,
  getUserJobs,
  getJobById,
  getActiveJobs,
  getJobStats,
} from "../services/backgroundJobs";

export const polygonRouter = router({
  // Polygon.io endpoints
  getOHLCV: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        from: z.string(),
        to: z.string(),
        timespan: z
          .enum(["minute", "hour", "day", "week", "month", "quarter", "year"])
          .default("day"),
      })
    )
    .query(async ({ input }) => {
      try {
        const ohlcv = await fetchPolygonOHLCV(
          input.ticker,
          input.timespan,
          input.from,
          input.to
        );
        return {
          success: true,
          data: ohlcv,
          count: ohlcv.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          data: [],
        };
      }
    }),

  getMultiYearOHLCV: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        years: z.number().min(1).max(10).default(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const ohlcv = await fetchMultiYearOHLCV(input.ticker, input.years);
        return {
          success: true,
          data: ohlcv,
          count: ohlcv.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          data: [],
        };
      }
    }),

  getIndicators: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        years: z.number().min(1).max(10).default(1),
        period: z.number().min(5).max(200).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const ohlcv = await fetchMultiYearOHLCV(input.ticker, input.years);
        const indicators = calculateIndicators(ohlcv, input.period);
        return {
          success: true,
          data: {
            ohlcv,
            indicators,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  clearCache: publicProcedure.mutation(() => {
    clearCache();
    return { success: true, message: "Cache cleared" };
  }),

  getCacheStats: publicProcedure.query(() => {
    return getCacheStats();
  }),

  // Background job endpoints
  createExportJob: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["pdf", "csv", "json"]),
        tickers: z.array(z.string()).min(1),
        schedule: z.enum(["daily", "weekly", "monthly"]),
        scheduleTime: z.string().regex(/^\d{2}:\d{2}$/),
        scheduleDay: z.number().optional(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const job = await createExportJob((ctx.user.id as any), {
          name: input.name,
          type: input.type,
          tickers: input.tickers,
          schedule: input.schedule,
          scheduleTime: input.scheduleTime,
          scheduleDay: input.scheduleDay,
          email: input.email,
          enabled: true,
        } as any) as any;
        return {
          success: true,
          data: job,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  updateExportJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        name: z.string().optional(),
        enabled: z.boolean().optional(),
        scheduleTime: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const job = await updateExportJob(input.jobId, {
          userId: (ctx.user.id as any),
          name: input.name,
          enabled: input.enabled,
          scheduleTime: input.scheduleTime,
          email: input.email,
        } as any) as any;
        return {
          success: true,
          data: job,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  deleteExportJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await deleteExportJob(input.jobId);
        return {
          success,
          message: success ? "Job deleted" : "Job not found",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  getUserJobs: protectedProcedure.query(async ({ ctx }) => {
    try {
      const jobs = await getUserJobs((ctx.user.id as any));
      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
      };
    }
  }),

  getJobById: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      try {
        const job = await getJobById(input.jobId);
        return {
          success: !!job,
          data: job,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  getActiveJobs: publicProcedure.query(() => {
    const jobs = getActiveJobs();
    return {
      success: true,
      data: jobs,
      count: jobs.length,
    };
  }),

  getJobStats: publicProcedure.query(() => {
    return getJobStats();
  }),
});
