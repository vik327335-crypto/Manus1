import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createHeartbeatJob, updateHeartbeatJob, deleteHeartbeatJob, listHeartbeatJobs, HeartbeatJobInfo as _HeartbeatJobInfo } from "../_core/heartbeat";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";

/**
 * Scheduler Router
 * Manages periodic tasks and scheduled jobs
 */

export const schedulerRouter = router({
  /**
   * Create a new scheduled job for balance sync
   */
  createBalanceSyncJob: protectedProcedure
    .input(
      z.object({
        cron: z.string().describe("6-field cron expression (sec min hour dom mon dow)"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        const job = await createHeartbeatJob(
          {
            name: `balance-sync-${ctx.user.id}-${Date.now()}`,
            cron: input.cron,
            path: "/api/scheduled/sync-balances",
            description: input.description || "Sync exchange balances",
          },
          sessionToken
        );

        return {
          success: true,
          taskUid: job.taskUid,
          message: "Balance sync job created successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create balance sync job: ${error.message}`,
        });
      }
    }),

  /**
   * Create a new scheduled job for backtesting
   */
  createBacktestJob: protectedProcedure
    .input(
      z.object({
        cron: z.string().describe("6-field cron expression"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        const job = await createHeartbeatJob(
          {
            name: `backtest-${ctx.user.id}-${Date.now()}`,
            cron: input.cron,
            path: "/api/scheduled/run-backtests",
            description: input.description || "Run periodic backtests",
          },
          sessionToken
        );

        return {
          success: true,
          taskUid: job.taskUid,
          message: "Backtest job created successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create backtest job: ${error.message}`,
        });
      }
    }),

  /**
   * Create a new scheduled job for leaderboard updates
   */
  createLeaderboardUpdateJob: protectedProcedure
    .input(
      z.object({
        cron: z.string().describe("6-field cron expression"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        const job = await createHeartbeatJob(
          {
            name: `leaderboard-update-${ctx.user.id}-${Date.now()}`,
            cron: input.cron,
            path: "/api/scheduled/update-leaderboard",
            description: input.description || "Update community leaderboard",
          },
          sessionToken
        );

        return {
          success: true,
          taskUid: job.taskUid,
          message: "Leaderboard update job created successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create leaderboard update job: ${error.message}`,
        });
      }
    }),

  /**
   * Create a new scheduled job for data cleanup
   */
  createCleanupJob: protectedProcedure
    .input(
      z.object({
        cron: z.string().describe("6-field cron expression"),
        daysToKeep: z.number().int().positive().default(30),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        const job = await createHeartbeatJob(
          {
            name: `cleanup-${ctx.user.id}-${Date.now()}`,
            cron: input.cron,
            path: "/api/scheduled/cleanup-data",
            payload: { daysToKeep: input.daysToKeep },
            description: input.description || `Clean up data older than ${input.daysToKeep} days`,
          },
          sessionToken
        );

        return {
          success: true,
          taskUid: job.taskUid,
          message: "Cleanup job created successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create cleanup job: ${error.message}`,
        });
      }
    }),

  /**
   * Create a new scheduled job for daily summaries
   */
  createDailySummaryJob: protectedProcedure
    .input(
      z.object({
        cron: z.string().describe("6-field cron expression"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        const job = await createHeartbeatJob(
          {
            name: `daily-summary-${ctx.user.id}-${Date.now()}`,
            cron: input.cron,
            path: "/api/scheduled/generate-daily-summary",
            description: input.description || "Generate daily summary report",
          },
          sessionToken
        );

        return {
          success: true,
          taskUid: job.taskUid,
          message: "Daily summary job created successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create daily summary job: ${error.message}`,
        });
      }
    }),

  /**
   * List all scheduled jobs for the current user
   */
  listJobs: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const result = await listHeartbeatJobs(sessionToken);

      const jobs = Array.isArray(result) ? result : result?.jobs || [];
      const filteredJobs = jobs.filter((job: any) => job.name.includes(`-${ctx.user.id}-`));

      return {
        success: true,
        jobs: filteredJobs,
        total: filteredJobs.length,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to list jobs: ${error.message}`,
      });
    }
  }),

  /**
   * Update a scheduled job
   */
  updateJob: protectedProcedure
    .input(
      z.object({
        taskUid: z.string(),
        cron: z.string().optional(),
        enable: z.boolean().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        await updateHeartbeatJob(
          input.taskUid,
          {
            cron: input.cron,
            enable: input.enable,
            description: input.description,
          },
          sessionToken
        );

        return {
          success: true,
          message: "Job updated successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update job: ${error.message}`,
        });
      }
    }),

  /**
   * Delete a scheduled job
   */
  deleteJob: protectedProcedure
    .input(
      z.object({
        taskUid: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        await deleteHeartbeatJob(input.taskUid, sessionToken);

        return {
          success: true,
          message: "Job deleted successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete job: ${error.message}`,
        });
      }
    }),

  /**
   * Pause a scheduled job
   */
  pauseJob: protectedProcedure
    .input(
      z.object({
        taskUid: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        await updateHeartbeatJob(input.taskUid, { enable: false }, sessionToken);

        return {
          success: true,
          message: "Job paused successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to pause job: ${error.message}`,
        });
      }
    }),

  /**
   * Resume a scheduled job
   */
  resumeJob: protectedProcedure
    .input(
      z.object({
        taskUid: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        await updateHeartbeatJob(input.taskUid, { enable: true }, sessionToken);

        return {
          success: true,
          message: "Job resumed successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to resume job: ${error.message}`,
        });
      }
    }),
});

export default schedulerRouter;
