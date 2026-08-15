import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import {
  paperTradingMonitorRuns,
  paperTradingMonitors,
  paperTradingMonitorTrades,
  paperTradingMonitorAlerts,
  type PaperTradingMonitor,
  type PaperTradingMonitorRun,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import TradingSignalService from "./tradingSignalService";

const DAILY_INTERVAL = "1d";
const LOOKBACK_BARS = 260;
const QUANTITY_SCALE = 100_000_000;
const MAX_COMPLETED_CANDLE_AGE_MINUTES = 36 * 60;
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1_000;

type DailyCandle = {
  openTime: number;
  closeTime: number;
  open: number;
  close: number;
};

type SymbolEvaluation = {
  symbol: string;
  executionPriceCents: number;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
};

export type RollingMetrics = {
  trades: number;
  profitFactorMilli: number | null;
  winRateBps: number | null;
  maxDrawdownBps: number;
};

export function calculateRollingMetrics(
  closedTrades: Array<{ pnlCents: number | null }>,
  equities: number[]
): RollingMetrics {
  const wins = closedTrades.filter((trade) => (trade.pnlCents ?? 0) > 0);
  const losses = closedTrades.filter((trade) => (trade.pnlCents ?? 0) < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + (trade.pnlCents ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnlCents ?? 0), 0));
  let peak = equities[0] ?? 0;
  let maxDrawdownBps = 0;

  for (const equity of equities) {
    peak = Math.max(peak, equity);
    if (peak > 0) maxDrawdownBps = Math.max(maxDrawdownBps, Math.round(((peak - equity) / peak) * 10_000));
  }

  return {
    trades: closedTrades.length,
    profitFactorMilli: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 1_000) : null,
    winRateBps: closedTrades.length > 0 ? Math.round((wins.length / closedTrades.length) * 10_000) : null,
    maxDrawdownBps,
  };
}

export function classifyMonitorStatus(
  metrics: RollingMetrics,
  modelReturnBps: number,
  benchmarkReturnBps: number,
  thresholds: Pick<PaperTradingMonitor, "minimumTradeCount" | "watchProfitFactorMilli" | "degradedProfitFactorMilli" | "degradedBenchmarkLagBps"> = {
    minimumTradeCount: 5,
    watchProfitFactorMilli: 1_500,
    degradedProfitFactorMilli: 1_000,
    degradedBenchmarkLagBps: 500,
  }
): "healthy" | "watch" | "degraded" {
  const relativeReturnBps = modelReturnBps - benchmarkReturnBps;
  if (metrics.trades >= thresholds.minimumTradeCount && ((metrics.profitFactorMilli !== null && metrics.profitFactorMilli < thresholds.degradedProfitFactorMilli) || relativeReturnBps <= -thresholds.degradedBenchmarkLagBps)) {
    return "degraded";
  }
  if (metrics.trades < thresholds.minimumTradeCount || metrics.profitFactorMilli === null || metrics.profitFactorMilli < thresholds.watchProfitFactorMilli || relativeReturnBps < 0) {
    return "watch";
  }
  return "healthy";
}

export function shouldNotifyDegradedTransition(
  previousStatus: string | null | undefined,
  nextStatus: "healthy" | "watch" | "degraded"
) {
  return previousStatus !== "degraded" && nextStatus === "degraded";
}

export function isCompletedCandleFresh(closeTime: number, nowMs = Date.now()) {
  const ageMinutes = Math.max(0, Math.floor((nowMs - closeTime) / 60_000));
  return { ageMinutes, fresh: ageMinutes <= MAX_COMPLETED_CANDLE_AGE_MINUTES };
}

export function shouldSendMonitorAlert(
  previousKind: string | null | undefined,
  previousAt: Date | null | undefined,
  nextKind: "degraded" | "data_stale" | "run_error",
  now = new Date()
) {
  if (previousKind !== nextKind || !previousAt) return true;
  return now.getTime() - previousAt.getTime() >= ALERT_COOLDOWN_MS;
}

