/**
 * Risk Management Router
 * Handles position sizing, hedging, stop-loss/take-profit, and VaR calculations
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import RiskManagementService from '../services/riskManagementService';

export const riskManagementRouter = router({
  /**
   * Calculate Kelly Criterion position size
   */
  calculateKellyCriterion: protectedProcedure
    .input(
      z.object({
        accountSize: z.number().positive(),
        winRate: z.number().min(0).max(1),
        avgWin: z.number().positive(),
        avgLoss: z.number().positive(),
        maxRiskPercentage: z.number().default(2),
      })
    )
    .query(async ({ input }) => {
      try {
        const positionSize = RiskManagementService.calculateKellyCriterion(
          input.accountSize,
          input.winRate,
          input.avgWin,
          input.avgLoss,
          input.maxRiskPercentage
        );

        return {
          success: true,
          positionSize,
          percentage: (positionSize / input.accountSize) * 100,
        };
      } catch (error) {
        throw new Error(`Failed to calculate Kelly Criterion: ${String(error)}`);
      }
    }),

  /**
   * Calculate volatility-based position size
   */
  calculateVolatilityBasedSize: protectedProcedure
    .input(
      z.object({
        accountSize: z.number().positive(),
        volatility: z.number().positive(),
        riskPercentage: z.number().default(2),
      })
    )
    .query(async ({ input }) => {
      try {
        const positionSize = RiskManagementService.calculateVolatilityBasedSize(
          input.accountSize,
          input.volatility,
          input.riskPercentage
        );

        return {
          success: true,
          positionSize,
          percentage: (positionSize / input.accountSize) * 100,
        };
      } catch (error) {
        throw new Error(`Failed to calculate volatility-based size: ${String(error)}`);
      }
    }),

  /**
   * Calculate Value at Risk
   */
  calculateVaR: protectedProcedure
    .input(
      z.object({
        returns: z.array(z.number()),
        confidenceLevel: z.number().default(0.95),
      })
    )
    .query(async ({ input }) => {
      try {
        const var95 = RiskManagementService.calculateVaR(input.returns, input.confidenceLevel);
        const cvar95 = RiskManagementService.calculateCVaR(input.returns, input.confidenceLevel);

        return {
          success: true,
          var: var95,
          cvar: cvar95,
          confidenceLevel: input.confidenceLevel,
        };
      } catch (error) {
        throw new Error(`Failed to calculate VaR: ${String(error)}`);
      }
    }),

  /**
   * Generate stop-loss and take-profit levels
   */
  generateStopLossLevels: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        entryPrice: z.number().positive(),
        volatility: z.number().positive(),
        riskRewardRatio: z.number().default(0.5),
      })
    )
    .query(async ({ input }) => {
      try {
        const levels = RiskManagementService.generateStopLossLevels(
          input.entryPrice,
          input.volatility,
          input.riskRewardRatio
        );

        return {
          success: true,
          symbol: input.symbol,
          entryPrice: input.entryPrice,
          stopLossPrice: levels.stopLossPrice,
          takeProfitPrice: levels.takeProfitPrice,
          maxLossPercentage: levels.maxLossPercentage,
          maxGainPercentage: levels.maxGainPercentage,
        };
      } catch (error) {
        throw new Error(`Failed to generate stop-loss levels: ${String(error)}`);
      }
    }),

  /**
   * Generate hedging strategy
   */
  generateHedgeStrategy: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        quantity: z.number().positive(),
        currentPrice: z.number().positive(),
        hedgeRatio: z.number().default(0.5),
      })
    )
    .query(async ({ input }) => {
      try {
        const position = {
          symbol: input.symbol,
          quantity: input.quantity,
          entryPrice: input.currentPrice,
          currentPrice: input.currentPrice,
          weight: 1,
        };

        const hedge = RiskManagementService.generateHedgeStrategy(position, input.hedgeRatio);

        return {
          success: true,
          hedge,
        };
      } catch (error) {
        throw new Error(`Failed to generate hedge strategy: ${String(error)}`);
      }
    }),

  /**
   * Calculate Sharpe Ratio
   */
  calculateSharpeRatio: protectedProcedure
    .input(
      z.object({
        returns: z.array(z.number()),
        riskFreeRate: z.number().default(0.02),
      })
    )
    .query(async ({ input }) => {
      try {
        const sharpeRatio = RiskManagementService.calculateSharpeRatio(
          input.returns,
          input.riskFreeRate
        );

        return {
          success: true,
          sharpeRatio,
        };
      } catch (error) {
        throw new Error(`Failed to calculate Sharpe Ratio: ${String(error)}`);
      }
    }),

  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown: protectedProcedure
    .input(z.object({ prices: z.array(z.number()).min(2) }))
    .query(async ({ input }) => {
      try {
        const maxDrawdown = RiskManagementService.calculateMaxDrawdown(input.prices);

        return {
          success: true,
          maxDrawdown,
          maxDrawdownPercentage: maxDrawdown * 100,
        };
      } catch (error) {
        throw new Error(`Failed to calculate max drawdown: ${String(error)}`);
      }
    }),

  /**
   * Calculate portfolio concentration risk
   */
  calculateConcentrationRisk: protectedProcedure
    .input(
      z.object({
        positions: z.array(
          z.object({
            symbol: z.string(),
            weight: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const concentrationRisk = RiskManagementService.calculateConcentrationRisk(
          input.positions as any
        );

        const riskLevel =
          concentrationRisk > 0.5 ? 'high' : concentrationRisk > 0.25 ? 'medium' : 'low';

        return {
          success: true,
          concentrationRisk,
          riskLevel,
        };
      } catch (error) {
        throw new Error(`Failed to calculate concentration risk: ${String(error)}`);
      }
    }),

  /**
   * Calculate correlation between assets
   */
  calculateCorrelation: protectedProcedure
    .input(
      z.object({
        returns1: z.array(z.number()),
        returns2: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      try {
        const correlation = RiskManagementService.calculateCorrelation(
          input.returns1,
          input.returns2
        );

        return {
          success: true,
          correlation,
          diversificationBenefit: correlation < 0.5 ? 'high' : correlation < 0.8 ? 'medium' : 'low',
        };
      } catch (error) {
        throw new Error(`Failed to calculate correlation: ${String(error)}`);
      }
    }),

  /**
   * Validate position size
   */
  validatePositionSize: protectedProcedure
    .input(
      z.object({
        positionSize: z.number().positive(),
        accountSize: z.number().positive(),
        maxRiskPercentage: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const validation = RiskManagementService.validatePositionSize(
          input.positionSize,
          input.accountSize,
          input.maxRiskPercentage
        );

        return {
          success: true,
          valid: validation.valid,
          error: validation.error,
          riskPercentage: (input.positionSize / input.accountSize) * 100,
        };
      } catch (error) {
        throw new Error(`Failed to validate position size: ${String(error)}`);
      }
    }),

  /**
   * Generate comprehensive risk report
   */
  generateRiskReport: protectedProcedure
    .input(
      z.object({
        positions: z.array(
          z.object({
            symbol: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            weight: z.number(),
          })
        ),
        portfolioValue: z.number().positive(),
        returns: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = RiskManagementService.generateRiskReport(
          input.positions as any,
          input.portfolioValue,
          input.returns
        );

        return {
          success: true,
          report,
        };
      } catch (error) {
        throw new Error(`Failed to generate risk report: ${String(error)}`);
      }
    }),
});

export default riskManagementRouter;
