import { runRegimeMomentumStrategy } from "./regime-momentum-research.mjs";

const DAY_MS = 86_400_000;
const START_DATE = "2024-08-12";
const PARAMETERS = {
  signalType: "momentum",
  fastPeriod: null,
  slowPeriod: null,
  trendPeriod: 100,
  rsiMinimum: 60,
  momentumLookback: 10,
  momentumThreshold: 0.15,
  stopLossPct: 0.05,
  takeProfitPct: null,
};

function toTimestamp(date) {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function toDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

async function fetchDailyKlines(symbol, startTime, endTime) {
  const candles = [];
  let cursor = startTime;
  while (cursor < endTime) {
    const url = new URL("https://api.binance.com/api/v3/klines");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", "1d");
    url.searchParams.set("startTime", String(cursor));
    url.searchParams.set("endTime", String(endTime - 1));
    url.searchParams.set("limit", "1000");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${symbol} klines request failed: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    candles.push(...rows.map((row) => ({ openTime: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })));
    cursor = candles[candles.length - 1].openTime + DAY_MS;
  }
  return candles;
}

async function main() {
  const todayUtc = new Date();
  const endExclusive = Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate());
  const endDate = toDate(endExclusive - DAY_MS);
  const period = { start: START_DATE, end: endDate };
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  const historyStart = toTimestamp(START_DATE) - 230 * DAY_MS;
  const results = await Promise.all(symbols.map(async (symbol) => {
    const candles = await fetchDailyKlines(symbol, historyStart, endExclusive);
    return { symbol, ...runRegimeMomentumStrategy(candles, period.start, period.end, PARAMETERS) };
  }));
  const grossProfit = results.reduce((sum, result) => sum + result.metrics.grossProfit, 0);
  const grossLoss = results.reduce((sum, result) => sum + result.metrics.grossLoss, 0);
  const completedTrades = results.reduce((sum, result) => sum + result.metrics.completedTrades, 0);
  const aggregateProfitFactor = grossLoss === 0 ? null : grossProfit / grossLoss;
  const positiveReturnAssets = results.filter((result) => result.metrics.totalReturn > 0).length;
  const targetMet = aggregateProfitFactor !== null && aggregateProfitFactor >= 1.5 && completedTrades >= 12 && positiveReturnAssets >= 2;
  const metrics = (result) => Object.fromEntries(Object.entries(result.metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]));

  console.log(JSON.stringify({
    source: "Binance Spot /api/v3/klines",
    protocol: "Parameters were selected before the evaluation window and are not altered in this run. The evaluation begins after a two-day separation from the prior historical validation end date of 2024-08-10.",
    period,
    completedDailyBars: Math.round((toTimestamp(endDate) - toTimestamp(START_DATE)) / DAY_MS) + 1,
    execution: "Entries and signal exits use the next daily open from indicators calculated only from preceding completed daily closes. Stop-loss takes precedence over take-profit when both thresholds are reached intraday.",
    assumptions: { feeRatePerSide: 0.001, slippageBeyondFee: "not modelled", equalInitialCapitalPerAsset: 100000, minimumAggregateTrades: 12, minimumPositiveReturnAssets: 2 },
    parameters: PARAMETERS,
    results: results.map((result) => ({ symbol: result.symbol, metrics: metrics(result), trades: result.trades.map((trade) => ({ ...trade, pnl: round(trade.pnl), pnlPercent: round(trade.pnlPercent) })) })),
    aggregate: { completedTrades, grossProfit: round(grossProfit), grossLoss: round(grossLoss), profitFactor: aggregateProfitFactor === null ? null : round(aggregateProfitFactor), positiveReturnAssets, targetMet },
  }, null, 2));
}

await main();