export function canRunPaperTradingMonitor(monitor: Pick<PaperTradingMonitor, "enabled" | "archivedAt">) {
  return monitor.enabled === 1 && monitor.archivedAt === null;
}

export function canRestorePaperTradingMonitor(monitor: Pick<PaperTradingMonitor, "archivedAt">) {
  return monitor.archivedAt !== null;
}

export type MonitorLifecycleFilter = "all" | "active" | "paused" | "archived";

export function matchesMonitorListFilter(
  monitor: Pick<PaperTradingMonitor, "name" | "symbols" | "enabled" | "archivedAt">,
  query: string,
  lifecycle: MonitorLifecycleFilter
) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = !normalizedQuery || `${monitor.name} ${(monitor.symbols ?? []).join(" ")}`.toLowerCase().includes(normalizedQuery);
  if (!matchesQuery) return false;
  if (lifecycle === "archived") return monitor.archivedAt !== null;
  if (lifecycle === "active") return monitor.archivedAt === null && monitor.enabled === 1;
  if (lifecycle === "paused") return monitor.archivedAt === null && monitor.enabled === 0;
  return true;
}

export type MonitorPeriodComparison = {
  windowDays: number;
  observationCount: number;
  hasFullWindow: boolean;
  modelReturnBps: number | null;
  benchmarkReturnBps: number | null;
  benchmarkGapBps: number | null;
  profitFactorMilli: number | null;
  closedTrades: number;
  maxDrawdownBps: number | null;
};

export function calculateMonitorPeriodComparisons(
  runs: Array<Pick<PaperTradingMonitorRun, "asOfDate" | "equityCents" | "benchmarkEquityCents" | "rollingProfitFactorMilli" | "rollingTrades" | "rollingMaxDrawdownBps">>,
  windows = [30, 60, 90]
): MonitorPeriodComparison[] {
  const chronological = [...runs].sort((left, right) => left.asOfDate.getTime() - right.asOfDate.getTime());
  const latest = chronological.at(-1);
  if (!latest) return windows.map((windowDays) => ({ windowDays, observationCount: 0, hasFullWindow: false, modelReturnBps: null, benchmarkReturnBps: null, benchmarkGapBps: null, profitFactorMilli: null, closedTrades: 0, maxDrawdownBps: null }));

  return windows.map((windowDays) => {
    const cutoff = new Date(latest.asOfDate.getTime() - windowDays * 86_400_000);
    const baseline = chronological.filter((run) => run.asOfDate.getTime() <= cutoff.getTime()).at(-1) ?? null;
    const observations = chronological.filter((run) => run.asOfDate.getTime() > cutoff.getTime());
    const firstObserved = observations[0] ?? latest;
    const modelStart = baseline?.equityCents ?? firstObserved.equityCents;
    const benchmarkStart = baseline?.benchmarkEquityCents ?? firstObserved.benchmarkEquityCents;
    const modelReturnBps = modelStart && latest.equityCents ? Math.round(((latest.equityCents / modelStart) - 1) * 10_000) : null;
    const benchmarkReturnBps = benchmarkStart && latest.benchmarkEquityCents ? Math.round(((latest.benchmarkEquityCents / benchmarkStart) - 1) * 10_000) : null;
    return {
      windowDays,
      observationCount: observations.length,
      hasFullWindow: baseline !== null,
      modelReturnBps,
      benchmarkReturnBps,
      benchmarkGapBps: modelReturnBps === null || benchmarkReturnBps === null ? null : modelReturnBps - benchmarkReturnBps,
      profitFactorMilli: latest.rollingProfitFactorMilli,
      closedTrades: latest.rollingTrades,
      maxDrawdownBps: latest.rollingMaxDrawdownBps,
    };
  });
}

