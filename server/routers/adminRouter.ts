import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  updateAssetNews,
  updateMultipleAssets,
  getJobStatus,
  getRunningJobs,
  startPeriodicNewsUpdates,
  stopPeriodicNewsUpdates,
} from "../services/newsJobService";
import { TRPCError } from "@trpc/server";

// Track active periodic job interval
let periodicJobInterval: NodeJS.Timeout | null = null;

export const adminRouter = router({
  // Check if user is admin
  requireAdmin: protectedProcedure.query(({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }
    return { isAdmin: true };
  }),

  // Start news update job for specific asset
  startNewsJob: protectedProcedure
    .input(
      z.object({
        assetId: z.number(),
        ticker: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      try {
        const job = await updateAssetNews(input.assetId, input.ticker, input.name);
        return {
          success: true,
          job,
          message: `News update started for ${input.ticker}`,
        };
      } catch (error) {
        console.error("[AdminRouter] Error starting news job:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start news job",
        });
      }
    }),

  // Start batch news update for multiple assets
  startBatchNewsJob: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            id: z.number(),
            ticker: z.string(),
            name: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      try {
        const jobs = await updateMultipleAssets(input.assets);
        return {
          success: true,
          jobs,
          count: jobs.length,
          message: `Batch news update started for ${jobs.length} assets`,
        };
      } catch (error) {
        console.error("[AdminRouter] Error starting batch job:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start batch job",
        });
      }
    }),

  // Get job status
  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const job = getJobStatus(input.jobId);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      return job;
    }),

  // Get all running jobs
  getRunningJobs: protectedProcedure.query(({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const jobs = getRunningJobs();
    return {
      count: jobs.length,
      jobs,
    };
  }),

  // Start periodic news updates
  startPeriodicUpdates: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            id: z.number(),
            ticker: z.string(),
            name: z.string(),
          })
        ),
        intervalMinutes: z.number().default(30).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Stop existing interval if running
      if (periodicJobInterval) {
        stopPeriodicNewsUpdates(periodicJobInterval);
      }

      // Start new periodic updates
      const intervalMs = (input.intervalMinutes || 30) * 60 * 1000;
      periodicJobInterval = startPeriodicNewsUpdates(input.assets, intervalMs);

      return {
        success: true,
        message: `Periodic news updates started (every ${input.intervalMinutes || 30} minutes)`,
        assetCount: input.assets.length,
        intervalMinutes: input.intervalMinutes || 30,
      };
    }),

  // Stop periodic news updates
  stopPeriodicUpdates: protectedProcedure.mutation(({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    if (!periodicJobInterval) {
      return {
        success: false,
        message: "No periodic updates running",
      };
    }

    stopPeriodicNewsUpdates(periodicJobInterval);
    periodicJobInterval = null;

    return {
      success: true,
      message: "Periodic news updates stopped",
    };
  }),

  // Get periodic updates status
  getPeriodicStatus: protectedProcedure.query(({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    return {
      isRunning: periodicJobInterval !== null,
      message: periodicJobInterval
        ? "Periodic updates are running"
        : "Periodic updates are stopped",
    };
  }),

  // Get system health
  getSystemHealth: protectedProcedure.query(({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const runningJobs = getRunningJobs();
    const isPeriodicRunning = periodicJobInterval !== null;

    return {
      timestamp: new Date(),
      status: "healthy",
      runningJobsCount: runningJobs.length,
      periodicUpdatesRunning: isPeriodicRunning,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }),
});
