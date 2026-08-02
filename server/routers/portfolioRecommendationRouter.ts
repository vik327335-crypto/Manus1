/**
 * Portfolio Recommendation Router
 * Handles portfolio optimization and ML-powered recommendations
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import PortfolioRecommendationService, {
  PortfolioAsset,
  RecommendationResult,
  PortfolioOptimizationResult,
} from '../services/portfolioRecommendationService';
import { getDb } from '../db';

export const portfolioRecommendationRouter = router({
  /**
   * Generate sell recommendations for portfolio assets
   */
  generateSellRecommendations: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            id: z.string(),
            symbol: z.string(),
            name: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            marketCap: z.number(),
            volatility: z.number(),
            dayVolume: z.number(),
          })
        ),
        portfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const recommendations =
          await PortfolioRecommendationService.generateSellRecommendations(
            input.assets as PortfolioAsset[],
            input.portfolioValue
          );

        return {
          success: true,
          recommendations,
          count: recommendations.length,
        };
      } catch (error) {
        throw new Error(`Failed to generate sell recommendations: ${String(error)}`);
      }
    }),

  /**
   * Generate buy recommendations for portfolio assets
   */
  generateBuyRecommendations: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            id: z.string(),
            symbol: z.string(),
            name: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            marketCap: z.number(),
            volatility: z.number(),
            dayVolume: z.number(),
            correlation: z.number().optional(),
          })
        ),
        portfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const recommendations =
          await PortfolioRecommendationService.generateBuyRecommendations(
            input.assets as PortfolioAsset[],
            input.portfolioValue,
            []
          );

        return {
          success: true,
          recommendations,
          count: recommendations.length,
        };
      } catch (error) {
        throw new Error(`Failed to generate buy recommendations: ${String(error)}`);
      }
    }),

  /**
   * Generate comprehensive portfolio optimization
   */
  optimizePortfolio: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            id: z.string(),
            symbol: z.string(),
            name: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            marketCap: z.number(),
            volatility: z.number(),
            dayVolume: z.number(),
            rarity: z.number().optional(),
            floorPrice: z.number().optional(),
            correlation: z.number().optional(),
          })
        ),
        portfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const optimization =
          await PortfolioRecommendationService.generatePortfolioOptimization(
            input.assets as PortfolioAsset[],
            input.portfolioValue
          );

        return {
          success: true,
          optimization,
        };
      } catch (error) {
        throw new Error(`Failed to optimize portfolio: ${String(error)}`);
      }
    }),

  /**
   * Calculate portfolio correlation matrix
   */
  calculateCorrelations: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            symbol: z.string(),
            gainPercent: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const correlations =
          PortfolioRecommendationService.calculateCorrelationMatrix(
            input.assets as PortfolioAsset[]
          );

        return {
          success: true,
          correlations,
        };
      } catch (error) {
        throw new Error(`Failed to calculate correlations: ${String(error)}`);
      }
    }),

  /**
   * Detect concentration risks
   */
  detectConcentrationRisks: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            symbol: z.string(),
            currentPrice: z.number(),
            quantity: z.number(),
          })
        ),
        portfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const risks = PortfolioRecommendationService.detectConcentrationRisk(
          input.assets as PortfolioAsset[],
          input.portfolioValue
        );

        return {
          success: true,
          risks,
          hasHighRisk: risks.some((r) => r.risk.includes('CRITICAL')),
        };
      } catch (error) {
        throw new Error(`Failed to detect concentration risks: ${String(error)}`);
      }
    }),

  /**
   * Get personalized recommendations based on user preferences
   */
  getPersonalizedRecommendations: protectedProcedure
    .input(
      z.object({
        riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        investmentHorizon: z.enum(['SHORT', 'MEDIUM', 'LONG']),
        assets: z.array(
          z.object({
            id: z.string(),
            symbol: z.string(),
            name: z.string(),
            quantity: z.number(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            marketCap: z.number(),
            volatility: z.number(),
            dayVolume: z.number(),
          })
        ),
        portfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const optimization =
          await PortfolioRecommendationService.generatePortfolioOptimization(
            input.assets as PortfolioAsset[],
            input.portfolioValue
          );

        // Filter recommendations based on risk tolerance
        let filteredRecommendations = optimization.recommendations;

        if (input.riskTolerance === 'LOW') {
          filteredRecommendations = filteredRecommendations.filter(
            (r) => r.riskLevel !== 'HIGH'
          );
        } else if (input.riskTolerance === 'MEDIUM') {
          // Keep all recommendations
        }

        // Adjust for investment horizon
        if (input.investmentHorizon === 'SHORT') {
          filteredRecommendations = filteredRecommendations.filter(
            (r) => r.timeframe === 'IMMEDIATE'
          );
        } else if (input.investmentHorizon === 'LONG') {
          // Keep all timeframes
        }

        return {
          success: true,
          recommendations: filteredRecommendations,
          optimization: {
            ...optimization,
            recommendations: filteredRecommendations,
          },
        };
      } catch (error) {
        throw new Error(`Failed to get personalized recommendations: ${String(error)}`);
      }
    }),

  /**
   * Analyze portfolio rebalancing opportunity
   */
  analyzeRebalancing: protectedProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            symbol: z.string(),
            currentPrice: z.number(),
            quantity: z.number(),
            targetAllocation: z.number(),
          })
        ),
        portfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const rebalancingActions = [];

        for (const asset of input.assets) {
          const currentValue = asset.currentPrice * asset.quantity;
          const currentAllocation = currentValue / input.portfolioValue;
          const drift = currentAllocation - asset.targetAllocation;

          if (Math.abs(drift) > 0.02) {
            // 2% drift threshold
            rebalancingActions.push({
              symbol: asset.symbol,
              currentAllocation: currentAllocation * 100,
              targetAllocation: asset.targetAllocation * 100,
              drift: drift * 100,
              action: drift > 0 ? 'REDUCE' : 'INCREASE',
              amount: Math.abs(drift * input.portfolioValue),
            });
          }
        }

        return {
          success: true,
          rebalancingNeeded: rebalancingActions.length > 0,
          actions: rebalancingActions.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift)),
          totalDrift: rebalancingActions.reduce((sum, a) => sum + Math.abs(a.drift), 0),
        };
      } catch (error) {
        throw new Error(`Failed to analyze rebalancing: ${String(error)}`);
      }
    }),
});

export default portfolioRecommendationRouter;
