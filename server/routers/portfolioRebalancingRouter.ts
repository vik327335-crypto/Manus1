import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import PortfolioRebalancingService from "../services/portfolioRebalancingService";

const positionSchema = z.object({
  symbol: z.string().min(1).max(20),
  quantity: z.number().nonnegative(),
  currentPrice: z.number().positive(),
});

const targetSchema = z.object({
  symbol: z.string().min(1).max(20),
  targetAllocation: z.number().min(0).max(100),
});

const constraintsSchema = z.object({
  driftThreshold: z.number().min(0).max(100).default(3),
  minTradeValue: z.number().min(0).default(25),
  cashReservePercentage: z.number().min(0).max(99.99).default(0),
  estimatedFeeBps: z.number().min(0).max(1_000).default(10),
});

export const portfolioRebalancingRouter = router({
  validateTargets: protectedProcedure
    .input(z.object({ targets: z.array(targetSchema).min(1), cashReservePercentage: z.number().min(0).max(99.99).default(0) }))
    .query(({ input }) => ({
      success: true,
      ...PortfolioRebalancingService.validateTargets(input.targets, input.cashReservePercentage),
    })),

  previewPlan: protectedProcedure
    .input(z.object({ positions: z.array(positionSchema).min(1), targets: z.array(targetSchema).min(1), constraints: constraintsSchema.partial().optional() }))
    .query(({ input }) => ({
      success: true,
      plan: PortfolioRebalancingService.buildPlan(input.positions, input.targets, input.constraints),
      disclaimer: "This preview does not place trades and is not personalized financial advice.",
    })),

  getDefaultConstraints: protectedProcedure.query(() => ({
    success: true,
    constraints: { driftThreshold: 3, minTradeValue: 25, cashReservePercentage: 0, estimatedFeeBps: 10 },
  })),
});

export default portfolioRebalancingRouter;
