const DAY_MS = 86_400_000;
const FAST_PERIOD = 10;
const SLOW_PERIOD = 20;
const FEE_RATE = 0.001;
const INITIAL_CAPITAL = 100_000;

function utcMidnight(timestamp) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function fetchDailyKlines() {
  const endExclusive = utcMidnight(Date.now());
  const startInclusive = endExclusive - 430 * DAY_MS;
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", "BTCUSDT");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("startTime", String(startInclusive));
  url.searchParams.set("endTime", String(endExclusive - 1));
  url.searchParams.set("limit", "1000");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Binance klines request failed: ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length < SLOW_PERIOD + 3) throw new Error("Insufficient daily kline data returned");

  return rows.map((row) => ({
    openTime: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  }));
}

export function runBacktest(candles) {
  const evaluationStart = candles[candles.length - 365].openTime;
  let cash = INITIAL_CAPITAL;
  let quantity = 0;
  let entry = null;
  const trades = [];

  for (let index = SLOW_PERIOD + 1; index < candles.length; index += 1) {
    const current = candles[index];
    if (current.openTime < evaluationStart) continue;

    // Both moving-average states use bars that closed before the executable open.
    const previousFast = average(candles.slice(index - FAST_PERIOD - 1, index - 1).map((candle) => candle.close));
    const previousSlow = average(candles.slice(index - SLOW_PERIOD - 1, index - 1).map((candle) => candle.close));
    const fast = average(candles.slice(index - FAST_PERIOD, index).map((candle) => candle.close));
    const slow = average(candles.slice(index - SLOW_PERIOD, index).map((candle) => candle.close));
    const goldenCross = previousFast <= previousSlow && fast > slow;
    const deathCross = previousFast >= previousSlow && fast < slow;

    if (goldenCross && quantity === 0) {
      const entryPrice = current.open * (1 + FEE_RATE);
      quantity = cash / entryPrice;
      entry = { date: new Date(current.openTime).toISOString().slice(0, 10), price: entryPrice, capital: cash };
      cash = 0;
    } else if (deathCross && quantity > 0 && entry) {
      const exitPrice = current.open * (1 - FEE_RATE);
      const proceeds = quantity * exitPrice;
      const pnl = proceeds - entry.capital;
      trades.push({ entryDate: entry.date, exitDate: new Date(current.openTime).toISOString().slice(0, 10), entryPrice: entry.price, exitPrice, pnl, pnlPercent: (pnl / entry.capital) * 100, exitReason: "death_cross" });
      cash = proceeds;
      quantity = 0;
      entry = null;
    }
  }

  if (quantity > 0 && entry) {
    const finalCandle = candles[candles.length - 1];
    const exitPrice = finalCandle.close * (1 - FEE_RATE);
    const proceeds = quantity * exitPrice;
    const pnl = proceeds - entry.capital;
    trades.push({ entryDate: entry.date, exitDate: new Date(finalCandle.openTime).toISOString().slice(0, 10), entryPrice: entry.price, exitPrice, pnl, pnlPercent: (pnl / entry.capital) * 100, exitReason: "end_of_period" });
    cash = proceeds;
  }

  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
  const profitFactor = grossLoss === 0 ? null : grossProfit / grossLoss;
  const firstEvaluationCandle = candles.find((candle) => candle.openTime === evaluationStart);
  const finalCandle = candles[candles.length - 1];
  const buyAndHoldReturn = (finalCandle.close * (1 - FEE_RATE)) / (firstEvaluationCandle.open * (1 + FEE_RATE)) - 1;

  return {
    strategy: "BTCUSDT 10/20-day SMA crossover",
    symbol: "BTCUSDT",
    source: "Binance Spot /api/v3/klines",
    evaluationStart: new Date(evaluationStart).toISOString().slice(0, 10),
    evaluationEnd: new Date(candles[candles.length - 1].openTime).toISOString().slice(0, 10),
    completedDailyBars: 365,
    initialCapital: INITIAL_CAPITAL,
    feeRatePerSide: FEE_RATE,
    execution: "next daily open after a signal computed only from prior completed daily closes",
    trades,
    metrics: {
      completedTrades: trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: trades.length === 0 ? null : wins.length / trades.length,
      grossProfit,
      grossLoss,
      profitFactor,
      averageWinningTrade: wins.length === 0 ? null : grossProfit / wins.length,
      averageLosingTrade: losses.length === 0 ? null : -grossLoss / losses.length,
      endingCapital: cash,
      totalReturn: cash / INITIAL_CAPITAL - 1,
      buyAndHoldReturn,
      excessReturnVsBuyAndHold: cash / INITIAL_CAPITAL - 1 - buyAndHoldReturn,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const candles = await fetchDailyKlines();
  console.log(JSON.stringify(runBacktest(candles), null, 2));
}
