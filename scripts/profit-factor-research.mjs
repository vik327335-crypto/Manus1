const DAY_MS = 86_400_000;
const INITIAL_CAPITAL = 100_000;
const FEE_RATE = 0.001;
const MIN_TRAIN_TRADES = 8;
const MIN_TEST_TRADES = 3;

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function utcTimestamp(date) {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function toDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

export function runSmaStrategy(candles, evaluationStart, evaluationEnd, parameters) {
  const { fastPeriod, slowPeriod, trendPeriod, stopLossPct, takeProfitPct } = parameters;
  const startTimestamp = utcTimestamp(evaluationStart);
  const endTimestamp = utcTimestamp(evaluationEnd);
  const requiredHistory = Math.max(slowPeriod, trendPeriod ?? 0) + 1;
  let cash = INITIAL_CAPITAL;
  let quantity = 0;
  let entry = null;
  let highWatermark = INITIAL_CAPITAL;
  let maxDrawdown = 0;
  const trades = [];

  for (let index = requiredHistory; index < candles.length; index += 1) {
    const current = candles[index];
    if (current.openTime < startTimestamp || current.openTime > endTimestamp) continue;

    const fast = average(candles.slice(index - fastPeriod, index).map((candle) => candle.close));
    const slow = average(candles.slice(index - slowPeriod, index).map((candle) => candle.close));
    const previousFast = average(candles.slice(index - fastPeriod - 1, index - 1).map((candle) => candle.close));
    const previousSlow = average(candles.slice(index - slowPeriod - 1, index - 1).map((candle) => candle.close));
    const goldenCross = previousFast <= previousSlow && fast > slow;
    const deathCross = previousFast >= previousSlow && fast < slow;
    const trendSma = trendPeriod ? average(candles.slice(index - trendPeriod, index).map((candle) => candle.close)) : null;
    const trendPasses = trendSma === null || candles[index - 1].close > trendSma;

    if (quantity > 0 && entry) {
      const stopPrice = stopLossPct ? entry.rawEntryPrice * (1 - stopLossPct) : null;
      const takeProfitPrice = takeProfitPct ? entry.rawEntryPrice * (1 + takeProfitPct) : null;
      const stoppedOut = stopPrice !== null && current.low <= stopPrice;
      const tookProfit = !stoppedOut && takeProfitPrice !== null && current.high >= takeProfitPrice;
      if (stoppedOut || tookProfit || deathCross) {
        const rawExitPrice = stoppedOut
          ? Math.min(current.open, stopPrice)
          : tookProfit
            ? Math.max(current.open, takeProfitPrice)
            : current.open;
        const exitPrice = rawExitPrice * (1 - FEE_RATE);
        const proceeds = quantity * exitPrice;
        const pnl = proceeds - entry.capital;
        trades.push({
          entryDate: entry.date,
          exitDate: toDate(current.openTime),
          pnl,
          pnlPercent: (pnl / entry.capital) * 100,
          exitReason: stoppedOut ? "stop_loss" : tookProfit ? "take_profit" : "death_cross",
        });
        cash = proceeds;
        quantity = 0;
        entry = null;
      }
    }

    if (quantity === 0 && goldenCross && trendPasses) {
      const rawEntryPrice = current.open;
      const entryPrice = rawEntryPrice * (1 + FEE_RATE);
      quantity = cash / entryPrice;
      entry = { date: toDate(current.openTime), rawEntryPrice, capital: cash };
      cash = 0;
    }

    const markToMarket = quantity > 0 ? quantity * current.close * (1 - FEE_RATE) : cash;
    highWatermark = Math.max(highWatermark, markToMarket);
    maxDrawdown = Math.max(maxDrawdown, 1 - markToMarket / highWatermark);
  }

  const finalCandle = candles.findLast((candle) => candle.openTime <= endTimestamp);
  if (quantity > 0 && entry && finalCandle) {
    const proceeds = quantity * finalCandle.close * (1 - FEE_RATE);
    const pnl = proceeds - entry.capital;
    trades.push({
      entryDate: entry.date,
      exitDate: toDate(finalCandle.openTime),
      pnl,
      pnlPercent: (pnl / entry.capital) * 100,
      exitReason: "end_of_period",
    });
    cash = proceeds;
  }

  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
  const profitFactor = grossLoss === 0 ? null : grossProfit / grossLoss;

  return {
    parameters,
    period: { start: evaluationStart, end: evaluationEnd },
    trades,
    metrics: {
      completedTrades: trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: trades.length === 0 ? null : wins.length / trades.length,
      grossProfit,
      grossLoss,
      profitFactor,
      totalReturn: cash / INITIAL_CAPITAL - 1,
      maxDrawdown,
    },
  };
}

export function aggregateFoldMetrics(foldResults) {
  const grossProfit = foldResults.reduce((sum, result) => sum + result.metrics.grossProfit, 0);
  const grossLoss = foldResults.reduce((sum, result) => sum + result.metrics.grossLoss, 0);
  return {
    completedTrades: foldResults.reduce((sum, result) => sum + result.metrics.completedTrades, 0),
    positiveFolds: foldResults.filter((result) => result.metrics.totalReturn > 0).length,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    totalReturn: foldResults.reduce((sum, result) => sum + result.metrics.totalReturn, 0),
    maxDrawdown: Math.max(...foldResults.map((result) => result.metrics.maxDrawdown)),
  };
}

export function selectCandidate(candidateResults) {
  return candidateResults
    .filter((result) => result.metrics.completedTrades >= MIN_TRAIN_TRADES)
    .filter((result) => result.metrics.positiveFolds >= 2)
    .filter((result) => result.metrics.profitFactor !== null)
    .filter((result) => result.metrics.totalReturn > 0)
    .sort((left, right) => {
      const profitFactorDifference = right.metrics.profitFactor - left.metrics.profitFactor;
      if (profitFactorDifference !== 0) return profitFactorDifference;
      const positiveFoldDifference = right.metrics.positiveFolds - left.metrics.positiveFolds;
      if (positiveFoldDifference !== 0) return positiveFoldDifference;
      return right.metrics.completedTrades - left.metrics.completedTrades;
    })[0] ?? null;
}

async function fetchDailyKlines(startTime, endTime) {
  const candles = [];
  let cursor = startTime;

  while (cursor < endTime) {
    const url = new URL("https://api.binance.com/api/v3/klines");
    url.searchParams.set("symbol", "BTCUSDT");
    url.searchParams.set("interval", "1d");
    url.searchParams.set("startTime", String(cursor));
    url.searchParams.set("endTime", String(endTime - 1));
    url.searchParams.set("limit", "1000");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Binance klines request failed: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    candles.push(...rows.map((row) => ({ openTime: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })));
    cursor = candles[candles.length - 1].openTime + DAY_MS;
  }

  return candles;
}

function makeParameterGrid() {
  const fastPeriods = [5, 10, 15, 20];
  const slowPeriods = [20, 30, 50, 75, 100];
  const trendPeriods = [null, 50, 100, 200];
  const stopLossPcts = [null, 0.05, 0.08, 0.1];
  const takeProfitPcts = [null, 0.1, 0.15, 0.2, 0.3];
  const grid = [];
  for (const fastPeriod of fastPeriods) {
    for (const slowPeriod of slowPeriods) {
      if (fastPeriod >= slowPeriod) continue;
      for (const trendPeriod of trendPeriods) {
        for (const stopLossPct of stopLossPcts) {
          for (const takeProfitPct of takeProfitPcts) {
            grid.push({ fastPeriod, slowPeriod, trendPeriod, stopLossPct, takeProfitPct });
          }
        }
      }
    }
  }
  return grid;
}

async function main() {
  const testEnd = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) - DAY_MS);
  const testEndDate = toDate(testEnd.getTime());
  const testStartDate = toDate(testEnd.getTime() - 364 * DAY_MS);
  const selectionEndDate = toDate(utcTimestamp(testStartDate) - 2 * DAY_MS);
  const selectionStartDate = toDate(utcTimestamp(selectionEndDate) - 364 * DAY_MS);
  const validationEndDate = toDate(utcTimestamp(selectionStartDate) - 2 * DAY_MS);
  const validationStartDate = toDate(utcTimestamp(validationEndDate) - 364 * DAY_MS);
  const trainingEndDate = toDate(utcTimestamp(validationStartDate) - 2 * DAY_MS);
  const trainingStartDate = toDate(utcTimestamp(trainingEndDate) - 364 * DAY_MS);
  const preTestFolds = [
    { name: "training", start: trainingStartDate, end: trainingEndDate },
    { name: "validation", start: validationStartDate, end: validationEndDate },
    { name: "selection", start: selectionStartDate, end: selectionEndDate },
  ];
  const historyStart = utcTimestamp(trainingStartDate) - 220 * DAY_MS;
  const candles = await fetchDailyKlines(historyStart, testEnd.getTime() + DAY_MS);
  const grid = makeParameterGrid();
  const candidateResults = grid.map((parameters) => {
    const folds = preTestFolds.map((period) => ({ name: period.name, result: runSmaStrategy(candles, period.start, period.end, parameters) }));
    return { parameters, folds, metrics: aggregateFoldMetrics(folds.map((fold) => fold.result)) };
  });
  const candidate = selectCandidate(candidateResults);
  if (!candidate) throw new Error("No training-period candidate met the minimum quality gate");
  const outOfSample = runSmaStrategy(candles, testStartDate, testEndDate, candidate.parameters);
  const targetMet = outOfSample.metrics.profitFactor !== null
    && outOfSample.metrics.profitFactor >= 1.5
    && outOfSample.metrics.completedTrades >= MIN_TEST_TRADES
    && outOfSample.metrics.totalReturn > 0;

  console.log(JSON.stringify({
    source: "Binance Spot /api/v3/klines",
    execution: "Signals use only completed daily closes before the executable daily open. A live stop-loss or take-profit order may trigger during the current day; when both thresholds are reachable, the stop-loss is used first as the conservative assumption. Gap-through stops exit at the opening price.",
    assumptions: { feeRatePerSide: FEE_RATE, slippageBeyondFee: "not modelled", initialCapital: INITIAL_CAPITAL, minimumTrainingTrades: MIN_TRAIN_TRADES, minimumOutOfSampleTrades: MIN_TEST_TRADES },
    periods: { preTestFolds, censorGaps: [toDate(utcTimestamp(trainingEndDate) + DAY_MS), toDate(utcTimestamp(validationEndDate) + DAY_MS), toDate(utcTimestamp(selectionEndDate) + DAY_MS)], outOfSample: { start: testStartDate, end: testEndDate } },
    parameterCombinationsTested: grid.length,
    selectedOnPreTestFoldsOnly: {
      parameters: candidate.parameters,
      metrics: Object.fromEntries(Object.entries(candidate.metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
      folds: candidate.folds.map((fold) => ({ name: fold.name, metrics: Object.fromEntries(Object.entries(fold.result.metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])) })),
    },
    outOfSample: {
      parameters: outOfSample.parameters,
      metrics: Object.fromEntries(Object.entries(outOfSample.metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
      trades: outOfSample.trades.map((trade) => ({ ...trade, pnl: round(trade.pnl), pnlPercent: round(trade.pnlPercent) })),
    },
    targetMet,
  }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