export function buildMonitorHistoricalMilestones(
  runs: Array<Pick<PaperTradingMonitorRun, "asOfDate" | "modelReturnBps" | "benchmarkReturnBps">>,
  windows = [30, 60, 90]
) {
  const chronological = [...runs].sort((left, right) => left.asOfDate.getTime() - right.asOfDate.getTime());
  const latest = chronological.at(-1);
  if (!latest) return [];
  return windows.map((windowDays) => {
    const target = latest.asOfDate.getTime() - windowDays * 86_400_000;
    const snapshot = chronological.filter((run) => run.asOfDate.getTime() <= target).at(-1) ?? chronological[0];
    const modelReturnBps = snapshot.modelReturnBps ?? null;
    const benchmarkReturnBps = snapshot.benchmarkReturnBps ?? null;
    return { windowDays, asOfDate: snapshot.asOfDate, modelReturnBps, benchmarkReturnBps, gapBps: modelReturnBps === null || benchmarkReturnBps === null ? null : modelReturnBps - benchmarkReturnBps };
  });
}

export function calculateMonitorBenchmarkDrift(runs: Array<Pick<PaperTradingMonitorRun, "asOfDate" | "modelReturnBps" | "benchmarkReturnBps">>) {
  const milestones = buildMonitorHistoricalMilestones(runs, [30]);
  const latest = [...runs].sort((left, right) => left.asOfDate.getTime() - right.asOfDate.getTime()).at(-1);
  const currentGapBps = latest?.modelReturnBps === null || latest?.modelReturnBps === undefined || latest?.benchmarkReturnBps === null || latest?.benchmarkReturnBps === undefined ? null : latest.modelReturnBps - latest.benchmarkReturnBps;
  const priorGapBps = milestones[0]?.gapBps ?? null;
  return { currentGapBps, priorGapBps, driftBps: currentGapBps === null || priorGapBps === null ? null : currentGapBps - priorGapBps, observations: runs.length };
}

export function validateMonitorRunHistory(runs: Array<Pick<PaperTradingMonitorRun, "asOfDate" | "status" | "dataFreshness" | "modelReturnBps" | "benchmarkReturnBps">>, now = new Date()) {
  const issues: string[] = [];
  const seen = new Set<number>();
  for (const run of runs) {
    const timestamp = run.asOfDate.getTime();
    if (timestamp > now.getTime()) issues.push("A run is dated in the future.");
    if (seen.has(timestamp)) issues.push("Duplicate completed-candle dates exist.");
    seen.add(timestamp);
    if (run.status !== "error" && run.status !== "skipped" && (run.modelReturnBps === null || run.benchmarkReturnBps === null)) issues.push("A completed run is missing benchmark comparison data.");
    if (run.dataFreshness === "stale" && run.status !== "error") issues.push("A stale-data run was not marked as an error.");
  }
  return { valid: issues.length === 0, issues: Array.from(new Set(issues)) };
}

export function diagnoseMonitorRunCadence(runs: Array<Pick<PaperTradingMonitorRun, "asOfDate">>, enabled: number, now = new Date()) {
  if (!enabled || runs.length === 0) return { monitored: enabled === 1, missedIntervals: 0, latestAgeHours: null, current: enabled === 0 };
  const chronological = [...runs].sort((left, right) => left.asOfDate.getTime() - right.asOfDate.getTime());
  const missedIntervals = chronological.slice(1).reduce((count, run, index) => count + (run.asOfDate.getTime() - chronological[index].asOfDate.getTime() > 36 * 3_600_000 ? 1 : 0), 0);
  const latestAgeHours = Math.max(0, Math.floor((now.getTime() - chronological.at(-1)!.asOfDate.getTime()) / 3_600_000));
  return { monitored: true, missedIntervals, latestAgeHours, current: latestAgeHours <= 36 };
}

