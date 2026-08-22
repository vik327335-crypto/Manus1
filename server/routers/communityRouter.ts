import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sharedStrategies, strategyRatings, communityLeaderboard } from "../../drizzle/schema";
import { eq, desc as _desc } from "drizzle-orm";
import { v4 as _uuidv4 } from "uuid";

/**
 * Community Router
 * Manages community features, leaderboards, and ratings
 */

export const communityRouter = router({
  /**
   * Get leaderboard of top strategies
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        timeframe: z.enum(["all", "month", "week"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategies = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.isPublic, 1))
          .limit(input.limit);

        // Calculate scores
        const leaderboard = strategies
          .map((s) => {
            const score =
              (s.rating || 0) * 0.4 +
              (s.copies || 0) * 0.3 +
              (s.views || 0) * 0.1 +
              (s.ratingCount || 0) * 0.2;

            return {
              ...s,
              score,
              rating: s.rating ? s.rating / 100 : 0, // Convert back to 0-5 scale
              parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
              tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
            };
          })
          .sort((a, b) => b.score - a.score);

        return leaderboard;
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        throw new Error("Failed to fetch leaderboard");
      }
    }),

  /**
   * Get user's community stats
   */
  getUserStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategies = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.userId, input.userId));

        const totalViews = strategies.reduce((sum, s) => sum + (s.views || 0), 0);
        const totalCopies = strategies.reduce((sum, s) => sum + (s.copies || 0), 0);
        const avgRating =
          strategies.length > 0
            ? strategies.reduce((sum, s) => sum + (s.rating || 0), 0) / strategies.length / 100
            : 0;

        return {
          userId: input.userId,
          strategiesCount: strategies.length,
          totalViews,
          totalCopies,
          averageRating: Math.round(avgRating * 100) / 100,
          topStrategy: strategies.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null,
        };
      } catch (error) {
        console.error("Error fetching user stats:", error);
        throw new Error("Failed to fetch user stats");
      }
    }),

  /**
   * Rate a strategy
   */
  rateStrategy: protectedProcedure
    .input(
      z.object({
        sharedId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Save rating
        await db.insert(strategyRatings).values({
          userId: ctx.user.id,
          strategyId: input.sharedId,
          rating: input.rating,
          comment: input.comment,
        });

        // Update strategy's average rating
        const ratings = await db
          .select()
          .from(strategyRatings)
          .where(eq(strategyRatings.strategyId, input.sharedId));

        const avgRating = Math.round(
          (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 100
        );

        await db
          .update(sharedStrategies)
          .set({ rating: avgRating, ratingCount: ratings.length })
          .where(eq(sharedStrategies.id, input.sharedId));

        return {
          success: true,
          message: "Rating submitted successfully",
        };
      } catch (error) {
        console.error("Error rating strategy:", error);
        throw new Error("Failed to rate strategy");
      }
    }),

  /**
   * Get strategy ratings and comments
   */
  getStrategyRatings: publicProcedure
    .input(
      z.object({
        sharedId: z.string(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const ratings = await db
          .select()
          .from(strategyRatings)
          .where(eq(strategyRatings.strategyId, input.sharedId))
          .limit(input.limit);

        return ratings;
      } catch (error) {
        console.error("Error fetching ratings:", error);
        throw new Error("Failed to fetch ratings");
      }
    }),

  /**
   * Get top strategies
   */
  getTopStrategies: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let query = db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.isPublic, 1));

        const strategies = await query.limit(input.limit);

        // Filter by category if provided
        let filtered = strategies;
        if (input.category) {
          filtered = strategies.filter((s) => s.category === input.category);
        }

        // Sort by rating
        const sorted = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        return sorted.map((s) => ({
          ...s,
          rating: s.rating ? s.rating / 100 : 0,
          parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
          tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
        }));
      } catch (error) {
        console.error("Error fetching top strategies:", error);
        throw new Error("Failed to fetch top strategies");
      }
    }),

  /**
   * Get community stats
   */
  getCommunityStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const strategies = await db.select().from(sharedStrategies);
      const ratings = await db.select().from(strategyRatings);

      const totalStrategies = strategies.length;
      const totalViews = strategies.reduce((sum, s) => sum + (s.views || 0), 0);
      const totalCopies = strategies.reduce((sum, s) => sum + (s.copies || 0), 0);
      const totalRatings = ratings.length;
      const avgRating =
        totalRatings > 0
          ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 100) / 100
          : 0;

      return {
        totalStrategies,
        totalViews,
        totalCopies,
        totalRatings,
        averageRating: avgRating,
        activeUsers: new Set(strategies.map((s) => s.userId)).size,
      };
    } catch (error) {
      console.error("Error fetching community stats:", error);
      throw new Error("Failed to fetch community stats");
    }
  }),

  /**
   * Get trending categories
   */
  getTrendingCategories: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const strategies = await db.select().from(sharedStrategies);

      // Group by category and count
      const categories: Record<string, number> = {};
      strategies.forEach((s) => {
        const category = s.category || "uncategorized";
        categories[category] = (categories[category] || 0) + 1;
      });

      // Sort by count
      const trending = Object.entries(categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return trending;
    } catch (error) {
      console.error("Error fetching trending categories:", error);
      throw new Error("Failed to fetch trending categories");
    }
  }),

  /**
   * Update leaderboard entry
   */
  updateLeaderboardEntry: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        rank: z.number(),
        score: z.number(),
        totalReturn: z.number().default(0),
        winRate: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if entry exists
        const existing = await db
          .select()
          .from(communityLeaderboard)
          .where(eq(communityLeaderboard.strategyId, input.strategyId));

        if (existing.length > 0) {
          // Update existing entry
          await db
            .update(communityLeaderboard)
            .set({
              rank: input.rank,
              score: input.score,
              totalReturn: input.totalReturn,
              winRate: input.winRate,
              updatedAt: new Date(),
            })
            .where(eq(communityLeaderboard.strategyId, input.strategyId));
        } else {
          // Create new entry
          await db.insert(communityLeaderboard).values({
            userId: ctx.user.id,
            strategyId: input.strategyId,
            rank: input.rank,
            score: input.score,
            totalReturn: input.totalReturn,
            winRate: input.winRate,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating leaderboard:", error);
        throw new Error("Failed to update leaderboard");
      }
    }),
});

export default communityRouter;
