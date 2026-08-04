/**
 * Caching Service
 * Handles Redis caching for market data and API responses
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Prefix for rate limit keys
}

export class CachingService {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static rateLimits: Map<string, number[]> = new Map();

  /**
   * Set cache value
   */
  static set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, {
      key,
      value,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Get cache value
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Delete cache value
   */
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  static getStats() {
    let totalSize = 0;
    let expiredCount = 0;

    this.cache.forEach((entry) => {
      if (entry.expiresAt < Date.now()) {
        expiredCount++;
      }
      totalSize += JSON.stringify(entry.value).length;
    });

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }

  /**
   * Cache market data
   */
  static cacheMarketData(symbol: string, data: any, ttlSeconds: number = 60): void {
    const key = `market:${symbol}`;
    this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached market data
   */
  static getMarketData(symbol: string): any | null {
    const key = `market:${symbol}`;
    return this.get(key);
  }

  /**
   * Cache API response
   */
  static cacheApiResponse(endpoint: string, params: Record<string, any>, response: any, ttlSeconds: number = 300): void {
    const paramsStr = JSON.stringify(params);
    const key = `api:${endpoint}:${paramsStr}`;
    this.set(key, response, ttlSeconds);
  }

  /**
   * Get cached API response
   */
  static getApiResponse(endpoint: string, params: Record<string, any>): any | null {
    const paramsStr = JSON.stringify(params);
    const key = `api:${endpoint}:${paramsStr}`;
    return this.get(key);
  }

  /**
   * Check rate limit
   */
  static checkRateLimit(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or initialize request timestamps
    let timestamps = this.rateLimits.get(key) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    const allowed = timestamps.length < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - timestamps.length);

    if (allowed) {
      timestamps.push(now);
    }

    // Update rate limit tracking
    this.rateLimits.set(key, timestamps);

    // Calculate reset time
    const resetTime = timestamps.length > 0 ? timestamps[0] + config.windowMs : now + config.windowMs;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  /**
   * Get rate limit status
   */
  static getRateLimitStatus(identifier: string, config: RateLimitConfig) {
    const key = `${config.keyPrefix}:${identifier}`;
    const timestamps = this.rateLimits.get(key) || [];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const activeRequests = timestamps.filter((ts) => ts > windowStart).length;
    const remaining = Math.max(0, config.maxRequests - activeRequests);
    const resetTime = timestamps.length > 0 ? timestamps[0] + config.windowMs : now + config.windowMs;

    return {
      activeRequests,
      remaining,
      limit: config.maxRequests,
      resetTime,
      resetIn: Math.max(0, resetTime - now),
    };
  }

  /**
   * Reset rate limit
   */
  static resetRateLimit(identifier: string, keyPrefix: string): void {
    const key = `${keyPrefix}:${identifier}`;
    this.rateLimits.delete(key);
  }

  /**
   * Cache strategy backtest results
   */
  static cacheBacktestResults(strategyId: string, results: any, ttlSeconds: number = 3600): void {
    const key = `backtest:${strategyId}`;
    this.set(key, results, ttlSeconds);
  }

  /**
   * Get cached backtest results
   */
  static getBacktestResults(strategyId: string): any | null {
    const key = `backtest:${strategyId}`;
    return this.get(key);
  }

  /**
   * Cache portfolio metrics
   */
  static cachePortfolioMetrics(userId: string, metrics: any, ttlSeconds: number = 120): void {
    const key = `portfolio:${userId}`;
    this.set(key, metrics, ttlSeconds);
  }

  /**
   * Get cached portfolio metrics
   */
  static getPortfolioMetrics(userId: string): any | null {
    const key = `portfolio:${userId}`;
    return this.get(key);
  }

  /**
   * Cleanup expired entries
   */
  static cleanup(): number {
    let removed = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    });

    return removed;
  }

  /**
   * Warm cache with initial data
   */
  static warmCache(data: Record<string, { value: any; ttl: number }>): void {
    for (const [key, { value, ttl }] of Object.entries(data)) {
      this.set(key, value, ttl);
    }
  }
}

export default CachingService;
