/**
 * Performance Monitoring Service
 * Tracks API latency, cache hit rates, rate limit usage, and system health
 */

export interface PerformanceMetric {
  timestamp: Date;
  endpoint: string;
  method: string;
  duration: number; // milliseconds
  statusCode: number;
  cached: boolean;
}

export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number; // percentage
  avgHitTime: number; // milliseconds
  avgMissTime: number; // milliseconds
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  blockRate: number; // percentage
  peakRequestsPerMinute: number;
  avgRequestsPerMinute: number;
}

export interface SystemHealth {
  uptime: number; // milliseconds
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  activeConnections: number;
  errorRate: number; // percentage
  avgResponseTime: number; // milliseconds
}

export interface PerformanceReport {
  timestamp: Date;
  period: 'minute' | 'hour' | 'day';
  metrics: PerformanceMetric[];
  cacheMetrics: CacheMetrics;
  rateLimitMetrics: RateLimitMetrics;
  systemHealth: SystemHealth;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'latency' | 'error_rate' | 'cache_hit_rate' | 'memory' | 'cpu';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  value: number;
  threshold: number;
}

export class PerformanceMonitoringService {
  private static metrics: PerformanceMetric[] = [];
  private static alerts: Alert[] = [];
  private static startTime = Date.now();

  /**
   * Record API request performance
   */
  static recordMetric(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    cached: boolean = false
  ): void {
    this.metrics.push({
      timestamp: new Date(),
      endpoint,
      method,
      duration,
      statusCode,
      cached,
    });

    // Keep only last 10000 metrics to avoid memory bloat
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  /**
   * Calculate cache metrics
   */
  static calculateCacheMetrics(timeWindowMs: number = 3600000): CacheMetrics {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    const cacheHits = recentMetrics.filter((m) => m.cached).length;
    const totalRequests = recentMetrics.length;
    const cacheMisses = totalRequests - cacheHits;

    const hitTimes = recentMetrics
      .filter((m) => m.cached)
      .map((m) => m.duration);
    const missTimes = recentMetrics
      .filter((m) => !m.cached)
      .map((m) => m.duration);

    const avgHitTime = hitTimes.length > 0 ? hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length : 0;
    const avgMissTime = missTimes.length > 0 ? missTimes.reduce((a, b) => a + b, 0) / missTimes.length : 0;

    return {
      totalRequests,
      cacheHits,
      cacheMisses,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      avgHitTime,
      avgMissTime,
    };
  }

  /**
   * Calculate rate limit metrics
   */
  static calculateRateLimitMetrics(timeWindowMs: number = 60000): RateLimitMetrics {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    const blockedRequests = recentMetrics.filter((m) => m.statusCode === 429).length;
    const totalRequests = recentMetrics.length;

    // Calculate peak requests per minute
    const minuteWindows: Record<number, number> = {};
    for (const metric of recentMetrics) {
      const minute = Math.floor(metric.timestamp.getTime() / 60000);
      minuteWindows[minute] = (minuteWindows[minute] || 0) + 1;
    }

    const peakRequestsPerMinute = Math.max(...Object.values(minuteWindows), 0);
    const avgRequestsPerMinute = totalRequests > 0 ? totalRequests / (timeWindowMs / 60000) : 0;

    return {
      totalRequests,
      blockedRequests,
      blockRate: totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0,
      peakRequestsPerMinute,
      avgRequestsPerMinute,
    };
  }

  /**
   * Calculate average response time
   */
  static calculateAverageResponseTime(timeWindowMs: number = 3600000): number {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) return 0;

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / recentMetrics.length;
  }

  /**
   * Calculate error rate
   */
  static calculateErrorRate(timeWindowMs: number = 3600000): number {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) return 0;

