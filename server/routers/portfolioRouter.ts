import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Mock portfolio data storage (in production, use database)
 */
const portfolios = new Map<string, any>();

/**
 * Portfolio Router - Provides procedures for managing user portfolios
 */
export const portfolioRouter = router({
  /**
   * Get all portfolios for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userPortfolios = Array.from(portfolios.values()).filter(
        (p) => p.userId === ctx.user.id
      );
      return userPortfolios;
    } catch (error) {
      console.error("List portfolios error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch portfolios",
      });
    }
  }),

  /**
   * Get a specific portfolio by ID
   */
  getById: protectedProcedure
    .input((val: any) => ({
      id: val.id as string,
    }))
    .query(async ({ ctx, input }) => {
      try {
        const portfolio = portfolios.get(input.id);
        if (!portfolio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }
        if (portfolio.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this portfolio",
          });
        }
        return portfolio;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Get portfolio error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch portfolio",
        });
      }
    }),

  /**
   * Create a new portfolio
   */
  create: protectedProcedure
    .input((val: any) => ({
      name: val.name as string,
      description: val.description as string,
      targetAllocation: val.targetAllocation as Record<string, number>,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const portfolio = {
          id,
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          targetAllocation: input.targetAllocation,
          holdings: [],
          totalValue: 0,
          totalGain: 0,
          totalGainPercent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        portfolios.set(id, portfolio);
        return portfolio;
      } catch (error) {
        console.error("Create portfolio error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create portfolio",
        });
      }
    }),

  /**
   * Update portfolio
   */
  update: protectedProcedure
    .input((val: any) => ({
      id: val.id as string,
      name: val.name as string,
      description: val.description as string,
      targetAllocation: val.targetAllocation as Record<string, number>,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const portfolio = portfolios.get(input.id);
        if (!portfolio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }
        if (portfolio.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this portfolio",
          });
        }

        portfolio.name = input.name;
        portfolio.description = input.description;
        portfolio.targetAllocation = input.targetAllocation;
        portfolio.updatedAt = new Date();

        portfolios.set(input.id, portfolio);
        return portfolio;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Update portfolio error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update portfolio",
        });
      }
    }),

  /**
   * Delete portfolio
   */
  delete: protectedProcedure
    .input((val: any) => ({
      id: val.id as string,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const portfolio = portfolios.get(input.id);
        if (!portfolio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }
        if (portfolio.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this portfolio",
          });
        }

        portfolios.delete(input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Delete portfolio error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete portfolio",
        });
      }
    }),

  /**
   * Add holding to portfolio
   */
  addHolding: protectedProcedure
    .input((val: any) => ({
      portfolioId: val.portfolioId as string,
      ticker: val.ticker as string,
      quantity: val.quantity as number,
      entryPrice: val.entryPrice as number,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const portfolio = portfolios.get(input.portfolioId);
        if (!portfolio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }
        if (portfolio.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this portfolio",
          });
        }

        const holding = {
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ticker: input.ticker,
          quantity: input.quantity,
          entryPrice: input.entryPrice,
          currentPrice: input.entryPrice, // Mock: same as entry price
          gain: 0,
          gainPercent: 0,
          addedAt: new Date(),
        };

        portfolio.holdings.push(holding);
        portfolio.updatedAt = new Date();
        portfolios.set(input.portfolioId, portfolio);

        return holding;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Add holding error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add holding",
        });
      }
    }),

  /**
   * Remove holding from portfolio
   */
  removeHolding: protectedProcedure
    .input((val: any) => ({
      portfolioId: val.portfolioId as string,
      holdingId: val.holdingId as string,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const portfolio = portfolios.get(input.portfolioId);
        if (!portfolio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }
        if (portfolio.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this portfolio",
          });
        }

        portfolio.holdings = portfolio.holdings.filter(
          (h: any) => h.id !== input.holdingId
        );
        portfolio.updatedAt = new Date();
        portfolios.set(input.portfolioId, portfolio);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Remove holding error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove holding",
        });
      }
    }),

  /**
   * Get portfolio performance metrics
   */
  getMetrics: protectedProcedure
    .input((val: any) => ({
      id: val.id as string,
    }))
    .query(async ({ ctx, input }) => {
      try {
        const portfolio = portfolios.get(input.id);
        if (!portfolio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }
        if (portfolio.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this portfolio",
          });
        }

        let totalValue = 0;
        let totalCost = 0;

        portfolio.holdings.forEach((holding: any) => {
          const cost = holding.quantity * holding.entryPrice;
          const value = holding.quantity * holding.currentPrice;
          totalCost += cost;
          totalValue += value;
        });

        const totalGain = totalValue - totalCost;
        const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

        return {
          totalValue,
          totalCost,
          totalGain,
          totalGainPercent,
          holdingsCount: portfolio.holdings.length,
          allocation: portfolio.targetAllocation,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Get metrics error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch metrics",
        });
      }
    }),
});
