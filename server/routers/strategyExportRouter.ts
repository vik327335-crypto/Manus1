import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  exportToJSON,
  exportToYAML,
  createSampleStrategy,
  exportStrategyWithMetadata as _exportStrategyWithMetadata,
  parseFromJSON,
  validateStrategy,
  type CANSLIMStrategy,
} from '../services/strategyExportService';

export const strategyExportRouter = router({
  // Export current strategy to JSON
  exportJSON: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        backtestResults: z.object({
          winRate: z.number(),
          profitFactor: z.number(),
          sharpeRatio: z.number(),
          maxDrawdown: z.number(),
          totalReturn: z.number(),
          backtestPeriod: z.object({
            startDate: z.string(),
            endDate: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const strategy: CANSLIMStrategy = {
          id: input.strategyId,
          name: input.strategyName,
          description: `CAN SLIM strategy: ${input.strategyName}`,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'CAN SLIM Scanner',

          parameters: [
            {
              name: 'minScore',
              value: 70,
              type: 'number',
              description: 'Minimum CAN SLIM score',
              min: 0,
              max: 100,
            },
          ],

          rules: [
            {
              criterion: 'C',
              name: 'Current Earnings',
              condition: 'EPS growth > 25%',
              threshold: 25,
              weight: 0.15,
            },
            {
              criterion: 'A',
              name: 'Annual Earnings',
              condition: 'EPS growth > 20% over 3 years',
              threshold: 20,
              weight: 0.15,
            },
            {
              criterion: 'N',
              name: 'New',
              condition: 'Recent breakout',
              threshold: 0,
              weight: 0.15,
            },
            {
              criterion: 'S',
              name: 'Supply/Demand',
              condition: 'Volume increase > 50%',
              threshold: 50,
              weight: 0.15,
            },
            {
              criterion: 'L',
              name: 'Leader/Laggard',
              condition: 'Outperforming sector',
              threshold: 0,
              weight: 0.15,
            },
            {
              criterion: 'I',
              name: 'Institutional Support',
              condition: 'Whale accumulation',
              threshold: 0,
              weight: 0.15,
            },
            {
              criterion: 'M',
              name: 'Market Direction',
              condition: 'BTC above 200-day EMA',
              threshold: 0,
              weight: 0.1,
            },
          ],

          performance: input.backtestResults,

          signals: {
            entry: {
              minScore: 70,
              conditions: [
                'CAN SLIM score > 70',
                'Price above 50-day EMA',
                'Volume > 20-day average',
              ],
            },
            exit: {
              stopLoss: -8,
              takeProfit: 25,
              conditions: ['CAN SLIM score drops below 50', 'Price breaks below 20-day EMA'],
            },
          },

          portfolio: {
            maxPositions: 10,
            positionSize: 10,
            rebalanceFrequency: 'weekly',
          },

          riskManagement: {
            maxDrawdown: -20,
            maxLeverage: 2,
            correlationThreshold: 0.7,
          },
        };

        const jsonContent = exportToJSON(strategy);

        return {
          success: true,
          content: jsonContent,
          filename: `canslim-strategy-${input.strategyId}.json`,
          mimeType: 'application/json',
        };
      } catch (error) {
        console.error('[StrategyExportRouter] Error exporting to JSON:', error);
        return {
          success: false,
          error: 'Failed to export strategy to JSON',
        };
      }
    }),

  // Export current strategy to YAML
  exportYAML: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        backtestResults: z.object({
          winRate: z.number(),
          profitFactor: z.number(),
          sharpeRatio: z.number(),
          maxDrawdown: z.number(),
          totalReturn: z.number(),
          backtestPeriod: z.object({
            startDate: z.string(),
            endDate: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const strategy: CANSLIMStrategy = {
          id: input.strategyId,
          name: input.strategyName,
          description: `CAN SLIM strategy: ${input.strategyName}`,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'CAN SLIM Scanner',

          parameters: [
            {
              name: 'minScore',
              value: 70,
              type: 'number',
              description: 'Minimum CAN SLIM score',
              min: 0,
              max: 100,
            },
          ],

          rules: [
            {
              criterion: 'C',
              name: 'Current Earnings',
              condition: 'EPS growth > 25%',
              threshold: 25,
              weight: 0.15,
            },
            {
              criterion: 'A',
              name: 'Annual Earnings',
              condition: 'EPS growth > 20% over 3 years',
              threshold: 20,
              weight: 0.15,
            },
            {
              criterion: 'N',
              name: 'New',
              condition: 'Recent breakout',
              threshold: 0,
              weight: 0.15,
            },
            {
              criterion: 'S',
              name: 'Supply/Demand',
              condition: 'Volume increase > 50%',
              threshold: 50,
              weight: 0.15,
            },
            {
              criterion: 'L',
              name: 'Leader/Laggard',
              condition: 'Outperforming sector',
              threshold: 0,
              weight: 0.15,
            },
            {
              criterion: 'I',
              name: 'Institutional Support',
              condition: 'Whale accumulation',
              threshold: 0,
              weight: 0.15,
            },
            {
              criterion: 'M',
              name: 'Market Direction',
              condition: 'BTC above 200-day EMA',
              threshold: 0,
              weight: 0.1,
            },
          ],

          performance: input.backtestResults,

          signals: {
            entry: {
              minScore: 70,
              conditions: [
                'CAN SLIM score > 70',
                'Price above 50-day EMA',
                'Volume > 20-day average',
              ],
            },
            exit: {
              stopLoss: -8,
              takeProfit: 25,
              conditions: ['CAN SLIM score drops below 50', 'Price breaks below 20-day EMA'],
            },
          },

          portfolio: {
            maxPositions: 10,
            positionSize: 10,
            rebalanceFrequency: 'weekly',
          },

          riskManagement: {
            maxDrawdown: -20,
            maxLeverage: 2,
            correlationThreshold: 0.7,
          },
        };

        const yamlContent = exportToYAML(strategy);

        return {
          success: true,
          content: yamlContent,
          filename: `canslim-strategy-${input.strategyId}.yaml`,
          mimeType: 'text/yaml',
        };
      } catch (error) {
        console.error('[StrategyExportRouter] Error exporting to YAML:', error);
        return {
          success: false,
          error: 'Failed to export strategy to YAML',
        };
      }
    }),

  // Get sample strategy template
  getSampleStrategy: publicProcedure.query(() => {
    try {
      const sample = createSampleStrategy();
      return {
        success: true,
        strategy: sample,
      };
    } catch (error) {
      console.error('[StrategyExportRouter] Error getting sample strategy:', error);
      return {
        success: false,
        error: 'Failed to get sample strategy',
      };
    }
  }),

  // Validate imported strategy
  validateStrategy: publicProcedure
    .input(
      z.object({
        strategyJSON: z.string(),
      })
    )
    .mutation(({ input }) => {
      try {
        const strategy = parseFromJSON(input.strategyJSON);
        const isValid = validateStrategy(strategy);

        if (!isValid) {
          return {
            success: false,
            error: 'Strategy validation failed: missing required fields',
            isValid: false,
          };
        }

        return {
          success: true,
          isValid: true,
          strategy,
          message: 'Strategy is valid and ready to use',
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to validate strategy: ${error}`,
          isValid: false,
        };
      }
    }),

  // Share strategy (generate shareable link)
  shareStrategy: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        expiresIn: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate a unique share token
        const shareToken = Buffer.from(`${input.strategyId}-${Date.now()}`).toString('base64');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (input.expiresIn || 7));

        return {
          success: true,
          shareToken,
          shareUrl: `/strategy/import/${shareToken}`,
          expiresAt: expiresAt.toISOString(),
          message: 'Strategy share link generated',
        };
      } catch (error) {
        console.error('[StrategyExportRouter] Error sharing strategy:', error);
        return {
          success: false,
          error: 'Failed to generate share link',
        };
      }
    }),

  // Get strategy comparison
  compareStrategies: publicProcedure
    .input(
      z.object({
        strategy1: z.string(),
        strategy2: z.string(),
      })
    )
    .mutation(({ input }) => {
      try {
        const s1 = parseFromJSON(input.strategy1);
        const s2 = parseFromJSON(input.strategy2);

        const comparison = {
          strategy1: {
            name: s1.name,
            winRate: s1.performance.winRate,
            profitFactor: s1.performance.profitFactor,
            sharpeRatio: s1.performance.sharpeRatio,
            maxDrawdown: s1.performance.maxDrawdown,
          },
          strategy2: {
            name: s2.name,
            winRate: s2.performance.winRate,
            profitFactor: s2.performance.profitFactor,
            sharpeRatio: s2.performance.sharpeRatio,
            maxDrawdown: s2.performance.maxDrawdown,
          },
          better: {
            winRate: s1.performance.winRate > s2.performance.winRate ? 'strategy1' : 'strategy2',
            profitFactor:
              s1.performance.profitFactor > s2.performance.profitFactor ? 'strategy1' : 'strategy2',
            sharpeRatio:
              s1.performance.sharpeRatio > s2.performance.sharpeRatio ? 'strategy1' : 'strategy2',
            maxDrawdown:
              s1.performance.maxDrawdown > s2.performance.maxDrawdown ? 'strategy1' : 'strategy2',
          },
        };

        return {
          success: true,
          comparison,
        };
      } catch (error) {
        console.error('[StrategyExportRouter] Error comparing strategies:', error);
        return {
          success: false,
          error: 'Failed to compare strategies',
        };
      }
    }),
});
