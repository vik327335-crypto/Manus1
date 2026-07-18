import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import DeFiIntegrationService from "../services/defiIntegrationService";

export const defiIntegrationRouter = router({
  /**
   * Get Uniswap pool information
   */
  getUniswapPool: protectedProcedure
    .input(
      z.object({
        token0: z.string(),
        token1: z.string(),
        fee: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const pool = await DeFiIntegrationService.getUniswapPool(input.token0, input.token1, input.fee);
        return { success: true, data: pool };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate swap route
   */
  calculateSwapRoute: protectedProcedure
    .input(
      z.object({
        tokenIn: z.string(),
        tokenOut: z.string(),
        amountIn: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      try {
        const swap = await DeFiIntegrationService.calculateSwapRoute(
          input.tokenIn,
          input.tokenOut,
          input.amountIn
        );
        return { success: true, data: swap };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Execute Uniswap swap
   */
  executeUniswapSwap: protectedProcedure
    .input(
      z.object({
        tokenIn: z.string(),
        tokenOut: z.string(),
        amountIn: z.number().positive(),
        amountOutMin: z.number().positive(),
        slippage: z.number(),
        path: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await DeFiIntegrationService.executeUniswapSwap(input as any);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get Aave markets
   */
  getAaveMarkets: protectedProcedure.query(async () => {
    try {
      const markets = await DeFiIntegrationService.getAaveMarkets();
      return { success: true, data: markets };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),

  /**
   * Lend on Aave
   */
  lendOnAave: protectedProcedure
    .input(
      z.object({
        asset: z.string(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const position = await DeFiIntegrationService.lendOnAave(input.asset, input.amount);
        return { success: true, data: position };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Borrow from Aave
   */
  borrowFromAave: protectedProcedure
    .input(
      z.object({
        asset: z.string(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const position = await DeFiIntegrationService.borrowFromAave(input.asset, input.amount);
        return { success: true, data: position };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get Curve pool
   */
  getCurvePool: protectedProcedure
    .input(z.object({ poolId: z.string() }))
    .query(async ({ input }) => {
      try {
        const pool = await DeFiIntegrationService.getCurvePool(input.poolId);
        return { success: true, data: pool };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Provide liquidity to Curve
   */
  provideLiquidityToCurve: protectedProcedure
    .input(
      z.object({
        poolId: z.string(),
        amounts: z.array(z.number().positive()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const position = await DeFiIntegrationService.provideLiquidityToCurve(
          input.poolId,
          input.amounts
        );
        return { success: true, data: position };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get yield farming opportunities
   */
  getYieldFarmingOpportunities: protectedProcedure.query(async () => {
    try {
      const opportunities = await DeFiIntegrationService.getYieldFarmingOpportunities();
      return { success: true, data: opportunities };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }),

  /**
   * Calculate DeFi portfolio value
   */
  calculatePortfolioValue: protectedProcedure
    .input(
      z.object({
        lendPositions: z.array(
          z.object({
            asset: z.string(),
            amount: z.number(),
            aTokenBalance: z.number(),
            supplyRate: z.number(),
            earnedInterest: z.number(),
          })
        ),
        borrowPositions: z.array(
          z.object({
            asset: z.string(),
            amount: z.number(),
            borrowRate: z.number(),
            interestPaid: z.number(),
            healthFactor: z.number(),
          })
        ),
        lpPositions: z.array(
          z.object({
            protocol: z.enum(["UNISWAP", "CURVE", "BALANCER"]),
            poolId: z.string(),
            lpTokens: z.number(),
            token0Amount: z.number(),
            token1Amount: z.number(),
            liquidity: z.number(),
            unrealizedFees: z.number(),
            apy: z.number(),
          })
        ),
        farmPositions: z.array(
          z.object({
            protocol: z.string(),
            farm: z.string(),
            stakedAmount: z.number(),
            rewardToken: z.string(),
            rewardRate: z.number(),
            totalRewards: z.number(),
            apy: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const value = DeFiIntegrationService.calculateTotalDeFiValue(
          input.lendPositions as any,
          input.borrowPositions as any,
          input.lpPositions as any,
          input.farmPositions as any
        );
        return { success: true, data: value };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate DeFi portfolio report
   */
  generateDeFiReport: protectedProcedure
    .input(
      z.object({
        lendPositions: z.array(
          z.object({
            asset: z.string(),
            amount: z.number(),
            aTokenBalance: z.number(),
            supplyRate: z.number(),
            earnedInterest: z.number(),
          })
        ),
        borrowPositions: z.array(
          z.object({
            asset: z.string(),
            amount: z.number(),
            borrowRate: z.number(),
            interestPaid: z.number(),
            healthFactor: z.number(),
          })
        ),
        lpPositions: z.array(
          z.object({
            protocol: z.enum(["UNISWAP", "CURVE", "BALANCER"]),
            poolId: z.string(),
            lpTokens: z.number(),
            token0Amount: z.number(),
            token1Amount: z.number(),
            liquidity: z.number(),
            unrealizedFees: z.number(),
            apy: z.number(),
          })
        ),
        farmPositions: z.array(
          z.object({
            protocol: z.string(),
            farm: z.string(),
            stakedAmount: z.number(),
            rewardToken: z.string(),
            rewardRate: z.number(),
            totalRewards: z.number(),
            apy: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = DeFiIntegrationService.generateDeFiReport(
          input.lendPositions as any,
          input.borrowPositions as any,
          input.lpPositions as any,
          input.farmPositions as any
        );
        return { success: true, data: report };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});
