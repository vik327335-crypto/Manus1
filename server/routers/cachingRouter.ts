/**
 * Caching Router
 * Handles cache management and rate limiting
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import CachingService from '../services/cachingService';

export const cachingRouter = router({
  /**
   * Get cache statistics
   */
  getCacheStats: protectedProcedure.query(async () => {
    try {
      const stats = CachingService.getStats();
      return {
        success: true,
        stats,
      };
    } catch (error) {
      throw new Error(`Failed to get cache stats: ${String(error)}`);
    }
  }),

  /**
   * Clear all cache
   */
  clearCache: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Only allow admins to clear cache
      if (ctx.user.role !== 'admin') {
        throw new Error('Only admins can clear cache');
      }

      CachingService.clear();

      return {
        success: true,
        message: 'Cache cleared successfully',
      };
    } catch (error) {
      throw new Error(`Failed to clear cache: ${String(error)}`);
    }
  }),

  /**
   * Cleanup expired cache entries
   */
  cleanupCache: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Only allow admins
      if (ctx.user.role !== 'admin') {
        throw new Error('Only admins can cleanup cache');
      }

      const removed = CachingService.cleanup();

      return {
        success: true,
        removed,
        message: `Removed ${removed} expired cache entries`,
      };
    } catch (error) {
      throw new Error(`Failed to cleanup cache: ${String(error)}`);
    }
  }),

  /**
   * Get rate limit status
   */
  getRateLimitStatus: protectedProcedure
    .input(
      z.object({
        identifier: z.string().optional(),
        keyPrefix: z.string().default('api'),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const identifier = input.identifier || String(ctx.user.id);
        const config = {
          windowMs: 60000, // 1 minute
          maxRequests: 100,
          keyPrefix: input.keyPrefix,
        };

        const status = CachingService.getRateLimitStatus(identifier, config);

        return {
          success: true,
          status,
        };
      } catch (error) {
        throw new Error(`Failed to get rate limit status: ${String(error)}`);
      }
    }),

  /**
   * Check rate limit
   */
  checkRateLimit: protectedProcedure
    .input(
      z.object({
        identifier: z.string().optional(),
        windowMs: z.number().default(60000),
        maxRequests: z.number().default(100),
        keyPrefix: z.string().default('api'),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const identifier = input.identifier || String(ctx.user.id);
        const config = {
          windowMs: input.windowMs,
          maxRequests: input.maxRequests,
          keyPrefix: input.keyPrefix,
        };

        const result = CachingService.checkRateLimit(identifier, config);

        return {
          success: true,
          allowed: result.allowed,
          remaining: result.remaining,
          resetTime: result.resetTime,
          resetIn: result.resetTime - Date.now(),
        };
      } catch (error) {
        throw new Error(`Failed to check rate limit: ${String(error)}`);
      }
    }),

  /**
   * Reset rate limit
   */
  resetRateLimit: protectedProcedure
    .input(
      z.object({
        identifier: z.string(),
        keyPrefix: z.string().default('api'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Only allow admins
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can reset rate limits');
        }

        CachingService.resetRateLimit(input.identifier, input.keyPrefix);

        return {
          success: true,
          message: 'Rate limit reset successfully',
        };
      } catch (error) {
        throw new Error(`Failed to reset rate limit: ${String(error)}`);
      }
    }),

  /**
   * Warm cache with market data
   */
  warmMarketDataCache: protectedProcedure
    .input(
      z.object({
        symbols: z.array(z.string()),
        ttlSeconds: z.number().default(300),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Only allow admins
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can warm cache');
        }

        const data: Record<string, { value: any; ttl: number }> = {};

        for (const symbol of input.symbols) {
          data[`market:${symbol}`] = {
            value: {
              symbol,
              price: 0,
              change24h: 0,
              volume: 0,
              marketCap: 0,
            },
            ttl: input.ttlSeconds,
          };
        }

        CachingService.warmCache(data);

        return {
          success: true,
          warmed: input.symbols.length,
          message: `Warmed cache for ${input.symbols.length} symbols`,
        };
      } catch (error) {
        throw new Error(`Failed to warm cache: ${String(error)}`);
      }
    }),

  /**
   * Get cache entry
   */
  getCacheEntry: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Only allow admins
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can access cache entries');
        }

        const value = CachingService.get(input.key);

        return {
          success: true,
          key: input.key,
          value,
          exists: value !== null,
        };
      } catch (error) {
        throw new Error(`Failed to get cache entry: ${String(error)}`);
      }
    }),

  /**
   * Delete cache entry
   */
  deleteCacheEntry: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Only allow admins
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can delete cache entries');
        }

        const deleted = CachingService.delete(input.key);

        return {
          success: true,
          deleted,
          message: deleted ? 'Cache entry deleted' : 'Cache entry not found',
        };
      } catch (error) {
        throw new Error(`Failed to delete cache entry: ${String(error)}`);
      }
    }),

  /**
   * Get API response from cache
   */
  getApiResponseFromCache: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        params: z.record(z.string(), z.any()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = CachingService.getApiResponse(input.endpoint, input.params || {});

        return {
          success: true,
          cached: response !== null,
          response,
        };
      } catch (error) {
        throw new Error(`Failed to get API response from cache: ${String(error)}`);
      }
    }),
});

export default cachingRouter;
