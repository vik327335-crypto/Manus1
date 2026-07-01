import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { invokeLLM } from '../_core/llm';

interface Recommendation {
  id: string;
  strategyName: string;
  category: 'risk' | 'performance' | 'optimization' | 'diversification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: number;
}

// In-memory storage for recommendations
const recommendations = new Map<string, Recommendation[]>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getRecommendationKey(userId: number, strategyName: string): string {
  return `${userId}:${strategyName}`;
}

export const recommendationsRouter = router({
  // Generate AI recommendations for a strategy
  generateRecommendations: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        metrics: z.object({
          totalTrades: z.number(),
          winRate: z.number(),
          roi: z.number(),
          sharpeRatio: z.number(),
          maxDrawdown: z.number(),
          profitFactor: z.number(),
          averageWin: z.number(),
          averageLoss: z.number(),
          largestWin: z.number(),
          largestLoss: z.number(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const metricsText = `
Strategy: ${input.strategyName}
Total Trades: ${input.metrics.totalTrades}
Win Rate: ${input.metrics.winRate}%
ROI: ${input.metrics.roi}%
Sharpe Ratio: ${input.metrics.sharpeRatio}
Max Drawdown: ${input.metrics.maxDrawdown}%
Profit Factor: ${input.metrics.profitFactor}
Average Win: ${input.metrics.averageWin}
Average Loss: ${input.metrics.averageLoss}
Largest Win: ${input.metrics.largestWin}
Largest Loss: ${input.metrics.largestLoss}
        `;

        const prompt = `You are an expert trading strategy analyst. Analyze the following trading strategy metrics and provide 3-5 specific, actionable recommendations for improvement.

${metricsText}

For each recommendation, provide:
1. Category (risk, performance, optimization, or diversification)
2. Priority (high, medium, or low)
3. Title (short, clear title)
4. Description (detailed explanation)
5. Action (specific steps to implement)
6. Expected Impact (what improvement to expect)
7. Difficulty (easy, medium, or hard to implement)

Format your response as a JSON array with these exact fields.`;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content:
                'You are a trading strategy optimization expert. Provide recommendations in valid JSON format only.',
            },
            {
              role: 'user',
              content: prompt as any,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'trading_recommendations',
              strict: true,
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: {
                      type: 'string',
                      enum: ['risk', 'performance', 'optimization', 'diversification'],
                    },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    action: { type: 'string' },
                    expectedImpact: { type: 'string' },
                    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                  },
                  required: [
                    'category',
                    'priority',
                    'title',
                    'description',
                    'action',
                    'expectedImpact',
                    'difficulty',
                  ],
                },
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const parsedRecommendations = JSON.parse(content as string);

        const recommendations_list: Recommendation[] = parsedRecommendations.map(
          (rec: any) => ({
            id: generateId(),
            strategyName: input.strategyName,
            category: rec.category,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            action: rec.action,
            expectedImpact: rec.expectedImpact,
            difficulty: rec.difficulty,
            timestamp: Date.now(),
          })
        );

        // Store recommendations
        const key = getRecommendationKey(ctx.user.id, input.strategyName);
        recommendations.set(key, recommendations_list);

        return {
          success: true,
          recommendations: recommendations_list,
        };
      } catch (error: any) {
        console.error('[RecommendationsRouter] Error generating recommendations:', error);
        return {
          success: false,
          error: error.message,
          recommendations: [],
        };
      }
    }),

  // Get recommendations for a strategy
  getRecommendations: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        category: z.enum(['risk', 'performance', 'optimization', 'diversification']).optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
      })
    )
    .query(({ input, ctx }) => {
      const key = getRecommendationKey(ctx.user.id, input.strategyName);
      let recs = recommendations.get(key) || [];

      if (input.category) {
        recs = recs.filter((r) => r.category === input.category);
      }

      if (input.priority) {
        recs = recs.filter((r) => r.priority === input.priority);
      }

      return recs.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }),

  // Get recommendation statistics
  getRecommendationStats: protectedProcedure
    .input(z.object({ strategyName: z.string() }))
    .query(({ input, ctx }) => {
      const key = getRecommendationKey(ctx.user.id, input.strategyName);
      const recs = recommendations.get(key) || [];

      const stats = {
        total: recs.length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
        lastGenerated: recs.length > 0 ? recs[recs.length - 1].timestamp : null,
      };

      recs.forEach((rec) => {
        stats.byCategory[rec.category] = (stats.byCategory[rec.category] || 0) + 1;
        stats.byPriority[rec.priority] = (stats.byPriority[rec.priority] || 0) + 1;
        stats.byDifficulty[rec.difficulty] = (stats.byDifficulty[rec.difficulty] || 0) + 1;
      });

      return stats;
    }),

  // Mark recommendation as implemented
  markAsImplemented: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        recommendationId: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      const key = getRecommendationKey(ctx.user.id, input.strategyName);
      const recs = recommendations.get(key) || [];

      const index = recs.findIndex((r) => r.id === input.recommendationId);
      if (index !== -1) {
        recs.splice(index, 1);
        recommendations.set(key, recs);
      }

      return {
        success: true,
      };
    }),

  // Clear recommendations
  clearRecommendations: protectedProcedure
    .input(z.object({ strategyName: z.string() }))
    .mutation(({ input, ctx }) => {
      const key = getRecommendationKey(ctx.user.id, input.strategyName);
      const beforeCount = (recommendations.get(key) || []).length;
      recommendations.delete(key);

      return {
        success: true,
        clearedCount: beforeCount,
      };
    }),
});
