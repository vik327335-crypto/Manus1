const DAY_MS = 86_400_000;
const INITIAL_CAPITAL = 100_000;
const FEE_RATE = 0.001;
const MIN_PRETEST_TRADES = 10;
const MIN_HELDOUT_TRADES = 3;

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toTimestamp(date) {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function toDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

export function calculateRsi(candles, index, period) {
  const closes = candles.slice(index - period - 1, index).map((candle) => candle.close);
  let gains = 0;
  let losses = 0;
  for (let closeIndex = 1; closeIndex < closes.length; closeIndex += 1) {
    const change = closes[closeIndex] - closes[closeIndex - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const relativeStrength = (gains / period) / (losses / period);
  return 100 - 100 / (1 + relativeStrength);
}

export function runRegimeMomentumStrategy(candles, evaluationStart, evaluationEnd, parameters) {
  const { signalType, fastPeriod, slowPeriod, trendPeriod, rsiMinimum, momentumLookback, momentumThreshold, stopLossPct, takeProfitPct } = parameters;
  const startTimestamp = toTimestamp(evaluationStart);
  const endTimestamp = toTimestamp(evaluationEnd);
  const requiredHistory = Math.max(slowPeriod ?? 0, trendPeriod + 20, 15, (momentumLookback ?? 0) + 2) + 2;
  let cash = INITIAL_CAPITAL;
  let quantity = 0;
  let entry = null;
  let maxDrawdown = 0;
  let highWatermark = INITIAL_CAPITAL;
  const trades = [];

  for (let index = requiredHistory; index < candles.length; index += 1) {
    const current = candles[index];
    if (current.openTime < startTimestamp || current.openTime > endTimestamp) continue;

    const previousClose = candles[index - 1].close;
    const trendSma = average(candles.slice(index - trendPeriod, index).map((candle) => candle.close));
    const priorTrendSma = average(candles.slice(index - trendPeriod - 20, index - 20).map((candle) => candle.close));
    const regimePasses = previousClose > trendSma && trendSma > priorTrendSma;
    const rsi = calculateRsi(candles, index, 14);
    const momentum = momentumLookback ? previousClose / candles[index - 1 - momentumLookback].close - 1 : null;
    const priorMomentum = momentumLookback ? candles[index - 2].close / candles[index - 2 - momentumLookback].close - 1 : null;

    const fast = fastPeriod ? average(candles.slice(index - fastPeriod, index).map((candle) => candle.close)) : null;
    const slow = slowPeriod ? average(candles.slice(index - slowPeriod, index).map((candle) => candle.close)) : null;
    const previousFast = fastPeriod ? average(candles.slice(index - fastPeriod - 1, index - 1).map((candle) => candle.close)) : null;
    const previousSlow = slowPeriod ? average(candles.slice(index - slowPeriod - 1, index - 1).map((candle) => candle.close)) : null;
    const goldenCross = fast !== null && slow !== null && previousFast <= previousSlow && fast > slow;
    const deathCross = fast !== null && slow !== null && previousFast >= previousSlow && fast < slow;
    const momentumCross = momentum !== null && priorMomentum !== null && priorMomentum < momentumThreshold && momentum >= momentumThreshold;

    if (quantity > 0 && entry) {
      const stopPrice = entry.rawEntryPrice * (1 - stopLossPct);
      const takeProfitPrice = takeProfitPct ? entry.rawEntryPrice * (1 + takeProfitPct) : null;
      const stoppedOut = current.low <= stopPrice;
      const tookProfit = !stoppedOut && takeProfitPrice !== null && current.high >= takeProfitPrice;
      const signalExit = signalType === "sma_cross" ? deathCross || !regimePasses : (momentum !== null && momentum < 0) || !regimePasses;

      if (stoppedOut || tookProfit || signalExit) {
        const rawExitPrice = stoppedOut
          ? Math.min(current.open, stopPrice)
          : tookProfit
            ? Math.max(current.open, takeProfitPrice)
            : current.open;
        const proceeds = quantity * rawExitPrice * (1 - FEE_RATE);
        const pnl = proceeds - entry.capital;
        trades.push({
          entryDate: entry.date,
          exitDate: toDate(current.openTime),
          pnl,
          pnlPercent: (pnl / entry.capital) * 100,
          exitReason: stoppedOut ? "stop_loss" : tookProfit ? "take_profit" : signalType === "sma_cross" ? "sma_or_regime_exit" : "momentum_or_regime_exit",
        });
        cash = proceeds;
        quantity = 0;
        entry = null;
      }
    }

    const entrySignal = signalType === "sma_cross" ? goldenCross : momentumCross;
    if (quantity === 0 && entrySignal && regimePasses && rsi >= rsiMinimum) {
      const rawEntryPrice = current.open;
      quantity = cash / (rawEntryPrice * (1 + FEE_RATE));
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
    trades.push({ entryDate: entry.date, exitDate: toDate(finalCandle.openTime), pnl, pnlPercent: (pnl / entry.capital) * 100, exitReason: "end_of_period" });
    cash = proceeds;
  }

  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
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
      profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
      totalReturn: cash / INITIAL_CAPITAL - 1,
      maxDrawdown,
    },
  };
}

export function aggregateMetrics(results) {
  const grossProfit = results.reduce((sum, result) => sum + result.metrics.grossProfit, 0);
  const grossLoss = results.reduce((sum, result) => sum + result.metrics.grossLoss, 0);
  return {
    completedTrades: results.reduce((sum, result) => sum + result.metrics.completedTrades, 0),
    positiveFolds: results.filter((result) => result.metrics.totalReturn > 0).length,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    totalReturn: results.reduce((sum, result) => sum + result.metrics.totalReturn, 0),
    maxDrawdown: Math.max(...results.map((result) => result.metrics.maxDrawdown)),
  };
}

export function chooseCandidate(results) {
  return results
    .filter((result) => result.metrics.completedTrades >= MIN_PRETEST_TRADES)
    .filter((result) => result.metrics.positiveFolds >= 2)
    .filter((result) => result.metrics.profitFactor !== null && result.metrics.totalReturn > 0)
    .sort((left, right) => right.metrics.profitFactor - left.metrics.profitFactor || right.metrics.positiveFolds - left.metrics.positiveFolds || right.metrics.completedTrades - left.metrics.completedTrades)[0] ?? null;
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

function parameterGrid() {
  const rsiMinimums = [45, 50, 55, 60];
  const trendPeriods = [100, 200];
  const stopLossPcts = [0.05, 0.08, 0.1, 0.12];
  const takeProfitPcts = [null, 0.1, 0.2, 0.3];
  const grid = [];
  for (const trendPeriod of trendPeriods) {
    for (const rsiMinimum of rsiMinimums) {
      for (const stopLossPct of stopLossPcts) {
        for (const takeProfitPct of takeProfitPcts) {
          for (const [fastPeriod, slowPeriod] of [[5, 20], [10, 30], [10, 50], [20, 50]]) {
            grid.push({ signalType: "sma_cross", fastPeriod, slowPeriod, trendPeriod, rsiMinimum, momentumLookback: null, momentumThreshold: null, stopLossPct, takeProfitPct });
          }
          for (const momentumLookback of [10, 20, 50]) {
            for (const momentumThreshold of [0, 0.03, 0.08, 0.15]) {
              grid.push({ signalType: "momentum", fastPeriod: null, slowPeriod: null, trendPeriod, rsiMinimum, momentumLookback, momentumThreshold, stopLossPct, takeProfitPct });
            }
          }
        }
      }
    }
  }
  return grid;
}

async function main() {
  const periods = {
    training: { start: "2018-08-10", end: "2019-08-09" },
    validation: { start: "2019-08-11", end: "2020-08-09" },
    selection: { start: "2020-08-11", end: "2021-08-09" },
    heldOut: { start: "2021-08-11", end: "2022-08-10" },
  };
  const historyStart = toTimestamp(periods.training.start) - 230 * DAY_MS;
  const candles = await fetchDailyKlines(historyStart, toTimestamp(periods.heldOut.end) + DAY_MS);
  const grid = parameterGrid();
  const preTestPeriods = ["training", "validation", "selection"];
  const candidateResults = grid.map((parameters) => {
    const folds = preTestPeriods.map((name) => ({ name, result: runRegimeMomentumStrategy(candles, periods[name].start, periods[name].end, parameters) }));
    return { parameters, folds, metrics: aggregateMetrics(folds.map((fold) => fold.result)) };
  });
  const candidate = chooseCandidate(candidateResults);
  if (!candidate) throw new Error("No regime/momentum candidate passed the pre-test gates");
  const heldOut = runRegimeMomentumStrategy(candles, periods.heldOut.start, periods.heldOut.end, candidate.parameters);
  const targetMet = heldOut.metrics.profitFactor !== null && heldOut.metrics.profitFactor >= 1.5 && heldOut.metrics.completedTrades >= MIN_HELDOUT_TRADES && heldOut.metrics.totalReturn > 0;
  const cleanMetrics = (metrics) => Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]));

  console.log(JSON.stringify({
    source: "Binance Spot /api/v3/klines",
    protocol: "The held-out 2021-08-11 to 2022-08-10 period was not used when selecting parameters. Each pre-test fold is separated by a one-day censor gap.",
    execution: "Every entry and signal exit uses the next daily open after indicators calculated only from prior completed daily closes. Stop-loss and take-profit orders may trigger during the current day; stop-loss takes precedence if both are reached.",
    assumptions: { feeRatePerSide: FEE_RATE, slippageBeyondFee: "not modelled", initialCapital: INITIAL_CAPITAL, minimumPreTestTrades: MIN_PRETEST_TRADES, minimumHeldOutTrades: MIN_HELDOUT_TRADES },
    periods,
    parameterCombinationsTested: grid.length,
    selectedOnPreTestFoldsOnly: { parameters: candidate.parameters, metrics: cleanMetrics(candidate.metrics), folds: candidate.folds.map((fold) => ({ name: fold.name, metrics: cleanMetrics(fold.result.metrics) })) },
    heldOut: { parameters: heldOut.parameters, metrics: cleanMetrics(heldOut.metrics), trades: heldOut.trades.map((trade) => ({ ...trade, pnl: round(trade.pnl), pnlPercent: round(trade.pnlPercent) })) },
    targetMet,
  }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