export function summarizeMonitorAlerts(alerts: Array<Pick<typeof paperTradingMonitorAlerts.$inferSelect, "alertKind" | "deliveryStatus">>) {
  return { total: alerts.length, suppressed: alerts.filter((alert) => alert.deliveryStatus === "suppressed").length, failed: alerts.filter((alert) => alert.deliveryStatus === "failed").length };
}

export function validateMonitorConfiguration(monitor: Pick<PaperTradingMonitor, "enabled" | "scheduleCronTaskUid" | "scheduleCron" | "symbols" | "minimumTradeCount" | "watchProfitFactorMilli" | "degradedProfitFactorMilli" | "degradedBenchmarkLagBps">) {
  const issues: string[] = [];
  if (monitor.enabled && (!monitor.scheduleCronTaskUid || !monitor.scheduleCron)) issues.push("Daily monitoring is enabled without a linked schedule.");
  if (!monitor.symbols || monitor.symbols.length === 0) issues.push("No symbols are configured.");
  if (monitor.minimumTradeCount < 3) issues.push("Minimum trade count must be at least three.");
  if (monitor.degradedProfitFactorMilli >= monitor.watchProfitFactorMilli) issues.push("Degraded PF must be lower than Watch PF.");
  if (monitor.degradedBenchmarkLagBps < 100) issues.push("Benchmark lag threshold is too small.");
  return { valid: issues.length === 0, issues };
}

export function validateMonitorReportIntegrity(input: {
  weeklyRuns: number;
  availableRuns: number;
  weeklyAlerts: number;
  latestProfitFactorMilli: number | null;
  latestTrades: number | null;
}) {
  const issues: string[] = [];
  if (input.weeklyRuns < 0 || input.weeklyRuns > input.availableRuns) issues.push("Weekly run count is inconsistent with available history.");
  if (input.weeklyAlerts < 0) issues.push("Weekly alert count cannot be negative.");
  if (input.latestProfitFactorMilli !== null && input.latestProfitFactorMilli < 0) issues.push("Profit factor cannot be negative.");
  if (input.latestTrades !== null && input.latestTrades < 0) issues.push("Closed trade count cannot be negative.");
  return { valid: issues.length === 0, issues };
}

export class MonitorDataStaleError extends Error {
  constructor(readonly ageMinutes: number) {
    super(`Latest completed daily candle is stale (${ageMinutes} minutes old)`);
    this.name = "MonitorDataStaleError";
  }
}

function toCents(price: number) {
  return Math.max(1, Math.round(price * 100));
}

function clampInt(value: number) {
  return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.round(value)));
}

function sma(values: number[], period: number) {
  return values.slice(-period).reduce((sum, value) => sum + value, 0) / period;
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  let result = values[0] ?? 0;
  for (const value of values.slice(1)) result = value * multiplier + result * (1 - multiplier);
  return result;
}

