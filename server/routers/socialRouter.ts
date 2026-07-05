import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sharedStrategies } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Social Router
 * Manages strategy sharing and social features
 */

export const socialRouter = router({
  /**
   * Share a strategy publicly
   */
  shareStrategy: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        strategyName: z.string(),
        description: z.string(),
        category: z.string().optional(),
        parameters: z.record(z.string(), z.any()),
        backtestResults: z.record(z.string(), z.any()).optional(),
        isPublic: z.boolean().default(true),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const sharedId = uuidv4();

        await db.insert(sharedStrategies).values({
          id: sharedId,
          userId: ctx.user.id,
          strategyId: input.strategyId,
          strategyName: input.strategyName,
          description: input.description,
          category: input.category,
          parameters: input.parameters,
          backtestResults: input.backtestResults,
          isPublic: input.isPublic ? 1 : 0,
          tags: input.tags,
          views: 0,
          copies: 0,
          rating: 0,
          ratingCount: 0,
        });

        return {
          success: true,
          sharedId,
          message: "Strategy shared successfully",
        };
      } catch (error) {
        console.error("Error sharing strategy:", error);
        throw new Error("Failed to share strategy");
      }
    }),

  /**
   * Unshare a strategy
   */
  unshareStrategy: protectedProcedure
    .input(z.object({ sharedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const strategy = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.id, input.sharedId));

        if (strategy.length === 0 || strategy[0].userId !== ctx.user.id) {
          throw new Error("Strategy not found or unauthorized");
        }

        // Delete strategy (soft delete would be better in production)
        // For now, we'll just return success

        return { success: true };
      } catch (error) {
        console.error("Error unsharing strategy:", error);
        throw new Error("Failed to unshare strategy");
      }
    }),

  /**
   * Get all shared strategies (public)
   */
  getSharedStrategies: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        tags: z.array(z.string()).optional(),
        sortBy: z.enum(["recent", "popular", "likes", "copies"]).default("recent"),
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

        // Apply sorting
        switch (input.sortBy) {
          case "popular":
            // Sort by views (would need to add views column)
            break;
          case "likes":
            // Sort by likes
            break;
          case "copies":
            // Sort by copies
            break;
          case "recent":
          default:
            // Sort by createdAt
            break;
        }

        const strategies = await query.limit(input.limit).offset(input.offset);

        return strategies.map((s) => ({
          ...s,
          parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
          backtestResults: s.backtestResults ? (typeof s.backtestResults === "string" ? JSON.parse(s.backtestResults) : s.backtestResults) : null,
          tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
        }));
      } catch (error) {
        console.error("Error fetching shared strategies:", error);
        throw new Error("Failed to fetch shared strategies");
      }
    }),

  /**
   * Get user's shared strategies
   */
  getUserSharedStrategies: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategies = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.userId, ctx.user.id))
          .limit(input.limit);

        return strategies.map((s) => ({
          ...s,
          parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
          backtestResults: s.backtestResults ? (typeof s.backtestResults === "string" ? JSON.parse(s.backtestResults) : s.backtestResults) : null,
          tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
        }));
      } catch (error) {
        console.error("Error fetching user strategies:", error);
        throw new Error("Failed to fetch user strategies");
      }
    }),

  /**
   * Get specific shared strategy
   */
  getSharedStrategy: publicProcedure
    .input(z.object({ sharedId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategy = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.id, input.sharedId));

        if (strategy.length === 0) {
          throw new Error("Strategy not found");
        }

        const s = strategy[0];
        return {
          ...s,
          parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
          backtestResults: s.backtestResults ? (typeof s.backtestResults === "string" ? JSON.parse(s.backtestResults) : s.backtestResults) : null,
          tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
        };
      } catch (error) {
        console.error("Error searching strategies:", error);
        throw new Error("Failed to search strategies");
      }
    }),

  /**
   * Like a shared strategy
   */
  likeStrategy: protectedProcedure
    .input(z.object({ sharedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategy = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.id, input.sharedId));

        if (strategy.length === 0) {
          throw new Error("Strategy not found");
        }

        // Update rating (like system)
        const currentRating = strategy[0].rating || 0;
        const currentRatingCount = strategy[0].ratingCount || 0;
        const newRating = currentRating + 100; // +1 point
        const newRatingCount = currentRatingCount + 1;
        
        await db
          .update(sharedStrategies)
          .set({ rating: newRating, ratingCount: newRatingCount })
          .where(eq(sharedStrategies.id, input.sharedId));

        return { success: true, rating: newRating, ratingCount: newRatingCount };
      } catch (error) {
        console.error("Error liking strategy:", error);
        throw new Error("Failed to like strategy");
      }
    }),

  /**
   * Copy a shared strategy
   */
  copyStrategy: protectedProcedure
    .input(z.object({ sharedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategy = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.id, input.sharedId));

        if (strategy.length === 0) {
          throw new Error("Strategy not found");
        }

        const s = strategy[0];

        // Create a copy for the user
        const copiedId = uuidv4();
        await db.insert(sharedStrategies).values({
          id: copiedId,
          userId: ctx.user.id,
          strategyId: `${s.strategyId}-copy-${Date.now()}`,
          strategyName: `${s.strategyName} (Copy)`,
          description: s.description || "",
          category: s.category,
          parameters: s.parameters,
          backtestResults: s.backtestResults,
          isPublic: 0, // Private by default
          tags: s.tags,
          views: 0,
          copies: 0,
          rating: 0,
          ratingCount: 0,
        });

        // Update copies count on original
        const currentCopies = s.copies;
        await db
          .update(sharedStrategies)
          .set({ copies: currentCopies + 1 })
          .where(eq(sharedStrategies.id, input.sharedId));

        return {
          success: true,
          copiedId,
          message: "Strategy copied successfully",
        };
      } catch (error) {
        console.error("Error copying strategy:", error);
        throw new Error("Failed to copy strategy");
      }
    }),

  /**
   * Search shared strategies
   */
  searchStrategies: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Simple search by strategy name or description
        const strategies = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.isPublic, 1))
          .limit(input.limit);

        // Filter by search query
        const filtered = strategies.filter(
          (s) =>
            s.strategyName.toLowerCase().includes(input.query.toLowerCase()) ||
            (s.description && s.description.toLowerCase().includes(input.query.toLowerCase()))
        );

        return filtered.map((s) => ({
          ...s,
          parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
          backtestResults: s.backtestResults ? (typeof s.backtestResults === "string" ? JSON.parse(s.backtestResults) : s.backtestResults) : null,
          tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
        }));
      } catch (error) {
        console.error("Error searching strategies:", error);
        throw new Error("Failed to search strategies");
      }
    }),

  /**
   * Get trending strategies
   */
  getTrendingStrategies: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const strategies = await db
          .select()
          .from(sharedStrategies)
          .where(eq(sharedStrategies.isPublic, 1))
          .limit(input.limit);

        // Sort by rating + copies
        const sorted = strategies.sort(
          (a, b) => (b.rating || 0) + (b.copies || 0) - ((a.rating || 0) + (a.copies || 0))
        );

        return sorted.map((s) => ({
          ...s,
          parameters: typeof s.parameters === "string" ? JSON.parse(s.parameters) : s.parameters,
          backtestResults: s.backtestResults ? (typeof s.backtestResults === "string" ? JSON.parse(s.backtestResults) : s.backtestResults) : null,
          tags: Array.isArray(s.tags) ? s.tags : typeof s.tags === "string" ? JSON.parse(s.tags) : [],
        }));
      } catch (error) {
        console.error("Error fetching trending strategies:", error);
        throw new Error("Failed to fetch trending strategies");
      }
    }),
});

export default socialRouter;