    const errors = recentMetrics.filter((m) => m.statusCode >= 400).length;
    return (errors / recentMetrics.length) * 100;
  }

  /**
   * Get system health status
   */
  static getSystemHealth(): SystemHealth {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.calculateAverageResponseTime();
    const errorRate = this.calculateErrorRate();

    // Mock memory and CPU usage (in production, use os module)
    const memoryUsage = process.memoryUsage().heapUsed;
    const cpuUsage = 25; // Mock value

    return {
      uptime,
      memoryUsage,
      cpuUsage,
      activeConnections: 0, // Would track from connection pool
      errorRate,
      avgResponseTime,
    };
  }

  /**
   * Generate performance report
   */
  static generatePerformanceReport(period: 'minute' | 'hour' | 'day' = 'hour'): PerformanceReport {
    const timeWindowMs = period === 'minute' ? 60000 : period === 'hour' ? 3600000 : 86400000;

    const now = Date.now();
    const cutoff = now - timeWindowMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    const cacheMetrics = this.calculateCacheMetrics(timeWindowMs);
    const rateLimitMetrics = this.calculateRateLimitMetrics(timeWindowMs);
    const systemHealth = this.getSystemHealth();

    const alerts = this.generateAlerts(cacheMetrics, rateLimitMetrics, systemHealth);

    return {
      timestamp: new Date(),
      period,
      metrics: recentMetrics,
      cacheMetrics,
      rateLimitMetrics,
      systemHealth,
      alerts,
    };
  }

  /**
   * Generate alerts based on thresholds
   */
  static generateAlerts(
    cacheMetrics: CacheMetrics,
    rateLimitMetrics: RateLimitMetrics,
    systemHealth: SystemHealth
  ): Alert[] {
    const alerts: Alert[] = [];

    // Latency alert
    if (systemHealth.avgResponseTime > 1000) {
      alerts.push({
        id: `alert_${Date.now()}_latency`,
        type: 'latency',
        severity: systemHealth.avgResponseTime > 2000 ? 'critical' : 'warning',
        message: `High API latency: ${systemHealth.avgResponseTime.toFixed(0)}ms`,
        timestamp: new Date(),
        value: systemHealth.avgResponseTime,
        threshold: 1000,
      });
    }

    // Error rate alert
    if (systemHealth.errorRate > 5) {
      alerts.push({
        id: `alert_${Date.now()}_error_rate`,
        type: 'error_rate',
        severity: systemHealth.errorRate > 10 ? 'critical' : 'warning',
        message: `High error rate: ${systemHealth.errorRate.toFixed(2)}%`,
        timestamp: new Date(),
        value: systemHealth.errorRate,
        threshold: 5,
      });
    }

    // Cache hit rate alert
    if (cacheMetrics.hitRate < 50) {
      alerts.push({
        id: `alert_${Date.now()}_cache_hit_rate`,
        type: 'cache_hit_rate',
        severity: 'info',
        message: `Low cache hit rate: ${cacheMetrics.hitRate.toFixed(2)}%`,
        timestamp: new Date(),
        value: cacheMetrics.hitRate,
        threshold: 50,
      });
    }

    // Memory usage alert
    const memoryMB = systemHealth.memoryUsage / 1024 / 1024;
    if (memoryMB > 512) {
      alerts.push({
        id: `alert_${Date.now()}_memory`,
        type: 'memory',
        severity: memoryMB > 1024 ? 'critical' : 'warning',
        message: `High memory usage: ${memoryMB.toFixed(0)}MB`,
        timestamp: new Date(),
        value: memoryMB,
        threshold: 512,
      });
    }

    // CPU usage alert
    if (systemHealth.cpuUsage > 80) {
      alerts.push({
        id: `alert_${Date.now()}_cpu`,
        type: 'cpu',
        severity: systemHealth.cpuUsage > 95 ? 'critical' : 'warning',
        message: `High CPU usage: ${systemHealth.cpuUsage.toFixed(0)}%`,
        timestamp: new Date(),
        value: systemHealth.cpuUsage,
        threshold: 80,
      });
    }

    return alerts;
  }

  /**
   * Get top slow endpoints
   */
  static getSlowEndpoints(limit: number = 10, timeWindowMs: number = 3600000): Array<{
    endpoint: string;
    avgDuration: number;
    maxDuration: number;
    requestCount: number;
  }> {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    const endpointStats: Record<
      string,
      {
        durations: number[];
        count: number;
      }
    > = {};

    for (const metric of recentMetrics) {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = { durations: [], count: 0 };
      }

      endpointStats[metric.endpoint].durations.push(metric.duration);
      endpointStats[metric.endpoint].count++;
    }

    const results = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length,
        maxDuration: Math.max(...stats.durations),
        requestCount: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);

    return results;
  }

  /**
   * Get error distribution
   */
  static getErrorDistribution(timeWindowMs: number = 3600000): Record<number, number> {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp.getTime() > cutoff && m.statusCode >= 400
    );

    const distribution: Record<number, number> = {};

    for (const metric of recentMetrics) {
      distribution[metric.statusCode] = (distribution[metric.statusCode] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Clear old metrics
   */
  static cleanup(maxAgeMs: number = 86400000): number {
    const now = Date.now();
    const cutoff = now - maxAgeMs;

    const beforeLength = this.metrics.length;
    this.metrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);
    const removed = beforeLength - this.metrics.length;

    return removed;
  }
}

export default PerformanceMonitoringService;
