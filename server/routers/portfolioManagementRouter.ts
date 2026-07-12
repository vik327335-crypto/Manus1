import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import PortfolioService from "../services/portfolioService";

export const portfolioManagementRouter = router({
  /**
   * Calculate position metrics
   */
  calculatePositionMetrics: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        quantity: z.number(),
        entryPrice: z.number(),
        currentPrice: z.number(),
        previousPrice: z.number().optional(),
      })
    )
    .query(({ input }) => {
      try {
        const metrics = PortfolioService.calculatePositionMetrics(
          {
            id: `${input.ticker}-${Date.now()}`,
            userId: "temp",
            ticker: input.ticker,
            quantity: input.quantity,
            entryPrice: input.entryPrice,
            currentPrice: input.currentPrice,
            exchange: "binance",
            entryDate: new Date(),
          },
          input.previousPrice
        );
        return { success: true, data: metrics };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate portfolio metrics
   */
  calculatePortfolioMetrics: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          quantity: z.number(),
          entryPrice: z.number(),
          currentPrice: z.number(),
        })
      )
    )
    .query(({ input }) => {
      try {
        const positions = input.map((p, i) => ({
          id: `${p.ticker}-${i}`,
          userId: "temp",
          ticker: p.ticker,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          exchange: "binance" as const,
          entryDate: new Date(),
        }));

        const metrics = PortfolioService.calculatePortfolioMetrics(positions);
        return { success: true, data: metrics };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          quantity: z.number(),
          entryPrice: z.number(),
          currentPrice: z.number(),
        })
      )
    )
    .query(({ input }) => {
      try {
        const positions = input.map((p, i) => ({
          id: `${p.ticker}-${i}`,
          userId: "temp",
          ticker: p.ticker,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          exchange: "binance" as const,
          entryDate: new Date(),
        }));

        const riskMetrics = PortfolioService.calculateRiskMetrics(positions);
        return { success: true, data: riskMetrics };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate diversification score
   */
  calculateDiversificationScore: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          quantity: z.number(),
          currentPrice: z.number(),
        })
      )
    )
    .query(({ input }) => {
      try {
        const positions = input.map((p, i) => ({
          id: `${p.ticker}-${i}`,
          userId: "temp",
          ticker: p.ticker,
          quantity: p.quantity,
          entryPrice: 0,
          currentPrice: p.currentPrice,
          exchange: "binance" as const,
          entryDate: new Date(),
        }));

        const score = PortfolioService.calculateDiversificationScore(positions);
        return { success: true, data: { score } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate rebalancing recommendations
   */
  generateRebalancingRecommendations: protectedProcedure
    .input(
      z.object({
        positions: z.array(
          z.object({
            ticker: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
          })
        ),
        targetAllocations: z.record(z.string(), z.number()),
      })
    )
    .query(({ input }) => {
      try {
        const positions = input.positions.map((p, i) => ({
          id: `${p.ticker}-${i}`,
          userId: "temp",
          ticker: p.ticker,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          exchange: "binance" as const,
          entryDate: new Date(),
        }));

        const targetMap = new Map(
          Object.entries(input.targetAllocations).map(([k, v]) => [k, Number(v)])
        );
        const recommendations = PortfolioService.generateRebalancingRecommendations(
          positions,
          targetMap
        );
        return { success: true, data: recommendations };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate Value at Risk
   */
  calculateValueAtRisk: protectedProcedure
    .input(
      z.object({
        positions: z.array(
          z.object({
            ticker: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
          })
        ),
        confidenceLevel: z.number().optional().default(0.95),
      })
    )
    .query(({ input }) => {
      try {
        const positions = input.positions.map((p, i) => ({
          id: `${p.ticker}-${i}`,
          userId: "temp",
          ticker: p.ticker,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          exchange: "binance" as const,
          entryDate: new Date(),
        }));

        const var_ = PortfolioService.calculateValueAtRisk(positions, input.confidenceLevel || 0.95);
        return { success: true, data: { valueAtRisk: var_ } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get portfolio summary
   */
  getPortfolioSummary: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          quantity: z.number(),
          entryPrice: z.number(),
          currentPrice: z.number(),
        })
      )
    )
    .query(({ input }) => {
      try {
        const positions = input.map((p, i) => ({
          id: `${p.ticker}-${i}`,
          userId: "temp",
          ticker: p.ticker,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          exchange: "binance" as const,
          entryDate: new Date(),
        }));

        const metrics = PortfolioService.calculatePortfolioMetrics(positions);
        const riskMetrics = PortfolioService.calculateRiskMetrics(positions);
        const diversificationScore = PortfolioService.calculateDiversificationScore(positions);
        const var_ = PortfolioService.calculateValueAtRisk(positions, 0.95);

        return {
          success: true,
          data: {
            metrics,
            riskMetrics,
            diversificationScore,
            valueAtRisk: var_,
          },
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});
