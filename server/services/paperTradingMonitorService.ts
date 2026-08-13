import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import {
  paperTradingMonitorRuns,
  paperTradingMonitors,
  paperTradingMonitorTrades,
  type PaperTradingMonitor,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import TradingSignalService from "./tradingSignalService";

const DAILY_INTERVAL = "1d";
const LOOKBACK_BARS = 260;
const QUANTITY_SCALE = 100_000_000;

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
  benchmarkReturnBps: number
): "healthy" | "watch" | "degraded" {
  const relativeReturnBps = modelReturnBps - benchmarkReturnBps;
  if (metrics.trades >= 5 && ((metrics.profitFactorMilli !== null && metrics.profitFactorMilli < 1_000) || relativeReturnBps <= -500)) {
    return "degraded";
  }
  if (metrics.trades < 5 || metrics.profitFactorMilli === null || metrics.profitFactorMilli < 1_500 || relativeReturnBps < 0) {
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

async function evaluateSymbol(symbol: string): Promise<{ asOfDate: Date; evaluation: SymbolEvaluation }> {
  const candles = await fetchDailyCandles(symbol);
  if (candles.length < 52) throw new Error(`${symbol} has insufficient daily history`);
  const executionCandle = candles.at(-1)!;
  const completed = candles.slice(0, -1);
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
    evaluation: {
      symbol,
      executionPriceCents: toCents(executionCandle.open),
      signal: signal.signal,
      confidence: signal.confidence,
    },
  };
}

function calculateBuyAllocation(cashCents: number, count: number) {
  return count > 0 ? Math.floor(cashCents / count) : 0;
}

export async function runPaperTradingMonitor(monitorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const monitor = (await db.select().from(paperTradingMonitors).where(eq(paperTradingMonitors.id, monitorId)).limit(1))[0];
  if (!monitor) throw new Error("Monitor not found");
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
  const openPositionValue = finalOpenTrades.reduce((sum, trade) => sum + ((trade.quantityE8 / QUANTITY_SCALE) * (priceBySymbol[trade.symbol] ?? trade.entryPriceCents)), 0);
  const equityCents = clampInt(cashCents + openPositionValue);
  const baselinePrices = monitor.baselinePrices ?? Object.fromEntries(evaluations.map((item) => [item.symbol, item.executionPriceCents]));
  const capitalPerSymbol = monitor.initialCapitalCents / symbols.length;
  const benchmarkEquityCents = clampInt(symbols.reduce((sum, symbol) => sum + (capitalPerSymbol / (baselinePrices[symbol] ?? priceBySymbol[symbol])) * priceBySymbol[symbol], 0));
  const modelReturnBps = Math.round(((equityCents / monitor.initialCapitalCents) - 1) * 10_000);
  const benchmarkReturnBps = Math.round(((benchmarkEquityCents / monitor.initialCapitalCents) - 1) * 10_000);
  const rollingStart = new Date(asOfDate.getTime() - monitor.rollingWindowDays * 86_400_000);
  const closedTrades = await db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitor.id), eq(paperTradingMonitorTrades.status, "closed"), gte(paperTradingMonitorTrades.closedAt, rollingStart)));
  const priorRuns = await db.select().from(paperTradingMonitorRuns).where(and(eq(paperTradingMonitorRuns.monitorId, monitor.id), gte(paperTradingMonitorRuns.asOfDate, rollingStart))).orderBy(asc(paperTradingMonitorRuns.asOfDate));
  const rollingMetrics = calculateRollingMetrics(closedTrades, [...priorRuns.map((run) => run.equityCents ?? monitor.initialCapitalCents), equityCents]);
  const status = classifyMonitorStatus(rollingMetrics, modelReturnBps, benchmarkReturnBps);
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
  });
  await db.update(paperTradingMonitors).set({
    cashCents,
    baselinePrices,
    lastRunAt: new Date(),
    lastStatus: status,
  }).where(eq(paperTradingMonitors.id, monitor.id));

  const ownerNotificationSent = shouldNotifyOwner
    ? await notifyOwner({
        title: `Paper monitor degraded: ${monitor.name}`,
        content: [
          "The research-only virtual monitor transitioned to degraded status.",
          `Rolling trades: ${rollingMetrics.trades}.`,
          `Rolling profit factor: ${rollingMetrics.profitFactorMilli === null ? "not yet defined" : (rollingMetrics.profitFactorMilli / 1_000).toFixed(2)}.`,
          `Model return: ${(modelReturnBps / 100).toFixed(2)}%; benchmark return: ${(benchmarkReturnBps / 100).toFixed(2)}%.`,
          "No real orders were sent. Review the research signal before taking any action.",
        ].join(" "),
      })
    : false;

  return { status, asOfDate, equityCents, benchmarkEquityCents, modelReturnBps, benchmarkReturnBps, rollingMetrics, ownerNotificationSent };
}

export async function getMonitorDashboard(userId: number, monitorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const monitor = (await db.select().from(paperTradingMonitors).where(and(eq(paperTradingMonitors.id, monitorId), eq(paperTradingMonitors.userId, userId))).limit(1))[0];
  if (!monitor) throw new Error("Monitor not found");
  const [runs, openTrades, recentTrades] = await Promise.all([
    db.select().from(paperTradingMonitorRuns).where(eq(paperTradingMonitorRuns.monitorId, monitorId)).orderBy(desc(paperTradingMonitorRuns.asOfDate)).limit(90),
    db.select().from(paperTradingMonitorTrades).where(and(eq(paperTradingMonitorTrades.monitorId, monitorId), eq(paperTradingMonitorTrades.status, "open"))),
    db.select().from(paperTradingMonitorTrades).where(eq(paperTradingMonitorTrades.monitorId, monitorId)).orderBy(desc(paperTradingMonitorTrades.createdAt)).limit(50),
  ]);
  return { monitor, runs, openTrades, recentTrades };
}
