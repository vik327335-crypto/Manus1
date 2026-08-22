import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { optimizationJobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import ParameterOptimizationService, {
  OptimizationRange,
} from "../services/parameterOptimizationService";
import BacktestingService from "../services/backtestingService";
import { v4 as uuidv4 } from "uuid";

/**
 * Parameter Optimization Router
 * Manages strategy parameter optimization
 */

export const parameterOptimizationRouter = router({
  /**
   * Run grid search optimization
   */
  runGridSearch: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        symbol: z.string(),
        historicalData: z.array(
          z.object({
            time: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
            volume: z.number(),
          })
        ),
        paramRanges: z.record(z.string(), z.object({
            min: z.number(),
            max: z.number(),
            step: z.number(),
          })),
        initialCapital: z.number().default(10000),
        fitnessMetric: z.enum(["totalReturn", "sharpeRatio", "profitFactor"]).default("totalReturn"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const jobId = uuidv4();

        // Save optimization job
        await db.insert(optimizationJobs).values({
          id: jobId,
          userId: ctx.user.id,
          strategyId: input.strategyId,
          strategyName: input.strategyName,
          symbol: input.symbol,
          status: "running",
          startedAt: new Date(),
          parameterRanges: input.paramRanges,
        });

        // Run optimization
        const report = ParameterOptimizationService.gridSearch(
          input.historicalData as any,
          BacktestingService.smaStrategy,
          input.paramRanges as Record<string, OptimizationRange>,
          input.initialCapital,
          input.fitnessMetric
        );

        // Update job with results
        await db
          .update(optimizationJobs)
          .set({
            status: "completed",
            completedAt: new Date(),
            bestParameters: report.bestResult.parameters,
            bestResult: {
              score: report.bestResult.score,
              metrics: report.bestResult.metrics,
            },
            totalCombinations: report.totalCombinations,
          })
          .where(eq(optimizationJobs.id, jobId));

        return {
          success: true,
          jobId,
          report,
        };
      } catch (error) {
        console.error("Error running grid search:", error);
        throw new Error("Failed to run grid search optimization");
      }
    }),

  /**
   * Run random search optimization
   */
  runRandomSearch: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        symbol: z.string(),
        historicalData: z.array(
          z.object({
            time: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
            volume: z.number(),
          })
        ),
        paramRanges: z.record(z.string(), z.object({
            min: z.number(),
            max: z.number(),
            step: z.number(),
          })),
        iterations: z.number().default(100),
        initialCapital: z.number().default(10000),
        fitnessMetric: z.enum(["totalReturn", "sharpeRatio", "profitFactor"]).default("totalReturn"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const jobId = uuidv4();

        // Save optimization job
        await db.insert(optimizationJobs).values({
          id: jobId,
          userId: ctx.user.id,
          strategyId: input.strategyId,
          strategyName: input.strategyName,
          symbol: input.symbol,
          status: "running",
          startedAt: new Date(),
          parameterRanges: input.paramRanges,
        });

        // Run optimization
        const report = ParameterOptimizationService.randomSearch(
          input.historicalData as any,
          BacktestingService.smaStrategy,
          input.paramRanges as Record<string, OptimizationRange>,
          input.iterations,
          input.initialCapital,
          input.fitnessMetric
        );

        // Update job with results
        await db
          .update(optimizationJobs)
          .set({
            status: "completed",
            completedAt: new Date(),
            bestParameters: report.bestResult.parameters,
            bestResult: {
              score: report.bestResult.score,
              metrics: report.bestResult.metrics,
            },
            totalCombinations: report.totalCombinations,
          })
          .where(eq(optimizationJobs.id, jobId));

        return {
          success: true,
          jobId,
          report,
        };
      } catch (error) {
        console.error("Error running random search:", error);
        throw new Error("Failed to run random search optimization");
      }
    }),

  /**
   * Run genetic algorithm optimization
   */
  runGeneticAlgorithm: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        symbol: z.string(),
        historicalData: z.array(
          z.object({
            time: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
            volume: z.number(),
          })
        ),
        paramRanges: z.record(z.string(), z.object({
            min: z.number(),
            max: z.number(),
            step: z.number(),
          })),
        populationSize: z.number().default(50),
        generations: z.number().default(20),
        initialCapital: z.number().default(10000),
        fitnessMetric: z.enum(["totalReturn", "sharpeRatio", "profitFactor"]).default("totalReturn"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const jobId = uuidv4();

        // Save optimization job
        await db.insert(optimizationJobs).values({
          id: jobId,
          userId: ctx.user.id,
          strategyId: input.strategyId,
          strategyName: input.strategyName,
          symbol: input.symbol,
          status: "running",
          startedAt: new Date(),
          parameterRanges: input.paramRanges,
        });

        // Run optimization
        const report = ParameterOptimizationService.geneticAlgorithm(
          input.historicalData as any,
          BacktestingService.smaStrategy,
          input.paramRanges as Record<string, OptimizationRange>,
          input.populationSize,
          input.generations,
          input.initialCapital,
          input.fitnessMetric
        );

        // Update job with results
        await db
          .update(optimizationJobs)
          .set({
            status: "completed",
            completedAt: new Date(),
            bestParameters: report.bestResult.parameters,
            bestResult: {
              score: report.bestResult.score,
              metrics: report.bestResult.metrics,
            },
            totalCombinations: report.totalCombinations,
          })
          .where(eq(optimizationJobs.id, jobId));

        return {
          success: true,
          jobId,
          report,
        };
      } catch (error) {
        console.error("Error running genetic algorithm:", error);
        throw new Error("Failed to run genetic algorithm optimization");
      }
    }),

  /**
   * Get optimization jobs for user
   */
  getOptimizationJobs: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobs = await db
        .select()
        .from(optimizationJobs)
        .where(eq(optimizationJobs.userId, ctx.user.id))
        .limit(input.limit);

      return jobs;
    }),

  /**
   * Get specific optimization job
   */
  getOptimizationJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx: _ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const job = await db
        .select()
        .from(optimizationJobs)
        .where(eq(optimizationJobs.id, input.jobId));

      if (job.length === 0) {
        throw new Error("Optimization job not found");
      }

      return job[0];
    }),

  /**
   * Delete optimization job
   */
  deleteOptimizationJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const job = await db
        .select()
        .from(optimizationJobs)
        .where(eq(optimizationJobs.id, input.jobId));

      if (job.length === 0 || job[0].userId !== ctx.user.id) {
        throw new Error("Optimization job not found or unauthorized");
      }

      return { success: true };
    }),
});

export default parameterOptimizationRouter;
