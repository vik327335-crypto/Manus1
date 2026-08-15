import { describe, expect, it } from "vitest";
import { buildMonitorHistoricalMilestones, calculateMonitorBenchmarkDrift, calculateMonitorPeriodComparisons, calculateRollingMetrics, canRestorePaperTradingMonitor, canRunPaperTradingMonitor, classifyMonitorStatus, diagnoseMonitorRunCadence, isCompletedCandleFresh, matchesMonitorListFilter, shouldNotifyDegradedTransition, shouldSendMonitorAlert, summarizeMonitorAlerts, validateMonitorConfiguration, validateMonitorReportIntegrity, validateMonitorRunHistory } from "./paperTradingMonitorService";

describe("paperTradingMonitorService", () => {
  it("calculates profit factor, win rate, and drawdown from closed virtual trades", () => {
    const metrics = calculateRollingMetrics(
      [{ pnlCents: 1_000 }, { pnlCents: -500 }, { pnlCents: -500 }],
      [10_000, 12_000, 9_000]
    );

    expect(metrics).toEqual({
      trades: 3,
      profitFactorMilli: 1_000,
      winRateBps: 3_333,
      maxDrawdownBps: 2_500,
    });
  });

  it("marks an underperforming monitored model as degraded only after enough trade history", () => {
    const lowPfMetrics = { trades: 6, profitFactorMilli: 900, winRateBps: 3_333, maxDrawdownBps: 1_000 };
    const lowSampleMetrics = { trades: 2, profitFactorMilli: 900, winRateBps: 5_000, maxDrawdownBps: 500 };

    expect(classifyMonitorStatus(lowPfMetrics, 100, 200)).toBe("degraded");
    expect(classifyMonitorStatus(lowSampleMetrics, 100, 200)).toBe("watch");
  });

  it("marks a sufficiently sampled, profitable model with benchmark outperformance as healthy", () => {
    const metrics = { trades: 8, profitFactorMilli: 1_750, winRateBps: 6_250, maxDrawdownBps: 1_200 };

    expect(classifyMonitorStatus(metrics, 650, 100)).toBe("healthy");
  });

  it("notifies the owner only when status transitions into degraded", () => {
    expect(shouldNotifyDegradedTransition("watch", "degraded")).toBe(true);
    expect(shouldNotifyDegradedTransition("degraded", "degraded")).toBe(false);
    expect(shouldNotifyDegradedTransition("healthy", "watch")).toBe(false);
  });

  it("rejects stale completed daily data before a virtual trade is evaluated", () => {
    const now = Date.UTC(2026, 7, 14, 12, 0, 0);
    expect(isCompletedCandleFresh(now - 35 * 60 * 60 * 1_000, now)).toEqual({ ageMinutes: 2_100, fresh: true });
    expect(isCompletedCandleFresh(now - 37 * 60 * 60 * 1_000, now)).toEqual({ ageMinutes: 2_220, fresh: false });
  });

  it("rate-limits repeated operational alerts of the same kind", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");
    expect(shouldSendMonitorAlert("data_stale", new Date("2026-08-14T01:00:00.000Z"), "data_stale", now)).toBe(false);
    expect(shouldSendMonitorAlert("data_stale", new Date("2026-08-13T11:00:00.000Z"), "data_stale", now)).toBe(true);
    expect(shouldSendMonitorAlert("run_error", new Date("2026-08-14T11:00:00.000Z"), "data_stale", now)).toBe(true);
  });

  it("uses saved monitor thresholds without changing the underlying trading signal", () => {
    const metrics = { trades: 4, profitFactorMilli: 1_200, winRateBps: 5_000, maxDrawdownBps: 600 };
    const customThresholds = {
      minimumTradeCount: 3,
      watchProfitFactorMilli: 1_400,
      degradedProfitFactorMilli: 1_100,
      degradedBenchmarkLagBps: 700,
    };

    expect(classifyMonitorStatus(metrics, 100, 200, customThresholds)).toBe("watch");
    expect(classifyMonitorStatus({ ...metrics, profitFactorMilli: 1_000 }, 100, 200, customThresholds)).toBe("degraded");
  });

  it("flags inconsistent schedule and threshold configuration before a daily run", () => {
    const invalid = validateMonitorConfiguration({
      enabled: 1,
      scheduleCronTaskUid: null,
      scheduleCron: null,
      symbols: [],
      minimumTradeCount: 2,
      watchProfitFactorMilli: 1_000,
      degradedProfitFactorMilli: 1_000,
      degradedBenchmarkLagBps: 50,
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toHaveLength(5);
  });

  it("flags invalid weekly report counts without changing virtual trades", () => {
    const integrity = validateMonitorReportIntegrity({
      weeklyRuns: 4,
      availableRuns: 2,
      weeklyAlerts: -1,
      latestProfitFactorMilli: -20,
      latestTrades: -1,
    });

    expect(integrity.valid).toBe(false);
    expect(integrity.issues).toHaveLength(4);
  });

  it("blocks virtual execution for an archived monitor", () => {
    expect(canRunPaperTradingMonitor({ enabled: 1, archivedAt: new Date() })).toBe(false);
    expect(canRunPaperTradingMonitor({ enabled: 1, archivedAt: null })).toBe(true);
    expect(canRunPaperTradingMonitor({ enabled: 0, archivedAt: null })).toBe(false);
  });

  it("allows restore only for an archived monitor and keeps scheduling separate", () => {
    expect(canRestorePaperTradingMonitor({ archivedAt: new Date() })).toBe(true);
    expect(canRestorePaperTradingMonitor({ archivedAt: null })).toBe(false);
  });

  it("filters monitors by lifecycle and case-insensitive name or symbol search", () => {
    const active = { name: "BTC research", symbols: ["BTCUSDT"], enabled: 1, archivedAt: null };
    const paused = { name: "ETH baseline", symbols: ["ETHUSDT"], enabled: 0, archivedAt: null };
    const archived = { name: "SOL archive", symbols: ["SOLUSDT"], enabled: 0, archivedAt: new Date() };

    expect(matchesMonitorListFilter(active, "btc", "active")).toBe(true);
    expect(matchesMonitorListFilter(paused, "ethusdt", "paused")).toBe(true);
    expect(matchesMonitorListFilter(archived, "sol", "archived")).toBe(true);
    expect(matchesMonitorListFilter(archived, "sol", "active")).toBe(false);
  });

  it("compares observed 30/60/90-day virtual performance without inventing missing history", () => {
    const runs = [
      { asOfDate: new Date("2026-05-01T00:00:00.000Z"), equityCents: 10_000, benchmarkEquityCents: 10_000, rollingProfitFactorMilli: 1_200, rollingTrades: 3, rollingMaxDrawdownBps: 400 },
      { asOfDate: new Date("2026-06-15T00:00:00.000Z"), equityCents: 11_000, benchmarkEquityCents: 10_500, rollingProfitFactorMilli: 1_300, rollingTrades: 5, rollingMaxDrawdownBps: 500 },
      { asOfDate: new Date("2026-07-30T00:00:00.000Z"), equityCents: 12_000, benchmarkEquityCents: 11_000, rollingProfitFactorMilli: 1_400, rollingTrades: 7, rollingMaxDrawdownBps: 600 },
    ];
    const [thirty, sixty, ninety] = calculateMonitorPeriodComparisons(runs);

    expect(thirty).toMatchObject({ windowDays: 30, observationCount: 1, hasFullWindow: true, modelReturnBps: 909, benchmarkReturnBps: 476, benchmarkGapBps: 433 });
    expect(sixty).toMatchObject({ windowDays: 60, observationCount: 2, hasFullWindow: true, modelReturnBps: 2_000, benchmarkReturnBps: 1_000, benchmarkGapBps: 1_000 });
    expect(ninety).toMatchObject({ windowDays: 90, observationCount: 2, hasFullWindow: true, modelReturnBps: 2_000, benchmarkReturnBps: 1_000, benchmarkGapBps: 1_000 });
  });

  it("uses persisted historical milestones to describe benchmark-gap drift", () => {
    const runs = [
      { asOfDate: new Date("2026-05-01T00:00:00.000Z"), modelReturnBps: 100, benchmarkReturnBps: 200 },
      { asOfDate: new Date("2026-07-30T00:00:00.000Z"), modelReturnBps: 800, benchmarkReturnBps: 500 },
    ];
    expect(buildMonitorHistoricalMilestones(runs)[0]).toMatchObject({ windowDays: 30, gapBps: -100 });
    expect(calculateMonitorBenchmarkDrift(runs)).toEqual({ currentGapBps: 300, priorGapBps: -100, driftBps: 400, observations: 2 });
  });

  it("flags invalid historical run quality without changing stored results", () => {
    const quality = validateMonitorRunHistory([
      { asOfDate: new Date("2026-08-01T00:00:00.000Z"), status: "healthy", dataFreshness: "fresh", modelReturnBps: 100, benchmarkReturnBps: 50 },
      { asOfDate: new Date("2026-08-01T00:00:00.000Z"), status: "watch", dataFreshness: "stale", modelReturnBps: null, benchmarkReturnBps: 50 },
    ], new Date("2026-08-15T00:00:00.000Z"));
    expect(quality.valid).toBe(false);
    expect(quality.issues).toHaveLength(3);
  });

  it("surfaces missed daily intervals and operational alert suppression without changing the monitor", () => {
    expect(diagnoseMonitorRunCadence([{ asOfDate: new Date("2026-08-10T00:00:00.000Z") }, { asOfDate: new Date("2026-08-13T00:00:00.000Z") }], 1, new Date("2026-08-14T00:00:00.000Z"))).toMatchObject({ missedIntervals: 1, current: true });
    expect(summarizeMonitorAlerts([{ alertKind: "run_error", deliveryStatus: "suppressed" }, { alertKind: "data_stale", deliveryStatus: "failed" }])).toEqual({ total: 2, suppressed: 1, failed: 1 });
  });
});
