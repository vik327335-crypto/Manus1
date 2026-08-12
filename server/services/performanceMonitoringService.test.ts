import { afterEach, describe, expect, it } from "vitest";
import PerformanceMonitoringService from "./performanceMonitoringService";

describe("PerformanceMonitoringService", () => {
  afterEach(() => {
    PerformanceMonitoringService.cleanup(0);
  });

  it("агрегирует кэш, ошибки и задержки по записанным запросам", () => {
    PerformanceMonitoringService.recordMetric("/market", "GET", 40, 200, true);
    PerformanceMonitoringService.recordMetric("/market", "GET", 120, 500, false);

    const cache = PerformanceMonitoringService.calculateCacheMetrics(60_000);
    const rateLimit = PerformanceMonitoringService.calculateRateLimitMetrics(60_000);
    const averageLatency = PerformanceMonitoringService.calculateAverageResponseTime(60_000);
    const errorRate = PerformanceMonitoringService.calculateErrorRate(60_000);

    expect(cache).toMatchObject({ totalRequests: 2, cacheHits: 1, cacheMisses: 1, hitRate: 50 });
    expect(rateLimit).toMatchObject({ totalRequests: 2, blockedRequests: 0, blockRate: 0 });
    expect(averageLatency).toBe(80);
    expect(errorRate).toBe(50);
  });

  it("показывает самые медленные endpoint-ы и распределение ошибок", () => {
    PerformanceMonitoringService.recordMetric("/fast", "GET", 15, 200);
    PerformanceMonitoringService.recordMetric("/slow", "POST", 900, 429);
    PerformanceMonitoringService.recordMetric("/slow", "POST", 1100, 500);

    const endpoints = PerformanceMonitoringService.getSlowEndpoints(2, 60_000);
    const errors = PerformanceMonitoringService.getErrorDistribution(60_000);

    expect(endpoints[0]).toMatchObject({ endpoint: "/slow", requestCount: 2, avgDuration: 1000, maxDuration: 1100 });
    expect(errors).toEqual({ 429: 1, 500: 1 });
  });

  it("формирует отчёт со здоровьем системы и уведомлениями", () => {
    PerformanceMonitoringService.recordMetric("/ready", "GET", 2001, 200, false);

    const report = PerformanceMonitoringService.generatePerformanceReport("minute");

    expect(report.period).toBe("minute");
    expect(report.metrics).toHaveLength(1);
    expect(report.systemHealth.memoryUsage).toBeGreaterThan(0);
    expect(report.alerts.some((alert) => alert.type === "latency")).toBe(true);
  });

  it("удаляет сохранённые метрики старше указанного порога", () => {
    PerformanceMonitoringService.recordMetric("/temporary", "GET", 10, 200);

    expect(PerformanceMonitoringService.cleanup(0)).toBeGreaterThanOrEqual(1);
    expect(PerformanceMonitoringService.calculateCacheMetrics(60_000).totalRequests).toBe(0);
  });
});