function rsi(values: number[], period = 14) {
  const sample = values.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < sample.length; index += 1) {
    const change = sample[index] - sample[index - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

async function fetchDailyCandles(symbol: string): Promise<DailyCandle[]> {
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", DAILY_INTERVAL);
  url.searchParams.set("limit", String(LOOKBACK_BARS));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${symbol} market-data request failed with HTTP ${response.status}`);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error(`${symbol} market-data response is invalid`);
  return rows.map((row) => {
    const candle = row as [number, string, string, string, string, string, number];
    return {
      openTime: Number(candle[0]),
      open: Number(candle[1]),
      close: Number(candle[4]),
      closeTime: Number(candle[6]),
    };
  });
}

async function evaluateSymbol(symbol: string): Promise<{ asOfDate: Date; candleAgeMinutes: number; evaluation: SymbolEvaluation }> {
  const candles = await fetchDailyCandles(symbol);
  if (candles.length < 52) throw new Error(`${symbol} has insufficient daily history`);
  const executionCandle = candles.at(-1)!;
  const completed = candles.slice(0, -1);
  const completedLatest = completed.at(-1)!;
  const freshness = isCompletedCandleFresh(completedLatest.closeTime);
  if (!freshness.fresh) throw new MonitorDataStaleError(freshness.ageMinutes);
  const closes = completed.map((candle) => candle.close);
  const currentPrice = closes.at(-1)!;
  const ema12 = ema(closes.slice(-60), 12);
  const ema26 = ema(closes.slice(-60), 26);
  const macdHistory = closes.slice(-35).map((_, index, series) => {
    const source = closes.slice(-(35 - index));
    return ema(source, 12) - ema(source, 26);
  });
  const macdValue = ema12 - ema26;
  const macdSignal = ema(macdHistory, 9);
  const signal = TradingSignalService.generateSignal(symbol, currentPrice, {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    rsi: rsi(closes),
    macdValue,
    macdSignal,
    ema12,
    ema26,
  });

  return {
    asOfDate: new Date(executionCandle.openTime),
    candleAgeMinutes: freshness.ageMinutes,
    evaluation: {
      symbol,
      executionPriceCents: toCents(executionCandle.open),
      signal: signal.signal,
      confidence: signal.confidence,
    },
  };
}

function summarizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").slice(0, 500);
}

async function persistMonitorAlert(
  monitor: PaperTradingMonitor,
  kind: "degraded" | "data_stale" | "run_error",
  message: string,
  shouldAttempt: boolean,
  title: string
) {
  const db = await getDb();
  if (!db) return false;
  if (!shouldAttempt) {
    await db.insert(paperTradingMonitorAlerts).values({
      monitorId: monitor.id,
      alertKind: kind,
      deliveryStatus: "suppressed",
      message: `Suppressed by alert policy: ${message}`.slice(0, 500),
    });
    return false;
  }
  const ownerNotificationSent = await notifyOwner({ title, content: message });
  await db.insert(paperTradingMonitorAlerts).values({
    monitorId: monitor.id,
    alertKind: kind,
    deliveryStatus: ownerNotificationSent ? "sent" : "failed",
    message: message.slice(0, 500),
  });
  if (ownerNotificationSent) {
    await db.update(paperTradingMonitors).set({ lastAlertAt: new Date(), lastAlertKind: kind }).where(eq(paperTradingMonitors.id, monitor.id));
  }
  return ownerNotificationSent;
}

export async function recordPaperTradingMonitorFailure(monitorId: number, error: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  const asOfDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const summary = summarizeError(error);
  const stale = error instanceof MonitorDataStaleError;
  const flags = stale ? ["stale_completed_candle"] : ["daily_run_error"];

  await db.insert(paperTradingMonitorRuns).values({
    monitorId,
    asOfDate,
    status: "error",
    dataFreshness: stale ? "stale" : null,
    candleAgeMinutes: stale ? error.ageMinutes : null,
    diagnosticFlags: flags,
    errorSummary: summary,
  }).onDuplicateKeyUpdate({
    set: {
      status: "error",
      dataFreshness: stale ? "stale" : null,
      candleAgeMinutes: stale ? error.ageMinutes : null,
      diagnosticFlags: flags,
      errorSummary: summary,
    },
  });
  const monitor = (await db.select().from(paperTradingMonitors).where(eq(paperTradingMonitors.id, monitorId)).limit(1))[0];
  if (!monitor) return { errorSummary: summary, ownerNotificationSent: false };

  await db.update(paperTradingMonitors).set({ lastStatus: "error", lastRunAt: now }).where(eq(paperTradingMonitors.id, monitorId));
  const kind = stale ? "data_stale" : "run_error";
  const shouldNotify = shouldSendMonitorAlert(monitor.lastAlertKind, monitor.lastAlertAt, kind, now);
  const message = stale
    ? `The research-only monitor did not execute because the latest completed daily candle is ${error.ageMinutes} minutes old. No virtual or real order was sent.`
    : `The research-only monitor daily run failed: ${summary}. No virtual or real order was sent.`;
  const ownerNotificationSent = await persistMonitorAlert(monitor, kind, message, shouldNotify, `Paper monitor issue: ${monitor.name}`);
  return { errorSummary: summary, ownerNotificationSent };
}

function calculateBuyAllocation(cashCents: number, count: number) {
  return count > 0 ? Math.floor(cashCents / count) : 0;
}

export async function runPaperTradingMonitor(monitorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const monitor = (await db.select().from(paperTradingMonitors).where(eq(paperTradingMonitors.id, monitorId)).limit(1))[0];
  if (!monitor) throw new Error("Monitor not found");
  if (monitor.archivedAt) return { status: "skipped" as const, reason: "monitor_archived" };
  if (!monitor.enabled) return { status: "skipped" as const, reason: "monitor_disabled" };

  const symbols = monitor.symbols ?? [];
  if (symbols.length === 0) throw new Error("Monitor has no symbols");
  const evaluationsWithDate = await Promise.all(symbols.map(evaluateSymbol));
  const asOfDate = evaluationsWithDate[0]?.asOfDate;
  if (!asOfDate || evaluationsWithDate.some((item) => item.asOfDate.getTime() !== asOfDate.getTime())) {
    throw new Error("Daily candle timestamps are inconsistent across monitored symbols");
  }

  const existingRun = (await db.select().from(paperTradingMonitorRuns).where(and(eq(paperTradingMonitorRuns.monitorId, monitor.id), eq(paperTradingMonitorRuns.asOfDate, asOfDate))).limit(1))[0];
  if (existingRun) return { status: "skipped" as const, reason: "already_processed", asOfDate };

  const evaluations = evaluationsWithDate.map((item) => item.evaluation);
  const candleAgeMinutes = Math.max(...evaluationsWithDate.map((item) => item.candleAgeMinutes));
  const priceBySymbol = Object.fromEntries(evaluations.map((item) => [item.symbol, item.executionPriceCents]));
  const openTrades = await db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitor.id), eq(paperTradingMonitorTrades.status, "open")));
  let cashCents = monitor.cashCents;
  const feeRate = monitor.feeBps / 10_000;

  for (const trade of openTrades) {
    const evaluation = evaluations.find((item) => item.symbol === trade.symbol);
    if (!evaluation || evaluation.signal !== "SELL") continue;
    const grossProceeds = (trade.quantityE8 / QUANTITY_SCALE) * evaluation.executionPriceCents;
    const exitFeeCents = clampInt(grossProceeds * feeRate);
    const proceedsCents = clampInt(grossProceeds - exitFeeCents);
    const pnlCents = proceedsCents - trade.entryCapitalCents;
    cashCents += proceedsCents;
    await db.update(paperTradingMonitorTrades).set({
      exitPriceCents: evaluation.executionPriceCents,
      exitFeeCents,
      pnlCents,
      pnlBps: Math.round((pnlCents / trade.entryCapitalCents) * 10_000),
      status: "closed",
      closedAt: asOfDate,
      closeReason: "technical_composite_sell",
    }).where(eq(paperTradingMonitorTrades.id, trade.id));
  }

  const refreshedOpenTrades = await db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitor.id), eq(paperTradingMonitorTrades.status, "open")));
  const openSymbols = new Set(refreshedOpenTrades.map((trade) => trade.symbol));
  const buyCandidates = evaluations.filter((evaluation) => evaluation.signal === "BUY" && evaluation.confidence >= 75 && !openSymbols.has(evaluation.symbol));
  const allocationCents = calculateBuyAllocation(cashCents, buyCandidates.length);

  for (const evaluation of buyCandidates) {
    const entryFeeCents = clampInt(allocationCents * feeRate);
    const notionalCents = allocationCents - entryFeeCents;
    const quantityE8 = clampInt((notionalCents / evaluation.executionPriceCents) * QUANTITY_SCALE);
    if (allocationCents <= entryFeeCents || quantityE8 <= 0) continue;
    await db.insert(paperTradingMonitorTrades).values({
      monitorId: monitor.id,
      symbol: evaluation.symbol,
      entryPriceCents: evaluation.executionPriceCents,
      entryCapitalCents: allocationCents,
      quantityE8,
      entryFeeCents,
      status: "open",
      openedAt: asOfDate,
    });
    cashCents -= allocationCents;
  }

  const finalOpenTrades = await db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitor.id), eq(paperTradingMonitorTrades.status, "open")));
  const openPositionCents = clampInt(finalOpenTrades.reduce((sum, trade) => sum + ((trade.quantityE8 / QUANTITY_SCALE) * (priceBySymbol[trade.symbol] ?? trade.entryPriceCents)), 0));
  const equityCents = clampInt(cashCents + openPositionCents);
  const equityInvariantDeltaCents = cashCents + openPositionCents - equityCents;
  const diagnosticFlags = equityInvariantDeltaCents === 0 ? [] : ["equity_invariant_delta"];
  const baselinePrices = monitor.baselinePrices ?? Object.fromEntries(evaluations.map((item) => [item.symbol, item.executionPriceCents]));
  const capitalPerSymbol = monitor.initialCapitalCents / symbols.length;
  const benchmarkEquityCents = clampInt(symbols.reduce((sum, symbol) => sum + (capitalPerSymbol / (baselinePrices[symbol] ?? priceBySymbol[symbol])) * priceBySymbol[symbol], 0));
  const modelReturnBps = Math.round(((equityCents / monitor.initialCapitalCents) - 1) * 10_000);
  const benchmarkReturnBps = Math.round(((benchmarkEquityCents / monitor.initialCapitalCents) - 1) * 10_000);
  const rollingStart = new Date(asOfDate.getTime() - monitor.rollingWindowDays * 86_400_000);
  const closedTrades = await db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitor.id), eq(paperTradingMonitorTrades.status, "closed"), gte(paperTradingMonitorTrades.closedAt, rollingStart)));
  const priorRuns = await db.select().from(paperTradingMonitorRuns).where(and(eq(paperTradingMonitorRuns.monitorId, monitor.id), gte(paperTradingMonitorRuns.asOfDate, rollingStart))).orderBy(asc(paperTradingMonitorRuns.asOfDate));
  const rollingMetrics = calculateRollingMetrics(closedTrades, [...priorRuns.map((run) => run.equityCents ?? monitor.initialCapitalCents), equityCents]);
  const status = classifyMonitorStatus(rollingMetrics, modelReturnBps, benchmarkReturnBps, monitor);
  const shouldNotifyOwner = shouldNotifyDegradedTransition(monitor.lastStatus, status);

  await db.insert(paperTradingMonitorRuns).values({
    monitorId: monitor.id,
    asOfDate,
    status,
    equityCents,
    benchmarkEquityCents,
    modelReturnBps,
    benchmarkReturnBps,
    rollingProfitFactorMilli: rollingMetrics.profitFactorMilli,
    rollingWinRateBps: rollingMetrics.winRateBps,
    rollingMaxDrawdownBps: rollingMetrics.maxDrawdownBps,
    rollingTrades: rollingMetrics.trades,
    dataFreshness: "fresh",
    candleAgeMinutes,
    equityInvariantDeltaCents,
    diagnosticFlags,
  });
  await db.update(paperTradingMonitors).set({
    cashCents,
    baselinePrices,
    lastRunAt: new Date(),
    lastStatus: status,
  }).where(eq(paperTradingMonitors.id, monitor.id));

  const ownerNotificationSent = await persistMonitorAlert(
    monitor,
    "degraded",
    [
      "The research-only virtual monitor transitioned to degraded status.",
      `Rolling trades: ${rollingMetrics.trades}.`,
      `Rolling profit factor: ${rollingMetrics.profitFactorMilli === null ? "not yet defined" : (rollingMetrics.profitFactorMilli / 1_000).toFixed(2)}.`,
      `Model return: ${(modelReturnBps / 100).toFixed(2)}%; benchmark return: ${(benchmarkReturnBps / 100).toFixed(2)}%.`,
      "No real orders were sent. Review the research signal before taking any action.",
    ].join(" "),
    shouldNotifyOwner,
    `Paper monitor degraded: ${monitor.name}`
  );

  return { status, asOfDate, equityCents, benchmarkEquityCents, modelReturnBps, benchmarkReturnBps, rollingMetrics, candleAgeMinutes, equityInvariantDeltaCents, diagnosticFlags, ownerNotificationSent };
}

export async function getMonitorDashboard(userId: number, monitorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const monitor = (await db.select().from(paperTradingMonitors).where(and(eq(paperTradingMonitors.id, monitorId), eq(paperTradingMonitors.userId, userId))).limit(1))[0];
  if (!monitor) throw new Error("Monitor not found");
  const [runs, openTrades, recentTrades, alerts] = await Promise.all([
    db.select().from(paperTradingMonitorRuns).where(eq(paperTradingMonitorRuns.monitorId, monitorId)).orderBy(desc(paperTradingMonitorRuns.asOfDate)).limit(90),
    db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitorId), eq(paperTradingMonitorTrades.status, "open"))),
    db.select().from(paperTradingMonitorTrades).where(eq(paperTradingMonitorTrades.monitorId, monitorId)).orderBy(desc(paperTradingMonitorTrades.createdAt)).limit(50),
    db.select().from(paperTradingMonitorAlerts).where(eq(paperTradingMonitorAlerts.monitorId, monitorId)).orderBy(desc(paperTradingMonitorAlerts.createdAt)).limit(20),
  ]);
  const configuration = validateMonitorConfiguration(monitor);
  const weeklyRuns = runs.filter((run) => run.asOfDate.getTime() >= Date.now() - 7 * 86_400_000);
  const weeklyDigest = {
    runs: weeklyRuns.length,
    latestStatus: runs[0]?.status ?? "idle",
    latestModelReturnBps: runs[0]?.modelReturnBps ?? null,
    latestBenchmarkReturnBps: runs[0]?.benchmarkReturnBps ?? null,
    latestProfitFactorMilli: runs[0]?.rollingProfitFactorMilli ?? null,
    alerts: alerts.filter((alert) => alert.createdAt.getTime() >= Date.now() - 7 * 86_400_000).length,
  };
  const reportIntegrity = validateMonitorReportIntegrity({
    weeklyRuns: weeklyDigest.runs,
    availableRuns: runs.length,
    weeklyAlerts: weeklyDigest.alerts,
    latestProfitFactorMilli: weeklyDigest.latestProfitFactorMilli,
    latestTrades: runs[0]?.rollingTrades ?? null,
  });
  const historyQuality = validateMonitorRunHistory(runs);
  const runCadence = diagnoseMonitorRunCadence(runs, monitor.enabled);
  const alertSummary = summarizeMonitorAlerts(alerts);
  return { monitor, runs, openTrades, recentTrades, alerts, configuration, weeklyDigest, reportIntegrity, historyQuality, runCadence, alertSummary };
}

export async function getMonitorPeriodComparison(userId: number, monitorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const monitor = (await db.select().from(paperTradingMonitors).where(and(eq(paperTradingMonitors.id, monitorId), eq(paperTradingMonitors.userId, userId))).limit(1))[0];
  if (!monitor) throw new Error("Monitor not found");
  const runs = await db.select().from(paperTradingMonitorRuns).where(eq(paperTradingMonitorRuns.monitorId, monitorId)).orderBy(desc(paperTradingMonitorRuns.asOfDate)).limit(366);
  return {
    monitorId,
    periods: calculateMonitorPeriodComparisons(runs),
    milestones: buildMonitorHistoricalMilestones(runs),
    drift: calculateMonitorBenchmarkDrift(runs),
  };
}
